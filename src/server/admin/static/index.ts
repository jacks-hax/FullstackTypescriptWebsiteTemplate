import express from 'express';
import StaticFiles from '@middleware/static-files';
import PostsRouter from '@server/admin/static/posts';

const router = express.Router();

router.use('/posts', PostsRouter);
router.use('/', StaticFiles('admin'));

export default router;
