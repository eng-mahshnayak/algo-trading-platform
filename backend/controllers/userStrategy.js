// // controllers/strategyUserController.js
// import StrategyUserModel from "../models/strategyUserModel.js";
// import UserModel from "../models/userModel.js";

// // 🔹 Helper: uniform success response
// const successResponse = (res, message, data = null, code = 200) => {
//   return res.status(code).json({
//     status: true,
//     statusCode: code,
//     message,
//     data,
//   });
// };

// // 🔹 Helper: uniform error response
// const errorResponse = (res, message, code = 500, error = null) => {
//   return res.status(code).json({
//     status: false,
//     statusCode: code,
//     message,
//     data: null,
//     error,
//   });
// };

// export const getAllStrategiesLoginUser = async (req, res) => {
//   try {

//     let loginUsers = await UserModel.findAll({
//        where: {
//         angelLoginUser: true,
//         role: "user",
//       },
//       raw:true
//     })


//     // अब इन users की strategies ढूंढो
//     const strategyName = loginUsers.map(user => user.strategyName);
    
    
//     const strategies = await StrategyUserModel.findAll({
//       where: {
//         strategyName: strategyName  // या जो भी foreign key हो
//       },
//       order: [["createdAt", "DESC"]],
//       raw: true
//     });

//     return successResponse(res, "successfully fetched data", strategies);
//   } catch (error) {
//     console.error("getAllStrategies error:", error);
//     return errorResponse(
//       res,
//       "Unexpected error occurred. Please try again.",
//       500,
//       error.message
//     );
//   }
// };

// export const getAllStrategies = async (req, res) => {
//   try {
//     const strategies = await StrategyUserModel.findAll({
//       order: [["createdAt", "DESC"]],
//       raw: true
//     });

//     return successResponse(res, "successfully fetched data", strategies);
//   } catch (error) {
//     console.error("getAllStrategies error:", error);
//     return errorResponse(
//       res,
//       "Unexpected error occurred. Please try again.",
//       500,
//       error.message
//     );
//   }
// };

// export const getStrategyById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const strategy = await StrategyUserModel.findByPk(id);

//     if (!strategy) {
//       return errorResponse(res, "Strategy not found", 404);
//     }

//     return successResponse(res, "successfully fetched data", strategy);
//   } catch (error) {
//     console.error("getStrategyById error:", error);
//     return errorResponse(
//       res,
//       "Unexpected error occurred. Please try again.",
//       500,
//       error.message
//     );
//   }
// };

// export const createStrategy = async (req, res) => {
//   try {
//     const { strategyName, strategyDis } = req.body;

//     if (!strategyName || !strategyName.trim()) {
//       return errorResponse(res, "strategyName is required", 400);
//     }

//     console.log(req.body);
    

//     const newStrategy = await StrategyUserModel.create({
//       strategyName: strategyName.trim(),
//       strategyDis: strategyDis?.trim() || "",
//     });

//     return successResponse(res, "Strategy created successfully", newStrategy, 201);
//   } catch (error) {
//     console.error("createStrategy error:", error);
//     return errorResponse(
//       res,
//       "Unexpected error occurred. Please try again.",
//       500,
//       error.message
//     );
//   }
// };

// export const updateStrategy = async (req, res) => {
//   try {
   
//     const { strategyName, strategyDis,id } = req.body;

//     const strategy = await StrategyUserModel.findByPk(id);

//     if (!strategy) {
//       return errorResponse(res, "Strategy not found", 404);
//     }

//     if (strategyName !== undefined) strategy.strategyName = strategyName.trim();
//     if (strategyDis !== undefined) strategy.strategyDis = strategyDis.trim();

//     await strategy.save();

//     return successResponse(res, "Strategy updated successfully", strategy);
//   } catch (error) {
//     console.error("updateStrategy error:", error);
//     return errorResponse(
//       res,
//       "Unexpected error occurred. Please try again.",
//       500,
//       error.message
//     );
//   }
// };

// export const deleteStrategy = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deleted = await StrategyUserModel.destroy({ where: { id } });

//     if (deleted === 0) {
//       return errorResponse(res, "Strategy not found or already deleted", 404);
//     }

//     return successResponse(res, "Strategy deleted successfully");
//   } catch (error) {
//     console.error("deleteStrategy error:", error);
//     return errorResponse(
//       res,
//       "Unexpected error occurred. Please try again.",
//       500,
//       error.message
//     );
//   }
// };


