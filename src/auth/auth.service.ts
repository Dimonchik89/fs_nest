import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../user/user.model';
import { AuthDto } from './dto/auth.dto';
import { hash, genSalt, compare } from 'bcryptjs';
import { FilesService } from '../files/files.service';
import { USER_NOT_FOUND_ERROR, WRONG_PASSWORD_ERROR } from './auth.constants';
import { JwtService } from '@nestjs/jwt';
import { TailUserForToken } from '../user/user.types';


@Injectable()
export class AuthService {
	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		private readonly filesService: FilesService,
		private jwtService: JwtService
	) {}

	async findUser(dto: AuthDto): Promise<User> {
		return this.userRepository.findOne<User>({ where: { email: dto.login }});
	}

	async createUser(dto: AuthDto): Promise<{ access_token: string }> {
		const salt = await genSalt(10);
		const folderPath = await this.filesService.createFolder(dto.login)

		const newUser = await this.userRepository.create({
			email: dto.login,
			passwordHash: await hash(dto.password, salt),
			subscription: "free",
			maxFolderSize: 50,
			folderPath
		})

		const tailUser = {
			id: newUser.id,
			email: newUser.email,
			subscription: newUser.subscription,
			maxFolderSize: newUser.maxFolderSize,
			stripeCustomerId: newUser.stripeCustomerId
		}

		return {
			access_token: await this.jwtService.signAsync(tailUser)
		};
	}

	async validateUser(dto: AuthDto):
		Promise<TailUserForToken> {
		const user = await this.findUser(dto);

		if(!user) {
			throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
		}

		const isCorrectPassword = await compare(dto.password, user.passwordHash);

		if(!isCorrectPassword) {
			throw new UnauthorizedException(WRONG_PASSWORD_ERROR);
		}

		return {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			maxFolderSize: user.maxFolderSize,
			stripeCustomerId: user.stripeCustomerId
		}
	}

	async login(user: TailUserForToken): Promise<{ access_token: string }> {
		return {
			access_token: await this.jwtService.signAsync(user)
		}
	}
}
