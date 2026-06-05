import express from 'express';
import { adminGroupSquareOffAWS, adminPlaceAWSOrder, adminPlaceReBuyOrder, adminPlaceWatchListOrder, adminSquareOff, adminSquareOffPartialAWS, CreateInstanceInAws, getHealthData } from '../../controllers/awsInstance/adminController.js';
import { cloneInstance, getInstanceStatus, getUserInstances, startInstance, stopInstance, terminateInstance } from '../../controllers/awsInstance/instanceController.js';


import { StopInstanceInAws,StartInstanceInAws,DeleteInstanceInAws,GetInstanceStatus } from '../../controllers/awsInstance/adminController.js';
import { AdminAuthMiddleware } from '../../middleware/authMiddleware.js';



const router = express.Router();

router.get('/instance/health', getHealthData);

router.post('/watchlist/place/order',AdminAuthMiddleware,adminPlaceWatchListOrder)
router.post('/multiple/place/order',adminPlaceAWSOrder)
router.post('/rebuy/place/order',adminPlaceReBuyOrder)
router.post('/sell/multiple/place/order',adminGroupSquareOffAWS)
router.get('/sequareoff',adminSquareOff)
router.post('/sequareoff/partial',adminSquareOffPartialAWS)




router.get('/instance/create',CreateInstanceInAws)


// In your routes fil . =================new code  start =====================
router.post('/aws/stop-instance', StopInstanceInAws);
router.post('/aws/start-instance', StartInstanceInAws);
router.delete('/aws/delete-instance', DeleteInstanceInAws);
router.get('/aws/instance-status/:id', GetInstanceStatus);

//   =================new code  end =====================


// Instance Management
router.get('/clone', cloneInstance);           // Clone from AMI
router.post('/stop/:instanceId', stopInstance); // Stop instance
router.post('/start/:instanceId', startInstance); // Start instance
router.delete('/terminate/:instanceId', terminateInstance); // Delete instance

// Get Instances
router.get('/my-instances', getUserInstances);   // User ki saari instances
router.get('/status/:instanceId', getInstanceStatus); // Single instance status





export default router;