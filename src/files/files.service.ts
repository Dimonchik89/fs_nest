import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ensureDir, writeFile, pathExists, remove } from 'fs-extra';
import { path } from 'app-root-path';
import { format } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { File } from './file.model';
import { FILE_NOT_FOUND } from './files.constants';
import { DeleteFileResponse } from './file.types';
import { createReadStream, readFileSync } from 'fs';

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

		const { id, email } = await this.jwtService.decode(access_token);
		const uploadFolder = `${path}/uploads/${email}`;

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

	async deleteFile(id: string): Promise<DeleteFileResponse> {
		const file = await this.fileRepository.findOne({ where: { id } });
		if (!file) {
			throw new BadRequestException(FILE_NOT_FOUND);
		}

		const res = await pathExists(file.filePath);
		if (!res) {
			throw new BadRequestException(FILE_NOT_FOUND);
		}
		await remove(file.filePath);
		await this.fileRepository.destroy({ where: { id } });

		const fileName = file.filePath
			.split('/')
			.find((item, index, arr) => index === arr.length - 1);

		return {
			statusCode: 200,
			message: `${fileName} file was deleted`,
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
