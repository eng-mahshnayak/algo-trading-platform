// routes/auth.routes.js


import express from "express";

import { loginWithTOTP, validateMPIN, logout, status, getUserLimits, getMasterScriptFilePaths, kotakNeoCredential, kotakNeoLoginWithTOtp, getKotakOrderHistory, adminKotakLoginNew } from '../controllers/kotalNeoController.js'
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();



// Step 1: TOTP Login
// router.get('/kotakneo/login/totp',authMiddleware, kotakNeoLoginWithTOtp );

router.get('/kotakneo/login/totp',authMiddleware, adminKotakLoginNew );

// Step 2: MPIN Validation
router.get('/kotakneo/login/mpin', validateMPIN);

router.get('/kotakneo/fund', authMiddleware,getUserLimits);

router.get('/kotakneo/instrument', getMasterScriptFilePaths);

router.post('/kotakneo/appcredential/create', authMiddleware,kotakNeoCredential);

router.get('/kotakneo/orderget',getKotakOrderHistory);

// Logout
router.post('/logout', logout);

// Check Auth Status
router.get('/status', status);

export default router;