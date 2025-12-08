import express from 'express';
import ensureAuthenticated from '../middleware/authtoken.js';
const router = express.Router();
import viewUserProfile from '../controllers/userProfile.js';



router.get('/:id', ensureAuthenticated, viewUserProfile);


export default router;