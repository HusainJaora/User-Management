import express from 'express';
import {getAllProjects} from '../../controllers/admin/project.js';
import ensureAuthenticated from '../../middleware/authtoken.js';
import ensureAdmin from '../../middleware/ensureAdmin.js';  
const router = express.Router();

router.get('/', ensureAuthenticated, ensureAdmin, getAllProjects);

export default router;
