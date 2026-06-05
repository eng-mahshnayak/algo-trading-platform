import AWS from 'aws-sdk';
import { exec } from 'child_process';
import util from 'util';
import GithubSetting from "../../models/GithubSetting.js"
const execPromise = util.promisify(exec);

// AWS Configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const ec2 = new AWS.EC2();
const ssm = new AWS.SSM();

class InstanceSetup {
    constructor() {
        // this.GITHUB_REPO = process.env.GITHUB_REPO_URL || 'https://github.com/manishbluewebspark/Trading-replica.git';
        // this.GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
        // this.GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        // this.ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        // this.SSH_KEY_PATH = process.env.SSH_KEY_PATH || '~/.ssh/id_rsa';
        // this.APP_DIR = '/home/ubuntu/trading-app';
        // this.BACKEND_PORT = 5000;


         // These will be loaded from database
        this.GITHUB_REPO = null;
        this.GITHUB_BRANCH = null;
        this.GITHUB_TOKEN = null;
        this.ADMIN_EMAIL = null;
        this.SSH_KEY_PATH = process.env.SSH_KEY_PATH || '~/.ssh/id_rsa';
        this.APP_DIR = '/home/ubuntu/trading-app';
        this.BACKEND_PORT = 5000;
    }


    // New method to load GitHub settings from database
    async loadGithubSettings() {
        try {
            console.log('📚 Loading GitHub settings from database...');
            
            // Get the latest GitHub settings (assuming single record, or get by id=1)
            const githubSettings = await GithubSetting.findOne({
                order: [['id', 'DESC']] // Get the latest settings
            });
            
            if (!githubSettings) {
                throw new Error('GitHub settings not found in database');
            }
            
            this.GITHUB_REPO = githubSettings.github_repo_url;
            this.GITHUB_BRANCH = githubSettings.github_branch;
            this.GITHUB_TOKEN = githubSettings.github_token;
            this.ADMIN_EMAIL = githubSettings.admin_email;
            
            console.log('✅ GitHub settings loaded successfully');
            console.log(`📦 Repo: ${this.GITHUB_REPO}`);
            console.log(`🌿 Branch: ${this.GITHUB_BRANCH}`);
            console.log(`📧 Admin Email: ${this.GITHUB_TOKEN ? '***token set***' : 'No token'}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to load GitHub settings:', error.message);
            throw error;
        }
    }

    async setupInstance(instanceId, user) {
        try {
            console.log(`\n🔧 ========== STARTING INSTANCE SETUP ==========`);


              // Load GitHub settings from database first
            await this.loadGithubSettings();
            
            console.log(`\n🔧 ========== STARTING INSTANCE SETUP ==========`);
            console.log(`🆔 Instance ID: ${instanceId}`);
            console.log(`📧 User: ${user.email}`);
            console.log(`📂 App Directory: ${this.APP_DIR}`);
            console.log(`📦 GitHub Repo: ${this.GITHUB_REPO}`);
            console.log(`🌿 GitHub Branch: ${this.GITHUB_BRANCH}`);

            console.log(`🆔 Instance ID: ${instanceId}`);
            console.log(`📧 User: ${user.email}`);
            console.log(`📂 App Directory: ${this.APP_DIR}`);

            // Step 1: Get instance details
            console.log('\n📡 Getting instance details...');
            const maxAttempts = 5;
            let attempt = 0;
            let instanceDetails;
            let publicIp;

            while (attempt < maxAttempts) {
                attempt++;
                instanceDetails = await this.getInstanceDetails(instanceId);
                publicIp = instanceDetails?.PublicIpAddress;
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
                    await this.sleep(60000);
                }
            }

            if (instanceDetails?.State?.Name !== 'running') {
                throw new Error(`❌ Instance not running after ${maxAttempts} attempts`);
            }

            // Step 2: Configure Security Group
            console.log('\n🔒 Configuring Security Group Rules...');
            await this.configureSecurityGroup(instanceId);
            console.log('✅ Security Group configured');

            // Step 3: Connect via SSM
            let connectionMethod = null;
            
            console.log('\n🔌 Trying to connect via SSM...');
            const ssmReady = await this.waitForSSMWithRetry(instanceId);
            
            if (ssmReady) {
                connectionMethod = 'ssm';
                console.log('✅ Connected via SSM');
            } else {
                console.log('⚠️ SSM not available, trying SSH...');
                const sshReady = await this.waitForSSH(publicIp);
                if (sshReady) {
                    connectionMethod = 'ssh';
                    console.log('✅ Connected via SSH');
                } else {
                    throw new Error('Neither SSM nor SSH is available');
                }
            }

            // Step 4: Install base dependencies
            console.log('\n📦 Installing base dependencies...');
            await this.installBaseDependencies(instanceId, publicIp, connectionMethod);
            console.log('✅ Base dependencies installed');

            // Step 5: Setup Node.js
            console.log('\n🟢 Setting up Node.js...');
            await this.setupNodeJS(instanceId, publicIp, connectionMethod);
            console.log('✅ Node.js installed');

            // Step 6: Install PM2
            console.log('\n📦 Installing PM2...');
            await this.installPM2(instanceId, publicIp, connectionMethod);
            console.log('✅ PM2 installed');

            // Step 7: Clone application
            console.log('\n📂 Cloning application code...');
            await this.cloneApplication(instanceId, publicIp, connectionMethod);
            console.log('✅ Application code cloned');

            // Step 8: Fix permissions
            console.log('\n🔧 Fixing permissions...');
            await this.fixPermissions(instanceId, publicIp, connectionMethod);
            console.log('✅ Permissions fixed');

            // Step 9: Setup Backend with PM2 (as ubuntu user)
            console.log('\n🚀 Setting up BACKEND with PM2...');
            await this.setupBackendWithPM2(instanceId, publicIp, connectionMethod, user);
            console.log('✅ Backend PM2 setup complete');

            // Step 10: Setup Frontend
            console.log('\n🎨 Setting up FRONTEND...');
            await this.setupFrontend(instanceId, publicIp, connectionMethod);
            console.log('✅ Frontend setup complete');

            // Step 11: Configure Nginx
            console.log('\n⚙️ Configuring Nginx...');
            await this.configureNginx(instanceId, publicIp, connectionMethod);
            console.log('✅ Nginx configured');

            // Step 12: Setup PM2 auto-start
            console.log('\n📊 Setting up PM2 auto-start...');
            await this.setupPM2AutoStartComplete(instanceId, publicIp, connectionMethod);
            console.log('✅ PM2 auto-start configured');

            console.log(`\n✅ ========== INSTANCE SETUP COMPLETE ==========\n`);
            console.log(`📂 Application Location: ${this.APP_DIR}`);
            console.log(`🌐 Frontend: http://${publicIp}`);
            console.log(`📡 Backend API: http://${publicIp}/api`);
            console.log(`❤️ Health Check: http://${publicIp}/health`);

            return {
                success: true,
                message: 'Instance setup completed successfully',
                publicIp: publicIp,
                frontendUrl: `http://${publicIp}`,
                backendUrl: `http://${publicIp}/api`,
                appDirectory: this.APP_DIR
            };

        } catch (error) {
            console.error('\n❌ Instance setup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ✅ FIXED: Install PM2
    async installPM2(instanceId, publicIp, method) {
        const commands = [
            'sudo npm install -g pm2',
            'pm2 --version',
            'sudo -u ubuntu pm2 --version || echo "PM2 installed"'
        ];
        await this.executeCommandsWithCD(instanceId, publicIp, method, '/home/ubuntu', commands);
    }

    // ✅ FIXED: Fix permissions for app directory
    async fixPermissions(instanceId, publicIp, method) {
        const commands = [
            `sudo chown -R ubuntu:ubuntu ${this.APP_DIR}`,
            `sudo chmod -R 755 ${this.APP_DIR}`,
            `mkdir -p ${this.APP_DIR}/logs`,
            `mkdir -p ${this.APP_DIR}/backend/logs`,
            `mkdir -p ${this.APP_DIR}/frontend/node_modules`,
            `sudo chown -R ubuntu:ubuntu ${this.APP_DIR}/backend`,
            `sudo chown -R ubuntu:ubuntu ${this.APP_DIR}/frontend`
        ];
        await this.executeCommandsWithCD(instanceId, publicIp, method, '/home/ubuntu', commands);
    }

    // ✅ CRITICAL FIX: Backend setup with PM2 as ubuntu user
    async setupBackendWithPM2(instanceId, publicIp, method, user) {
        const commands = [
            // Kill any root process on port 5000
            'sudo fuser -k 5000/tcp 2>/dev/null || true',
            'sudo pkill -f "node.*server.js" 2>/dev/null || true',
            
            // Install backend dependencies
            'npm install --production 2>&1 || npm install 2>&1',
            
            // Create .env file
            `cat > .env << 'EOF'
NODE_ENV=production
PORT=${this.BACKEND_PORT}
MONGODB_URI=${process.env.MONGODB_URI}
JWT_SECRET=${process.env.JWT_SECRET}
USER_ID=${user._id}
USER_EMAIL=${user.email}
MAC_Address=32:bd:3a:75:8f:62
EOF`,
            
            // Delete old PM2 process if exists (as ubuntu user)
            'sudo -u ubuntu pm2 delete backend 2>/dev/null || true',
            
            // Start with PM2 as ubuntu user (CRITICAL)
            `sudo -u ubuntu pm2 start server.js --name backend -- --port ${this.BACKEND_PORT}`,
            
            // Wait for start
            'sleep 5',
            
            // Verify PM2 status as ubuntu user
            'sudo -u ubuntu pm2 list',
            'sudo -u ubuntu pm2 status backend',
            
            // Check if backend is responding
            `curl -s -f http://localhost:${this.BACKEND_PORT}/health || echo "Backend not responding"`,
            
            // Save PM2 configuration as ubuntu user
            'sudo -u ubuntu pm2 save --force'
        ];
        
        await this.executeCommandsWithCD(instanceId, publicIp, method, `${this.APP_DIR}/backend`, commands);
    }

    // ✅ FIXED: Frontend setup
    async setupFrontend(instanceId, publicIp, method) {
        const commands = [
            // Install dependencies
            'npm install 2>&1',
            
            // Create .env
            `cat > .env << 'EOF'
VITE_API_URL=/api
VITE_WS_URL=wss://${publicIp}
VITE_APP_ENV=production
EOF`,
            
            // Build
            'npm run build 2>&1',
            
            // Deploy to nginx
            'sudo rm -rf /var/www/trading-frontend',
            'sudo mkdir -p /var/www/trading-frontend',
            'sudo cp -r dist/* /var/www/trading-frontend/',
            'sudo chown -R www-data:www-data /var/www/trading-frontend',
            'sudo chmod -R 755 /var/www/trading-frontend',
            
            // Verify build
            'ls -la /var/www/trading-frontend/ | head -5'
        ];
        
        await this.executeCommandsWithCD(instanceId, publicIp, method, `${this.APP_DIR}/frontend`, commands);
    }

    // ✅ FIXED: Nginx configuration
    async configureNginx(instanceId, publicIp, method) {
        const nginxConfig = `
server {
    listen 80;
    server_name _;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    access_log /var/log/nginx/trading-app-access.log;
    error_log /var/log/nginx/trading-app-error.log;

    location / {
        root /var/www/trading-frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${this.BACKEND_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    location /health {
        proxy_pass http://127.0.0.1:${this.BACKEND_PORT}/health;
        access_log off;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:${this.BACKEND_PORT}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`;
        
        const commands = [
            `cat > /etc/nginx/sites-available/trading-app << 'EOF'\n${nginxConfig}\nEOF`,
            'sudo ln -sf /etc/nginx/sites-available/trading-app /etc/nginx/sites-enabled/',
            'sudo rm -f /etc/nginx/sites-enabled/default',
            'sudo nginx -t',
            'sudo systemctl reload nginx'
        ];
        
        await this.executeCommandsWithCD(instanceId, publicIp, method, '/home/ubuntu', commands);
    }

    // ✅ FIXED: PM2 auto-start setup
    async setupPM2AutoStartComplete(instanceId, publicIp, method) {
        const commands = [
            // Save PM2 as ubuntu user
            'sudo -u ubuntu pm2 save --force',
            
            // Generate startup script for ubuntu user
            'sudo -u ubuntu pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | tail -1 | sudo bash',
            
            // Reload systemd
            'sudo systemctl daemon-reload',
            
            // Enable PM2 service
            'sudo systemctl enable pm2-ubuntu 2>/dev/null || true',
            
            // Create health check script
            `cat > ${this.APP_DIR}/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -s -f http://localhost:${this.BACKEND_PORT}/health > /dev/null 2>&1; then
    echo "[\\$(date)] Backend down, restarting..." >> ${this.APP_DIR}/health-check.log
    sudo -u ubuntu pm2 restart backend
fi
EOF`,
            `chmod +x ${this.APP_DIR}/health-check.sh`,
            
            // Add cron job
            '(crontab -l 2>/dev/null | grep -v "health-check.sh"; echo "*/5 * * * * /home/ubuntu/trading-app/health-check.sh") | crontab -',
            
            // Final verification
            'echo "========== FINAL PM2 STATUS (ubuntu user) =========="',
            'sudo -u ubuntu pm2 list',
            'sudo -u ubuntu pm2 status backend',
            'echo "========== BACKEND HEALTH =========="',
            `curl -s http://localhost:${this.BACKEND_PORT}/health || echo "Health check failed"`,
            'echo "========== PORT 5000 OWNER =========="',
            'sudo lsof -i :5000 | head -5'
        ];
        
        await this.executeCommandsWithCD(instanceId, publicIp, method, '/home/ubuntu', commands);
    }

    // ✅ Execute commands with specific working directory
    async executeCommandsWithCD(instanceId, publicIp, method, workingDir, commands) {
        const wrappedCommands = commands.map(cmd => `cd ${workingDir} && ${cmd}`);
        
        for (let i = 0; i < wrappedCommands.length; i++) {
            const cmd = wrappedCommands[i];
            console.log(`📝 [${i + 1}/${wrappedCommands.length}] Executing in ${workingDir}: ${cmd.substring(0, 80)}...`);
            
            let success = false;
            let retries = 0;
            const maxRetries = 2;
            
            while (!success && retries < maxRetries) {
                try {
                    if (method === 'ssm') {
                        await this.runSingleSSMCommand(instanceId, cmd);
                    } else {
                        await this.runSingleSSHCommand(publicIp, cmd);
                    }
                    success = true;
                    console.log(`✅ Command succeeded`);
                } catch (error) {
                    retries++;
                    console.log(`⚠️ Command failed (attempt ${retries}/${maxRetries}): ${error.message}`);
                    if (retries < maxRetries) {
                        await this.sleep(5000);
                    } else {
                        console.log(`❌ Command failed after ${maxRetries} attempts: ${cmd.substring(0, 80)}...`);
                    }
                }
            }
            
            await this.sleep(2000);
        }
    }

    // ✅ Run single SSM command
    async runSingleSSMCommand(instanceId, command) {
        const response = await ssm.sendCommand({
            InstanceIds: [instanceId],
            DocumentName: 'AWS-RunShellScript',
            Parameters: { commands: [command] },
            TimeoutSeconds: 600
        }).promise();
        
        const commandId = response.Command.CommandId;
        let attempts = 0;
        const maxAttempts = 120;
        
        while (attempts < maxAttempts) {
            await this.sleep(3000);
            
            const result = await ssm.listCommandInvocations({
                CommandId: commandId,
                InstanceId: instanceId,
                Details: true
            }).promise();
            
            const status = result.CommandInvocations[0]?.Status;
            
            if (status === 'Success') {
                return;
            } else if (status === 'Failed') {
                const output = result.CommandInvocations[0]?.CommandPlugins?.[0]?.Output || 'No output';
                throw new Error(`Command failed: ${output.substring(0, 300)}`);
            }
            
            attempts++;
        }
        
        throw new Error('Command timeout');
    }

    // ✅ Run single SSH command
    async runSingleSSHCommand(publicIp, command) {
        const sshCmd = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -i ${this.SSH_KEY_PATH} ubuntu@${publicIp} '${command}'`;
        const { stdout, stderr } = await execPromise(sshCmd, { timeout: 600000 });
        if (stderr && !stderr.includes('Warning')) {
            console.log('SSH stderr:', stderr.substring(0, 200));
        }
        return stdout;
    }

    // ========== HELPER FUNCTIONS ==========
    
    async configureSecurityGroup(instanceId) {
        try {
            console.log('🔒 Configuring Security Group rules...');
            const instanceDetails = await this.getInstanceDetails(instanceId);
            const securityGroupId = instanceDetails.SecurityGroups[0].GroupId;
            console.log(`📋 Security Group ID: ${securityGroupId}`);
            
            const sgDetails = await ec2.describeSecurityGroups({
                GroupIds: [securityGroupId]
            }).promise();
            
            const existingRules = sgDetails.SecurityGroups[0].IpPermissions;
            const rulesToAdd = [
                { port: 22, desc: 'SSH' },
                { port: 80, desc: 'HTTP' },
                { port: 443, desc: 'HTTPS' },
                { port: 5000, desc: 'Backend API' }
            ];
            
            for (const rule of rulesToAdd) {
                const ruleExists = existingRules.some(existing => 
                    existing.FromPort === rule.port && existing.ToPort === rule.port
                );
                
                if (!ruleExists) {
                    console.log(`➕ Adding port ${rule.port} (${rule.desc})`);
                    await ec2.authorizeSecurityGroupIngress({
                        GroupId: securityGroupId,
                        IpPermissions: [{
                            IpProtocol: 'tcp',
                            FromPort: rule.port,
                            ToPort: rule.port,
                            IpRanges: [{ CidrIp: '0.0.0.0/0' }]
                        }]
                    }).promise();
                }
            }
            return true;
        } catch (error) {
            console.error('Security Group config failed:', error.message);
            return false;
        }
    }

    async getInstanceDetails(instanceId) {
        const response = await ec2.describeInstances({
            InstanceIds: [instanceId]
        }).promise();
        return response.Reservations[0].Instances[0];
    }

    async waitForSSMWithRetry(instanceId, maxAttempts = 60) {
        console.log('⏳ Waiting for SSM agent...');
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await ssm.sendCommand({
                    InstanceIds: [instanceId],
                    DocumentName: 'AWS-RunShellScript',
                    Parameters: { commands: ['echo "SSM Ready"'] },
                    TimeoutSeconds: 30
                }).promise();
                if (response.Command?.CommandId) {
                    await this.sleep(5000);
                    const result = await ssm.listCommandInvocations({
                        CommandId: response.Command.CommandId,
                        InstanceId: instanceId
                    }).promise();
                    const status = result.CommandInvocations[0]?.Status;
                    if (status === 'Success') {
                        console.log(`✅ SSM ready after ${attempt} attempts`);
                        return true;
                    }
                }
            } catch (error) {
                // Ignore
            }
            await this.sleep(15000);
        }
        return false;
    }

    async waitForSSH(publicIp, maxAttempts = 30) {
        console.log('⏳ Waiting for SSH...');
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await execPromise(`nc -zv -w 5 ${publicIp} 22 2>&1`);
                console.log(`✅ SSH ready after ${attempt} attempts`);
                await this.sleep(5000);
                return true;
            } catch (error) {
                if (attempt % 5 === 0) {
                    console.log(`⏳ SSH not ready (attempt ${attempt}/${maxAttempts})...`);
                }
            }
            await this.sleep(10000);
        }
        return false;
    }

    async installBaseDependencies(instanceId, publicIp, method) {
        const commands = [
            'sudo apt-get update -y',
            'sudo apt-get upgrade -y',
            'sudo apt-get install -y curl wget git nginx build-essential software-properties-common'
        ];
        await this.executeCommandsWithCD(instanceId, publicIp, method, '/home/ubuntu', commands);
    }

    async setupNodeJS(instanceId, publicIp, method) {
        const commands = [
            'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -',
            'sudo apt-get install -y nodejs'
        ];
        await this.executeCommandsWithCD(instanceId, publicIp, method, '/home/ubuntu', commands);
    }

    async cloneApplication(instanceId, publicIp, method) {
        let gitCloneCmd = `git clone ${this.GITHUB_REPO} ${this.APP_DIR}`;

        console.log(gitCloneCmd,'===============gitCloneCmd=========================');
        

        if (this.GITHUB_TOKEN) {
            const repoUrl = this.GITHUB_REPO.replace('https://', `https://${this.GITHUB_TOKEN}@`);
            gitCloneCmd = `git clone ${repoUrl} ${this.APP_DIR}`;
        }
        const commands = [
            `sudo rm -rf ${this.APP_DIR}`,
            gitCloneCmd,
            `cd ${this.APP_DIR} && git checkout ${this.GITHUB_BRANCH} || true`
        ];
        await this.executeCommandsWithCD(instanceId, publicIp, method, '/home/ubuntu', commands);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}



export default new InstanceSetup();