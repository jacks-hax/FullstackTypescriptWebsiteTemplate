import PostRepository from '@database/repositories/post';
import StringUtils from '@utils/string';
import express, { Request, Response } from 'express';

async function listPosts(_: Request, response: Response, next: Function) {
    const posts = await PostRepository.listPosts();
    console.log('applying posts to appdata');
    response.appData!.posts = posts;
    next();
}

async function getPost(request: Request, response: Response, next: Function) {
    const postId = StringUtils.getRequestParameter(request, 'id');
    if (!postId?.length) {
        return response.redirect('/404');
    }
    const post = await PostRepository.getPost(postId);
    if (!post) {
        return response.redirect('/404');
    }
    response.appData!.post = post;
    request.page = 'post';
    next();
}

const router = express.Router();

router.get('/', listPosts);
router.get('/:id', getPost);

export default router;
