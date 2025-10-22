import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from '../entities/post.entity';
import { join } from 'path';
import { path } from 'app-root-path';
import * as fsExtra from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import { NOT_FOUND } from '../files/files.constants';
import { BAD_REQUEST } from '../app.constants';
import { FindAllPostResponse, PostImage, PostSuccess } from './post.types';

@Injectable()
export class PostsService {
	constructor(@Inject('POST_REPOSITORY') private postRepository: typeof Post) {}

	async uploadArrayFiles({ files }: { files: Array<Express.Multer.File> }) {
		// const createdFiles: string[] = [];
		const createdFiles: Array<PostImage> = [];

		const uploadFolder = join(path, process.env.UPLOADS_BASE_PATH, 'posts');
		await fsExtra.ensureDir(uploadFolder);

		for (const file of files) {
			const { originalname, buffer, size } = file;

			const lastDotIndex = originalname.lastIndexOf('.');
			const fileExtPart =
				lastDotIndex !== -1 ? originalname.substring(lastDotIndex + 1) : '';

			const uniqueServerFileName = `${uuidv4()}.${fileExtPart}`;
			const fullFilePath = join(uploadFolder, uniqueServerFileName);

			try {
				await fsPromises.writeFile(fullFilePath, buffer);
				// createdFiles.push(join('posts', uniqueServerFileName));
				createdFiles.push({
					title: file.originalname,
					src: join('posts', uniqueServerFileName),
				});
			} catch (error) {
				throw new BadRequestException();
			}
		}

		return createdFiles;
	}

	async create({
		createPostDto,
		optionalFiles,
		requiredFiles,
	}: {
		requiredFiles?: Express.Multer.File[];
		optionalFiles?: Express.Multer.File[];
		createPostDto: CreatePostDto;
	}): Promise<Post> {
		try {
			const pathRequiredFilesArray = await this.uploadArrayFiles({
				files: requiredFiles,
			});
			let pathOptionalFilesArray = null;
			let createdPost: Post | null = null;

			if (optionalFiles) {
				pathOptionalFilesArray = await this.uploadArrayFiles({
					files: optionalFiles,
				});
			}

			if (pathOptionalFilesArray) {
				createdPost = await this.postRepository.create({
					...createPostDto,
					requiredFiles: pathRequiredFilesArray,
					optionalFiles: pathOptionalFilesArray,
				});
			} else {
				createdPost = await this.postRepository.create({
					...createPostDto,
					requiredFiles: pathRequiredFilesArray,
				});
			}

			return createdPost;
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async findAll({
		limit,
		page,
	}: {
		page?: string;
		limit?: string;
	}): Promise<FindAllPostResponse> {
		try {
			const postLimit = +limit || 8;
			const postPage = +page || 1;
			const postOffset = postPage * postLimit - postLimit;

			return await this.postRepository.findAndCountAll({
				limit: postLimit,
				offset: postOffset,
				order: [['createdAt', 'DESC']],
			});
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async findOne(id: string): Promise<Post> {
		try {
			const post = await this.postRepository.findOne({ where: { id } });

			return post;
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async update({
		id,
		updatePostDto,
		optionalFiles = [],
		requiredFiles = [],
	}: {
		id: string;
		updatePostDto: UpdatePostDto;
		requiredFiles?: Express.Multer.File[];
		optionalFiles?: Express.Multer.File[];
	}) {
		try {
			const oldPost = await this.postRepository.findOne({ where: { id } });

			console.log('requiredFiles', requiredFiles);
			console.log('optionalFiles', optionalFiles);

			if (!oldPost) {
				throw new BadRequestException(NOT_FOUND);
			}

			if (!requiredFiles.length && !optionalFiles.length) {
				const [count, [updatedPost]] = await this.postRepository.update(
					updatePostDto,
					{ where: { id }, returning: true },
				);

				return updatedPost;
			}

			if (requiredFiles.length && optionalFiles.length) {
				await this.deletePostImageArray(oldPost.requiredFiles);
				await this.deletePostImageArray(oldPost.optionalFiles);

				const pathRequiredFilesArray = await this.uploadArrayFiles({
					files: requiredFiles,
				});
				const pathOptionalFilesArray = await this.uploadArrayFiles({
					files: optionalFiles,
				});

				const [count, [updatedPost]] = await this.postRepository.update(
					{
						...updatePostDto,
						requiredFiles: pathRequiredFilesArray,
						optionalFiles: pathOptionalFilesArray,
					},
					{ where: { id }, returning: true },
				);

				return updatedPost;
			}

			if (requiredFiles.length && !optionalFiles.length) {
				await this.deletePostImageArray(oldPost.requiredFiles);

				const pathRequiredFilesArray = await this.uploadArrayFiles({
					files: requiredFiles,
				});

				const [count, [updatedPost]] = await this.postRepository.update(
					{
						...updatePostDto,
						requiredFiles: pathRequiredFilesArray,
					},
					{ where: { id }, returning: true },
				);

				return updatedPost;
			}

			if (!requiredFiles.length && optionalFiles.length) {
				await this.deletePostImageArray(oldPost.optionalFiles);

				const pathOptionalFilesArray = await this.uploadArrayFiles({
					files: optionalFiles,
				});

				const [count, [updatedPost]] = await this.postRepository.update(
					{
						...updatePostDto,
						optionalFiles: pathOptionalFilesArray,
					},
					{ where: { id }, returning: true },
				);

				return updatedPost;
			}
		} catch (error) {
			throw new BadRequestException(error.message);
		}

		return `This action updates a #${id} post`;
	}

	async remove(id: string): Promise<PostSuccess> {
		try {
			const post = await this.postRepository.findOne({ where: { id } });

			console.log('post', post);
			if (!post) {
				throw new BadRequestException('Post not found');
			}

			let allImagePath = [];

			if (post?.requiredFiles && post?.requiredFiles.length) {
				allImagePath = [...allImagePath, ...post?.requiredFiles];
			}

			if (post?.optionalFiles && post?.optionalFiles.length) {
				allImagePath = [...allImagePath, ...post?.optionalFiles];
			}

			const requiredPostImagePromise = allImagePath.map(async ({ src }) => {
				const path = join(__dirname, '..', '..', 'uploads', src);
				return await fsExtra.pathExists(path);
			});

			const allImagePathExist = await Promise.all(requiredPostImagePromise);

			const allImagesFound = allImagePathExist.every((item) => item);

			if (!allImagesFound) {
				throw new BadRequestException(BAD_REQUEST);
			}

			// allImagePath.forEach(async (imgPath) => {
			// 	const path = join(__dirname, '..', '..', 'uploads', imgPath);
			// 	await fsExtra.remove(path);
			// });
			await this.deletePostImageArray(allImagePath);

			await this.postRepository.destroy({ where: { id } });
			return {
				statusCode: 200,
				message: `the post ${id} was deleted`,
			};
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async deletePostImageArray(arrayPath: PostImage[]) {
		try {
			arrayPath.forEach(async ({ src }) => {
				const path = join(__dirname, '..', '..', 'uploads', src);
				await fsExtra.remove(path);
			});
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}
