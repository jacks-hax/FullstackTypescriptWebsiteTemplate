import express from 'express';
//import StaticFiles from '@middleware/static-files';
import PostsRouter from '@server/admin/static/posts';
import Static from '@middleware/static';

const router = express.Router();

router.use('/posts', PostsRouter);
//router.use('/', StaticFiles('admin'));
router.use('/', Static('admin'));
//router.use('/', Static);

export default router;
