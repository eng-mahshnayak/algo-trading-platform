// controllers/instanceController.js

import AMIManager from '../../services/awsServices/AMIManager.js';
import User from '../../models/userModel.js';

// ========== 1. Clone Instance from Another Instance ==========
export const cloneInstance = async (req, res) => {
    try {
        const sourceInstanceId = "i-0d5b2b1b96255e46e"
        const userId = req.headers.userid || 120;
        
        // Get user details
        const user = await User.findOne({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Clone instance from source instance
        const result = await AMIManager.cloneCompleteInstance(sourceInstanceId, user);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        console.log('Instance cloned successfully', {
            sourceInstanceId: sourceInstanceId,
            newInstanceId: result.instanceId,
            publicIp: result.publicIp,
            dbId: result.dbId
        });
        
        return res.json({
            success: true,
            statusCode: 201,
            message: 'Instance cloned successfully with all data and software',
            data: {
                instanceId: result.instanceId,
                publicIp: result.publicIp,
                dbId: result.dbId,
                sourceInstanceId: sourceInstanceId
            }
        });

    } catch (error) {
        console.error('Clone API Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== 2. Create AMI from Instance ==========
export const createAMI = async (req, res) => {
    try {
        const { instanceId, amiName } = req.body;
        
        const result = await AMIManager.createAMIFromInstance(instanceId, amiName);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
        
        return res.json({
            success: true,
            message: 'AMI creation started',
            data: {
                amiId: result.amiId,
                amiName: result.amiName
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== 3. Stop Instance ==========
export const stopInstance = async (req, res) => {
    try {
        const { instanceId } = req.params;
        
        const result = await AMIManager.stopInstance(instanceId);
        
        return res.json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== 4. Start Instance ==========
export const startInstance = async (req, res) => {
    try {
        const { instanceId } = req.params;
        
        const result = await AMIManager.startInstance(instanceId);
        
        return res.json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== 5. Terminate Instance ==========
export const terminateInstance = async (req, res) => {
    try {
        const { instanceId } = req.params;
        
        const result = await AMIManager.terminateInstance(instanceId);
        
        return res.json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== 6. Get User's All Instances ==========
export const getUserInstances = async (req, res) => {
    try {
        const userId = req.headers.userid;
        
        const result = await AMIManager.getUserInstances(parseInt(userId));
        
        return res.json({
            success: result.success,
            data: result.data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== 7. Get Single Instance Status ==========
export const getInstanceStatus = async (req, res) => {
    try {
        const { instanceId } = req.params;
        
        const result = await AMIManager.getInstanceStatus(instanceId);
        
        return res.json({
            success: result.success,
            data: result.data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== 8. Clone from AMI Directly ==========
export const cloneFromAMI = async (req, res) => {
    try {
        const { amiId } = req.body;
        const userId = req.headers.userid || 120;
        
        const user = await User.findOne({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const result = await AMIManager.cloneInstanceFromAMIId(amiId, user);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        return res.json({
            success: true,
            message: 'Instance cloned from AMI successfully',
            data: {
                instanceId: result.instanceId,
                publicIp: result.publicIp
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};