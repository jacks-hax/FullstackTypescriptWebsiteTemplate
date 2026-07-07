import PostRepository from '@database/repositories/post';
import express, { Request, Response } from 'express';

const router = express.Router();

router.use('/', async (request: Request, _: Response, next: Function) => {
    const posts = await PostRepository.listPosts();
    console.log('applying posts to appdata');
    request.appData!.posts = posts;
    next();
});

export default router;
