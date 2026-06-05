// services/AMIManager.js - Complete Clone Implementation

import AWS from 'aws-sdk';
import AwsInstance from '../../models/AwsInstance.js';

// AWS Config
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const ec2 = new AWS.EC2();

class AMIManager {
    constructor() {
        this.BASE_AMI_ID = process.env.BASE_AMI_ID || 'ami-0xxxxxx';
        this.INSTANCE_TYPE = process.env.AWS_INSTANCE_TYPE || 't3.micro';
        this.SECURITY_GROUP_ID = process.env.AWS_SECURITY_GROUP_ID;
        this.SUBNET_ID = process.env.AWS_SUBNET_ID;
    }

    // ========== 1. COMPLETE CLONE FROM SOURCE INSTANCE ==========
    async cloneCompleteInstance(sourceInstanceId, user) {
        try {
            console.log(`🚀 Starting complete clone of instance ${sourceInstanceId} for user ${user.email}`);

            // Step 1: Create AMI from source instance
            console.log(`📸 Creating AMI from source instance: ${sourceInstanceId}`);
            const amiId = await this.createAMIFromInstance(
                sourceInstanceId, 
                `clone-${user.id}-${Date.now()}`
            );
            
            if (!amiId) {
                throw new Error('Failed to create AMI from source instance');
            }
            
            console.log(`✅ AMI Created: ${amiId}`);
            
            // Step 2: Wait for AMI to be ready
            console.log(`⏳ Waiting for AMI ${amiId} to be ready...`);
            const isAmiReady = await this.waitForAMIReady(amiId);
            
            if (!isAmiReady) {
                throw new Error('AMI failed to become ready within timeout');
            }
            
            console.log(`✅ AMI is ready: ${amiId}`);
            
            // Step 3: Launch new instance from this AMI
            console.log(`🚀 Launching cloned instance from AMI ${amiId}`);
            const instanceId = await this.launchEC2FromAMIWithUserData(user, amiId);
            
            if (!instanceId) {
                throw new Error('Failed to launch instance from AMI');
            }
            
            console.log(`✅ Instance launched: ${instanceId}`);
            
            // Step 4: Create DB record
            const dbRecord = await AwsInstance.create({
                userId: user.id,
                userName: user.name || user.firstName || user.email,
                userEmail: user.email,
                instanceId: instanceId,
                status: 'PENDING',
                instanceType: this.INSTANCE_TYPE,
                amiId: amiId,
                sourceInstanceId: sourceInstanceId
            });
            
            // Step 5: Wait for instance to be running
            console.log(`⏳ Waiting for instance ${instanceId} to be ready...`);
            const isRunning = await this.waitForInstanceRunning(instanceId);
            
            if (!isRunning) {
                throw new Error('Instance failed to start within timeout');
            }
            
            // Step 6: Attach Elastic IP
            console.log(`🌐 Attaching Elastic IP to running instance...`);
            const elasticIp = await this.attachElasticIPWithRetry(instanceId);
            
            // Step 7: Update DB with IP
            await dbRecord.update({
                publicIp: elasticIp,
                elasticIp: elasticIp,
                status: 'RUNNING'
            });
            
            // Step 8: Get instance details
            const instanceDetails = await this.getInstanceDetails(instanceId);
            await dbRecord.update({
                privateIp: instanceDetails.PrivateIpAddress
            });
            
            console.log(`✅ Clone completed successfully!`);
            console.log(`   Instance ID: ${instanceId}`);
            console.log(`   Public IP: ${elasticIp}`);
            console.log(`   AMI Used: ${amiId}`);
            
            // Optional: Clean up temporary AMI after 24 hours
            // await this.scheduleAMICleanup(amiId, 24);
            
            return {
                success: true,
                instanceId: instanceId,
                dbId: dbRecord.id,
                publicIp: elasticIp,
                amiId: amiId,
                message: 'Instance cloned successfully with all data and configurations'
            };
            
        } catch (error) {
            console.error('❌ Clone failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ========== 2. CREATE AMI FROM INSTANCE ==========
    async createAMIFromInstance(instanceId, amiName) {
        try {
            // First, stop the instance for consistent AMI (optional)
            // await this.stopInstance(instanceId);
            // await this.waitForInstanceStopped(instanceId);
            
            const params = {
                InstanceId: instanceId,
                Name: amiName,
                Description: `AMI created from instance ${instanceId} at ${new Date().toISOString()}`,
                NoReboot: false // Set to true to avoid reboot but may result in inconsistent data
            };
            
            const result = await ec2.createImage(params).promise();
            console.log(`✅ AMI creation initiated: ${result.ImageId}`);
            
            return result.ImageId;
        } catch (error) {
            console.error(`❌ Failed to create AMI: ${error.message}`);
            throw error;
        }
    }
    
    // ========== 3. WAIT FOR AMI TO BE READY ==========
    async waitForAMIReady(amiId, maxAttempts = 60) {
        console.log(`⏳ Waiting for AMI ${amiId} to be ready...`);
        
        for (let i = 1; i <= maxAttempts; i++) {
            try {
                const params = {
                    ImageIds: [amiId]
                };
                
                const result = await ec2.describeImages(params).promise();
                const image = result.Images[0];
                
                if (!image) {
                    console.log(`⏳ Attempt ${i}/${maxAttempts}: AMI not found yet`);
                    await this.sleep(10000);
                    continue;
                }
                
                console.log(`📊 Attempt ${i}/${maxAttempts}: AMI State = ${image.State}`);
                
                if (image.State === 'available') {
                    console.log(`✅ AMI ${amiId} is ready`);
                    return true;
                } else if (image.State === 'failed') {
                    throw new Error(`AMI creation failed: ${image.StateReason?.Message || 'Unknown error'}`);
                }
                
                await this.sleep(10000);
            } catch (error) {
                console.log(`⚠️ Error checking AMI: ${error.message}`);
                await this.sleep(10000);
            }
        }
        
        throw new Error(`AMI not ready after ${maxAttempts * 10} seconds`);
    }
    
    // ========== 4. LAUNCH EC2 WITH USER DATA (NGINX SETUP) ==========
    async launchEC2FromAMIWithUserData(user, amiId = null) {
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const instanceName = `${user.name || user.firstName || 'user'}-clone-${randomSuffix}`;
        
        // User data script for automatic nginx setup
        const userDataScript = `#!/bin/bash
# Log everything
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting user data script at $(date)"

# Update system
apt-get update -y

# Install nginx
apt-get install -y nginx

# Start nginx
systemctl start nginx
systemctl enable nginx

# Create custom web page with user info
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Welcome ${user.email}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 30px;
            margin-top: 50px;
        }
        h1 { color: #fff; }
        .info { margin: 20px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Instance Cloned Successfully!</h1>
        <div class="info">
            <p><strong>User:</strong> ${user.email}</p>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Clone Date:</strong> $(date)</p>
            <p><strong>Status:</strong> ✅ Nginx is running</p>
        </div>
        <p>This instance was automatically cloned with nginx pre-installed!</p>
    </div>
</body>
</html>
EOF

# Install additional useful packages
apt-get install -y git curl wget htop

# Setup firewall
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

# Restart nginx to apply changes
systemctl restart nginx

echo "User data script completed at $(date)"
`;
        
        const params = {
            ImageId: amiId || this.BASE_AMI_ID,
            InstanceType: this.INSTANCE_TYPE,
            MinCount: 1,
            MaxCount: 1,
            SecurityGroupIds: [this.SECURITY_GROUP_ID],
            SubnetId: this.SUBNET_ID,
            UserData: Buffer.from(userDataScript).toString('base64'),
            IamInstanceProfile: {
                Name: 'EC2SSMRole'
            },
            TagSpecifications: [{
                ResourceType: 'instance',
                Tags: [
                    { Key: 'Name', Value: instanceName },
                    { Key: 'CloneType', Value: 'CompleteClone' },
                    { Key: 'UserId', Value: user.id.toString() },
                    { Key: 'UserEmail', Value: user.email },
                    { Key: 'CloneDate', Value: new Date().toISOString() },
                    { Key: 'HasNginx', Value: 'true' }
                ]
            }]
        };
        
        const result = await ec2.runInstances(params).promise();
        const instanceId = result.Instances[0].InstanceId;
        
        console.log(`📦 Instance launched with nginx auto-setup: ${instanceId}`);
        return instanceId;
    }
    
    // ========== 5. CLONE FROM EXISTING AMI ID ==========
    async cloneInstanceFromAMIId(amiId, user) {
        try {
            console.log(`🚀 Cloning from existing AMI: ${amiId}`);
            
            // Create DB record
            const dbRecord = await AwsInstance.create({
                userId: user.id,
                userName: user.name || user.firstName || user.email,
                userEmail: user.email,
                status: 'PENDING',
                instanceType: this.INSTANCE_TYPE,
                amiId: amiId
            });
            
            // Launch instance
            const instanceId = await this.launchEC2FromAMIWithUserData(user, amiId);
            
            // Update DB
            await dbRecord.update({
                instanceId: instanceId,
                status: 'PENDING'
            });
            
            // Wait for running
            await this.waitForInstanceRunning(instanceId);
            
            // Attach IP
            const elasticIp = await this.attachElasticIPWithRetry(instanceId);
            
            // Update DB with IP
            await dbRecord.update({
                publicIp: elasticIp,
                elasticIp: elasticIp,
                status: 'RUNNING'
            });
            
            return {
                success: true,
                instanceId: instanceId,
                publicIp: elasticIp,
                amiId: amiId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ========== 6. WAIT FOR INSTANCE RUNNING ==========
    async waitForInstanceRunning(instanceId, maxAttempts = 60) {
        console.log(`⏳ Waiting for instance ${instanceId} to be running...`);
        
        for (let i = 1; i <= maxAttempts; i++) {
            try {
                const details = await this.getInstanceDetails(instanceId);
                const state = details?.State?.Name;
                
                console.log(`📊 Attempt ${i}/${maxAttempts}: Instance State = ${state}`);
                
                if (state === 'running') {
                    console.log(`✅ Instance is running`);
                    // Wait for services to initialize
                    await this.sleep(15000);
                    return true;
                } else if (['terminated', 'shutting-down'].includes(state)) {
                    throw new Error(`Instance entered bad state: ${state}`);
                }
                
                await this.sleep(10000);
            } catch (error) {
                if (error.code !== 'InvalidInstanceID.NotFound') {
                    console.log(`⚠️ Error: ${error.message}`);
                }
                await this.sleep(10000);
            }
        }
        
        throw new Error(`Instance not running after timeout`);
    }
    
    // ========== 7. WAIT FOR INSTANCE STOPPED ==========
    async waitForInstanceStopped(instanceId, maxAttempts = 30) {
        for (let i = 1; i <= maxAttempts; i++) {
            const details = await this.getInstanceDetails(instanceId);
            const state = details?.State?.Name;
            
            if (state === 'stopped') {
                return true;
            } else if (state === 'terminated') {
                throw new Error('Instance was terminated');
            }
            
            await this.sleep(10000);
        }
        return false;
    }
    
    // ========== 8. ATTACH ELASTIC IP WITH RETRY ==========
    async attachElasticIPWithRetry(instanceId, maxRetries = 10) {
        for (let retry = 1; retry <= maxRetries; retry++) {
            try {
                console.log(`🌐 Attempt ${retry}/${maxRetries} to attach Elastic IP...`);
                
                // Check for existing unused Elastic IP
                const addresses = await ec2.describeAddresses({
                    Filters: [{ Name: 'domain', Values: ['vpc'] }]
                }).promise();
                
                const unusedIp = addresses.Addresses.find(addr => !addr.AssociationId);
                
                if (unusedIp) {
                    await ec2.associateAddress({
                        InstanceId: instanceId,
                        AllocationId: unusedIp.AllocationId
                    }).promise();
                    console.log(`♻️ Reused Elastic IP: ${unusedIp.PublicIp}`);
                    return unusedIp.PublicIp;
                }
                
                // Create new Elastic IP
                const allocateResult = await ec2.allocateAddress({
                    Domain: 'vpc'
                }).promise();
                
                await ec2.associateAddress({
                    InstanceId: instanceId,
                    AllocationId: allocateResult.AllocationId
                }).promise();
                
                console.log(`🆕 New Elastic IP: ${allocateResult.PublicIp}`);
                return allocateResult.PublicIp;
                
            } catch (error) {
                console.log(`⚠️ Attempt ${retry} failed: ${error.message}`);
                
                if (error.message.includes('pending') || error.code === 'InvalidInstanceID') {
                    await this.sleep(10000);
                } else {
                    throw error;
                }
            }
        }
        
        throw new Error(`Failed to attach Elastic IP after ${maxRetries} retries`);
    }
    
    // ========== 9. GET INSTANCE DETAILS ==========
    async getInstanceDetails(instanceId) {
        try {
            const response = await ec2.describeInstances({
                InstanceIds: [instanceId]
            }).promise();
            
            return response.Reservations[0]?.Instances[0];
        } catch (error) {
            console.log(`⚠️ Error getting instance details: ${error.message}`);
            return null;
        }
    }
    
    // ========== 10. STOP INSTANCE ==========
    async stopInstance(instanceId) {
        try {
            const dbRecord = await AwsInstance.findOne({ where: { instanceId: instanceId } });
            
            if (dbRecord) {
                await dbRecord.update({ status: 'STOPPING' });
            }
            
            await ec2.stopInstances({
                InstanceIds: [instanceId]
            }).promise();
            
            if (dbRecord) {
                await dbRecord.update({ 
                    status: 'STOPPED',
                    lastStateChange: new Date()
                });
            }
            
            return { success: true, message: 'Instance stopped' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ========== 11. START INSTANCE ==========
    async startInstance(instanceId) {
        try {
            const dbRecord = await AwsInstance.findOne({ where: { instanceId: instanceId } });
            
            if (dbRecord) {
                await dbRecord.update({ status: 'RUNNING' });
            }
            
            await ec2.startInstances({
                InstanceIds: [instanceId]
            }).promise();
            
            await dbRecord.update({ lastStateChange: new Date() });
            
            return { success: true, message: 'Instance started' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ========== 12. TERMINATE INSTANCE ==========
    async terminateInstance(instanceId) {
        try {
            const dbRecord = await AwsInstance.findOne({ where: { instanceId: instanceId } });
            
            if (dbRecord) {
                await dbRecord.update({ status: 'TERMINATING' });
            }
            
            // Release Elastic IP
            if (dbRecord?.elasticIp) {
                const addresses = await ec2.describeAddresses({
                    PublicIps: [dbRecord.elasticIp]
                }).promise();
                
                if (addresses.Addresses[0]) {
                    await ec2.releaseAddress({
                        AllocationId: addresses.Addresses[0].AllocationId
                    }).promise();
                }
            }
            
            // Terminate instance
            await ec2.terminateInstances({
                InstanceIds: [instanceId]
            }).promise();
            
            if (dbRecord) {
                await dbRecord.update({ 
                    status: 'TERMINATED',
                    terminatedAt: new Date(),
                    lastStateChange: new Date()
                });
            }
            
            return { success: true, message: 'Instance terminated' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ========== 13. GET USER INSTANCES ==========
    async getUserInstances(userId) {
        try {
            const instances = await AwsInstance.findAll({
                where: { userId: userId },
                order: [['createdAt', 'DESC']]
            });
            
            return { success: true, data: instances };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ========== 14. GET INSTANCE STATUS ==========
    async getInstanceStatus(instanceId) {
        try {
            const dbRecord = await AwsInstance.findOne({ where: { instanceId: instanceId } });
            
            if (!dbRecord) {
                return { success: false, error: 'Instance not found' };
            }
            
            const awsDetails = await this.getInstanceDetails(instanceId);
            const awsState = awsDetails?.State?.Name;
            
            return {
                success: true,
                data: {
                    ...dbRecord.toJSON(),
                    awsActualState: awsState,
                    publicIp: dbRecord.publicIp,
                    status: dbRecord.status
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ========== 15. SCHEDULE AMI CLEANUP ==========
    async scheduleAMICleanup(amiId, hoursToKeep = 24) {
        setTimeout(async () => {
            try {
                await ec2.deregisterImage({ ImageId: amiId }).promise();
                console.log(`🗑️ Cleaned up temporary AMI: ${amiId}`);
            } catch (error) {
                console.log(`⚠️ Failed to cleanup AMI ${amiId}: ${error.message}`);
            }
        }, hoursToKeep * 60 * 60 * 1000);
    }
    
    // ========== HELPER: SLEEP ==========
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new AMIManager();