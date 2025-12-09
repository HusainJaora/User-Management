import express from 'express';
import {addUser,deleteUser,getAllUsers,getSingleUser,editUser} from '../../controllers/admin/User.js';
import ensureAuthenticated from '../../middleware/authtoken.js';
import ensureAdmin from '../../middleware/ensureAdmin.js';  
const router = express.Router();
import {addUserValidation,checkDuplicateUser} from '../../middleware/userValidation.js';

router.delete('/delete-user/:id',ensureAuthenticated, ensureAdmin,deleteUser);
router.post('/add-user', ensureAuthenticated, ensureAdmin, addUserValidation, checkDuplicateUser, addUser);
router.put('/edit-user/:id', ensureAuthenticated, ensureAdmin, editUser);
router.get('/all-users', ensureAuthenticated, ensureAdmin, getAllUsers);
router.get('/user/:id', ensureAuthenticated, ensureAdmin, getSingleUser);


export default router;