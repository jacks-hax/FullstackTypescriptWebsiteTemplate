/**
 * API V1 Router
 * @version 1.0.0
 */
import express from 'express';
import UsersApi from '@api/users/index';
import AuthApi from '@api/auth/index';

const router = express.Router();

router.use('/user', UsersApi);
router.use('/auth', AuthApi);

export default router;
