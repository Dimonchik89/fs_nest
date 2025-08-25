import { BadRequestException, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
// import { ensureDir, writeFile, pathExists, remove } from 'fs-extra';
import { path } from 'app-root-path';
import { format } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { FILE_NOT_FOUND } from './files.constants';
import { DeleteFileResponse } from './file.types';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { File } from '../entities/file.entity';
import { Role } from '../auth/enums/role.enum';
import { User } from '../entities/user.entity';

import * as fsExtra from 'fs-extra';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid'

const UPLOADS_BASE_PATH = './uploads';

@Injectable()
export class FilesService {
	constructor(
		@Inject('FILE_REPOSITORY') private fileRepository: typeof File,
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		private jwtService: JwtService,
	) {}

	async createFolder(userPath): Promise<string> {
		const folderPath = join(path, UPLOADS_BASE_PATH, userPath);
		await fsExtra.ensureDir(folderPath);
		return folderPath;
	}

    async uploadFiles(
        files: Array<Express.Multer.File>,
        reqUser: { id: string; email: string, role: Role },
    ): Promise<File[]> {
		const { email, id, role } = reqUser;		

        if (!id || !email) {
            throw new UnauthorizedException('Invalid token payload.');
        }

		const user = await this.userRepository.findOne({ where: { id } });
		
        if (!user) {
            throw new UnauthorizedException('User not found.');
        }


        const maxFolderSizeMb = user.maxFolderSize;
        const maxFolderSizeBytes = maxFolderSizeMb * 1024 * 1024;

        const uploadFolder = join(path, UPLOADS_BASE_PATH, email);
        await fsExtra.ensureDir(uploadFolder);

        let currentTotalFolderSize = 0;

		

        try {
            const existingFileNames = await fsPromises.readdir(uploadFolder);
            for (const fileName of existingFileNames) {
                const filePath = join(uploadFolder, fileName);
                const stats = await fsPromises.stat(filePath);
                currentTotalFolderSize += stats.size;
            }
        } catch (error: any) {
			console.error(`Error reading directory ${uploadFolder}:`, error);
			throw new InternalServerErrorException('Failed to calculate folder size.');
        }

        const incomingFilesTotalSize = files.reduce((sum, file) => sum + file.size, 0);

        if (currentTotalFolderSize + incomingFilesTotalSize > maxFolderSizeBytes) {
            throw new BadRequestException(
                `Total size of file upload folder exceeded. Max allowed: ${maxFolderSizeMb}MB.`,
            );
        }

        const createdFiles: File[] = [];

        for (const file of files) {
            const { originalname, buffer, size } = file;
            
            const lastDotIndex = originalname.lastIndexOf('.');
            const fileExtPart = lastDotIndex !== -1 ? originalname.substring(lastDotIndex + 1) : '';

            const uniqueServerFileName = `${uuidv4()}.${fileExtPart}`
            const fullFilePath = join(uploadFolder, uniqueServerFileName);

            const existingFileByOriginalName = await this.fileRepository.findOne({
                where: {
                    userId: id,
                    originalName: originalname,
                },
            });

            if (existingFileByOriginalName) {
                try {
                    await fsPromises.unlink(existingFileByOriginalName.filePath);
                } catch (unlinkError: any) {
                    if (unlinkError.code !== 'ENOENT') {
                        console.warn(`Could not delete old file ${fullFilePath}:`, unlinkError);
                    }
                }
				await this.fileRepository.destroy({
                    where: { id: existingFileByOriginalName.id },
                });
            }

            await fsPromises.writeFile(fullFilePath, buffer);

            const createdFile = await this.fileRepository.create({
                filePath: fullFilePath,
                userId: id,
                fileExt: fileExtPart,
                fileName: uniqueServerFileName,
                originalName: originalname,
                size: size,
            });
            createdFiles.push(createdFile);
        }

        return createdFiles;
    }

	// async uploadFile(
	// 	file: Express.Multer.File,
	// 	bearerToken: string,
	// ): Promise<File> {
	// 	const date = format(new Date(), 'dd-MM-yyyy');
	// 	const { originalname } = file;
	// 	const [fileName, fileExt] = originalname.split('.');
	// 	const newFileName = `${fileName}_${date}.${fileExt}`;

	// 	const access_token = bearerToken.split(' ')[1];

	// 	const { id, email, maxFolderSize } =
	// 		await this.jwtService.decode(access_token); // убрать получение maxFolderSize и получать его из базы данных
	// 	const uploadFolder = `${path}/uploads/${email}`;

	// 	// ------------------------------------ проверка размера папки

	// 	let totalSize = 0;
	// 	const files = readdirSync(uploadFolder);

	// 	files.forEach((file) => {
	// 		const filePath = join(uploadFolder, file);
	// 		const stats = statSync(filePath);
	// 		totalSize += stats.size;
	// 	});

	// 	if (totalSize + file.size > maxFolderSize * 1024 * 1024) {
	// 		throw new BadRequestException(
	// 			'Total size of file upload folder exceeded',
	// 		);
	// 	}
	// 	// ------------------------------------

	// 	const hasOldFileWithThisName = await this.fileRepository.findOne({
	// 		where: { filePath: `${uploadFolder}/${newFileName}` },
	// 	});

	// 	if (hasOldFileWithThisName) {
	// 		await this.fileRepository.destroy({
	// 			where: { id: hasOldFileWithThisName.id },
	// 		});
	// 	}

	// 	await ensureDir(uploadFolder);
	// 	await writeFile(`${uploadFolder}/${newFileName}`, file.buffer);

	// 	const createdFile = await this.fileRepository.create({
	// 		filePath: `${uploadFolder}/${newFileName}`,
	// 		userId: id,
	// 		fileExt,
	// 	});

	// 	return createdFile;
	// }

	async deleteFile(fileId: string, userId: string): Promise<DeleteFileResponse> {
		const file = await this.fileRepository.findOne({ where: { id: fileId, userId } });
		if (!file) {
			throw new BadRequestException(FILE_NOT_FOUND);
		}

		const fullFilePathToDelete = file.filePath;
		// const folderPath = join(`${path}/uploads/${email}`, deletedFileName);
		// const folderPath = join(path, UPLOADS_BASE_PATH, email, deletedFileName);
		const res = await fsExtra.pathExists(fullFilePathToDelete);
		if (!res) {
			throw new BadRequestException(FILE_NOT_FOUND);
		}
		
		await fsExtra.remove(fullFilePathToDelete);
		await this.fileRepository.destroy({ where: { id: fileId } });

		return {
			statusCode: 200,
			message: `${file.originalName || file.fileName} file was deleted`,
		};
	}

	async getAllUserFiles(userId: string, page: string): Promise<{ rows: File[]; count: number }> {
		const currentPage = page || 1;
		const limit = 10;
		const offset = (Number(currentPage) - 1) * limit;

		const data = this.fileRepository.findAndCountAll({
			where: { userId },
			offset,
			limit,
			order: [['createdAt', 'DESC']]
		});
		return data;
	}

	// async downloadFile(id: string, userId: string) {
	// 	const file = await this.fileRepository.findOne({ where: { id, userId } });

	// 	if (!file) {
	// 		throw new BadRequestException(FILE_NOT_FOUND);
	// 	}
	// 	const fileName = file.filePath.split('/').pop();
	// 	return {
	// 		file: readFileSync(file.filePath),
	// 		fileName,
	// 	};
	// }
	async downloadFile(id: string, userId: string): Promise<{ filePath: string; fileName: string }> {
        // const access_token = bearerToken.split(' ')[1];
        // const { id: userId } = await this.jwtService.decode(access_token);
        if (!userId) {
            throw new UnauthorizedException('Invalid token payload.');
        }

        const file = await this.fileRepository.findOne({ where: { id, userId } });

        if (!file) {
            throw new BadRequestException(FILE_NOT_FOUND);
        }

        return {
            filePath: file.filePath,
			fileName: file.originalName,
            // fileName: file?.originalName || file?.fileName || file.filePath.split('/').pop(), // Постарайтесь использовать оригинальное имя
        };
    }
}
