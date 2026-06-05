import GithubSetting from '../../models/GithubSetting.js';

// Helper: success response
const successResponse = (res, message, data = null, code = 200) => {
  return res.status(code).json({
    status: true,
    statusCode: code,
    message,
    data,
  });
};

// Helper: error response
const errorResponse = (res, message, code = 500, error = null) => {
  return res.status(code).json({
    status: false,
    statusCode: code,
    message,
    data: null,
    error: error ? error.toString() : null,
  });
};

// ==================== GET ALL SETTINGS ====================
export const getAllGithubSettings = async (req, res) => {
  try {
    const settings = await GithubSetting.findAll({
      order: [['createdAt', 'DESC']],
    });

    return successResponse(
      res,
      'GitHub settings fetched successfully',
      settings
    );
  } catch (error) {
    console.error('Error fetching GitHub settings:', error);
    return errorResponse(res, 'Unexpected error occurred', 500, error.message);
  }
};

// ==================== GET SINGLE SETTING ====================
export const getGithubSettingById = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await GithubSetting.findByPk(id);

    if (!setting) {
      return errorResponse(res, 'GitHub setting not found', 404);
    }

    return successResponse(
      res,
      'GitHub setting fetched successfully',
      setting
    );
  } catch (error) {
    console.error('Error fetching GitHub setting:', error);
    return errorResponse(res, 'Unexpected error occurred', 500, error.message);
  }
};

// ==================== CREATE SETTING ====================
export const createGithubSetting = async (req, res) => {
  try {
    const {
      github_repo_url,
      github_branch,
      github_token,
      admin_email,
    } = req.body;

    // Validation
    if (!github_repo_url || !github_repo_url.trim()) {
      return errorResponse(res, 'GitHub repo URL is required', 400);
    }

    if (!github_token || !github_token.trim()) {
      return errorResponse(res, 'GitHub token is required', 400);
    }

    if (!admin_email || !admin_email.trim()) {
      return errorResponse(res, 'Admin email is required', 400);
    }

    // Check if setting already exists
    const existing = await GithubSetting.findOne({
      where: { github_repo_url: github_repo_url.trim() },
    });

    if (existing) {
      return errorResponse(res, 'GitHub setting with this URL already exists', 409);
    }

    const newSetting = await GithubSetting.create({
      github_repo_url: github_repo_url.trim(),
      github_branch: github_branch?.trim() || 'main',
      github_token: github_token.trim(),
      admin_email: admin_email.trim(),
    });

    return successResponse(
      res,
      'GitHub setting created successfully',
      newSetting,
      201
    );
  } catch (error) {
    console.error('Error creating GitHub setting:', error);
    return errorResponse(res, 'Unexpected error occurred', 500, error.message);
  }
};

// ==================== UPDATE SETTING ====================
export const updateGithubSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      github_repo_url,
      github_branch,
      github_token,
      admin_email,
    } = req.body;

    const setting = await GithubSetting.findByPk(id);

    if (!setting) {
      return errorResponse(res, 'GitHub setting not found', 404);
    }

    // Update fields if provided
    if (github_repo_url !== undefined) {
      setting.github_repo_url = github_repo_url.trim();
    }

    if (github_branch !== undefined) {
      setting.github_branch = github_branch.trim();
    }

    if (github_token !== undefined) {
      setting.github_token = github_token.trim();
    }

    if (admin_email !== undefined) {
      setting.admin_email = admin_email.trim();
    }

    await setting.save();

    return successResponse(
      res,
      'GitHub setting updated successfully',
      setting
    );
  } catch (error) {
    console.error('Error updating GitHub setting:', error);
    return errorResponse(res, 'Unexpected error occurred', 500, error.message);
  }
};

// ==================== DELETE SETTING ====================
export const deleteGithubSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await GithubSetting.findByPk(id);

    if (!setting) {
      return errorResponse(res, 'GitHub setting not found', 404);
    }

    await setting.destroy();

    return successResponse(res, 'GitHub setting deleted successfully');
  } catch (error) {
    console.error('Error deleting GitHub setting:', error);
    return errorResponse(res, 'Unexpected error occurred', 500, error.message);
  }
};