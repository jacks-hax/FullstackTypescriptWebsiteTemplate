import express from 'express';
import StaticFiles from '@middleware/static-files';

const router = express.Router();

router.use('/', StaticFiles('admin'));

export default router;
