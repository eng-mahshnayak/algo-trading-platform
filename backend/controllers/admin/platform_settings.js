
import PlatformSetting from "../../models/platform_settings.js";
import fs from "fs";
import path from "path";

// 🔹 Helper: uniform success response
const successResponse = (res, message, data = null, code = 200) => {
  return res.json({
    status: true,
    statusCode: code,
    message,
    data,
  });
};

// 🔹 Helper: uniform error response
const errorResponse = (res, message, code = 500, error = null) => {
  return res.json({
    status: false,
    statusCode: code,
    message,
    data: null,
    error,
  });
};



export const deletePlatformSetting = async (req, res) => {
  try {
    
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Platform setting ID is required", 400);
    }

    const setting = await PlatformSetting.findByPk(id);

    if (!setting) {
      return errorResponse(res, "Platform setting not found", 404);
    }

    await setting.destroy();

    return successResponse(
      res,
      "Platform setting deleted successfully"
    );
  } catch (error) {
    return errorResponse(
      res,
      "Unexpected error occurred",
      500,
      error.message
    );
  }
};


/* =====================================================
   ✅ GET ACTIVE PLATFORM SETTING
===================================================== */

export const getActivePlatformSetting = async (req, res) => {
  try {

    const setting = await PlatformSetting.findOne({
      where: {
        isActive: true,
      },
      raw:true,
      order: [["createdAt", "DESC"]], // agar multiple true ho to latest milega
    });

    if (!setting) {
      return errorResponse(res, "No active platform setting found", 404);
    }

    return successResponse(
      res,
      "Active platform setting fetched successfully",
      setting
    );
  } catch (error) {
   

    return errorResponse(
      res,
      "Unexpected error occurred",
      500,
      error.message
    );
  }
};



/* =====================================================
   ✅ GET ALL PLATFORM SETTINGS
===================================================== */

export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.findAll({
      order: [["createdAt", "DESC"]],
    });

    return successResponse(
      res,
      "Platform settings fetched successfully",
      settings
    );
  } catch (error) {
    

    return errorResponse(
      res,
      "Unexpected error occurred",
      500,
      error.message
    );
  }
};

/* =====================================================
   ✅ CREATE PLATFORM SETTING WITH LOGO
===================================================== */
export const createPlatformSetting = async (req, res) => {
  try {
    const {
      email,
      phoneSupport,
      whatsappSupport,
      website,
      softwareName,
      softwareTitle,
      isActive
    } = req.body;

    // Trim helper
const isEmpty = (val) => !val || !String(val).trim();

// Check all fields
if (
  isEmpty(email) ||
  isEmpty(phoneSupport) ||
  isEmpty(whatsappSupport) ||
  isEmpty(website) ||
  isEmpty(softwareName) ||
  isEmpty(softwareTitle) ||
  isActive === undefined
) {
  return errorResponse(res, "All fields are required", 400);
}

    // ✅ Check required
    if (!softwareName || !softwareName.trim()) {
      return errorResponse(res, "Software name is required", 400);
    }

    // ✅ Check if already exists
    const existing = await PlatformSetting.findOne({
      where:{
        email: email?.trim(),
      phone_support: phoneSupport?.trim() ,
      whatsapp_support: whatsappSupport?.trim()
      }
    });

    if (existing) {
      return errorResponse(
        res,
        "Platform setting already exists. Please update it.",
        409
      );
    }

    if(req.file===undefined||req.file===null) {
       return errorResponse(res, "File is required", 400);
    }
    

    // ✅ Handle file if uploaded
    let softwareLogo = null;
    if (req.file) {
      softwareLogo = `${req.protocol}://${req.get("host")}/uploads/platform-logos/${req.file.filename}`;
    }

    const newSetting = await PlatformSetting.create({
      email: email?.trim() || null,
      phone_support: phoneSupport?.trim() || null,
      whatsapp_support: whatsappSupport?.trim() || null,
      website: website?.trim() || null,
      software_name: softwareName.trim(),
      software_title: softwareTitle?.trim() || null,
      software_logo:softwareLogo,
      isActive:isActive
    });

    return successResponse(res, "Platform setting created successfully", newSetting, 201);
  } catch (error) {
   
    return errorResponse(res, "Unexpected error occurred", 500, error.message);
  }
};

/* =====================================================
   ✅ UPDATE PLATFORM SETTING WITH LOGO
===================================================== */
export const updatePlatformSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await PlatformSetting.findByPk(id);
    if (!setting) return errorResponse(res, "Platform setting not found", 404);

    const {
      email,
      phoneSupport,
      whatsappSupport,
      website,
      softwareName,
      softwareTitle,
      isActive
    } = req.body;

    // ✅ Update text fields if provided
    if (email !== undefined) setting.email = email?.trim() || null;
    if (phoneSupport !== undefined) setting.phone_support = phoneSupport?.trim() || null;
    if (whatsappSupport !== undefined) setting.whatsapp_support = whatsappSupport?.trim() || null;
    if (website !== undefined) setting.website = website?.trim() || null;
    if (softwareName !== undefined) setting.software_name = softwareName.trim();
    if (softwareTitle !== undefined) setting.software_title = softwareTitle?.trim() || null;
    if (isActive !== undefined) setting.isActive = isActive?.trim() || null;

    // ✅ Update logo if new file uploaded
    if (req.file) {
      // Delete old file if exists
      if (setting.software_logo) {
        const oldFilePath = path.join("uploads/platform-logos", path.basename(setting.software_logo));
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      setting.software_logo = `${req.protocol}://${req.get("host")}/uploads/platform-logos/${req.file.filename}`;
    }

    await setting.save();

    return successResponse(res, "Platform setting updated successfully", setting);
  } catch (error) {
    console.error("updatePlatformSetting error:", error);
    return errorResponse(res, "Unexpected error occurred", 500, error.message);
  }
};

