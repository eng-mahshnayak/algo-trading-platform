import AWS from 'aws-sdk';
import instanceSetup from './instanceSetup.js';

// AWS Configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const ec2 = new AWS.EC2();
const ssm = new AWS.SSM();
const route53 = new AWS.Route53();

class AWSProvisioner {

    constructor() {
        this.AMI_ID = process.env.AWS_AMI_ID;
        this.INSTANCE_TYPE = process.env.AWS_INSTANCE_TYPE;
        this.SECURITY_GROUP_ID = process.env.AWS_SECURITY_GROUP_ID;
        this.SUBNET_ID = process.env.AWS_SUBNET_ID;
        this.BASE_DOMAIN = process.env.BASE_DOMAIN;
        this.HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID;
    }

    async provisionUser(user) {
        try {
            console.log(`🚀 Starting provisioning for user: ${user.email}`);
            
            user.status = 'provisioning';
            await user.save();

            const random8Digit = Math.floor(10000000 + Math.random() * 90000000);
            let instanceNameRandom = `${user.name}-${random8Digit}`;
            console.log(instanceNameRandom, '============ instanceNameRandom ===============');

            // Step 1: Launch EC2 Instance
            console.log('📦 Launching EC2 instance...');
            const instanceId = await this.launchEC2(user);
            console.log(instanceId, '📦 EC2 instance instanceId ...');

            user.instanceId = instanceId;
            await user.save();
            
            // Step 2: Attach Elastic IP
            console.log('🌐 Attaching Elastic IP...');
            const elasticIp = await this.attachElasticIP(instanceId);
            user.publicIp = elasticIp;
            console.log('🌐 done Elastic IP...');
            await user.save();
            
            // Step 3: Wait for instance to be ready
            console.log('⏳ Waiting for instance to be ready...');
            await this.waitForInstanceReady(instanceId);
            
            // Step 4: Configure Nginx
            console.log('⚙️ Configuring Nginx...');
            await this.configureNginx(instanceId, user.id.toString());
            
            console.log(instanceId, instanceId, user, '🚀 Starting instance setup and code deployment...');

            // Step 5: Instance Setup
            console.log('🚀 Starting instance setup and code deployment...');
            const setupResult = await instanceSetup.setupInstance(instanceId, user);
            
            if (!setupResult.success) {
                throw new Error(`Instance setup failed: ${setupResult.error}`);
            }
        
            // Step 6: Deploy user config
            console.log('📝 Deploying config to instance...');
            await this.deployConfig(instanceId, user);
            
            return {
                success: true,
                instanceId: instanceId,
                message: 'User provisioned successfully',
                elasticIp: elasticIp
            };
            
        } catch (error) {
            console.error('❌ Provisioning failed:', error);
            
            user.awsProvisioning.status = 'failed';
            user.awsProvisioning.errorMessage = error.message;
            await user.save();
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async launchEC2(user) {
        const params = {
            ImageId: this.AMI_ID,
            InstanceType: this.INSTANCE_TYPE,
            MinCount: 1,
            MaxCount: 1,
            IamInstanceProfile: {
                Name: 'EC2SSMRole'
            },
            SecurityGroupIds: [this.SECURITY_GROUP_ID],
            SubnetId: this.SUBNET_ID,
            TagSpecifications: [{
                ResourceType: 'instance',
                Tags: [
                    { Key: 'Name', Value: `trading-user-${user.id}` },
                    { Key: 'UserEmail', Value: user.email },
                    { Key: 'Environment', Value: 'production' }
                ]
            }]
        };
        
        const result = await ec2.runInstances(params).promise();
        const instanceId = result.Instances[0].InstanceId;

        const name = `userid-${user.id}-username-${user.firstName}-${user.lastName}`.toLowerCase();
        
        await ec2.createTags({
            Resources: [instanceId],
            Tags: [{ Key: 'Name', Value: name }]
        }).promise();
        
        return instanceId;
    }
    
    async attachElasticIP(instanceId) {
        try {


                    // ============= adding new code for testing instance status ==============
           
        const maxAttempts = 5;
let attempt = 0;
let instanceDetails;


while (attempt < maxAttempts) {
  attempt++;

const instanceDetails = await instanceSetup.getInstanceDetails(instanceId);

  let publicIp = instanceDetails?.PublicIpAddress;
  const instanceState = instanceDetails?.State?.Name;

  console.log(`\n🔁 Attempt ${attempt}/${maxAttempts}`);
  console.log(`📍 Public IP: ${publicIp}`);
  console.log(`🟢 Instance State: ${instanceState}`);

  if (instanceState === 'running') {
    console.log('✅ Instance is running');
    break;
  }

  if (attempt < maxAttempts) {
    console.log('⏳ Waiting 1 minute before retry...');
    await this.sleep(60000); // 1 minute
  }
}

        //  end ===============================

            console.log('🔍 Checking existing Elastic IPs...');
            
            const addresses = await ec2.describeAddresses({
                Filters: [{ Name: 'domain', Values: ['vpc'] }]
            }).promise();
            
            console.log(`📊 Total Elastic IPs: ${addresses.Addresses.length}`);
            
            addresses.Addresses.forEach(addr => {
                console.log(`   IP: ${addr.PublicIp} | Associated: ${addr.AssociationId ? 'Yes' : 'No'} | Instance: ${addr.InstanceId || 'None'}`);
            });
            
            const unusedIp = addresses.Addresses.find(addr => !addr.AssociationId);
            
            if (unusedIp) {
                console.log(`♻️ Found unused Elastic IP: ${unusedIp.PublicIp}`);
                console.log(`🔗 Attaching to instance: ${instanceId}`);
                
                await ec2.associateAddress({
                    InstanceId: instanceId,
                    AllocationId: unusedIp.AllocationId
                }).promise();
                
                console.log(`✅ Reused existing Elastic IP: ${unusedIp.PublicIp}`);
                return unusedIp.PublicIp;
            }
            
            const totalIps = addresses.Addresses.length;
            
            if (totalIps >= process.env.totalIps) {
                console.error(`❌ Elastic IP limit reached (${process.env.totalIps} max)`);
                const associatedIps = addresses.Addresses.filter(addr => addr.AssociationId);
                console.log('\n📋 Currently associated Elastic IPs:');
                for (const ip of associatedIps) {
                    console.log(`   IP: ${ip.PublicIp} -> Instance: ${ip.InstanceId || 'Unknown'}`);
                }
                throw new Error('Elastic IP limit reached. Please release unused IPs or terminate old instances.');
            }
            
            console.log('📦 Allocating new Elastic IP...');
            const allocateResult = await ec2.allocateAddress({
                Domain: 'vpc'
            }).promise();
            
            const allocationId = allocateResult.AllocationId;
            const publicIp = allocateResult.PublicIp;
            
            console.log(`✅ New Elastic IP allocated: ${publicIp}`);
            
            await ec2.associateAddress({
                InstanceId: instanceId,
                AllocationId: allocationId
            }).promise();
            
            console.log(`✅ Elastic IP attached: ${publicIp}`);
            return publicIp;
            
        } catch (error) {
            console.error('❌ Elastic IP operation failed:', error.message);
            
            if (error.code === 'AddressLimitExceeded') {
                throw new Error('Elastic IP limit reached. Please release unused Elastic IPs from AWS Console.');
            }
            throw error;
        }
    }
    
    async waitForInstanceReady(instanceId, timeout = 300000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const response = await ec2.describeInstances({
                InstanceIds: [instanceId]
            }).promise();
            
            const state = response.Reservations[0].Instances[0].State.Name;
            
            if (state === 'running') {
                await this.sleep(30000);
                return true;
            }
            
            await this.sleep(10000);
        }
        
        throw new Error('Instance not ready within timeout');
    }
    
    async configureNginx(instanceId, userId, domain = 'login.softwaresetu121.com') {
        const nginxConfig = `
server {
    listen 80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};
    
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    limit_req zone=user_limit burst=20 nodelay;
    
    access_log /var/log/nginx/${userId}-access.log;
    error_log /var/log/nginx/${userId}-error.log;
    
    location / {
        root /var/www/trading-ui;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}

limit_req_zone $binary_remote_addr zone=user_limit:10m rate=10r/s;
`;
        
        const commands = [
            `cat > /etc/nginx/sites-available/${userId}.conf << 'EOF'\n${nginxConfig}\nEOF`,
            `ln -sf /etc/nginx/sites-available/${userId}.conf /etc/nginx/sites-enabled/`,
            'nginx -t',
            'systemctl reload nginx'
        ];
        
        await ssm.sendCommand({
            InstanceIds: [instanceId],
            DocumentName: 'AWS-RunShellScript',
            Parameters: {
                commands: commands
            }
        }).promise();
    }
    
    async deployConfig(instanceId, user, brokerCreds = null) {
        const config = {
            user_id: user.id.toString(),
            email: user.email,
            name: user.name,
            environment: 'production'
        };
        
        const configJson = JSON.stringify(config, null, 2);
        
        const commands = [
            `mkdir -p /opt/trading`,
            `cat > /opt/trading/config.json << 'EOF'\n${configJson}\nEOF`,
            `chmod 600 /opt/trading/config.json`,
            `systemctl restart trading-algo || echo "Service not found, skipping restart"`
        ];
        
        await ssm.sendCommand({
            InstanceIds: [instanceId],
            DocumentName: 'AWS-RunShellScript',
            Parameters: {
                commands: commands
            }
        }).promise();
    }
    
    async terminateUser(user) {
        try {
            if (user.instanceId) {
                await ec2.terminateInstances({
                    InstanceIds: [user.instanceId]
                }).promise();
                
                if (user.publicIp) {
                    const addresses = await ec2.describeAddresses({
                        PublicIps: [user.publicIp]
                    }).promise();
                    
                    if (addresses.Addresses.length > 0) {
                        await ec2.releaseAddress({
                            AllocationId: addresses.Addresses[0].AllocationId
                        }).promise();
                    }
                }
                
                user.status = 'terminated';
                await user.save();
                
                return { success: true };
            }
        } catch (error) {
            console.error('Termination failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    // =============================================================== new code start =====================================

    // Add these methods to your AWSProvisioner class

async stopUserInstance(user) {
    try {
        console.log(`🛑 Stopping instance for user: ${user.email}`);
        
        if (!user.instanceId) {
            throw new Error('No instance ID found for this user');
        }

        // Check if instance exists and get its state
        const instanceDetails = await this.getInstanceDetails(user.instanceId);
        
        if (!instanceDetails) {
            throw new Error(`Instance ${user.instanceId} not found`);
        }

        const currentState = instanceDetails.State.Name;
        console.log(`📊 Current instance state: ${currentState}`);

        // Only stop if instance is running or pending
        if (currentState === 'running' || currentState === 'pending') {
            // Stop the instance
            await ec2.stopInstances({
                InstanceIds: [user.instanceId]
            }).promise();
            
            console.log(`✅ Instance ${user.instanceId} stop initiated`);
            
            // Wait for instance to stop
            await this.waitForInstanceState(user.instanceId, 'stopped', 120000);
            
            // Update user status
            user.status = 'stopped';
            user.instanceState = 'stopped';
            user.stoppedAt = new Date();
            await user.save();
            
            console.log(`✅ Instance ${user.instanceId} stopped successfully`);
            
            return {
                success: true,
                instanceId: user.instanceId,
                state: 'stopped',
                message: 'Instance stopped successfully'
            };
        } else if (currentState === 'stopped') {
            return {
                success: true,
                instanceId: user.instanceId,
                state: 'stopped',
                message: 'Instance is already stopped'
            };
        } else {
            throw new Error(`Cannot stop instance in ${currentState} state`);
        }
        
    } catch (error) {
        console.error('❌ Failed to stop instance:', error);
        
        user.awsProvisioning.status = 'stop_failed';
        user.awsProvisioning.errorMessage = error.message;
        await user.save();
        
        return {
            success: false,
            error: error.message
        };
    }
}

async startUserInstance(user) {
    try {
        console.log(`▶️ Starting instance for user: ${user.email}`);
        
        if (!user.instanceId) {
            throw new Error('No instance ID found for this user');
        }

        // Check if instance exists and get its state
        const instanceDetails = await this.getInstanceDetails(user.instanceId);
        
        if (!instanceDetails) {
            throw new Error(`Instance ${user.instanceId} not found`);
        }

        const currentState = instanceDetails.State.Name;
        console.log(`📊 Current instance state: ${currentState}`);

        // Only start if instance is stopped
        if (currentState === 'stopped') {
            // Start the instance
            await ec2.startInstances({
                InstanceIds: [user.instanceId]
            }).promise();
            
            console.log(`✅ Instance ${user.instanceId} start initiated`);
            
            // Wait for instance to be running
            await this.waitForInstanceState(user.instanceId, 'running', 180000);
            
            // Optional: Reattach Elastic IP if needed
            if (user.publicIp) {
                await this.reattachElasticIP(user.instanceId, user.publicIp);
            }
            
            // Update user status
            user.status = 'active';
            user.instanceState = 'running';
            user.startedAt = new Date();
            await user.save();
            
            console.log(`✅ Instance ${user.instanceId} started successfully`);
            
            return {
                success: true,
                instanceId: user.instanceId,
                publicIp: user.publicIp,
                state: 'running',
                message: 'Instance started successfully'
            };
        } else if (currentState === 'running') {
            return {
                success: true,
                instanceId: user.instanceId,
                publicIp: user.publicIp,
                state: 'running',
                message: 'Instance is already running'
            };
        } else {
            throw new Error(`Cannot start instance in ${currentState} state`);
        }
        
    } catch (error) {
        console.error('❌ Failed to start instance:', error);
        
        user.awsProvisioning.status = 'start_failed';
        user.awsProvisioning.errorMessage = error.message;
        await user.save();
        
        return {
            success: false,
            error: error.message
        };
    }
}

async deleteUserInstance(user, releaseElasticIp = true) {
    try {
        console.log(`🗑️ Deleting instance for user: ${user.email}`);
        
        if (!user.instanceId) {
            throw new Error('No instance ID found for this user');
        }

        // First, try to stop the instance if it's running
        const instanceDetails = await this.getInstanceDetails(user.instanceId);
        
        if (instanceDetails && instanceDetails.State.Name === 'running') {
            console.log('🛑 Stopping instance before termination...');
            await ec2.stopInstances({
                InstanceIds: [user.instanceId]
            }).promise();
            
            await this.waitForInstanceState(user.instanceId, 'stopped', 120000);
        }
        
        // Terminate the instance
        console.log('💀 Terminating instance...');
        await ec2.terminateInstances({
            InstanceIds: [user.instanceId]
        }).promise();
        
        console.log(`✅ Instance ${user.instanceId} termination initiated`);
        
        // Wait for instance to be terminated
        await this.waitForInstanceState(user.instanceId, 'terminated', 180000);
        
        // Release Elastic IP if requested
        let elasticIpReleased = false;
        if (releaseElasticIp && user.publicIp) {
            console.log(`🌐 Releasing Elastic IP: ${user.publicIp}`);
            elasticIpReleased = await this.releaseElasticIp(user.publicIp);
            
            if (elasticIpReleased) {
                console.log(`✅ Elastic IP ${user.publicIp} released`);
            } else {
                console.log(`⚠️ Failed to release Elastic IP ${user.publicIp}`);
            }
        }
        
        // Clear user's AWS data
        const deletedInstanceId = user.instanceId;
        const deletedPublicIp = user.publicIp;
        
        user.instanceId = null;
        user.publicIp = null;
        user.status = 'deleted';
        user.instanceState = 'terminated';
        user.deletedAt = new Date();
        user.awsProvisioning = {
            status: 'deleted',
            deletedAt: new Date(),
            instanceId: deletedInstanceId,
            publicIp: deletedPublicIp
        };
        await user.save();
        
        console.log(`✅ User ${user.email} instance completely deleted`);
        
        return {
            success: true,
            instanceId: deletedInstanceId,
            publicIp: deletedPublicIp,
            elasticIpReleased: elasticIpReleased,
            message: 'Instance and Elastic IP deleted successfully'
        };
        
    } catch (error) {
        console.error('❌ Failed to delete instance:', error);
        
        user.awsProvisioning.status = 'delete_failed';
        user.awsProvisioning.errorMessage = error.message;
        await user.save();
        
        return {
            success: false,
            error: error.message
        };
    }
}

async releaseElasticIp(publicIp) {
    try {
        // Find the allocation ID for the Elastic IP
        const addresses = await ec2.describeAddresses({
            PublicIps: [publicIp]
        }).promise();
        
        if (addresses.Addresses.length === 0) {
            console.log(`⚠️ Elastic IP ${publicIp} not found`);
            return false;
        }
        
        const allocationId = addresses.Addresses[0].AllocationId;
        
        // Check if it's associated with any instance
        if (addresses.Addresses[0].AssociationId) {
            console.log(`🔓 Disassociating Elastic IP ${publicIp}...`);
            await ec2.disassociateAddress({
                AssociationId: addresses.Addresses[0].AssociationId
            }).promise();
            await this.sleep(5000);
        }
        
        // Release the Elastic IP
        console.log(`🗑️ Releasing Elastic IP ${publicIp}...`);
        await ec2.releaseAddress({
            AllocationId: allocationId
        }).promise();
        
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to release Elastic IP ${publicIp}:`, error.message);
        return false;
    }
}

async reattachElasticIP(instanceId, publicIp) {
    try {
        const addresses = await ec2.describeAddresses({
            PublicIps: [publicIp]
        }).promise();
        
        if (addresses.Addresses.length === 0) {
            console.log(`⚠️ Elastic IP ${publicIp} not found`);
            return false;
        }
        
        const allocationId = addresses.Addresses[0].AllocationId;
        
        // Check if already associated
        if (addresses.Addresses[0].AssociationId) {
            console.log(`⚠️ Elastic IP ${publicIp} is already associated`);
            return true;
        }
        
        // Associate Elastic IP
        await ec2.associateAddress({
            InstanceId: instanceId,
            AllocationId: allocationId
        }).promise();
        
        console.log(`✅ Reattached Elastic IP ${publicIp} to instance ${instanceId}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to reattach Elastic IP:`, error.message);
        return false;
    }
}

async waitForInstanceState(instanceId, targetState, timeout = 120000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            const response = await ec2.describeInstances({
                InstanceIds: [instanceId]
            }).promise();
            
            const currentState = response.Reservations[0]?.Instances[0]?.State?.Name;
            console.log(`⏳ Current state: ${currentState}, waiting for: ${targetState}`);
            
            if (currentState === targetState) {
                console.log(`✅ Instance reached state: ${targetState}`);
                return true;
            }
            
            // If instance is terminated and that's what we want
            if (targetState === 'terminated' && currentState === 'terminated') {
                return true;
            }
            
            await this.sleep(10000);
            
        } catch (error) {
            // If instance is terminated, describeInstances might throw an error
            if (targetState === 'terminated' && error.code === 'InvalidInstanceID.NotFound') {
                console.log(`✅ Instance ${instanceId} has been terminated`);
                return true;
            }
            console.log(`⚠️ Error checking instance state:`, error.message);
            await this.sleep(10000);
        }
    }
    
    throw new Error(`Timeout waiting for instance to reach ${targetState} state`);
}

async getInstanceDetailsNew(instanceId) {
    try {
        const response = await ec2.describeInstances({
            InstanceIds: [instanceId]
        }).promise();
        
        if (response.Reservations[0]?.Instances[0]) {
            return response.Reservations[0].Instances[0];
        }
        return null;
    } catch (error) {
        if (error.code === 'InvalidInstanceID.NotFound') {
            return null;
        }
        throw error;
    }
}

async listAllUserInstances() {
    try {
        const response = await ec2.describeInstances({
            Filters: [
                {
                    Name: 'tag:Environment',
                    Values: ['production']
                }
            ]
        }).promise();
        
        const instances = [];
        
        for (const reservation of response.Reservations) {
            for (const instance of reservation.Instances) {
                instances.push({
                    instanceId: instance.InstanceId,
                    state: instance.State.Name,
                    publicIp: instance.PublicIpAddress || null,
                    privateIp: instance.PrivateIpAddress,
                    launchTime: instance.LaunchTime,
                    tags: instance.Tags
                });
            }
        }
        
        return instances;
        
    } catch (error) {
        console.error('Failed to list instances:', error);
        throw error;
    }
} 

    // ================================================================= new code end 
}



export default new AWSProvisioner();