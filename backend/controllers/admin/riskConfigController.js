


import RiskConfig from "../../models/RiskConfig.js";


// ===============================
// CREATE RiskConfig (Only One Allowed)
// ===============================
export const createRiskConfig = async (req, res) => {
  try {
    const { maxLoss, maxProfit, strategyOne, strategyTwo, isActive } = req.body;

    // 🔥 Check if already exists
    const existingRisk = await RiskConfig.findOne();

    if (existingRisk) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "RiskConfig already exists. You cannot create another one.",
        error: "Only one RiskConfig allowed"
      });
    }

    // Prepare data object with only provided fields
    const dataToCreate = {};
    
    if (maxLoss !== undefined && maxLoss !== null) {
      dataToCreate.maxLoss = maxLoss;
    }
    
    if (maxProfit !== undefined && maxProfit !== null) {
      dataToCreate.maxProfit = maxProfit;
    }
    
    if (strategyOne !== undefined && strategyOne !== null) {
      dataToCreate.strategyOne = strategyOne;
    }
    
    if (strategyTwo !== undefined && strategyTwo !== null) {
      dataToCreate.strategyTwo = strategyTwo;
    }
    
    // Only set isActive if provided, otherwise use default false
    if (isActive !== undefined) {
      dataToCreate.isActive = isActive;
    }

    const risk = await RiskConfig.create(dataToCreate);

    return res.json({
      status: true,
      statusCode: 201,
      message: "RiskConfig created successfully",
      data: risk
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// GET ALL RiskConfigs
// ===============================
export const getAllRiskConfig = async (req, res) => {
  try {

    const risks = await RiskConfig.findAll({
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      status: true,
      statusCode: 200,
      message: "RiskConfig list fetched successfully",
      data: risks
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// GET ONE RiskConfig
// ===============================
export const getOneRiskConfig = async (req, res) => {
  try {

    const { id } = req.params;

    const risk = await RiskConfig.findByPk(id);

    if (!risk) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "RiskConfig not found",
        error: "RiskConfig not found"
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "RiskConfig fetched successfully",
      data: risk
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// UPDATE RiskConfig
// ===============================
export const updateRiskConfig = async (req, res) => {
  try {

    const { id } = req.params;
    const { maxLoss, maxProfit, strategyOne, strategyTwo, isActive } = req.body;

    const risk = await RiskConfig.findByPk(id);

    if (!risk) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "RiskConfig not found",
        error: "RiskConfig not found"
      });
    }

    // Prepare update object with only provided fields
    const dataToUpdate = {};
    
    // Only update fields that are provided in the request
    if (maxLoss !== undefined) {
      dataToUpdate.maxLoss = maxLoss;
    }
    
    if (maxProfit !== undefined) {
      dataToUpdate.maxProfit = maxProfit;
    }
    
    if (strategyOne !== undefined) {
      dataToUpdate.strategyOne = strategyOne;
    }
    
    if (strategyTwo !== undefined) {
      dataToUpdate.strategyTwo = strategyTwo;
    }
    
    if (isActive !== undefined) {
      dataToUpdate.isActive = isActive;
    }

    await risk.update(dataToUpdate);

    return res.json({
      status: true,
      statusCode: 200,
      message: "RiskConfig updated successfully",
      data: risk
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// DELETE RiskConfig
// ===============================
export const deleteRiskConfig = async (req, res) => {
  try {

    const { id } = req.params;

    const risk = await RiskConfig.findByPk(id);

    if (!risk) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "RiskConfig not found",
        error: "RiskConfig not found"
      });
    }

    await risk.destroy();

    return res.json({
      status: true,
      statusCode: 200,
      message: "RiskConfig deleted successfully"
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// GET ACTIVE RiskConfig (Helper function for other modules)
// ===============================
export const getActiveRiskConfig = async (req, res) => {
  try {
    const activeConfig = await RiskConfig.findOne({
      where: { isActive: true }
    });

    if (!activeConfig) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No active risk configuration found",
        data: null
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "Active risk configuration fetched successfully",
      data: activeConfig
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// TOGGLE RiskConfig Active Status
// ===============================
export const toggleRiskConfigStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const risk = await RiskConfig.findByPk(id);

    if (!risk) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "RiskConfig not found",
        error: "RiskConfig not found"
      });
    }

    // Toggle the isActive status
    await risk.update({ isActive: !risk.isActive });

    return res.json({
      status: true,
      statusCode: 200,
      message: `RiskConfig ${risk.isActive ? 'activated' : 'deactivated'} successfully`,
      data: risk
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// UPDATE Strategy One Only
// ===============================
export const updateStrategyOne = async (req, res) => {
  try {
    const { id } = req.params;
    const { fund, maxLoss } = req.body;

    const risk = await RiskConfig.findByPk(id);

    if (!risk) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "RiskConfig not found",
        error: "RiskConfig not found"
      });
    }

    // Get current strategyOne or use default
    const currentStrategyOne = risk.strategyOne || { fund: 50000, maxLoss: 15000 };
    
    // Update only provided fields
    const updatedStrategyOne = {
      fund: fund !== undefined ? fund : currentStrategyOne.fund,
      maxLoss: maxLoss !== undefined ? maxLoss : currentStrategyOne.maxLoss
    };

    await risk.update({ strategyOne: updatedStrategyOne });

    return res.json({
      status: true,
      statusCode: 200,
      message: "Strategy One updated successfully",
      data: risk
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};


// ===============================
// UPDATE Strategy Two Only
// ===============================
export const updateStrategyTwo = async (req, res) => {
  try {
    const { id } = req.params;
    const { fund, maxLoss } = req.body;

    const risk = await RiskConfig.findByPk(id);

    if (!risk) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "RiskConfig not found",
        error: "RiskConfig not found"
      });
    }

    // Get current strategyTwo or use default
    const currentStrategyTwo = risk.strategyTwo || { fund: 100000, maxLoss: 30000 };
    
    // Update only provided fields
    const updatedStrategyTwo = {
      fund: fund !== undefined ? fund : currentStrategyTwo.fund,
      maxLoss: maxLoss !== undefined ? maxLoss : currentStrategyTwo.maxLoss
    };

    await risk.update({ strategyTwo: updatedStrategyTwo });

    return res.json({
      status: true,
      statusCode: 200,
      message: "Strategy Two updated successfully",
      data: risk
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
      error: error.message
    });
  }
};