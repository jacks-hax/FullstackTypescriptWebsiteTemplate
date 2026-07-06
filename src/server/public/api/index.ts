/**
 * API V1 Router
 * @version 1.0.0
 */
import express from 'express';
import UsersApi from '@server/public/api/users';
import AuthApi from '@server/public/api/auth';

const router = express.Router();

router.use('/user', UsersApi);
router.use('/auth', AuthApi);

export default router;
