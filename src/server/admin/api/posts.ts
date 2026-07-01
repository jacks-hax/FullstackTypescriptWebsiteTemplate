import express, { Request, Response } from 'express';
import { RequestError } from '@database/models/errors';
import PostRepository from '@database/repositories/post';
import JsonApiResponse from '@models/jsonapi';
import Constants from '@constants/shared';
import Post from '@database/models/post';
import Utils from '@utils/utils';
import StringUtils from '@utils/string';

/**
 * @description Fetch User Details by ID
 * @param request
 * @param response
 */
async function getPostById(request: Request, response: Response) {
    try {
        const postId = StringUtils.getRequestParameter(request, 'id');
        if (!postId?.length) {
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, 'Post Id missing');
        }
        const post = await PostRepository.getPost(postId);
        if (!post) {
            throw new RequestError(
                Constants.ERROR_CODES.NOT_FOUND,
                StringUtils.format(Constants.ERROR_MESSAGES.RECORD_NOT_FOUND, ['post', 'id', postId])
            );
        }
        response.status(200).json(new JsonApiResponse(post));
    } catch (error) {
        console.error(error);
        Utils.applyErrorToResponse(error, response);
    }
}

async function getPosts(request: Request, response: Response) {
    try {
        const 
    } catch (error) {
        console.error(error);
        Utils.applyErrorToResponse(error, response);
    }
}

/**
 * @description Create a post record.
 * @param request
 * @param response
 */
async function createPost(request: Request, response: Response) {
    try {
        if (!request.sessionID?.length) {
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, Constants.ERROR_MESSAGES.SESSION_NOT_FOUND);
        }
        if (!request.body) {
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, Constants.ERROR_MESSAGES.INVALID_PAYLOAD);
        }
        const inputPost: Post = Post.from(request.body);
        const createdPost = await PostRepository.createPost(inputPost);
        response.status(201).json({
            message: 'Success',
            data: createdPost
        });
    } catch (error) {
        console.error(error);
        Utils.applyErrorToResponse(error, response);
    }
}

/**
 * @description Update a Post record.
 * @param request
 * @param response
 */
async function updatePost(request: Request, response: Response) {
    try {
        const inputPost = Post.from(request.body);
        inputPost.Id = StringUtils.getRequestParameter(request, 'id');
        console.log('UPDATE POST', inputPost);
        const result = await PostRepository.updatePost(inputPost);

        response.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        console.error(error);
        let errorMessage = error instanceof Error ? error.message : Constants.ERROR_MESSAGES.UNEXPECTED;
        let statusCode = Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        if (error instanceof RequestError) {
            if (error.statusCode) {
                statusCode = error.statusCode;
            }
        }
        response.status(statusCode).json({
            error: errorMessage
        });
    }
}

async function deletePost(request: Request, response: Response) {
    try {
        const postId = StringUtils.getRequestParameter(request, 'id');
        const post = await PostRepository.getPost(postId);
        if (!post) {
            throw new RequestError(
                Constants.ERROR_CODES.NOT_FOUND,
                StringUtils.format(Constants.ERROR_MESSAGES.RECORD_NOT_FOUND, ['post', 'id', postId])
            );
        }
        const result = await PostRepository.deletePost(postId);

        response.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        console.error(error);
        let errorMessage = error instanceof Error ? error.message : Constants.ERROR_MESSAGES.UNEXPECTED;
        let statusCode = Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        if (error instanceof RequestError) {
            if (error.statusCode) {
                statusCode = error.statusCode;
            }
        }
        response.status(statusCode).json({
            error: errorMessage
        });
    }
}

const router = express.Router();
router.post('/', createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