// controllers/strategyUserController.js
import StrategyUserModel from "../models/strategyUserModel.js";
import UserModel from "../models/userModel.js";
import { Op } from "sequelize";

// 🔹 Helper: uniform success response
const successResponse = (res, message, data = null, code = 200) => {
  return res.status(code).json({
    status: true,
    statusCode: code,
    message,
    data,
  });
};

// 🔹 Helper: uniform error response
const errorResponse = (res, message, code = 500, error = null) => {
  return res.status(code).json({
    status: false,
    statusCode: code,
    message,
    data: null,
    error,
  });
};

export const getAllStrategiesLoginUser = async (req, res) => {
  try {
    let loginUsers = await UserModel.findAll({
      where: {
        angelLoginUser: true,
        role: "user",
      },
      raw: true
    })

    const strategyName = loginUsers.map(user => user.strategyName);
    
    const strategies = await StrategyUserModel.findAll({
      where: {
        strategyName: strategyName
      },
      order: [["createdAt", "DESC"]],
      raw: true
    });

    return successResponse(res, "successfully fetched data", strategies);
  } catch (error) {
    console.error("getAllStrategies error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const getAllStrategies = async (req, res) => {
  try {
    const strategies = await StrategyUserModel.findAll({
      order: [["createdAt", "DESC"]],
      raw: true
    });

    return successResponse(res, "successfully fetched data", strategies);
  } catch (error) {
    console.error("getAllStrategies error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const getStrategyById = async (req, res) => {
  try {
    const { id } = req.params;

    const strategy = await StrategyUserModel.findByPk(id);

    if (!strategy) {
      return errorResponse(res, "Strategy not found", 404);
    }

    return successResponse(res, "successfully fetched data", strategy);
  } catch (error) {
    console.error("getStrategyById error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const createStrategy = async (req, res) => {
  try {
    const { strategyName, strategyDis, maxLotSize } = req.body;


    console.log(req.body,'================req.body=================');
    

    if (!strategyName || !strategyName.trim()) {
      return errorResponse(res, "strategyName is required", 400);
    }

    // ✅ Check for duplicate strategy name (case-insensitive)
    const trimmedName = strategyName.trim().toLowerCase();
    const existingStrategy = await StrategyUserModel.findOne({
      where: {
        strategyName: trimmedName
      }
    });

    if (existingStrategy) {
      return errorResponse(
        res, 
        `Strategy with name "${strategyName}" already exists. Please use a different name.`, 
        400
      );
    }

    console.log(req.body);

    const newStrategy = await StrategyUserModel.create({
      strategyName: trimmedName,
      strategyDis: strategyDis?.trim() || "",
      maxLotSize:
  maxLotSize !== undefined &&
  maxLotSize !== null &&
  maxLotSize !== ""
    ? parseInt(maxLotSize)
    : 0,
    });

    return successResponse(res, "Strategy created successfully", newStrategy, 201);
  } catch (error) {
    console.error("createStrategy error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const updateStrategy = async (req, res) => {
  try {
    const { strategyName, strategyDis, maxLotSize, id } = req.body;

    const strategy = await StrategyUserModel.findByPk(id);

    if (!strategy) {
      return errorResponse(res, "Strategy not found", 404);
    }

    // ✅ Check for duplicate strategy name (excluding current strategy)
    if (strategyName !== undefined && strategyName.trim().toLowerCase() !== strategy.strategyName) {
      const trimmedName = strategyName.trim().toLowerCase();
      const existingStrategy = await StrategyUserModel.findOne({
        where: {
          strategyName: trimmedName,
          id: { [Op.ne]: id } // Exclude current strategy
        }
      });

      if (existingStrategy) {
        return errorResponse(
          res, 
          `Strategy with name "${strategyName}" already exists. Please use a different name.`, 
          400
        );
      }
      strategy.strategyName = trimmedName;
    }

    if (strategyDis !== undefined) strategy.strategyDis = strategyDis.trim();
    
    strategy.maxLotSize =
  maxLotSize !== undefined &&
  maxLotSize !== null &&
  maxLotSize !== ""
    ? parseInt(maxLotSize)
    : 0;

    await strategy.save();

    return successResponse(res, "Strategy updated successfully", strategy);
  } catch (error) {
    console.error("updateStrategy error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

export const deleteStrategy = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await StrategyUserModel.destroy({ where: { id } });

    if (deleted === 0) {
      return errorResponse(res, "Strategy not found or already deleted", 404);
    }

    return successResponse(res, "Strategy deleted successfully");
  } catch (error) {
    console.error("deleteStrategy error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};