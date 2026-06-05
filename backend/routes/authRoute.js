import express from 'express';
import { register, login, profileUpdate, addressUpdate, updatePassword, sendForgotEmail, verifyCode, newPassword,   loginWithGroww, growwCallback,  } from '../controllers/authController.js';
import { upload } from "../middleware/upload.js"
import {authMiddleware} from '../middleware/authMiddleware.js';



const router = express.Router();

// local 
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', login);
router.put('/profile/update', upload.single("image"), profileUpdate);
router.put("/address/update", upload.none(), addressUpdate);
router.put('/update-password',authMiddleware, updatePassword);
router.post('/forgot-password', sendForgotEmail);
router.post('/verify-code', verifyCode);
router.post('/new-password', newPassword);


// Groww Login
router.get("/groww", loginWithGroww);
router.get("/groww/callback", growwCallback);



export default router;
