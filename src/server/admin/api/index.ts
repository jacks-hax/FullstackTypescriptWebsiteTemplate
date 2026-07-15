/**
 * API V1 Router
 * @version 1.0.0
 */
import express from 'express';
import PostsApi from '@server/admin/api/posts';
import UserApi from '@server/admin/api/users';

const router = express.Router();

router.use('/posts', PostsApi);
router.use('/users', UserApi);

export default router;
