import User from '../../models/userModel.js';

// Get all users with risk management fields
export const getAllUsersRisk = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'riskMngtActive', 'riskLimit', 'email', 'username'],
      order: [['id', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: users,
      message: 'Users fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching users risk data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get single user risk settings
export const getUserRiskById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'firstName', 'lastName', 'riskMngtActive', 'riskLimit', 'email']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User risk data fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching user risk data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user risk data',
      error: error.message
    });
  }
};

// Update user risk settings
export const updateUserRisk = async (req, res) => {
  try {
    const { id } = req.params;
    const { riskMngtActive, riskLimit } = req.body;

    // Validate riskLimit if provided
    if (riskLimit !== undefined && (isNaN(riskLimit) || riskLimit < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Risk limit must be a valid number greater than or equal to 0'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (riskMngtActive !== undefined) {
      user.riskMngtActive = riskMngtActive;
    }
    
    if (riskLimit !== undefined) {
      user.riskLimit = riskLimit;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        riskMngtActive: user.riskMngtActive,
        riskLimit: user.riskLimit
      },
      message: 'Risk management settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating user risk settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update risk settings',
      error: error.message
    });
  }
};

// Bulk update risk settings
export const bulkUpdateUserRisk = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, riskMngtActive, riskLimit }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { id, riskMngtActive, riskLimit } = update;
        
        const user = await User.findByPk(id);
        
        if (!user) {
          errors.push({ id, error: 'User not found' });
          continue;
        }

        if (riskMngtActive !== undefined) {
          user.riskMngtActive = riskMngtActive;
        }
        
        if (riskLimit !== undefined && !isNaN(riskLimit) && riskLimit >= 0) {
          user.riskLimit = riskLimit;
        }

        await user.save();
        
        results.push({
          id: user.id,
          riskMngtActive: user.riskMngtActive,
          riskLimit: user.riskLimit
        });
      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      data: { results, errors },
      message: `${results.length} users updated successfully, ${errors.length} failed`
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update risk settings',
      error: error.message
    });
  }
};