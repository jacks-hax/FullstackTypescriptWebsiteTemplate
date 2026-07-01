/**
 * API V1 Router
 * @version 1.0.0
 */
import express from 'express';
import PostsApi from '@admin/api/posts';

const router = express.Router();

router.use('/posts', PostsApi);

export default router;
