import express from 'express';
import { getAllUsers, getPopupBoxDyamicCode, getUserById, getUserByIdAdminCheckUserDeshboard, updateUserPakage, updateUserProfile, userLogout } from '../controllers/userController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';
import { downloadOrderData, downloadUserAngelOneCredential, downloadUserExcelFile } from '../excelFiles/downloadExcel.js';
import multer from "multer";



// Store uploaded images in /uploads folder
const storage = multer.memoryStorage(); // or diskStorage if you want actual file
const upload = multer({ storage });



const router = express.Router();
  
router.get('/get-users', getAllUsers);
router.put('/profile/update',upload.single("image"), updateUserProfile);
router.put('/package/update', updateUserPakage);
router.get('/getuser/profile',authMiddleware, getUserById);
router.get('/logout',authMiddleware, userLogout);

router.get('/withouttoken/getuser', getUserByIdAdminCheckUserDeshboard);


// excel 
router.get('/export/users',authMiddleware, downloadUserExcelFile);
router.get('/export/angelone/credential',authMiddleware, downloadUserAngelOneCredential);
router.get('/export/orders',authMiddleware, downloadOrderData);

//  test apis
// router.get('/test/get/user/fund', testGetAngelOneProfileFund); 

// router.get('/test/get/user/trade', testGetTradeBook); 
// router.get('/test/get/user/order', testGetOrder); 
// router.get('/test/get/user/perticular/order', testGetPerticularOrder); 


router.get('/get-popup-html',authMiddleware,getPopupBoxDyamicCode)

export default router;