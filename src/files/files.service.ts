import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ensureDir, writeFile, pathExists, remove } from 'fs-extra';
import { path } from 'app-root-path';
import { format } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { FILE_NOT_FOUND } from './files.constants';
import { DeleteFileResponse } from './file.types';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { File } from '../entities/file.entity';

@Injectable()
export class FilesService {
	constructor(
		@Inject('FILE_REPOSITORY') private fileRepository: typeof File,
		private jwtService: JwtService,
	) {}

	async createFolder(userPath): Promise<string> {
		const folderPath = `${path}/uploads/${userPath}`;
		await ensureDir(folderPath);
		return folderPath;
	}

	async uploadFile(
		file: Express.Multer.File,
		bearerToken: string,
	): Promise<File> {
		const date = format(new Date(), 'dd-MM-yyyy');
		const { originalname } = file;
		const [fileName, fileExt] = originalname.split('.');
		const newFileName = `${fileName}_${date}.${fileExt}`;

		const access_token = bearerToken.split(' ')[1];

		const { id, email, maxFolderSize } =
			await this.jwtService.decode(access_token); // убрать получение maxFolderSize и получать его из базы данных
		const uploadFolder = `${path}/uploads/${email}`;

		// ------------------------------------ проверка размера папки

		let totalSize = 0;
		const files = readdirSync(uploadFolder);

		files.forEach((file) => {
			const filePath = join(uploadFolder, file);
			const stats = statSync(filePath);
			totalSize += stats.size;
		});

		if (totalSize + file.size > maxFolderSize * 1024 * 1024) {
			throw new BadRequestException(
				'Total size of file upload folder exceeded',
			);
		}
		// ------------------------------------

		const hasOldFileWithThisName = await this.fileRepository.findOne({
			where: { filePath: `${uploadFolder}/${newFileName}` },
		});

		if (hasOldFileWithThisName) {
			await this.fileRepository.destroy({
				where: { id: hasOldFileWithThisName.id },
			});
		}

		await ensureDir(uploadFolder);
		await writeFile(`${uploadFolder}/${newFileName}`, file.buffer);

		const createdFile = await this.fileRepository.create({
			filePath: `${uploadFolder}/${newFileName}`,
			userId: id,
			fileExt,
		});

		return createdFile;
	}

	async deleteFile(id: string, email: string): Promise<DeleteFileResponse> {
		const file = await this.fileRepository.findOne({ where: { id } });
		if (!file) {
			throw new BadRequestException(FILE_NOT_FOUND);
		}

		const deletedFileName = file.filePath.split('/').pop();
		const folderPath = join(`${path}/uploads/${email}`, deletedFileName);
		const res = await pathExists(folderPath);
		if (!res) {
			throw new BadRequestException(FILE_NOT_FOUND);
		}
		await remove(folderPath);
		await this.fileRepository.destroy({ where: { id } });

		return {
			statusCode: 200,
			message: `${deletedFileName} file was deleted`,
		};
	}

	async getAllUserFiles(bearerToken: string, page: string): Promise<File[]> {
		const access_token = bearerToken.split(' ').pop();
		const user = await this.jwtService.decode(access_token);
		const currentPage = page || 1;
		const limit = 2;
		const offset = (Number(currentPage) - 1) * limit;

		const files = this.fileRepository.findAll({
			where: { userId: user.id },
			offset,
			limit,
		});
		return files;
	}

	async downloadFile(id: string) {
		const file = await this.fileRepository.findOne({ where: { id } });

		if (!file) {
			throw new BadRequestException(FILE_NOT_FOUND);
		}
		const fileName = file.filePath.split('/').pop();
		return {
			file: readFileSync(file.filePath),
			fileName,
		};
	}
}
