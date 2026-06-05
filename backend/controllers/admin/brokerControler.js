// controllers/brokerController.js
import BrokerModel from "../../models/borkerModel.js";

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

// ✅ Get all brokers
export const getAllBrokers = async (req, res) => {
  try {

    const brokers = await BrokerModel.findAll({
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, "successfully fetched data", brokers);

  } catch (error) {
    console.error("getAllBrokers error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

// ✅ Get broker by ID
export const getBrokerById = async (req, res) => {
  try {
    const { id } = req.params;

    const broker = await BrokerModel.findByPk(id);

    if (!broker) {
      return errorResponse(res, "Broker not found", 404);
    }

    return successResponse(res, "successfully fetched data", broker);
  } catch (error) {
    console.error("getBrokerById error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

// ✅ Create broker
export const createBroker = async (req, res) => {
  try {
    const { brokerName, brokerLink,tag } = req.body;


    if (!brokerName || !brokerName.trim()) {
      return errorResponse(res, "brokerName is required", 400);
    }

    const newBroker = await BrokerModel.create({
      brokerName: brokerName,
      brokerLink: brokerLink?.trim(),
      tag:tag
    });

     

    return successResponse(res, "Broker created successfully", newBroker, 201);
  } catch (error) {
    console.error("createBroker error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

// ✅ Update broker
export const updateBroker = async (req, res) => {
  try {
   
    const { brokerName, brokerLink,tag,id } = req.body;

    const broker = await BrokerModel.findByPk(id);

    if (!broker) {
      return errorResponse(res, "Broker not found", 404);
    }

    if (brokerName !== undefined) {
      broker.brokerName = brokerName.trim();
    }
    if (brokerLink !== undefined) {
      broker.brokerLink = brokerLink.trim();
    }

    if (tag !== undefined) {
      broker.tag = tag.trim();
    }


    await broker.save();

    return successResponse(res, "Broker updated successfully", broker);
  } catch (error) {
    console.error("updateBroker error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};

// ✅ Delete broker
export const deleteBroker = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await BrokerModel.destroy({ where: { id } });

    if (deleted === 0) {
      return errorResponse(res, "Broker not found or already deleted", 404);
    }

    return successResponse(res, "Broker deleted successfully");
  } catch (error) {
    console.error("deleteBroker error:", error);
    return errorResponse(
      res,
      "Unexpected error occurred. Please try again.",
      500,
      error.message
    );
  }
};
