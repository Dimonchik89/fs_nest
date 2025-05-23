import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthDto, RegisterDto } from './dto/auth.dto';
import { hash, genSalt, compare } from 'bcryptjs';
import { FilesService } from '../files/files.service';
import {
	INVALID_TOKEN_ERROR,
	USER_EMAIL_NOT_FOUND_ERROR,
	WRONG_PASSWORD_ERROR,
} from './auth.constants';
import { JwtService } from '@nestjs/jwt';
import {
	TailUserForToken,
	UserAccessToken,
	UserAccessTokenAndRefreshToken,
} from '../user/user.types';
import { User } from '../entities/user.entity';
import { File } from '../entities/file.entity';
import refreshJwtConfig from './config/refresh-jwt-config';
import { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		private readonly filesService: FilesService,
		private jwtService: JwtService,
		@Inject(refreshJwtConfig.KEY)
		private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
	) {}

	async updateHashedRefreshToken(userId: string, hashedRefreshToken: string) {
		return await this.userRepository.update(
			{ hashedRefreshToken },
			{ where: { id: userId } },
		);
	}

	async findUser(login: string): Promise<User> {
		return this.userRepository.findOne<User>({ where: { email: login } });
	}

	async createUser(dto: RegisterDto): Promise<UserAccessTokenAndRefreshToken> {
		const salt = await genSalt(10);
		const folderPath = await this.filesService.createFolder(dto.login);

		const newUser = await this.userRepository.create({
			email: dto.login,
			passwordHash: await hash(dto.password, salt),
			subscription: 'free',
			maxFolderSize: 50,
			folderPath,
			role: dto.role,
		});

		const tailUser = {
			id: newUser.id,
			email: newUser.email,
			subscription: newUser.subscription,
			stripeCustomerId: newUser.stripeCustomerId,
			role: newUser.role,
		};

		const { accessToken, refreshToken } = await this.generateTokens(tailUser);
		const hashedRefreshToken = await argon2.hash(refreshToken);

		await this.updateHashedRefreshToken(newUser.id, hashedRefreshToken);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
	}

	async validateUser(dto: AuthDto): Promise<TailUserForToken> {
		const user = await this.findUser(dto.login);

		if (!user) {
			throw new UnauthorizedException(USER_EMAIL_NOT_FOUND_ERROR);
		}

		const isCorrectPassword = await compare(dto.password, user.passwordHash);

		if (!isCorrectPassword) {
			throw new UnauthorizedException(WRONG_PASSWORD_ERROR);
		}

		return {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			stripeCustomerId: user.stripeCustomerId,
			role: user.role,
		};
	}

	async login(user: TailUserForToken): Promise<UserAccessTokenAndRefreshToken> {
		const { accessToken, refreshToken } = await this.generateTokens(user);
		const hashedRefreshToken = await argon2.hash(refreshToken);

		await this.updateHashedRefreshToken(user.id, hashedRefreshToken);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
		// return await this.userRepository.findOne({
		// 	where: { id: user.id },
		// 	include: [File],
		// });
	}

	async generateTokens(user: TailUserForToken) {
		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(user),
			this.jwtService.signAsync(user, this.refreshTokenConfig),
		]);

		return {
			accessToken,
			refreshToken,
		};
	}

	// -------------------------------- Посмотреть на необходимость наличия этой функции, возможно оставить refresh
	async isAuth(bearerToken: string) {
		const token = bearerToken.split(' ').pop();

		const user = await this.jwtService.decode(token);

		if (!user) {
			throw new UnauthorizedException(INVALID_TOKEN_ERROR);
		}
		return {
			access_token: await this.jwtService.signAsync({
				id: user.id,
				email: user.email,
				subscription: user.subscription,
				stripeCustomerId: user.stripeCustomerId,
			}),
		};
	}

	// -------------------------------- Посмотреть на необходимость наличия этой функции
	async getProfile(userId: string) {
		const { id, email, subscription, stripeCustomerId } =
			await this.userRepository.findOne({
				where: { id: userId },
			});
		return {
			id,
			email,
			subscription,
			stripeCustomerId,
		};
	}

	// -------------------------------- Посмотреть на необходимость наличия этой функции
	async refreshToken(userId: string) {
		const { id, email, subscription, stripeCustomerId, role } =
			await this.userRepository.findOne({
				where: { id: userId },
			});

		const { accessToken, refreshToken } = await this.generateTokens({
			id,
			email,
			subscription,
			stripeCustomerId,
			role,
		});
		const hashedRefreshToken = await argon2.hash(refreshToken);

		await this.updateHashedRefreshToken(id, hashedRefreshToken);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
	}

	async validateRefreshToken(
		userId: string,
		refreshToken: string,
	): Promise<{ id: string; email: string }> {
		const user = await this.userRepository.findOne({ where: { id: userId } });

		if (!user || !user.hashedRefreshToken) {
			throw new UnauthorizedException(INVALID_TOKEN_ERROR);
		}

		const refreshTokenMatches = await argon2.verify(
			user.hashedRefreshToken,
			refreshToken,
		);

		if (!refreshTokenMatches) {
			throw new UnauthorizedException(INVALID_TOKEN_ERROR);
		}

		return {
			id: user.id,
			email: user.email,
		};
	}

	async signOut(userId: string) {
		await this.updateHashedRefreshToken(userId, null);
	}

	async validateGoogleUser(googleUser: RegisterDto) {
		const user = await this.userRepository.findOne({
			where: { email: googleUser.login },
		});

		if (user) return user;

		// ------------------- Переделать функиию create чтоб она возвращала пользователя а в контроллере из тех данных делать токины и отправлять на клиент. и тогда можно будет ниже вместо кода вызывать функцию authService.cerate() и не дублировать код

		const salt = await genSalt(10);
		const folderPath = await this.filesService.createFolder(googleUser.login);

		const createdUser = await this.userRepository.create({
			email: googleUser.login,
			passwordHash: await hash(googleUser.password, salt),
			subscription: 'free',
			maxFolderSize: 50,
			folderPath,
			role: Role.USER,
		});
		const { accessToken, refreshToken } = await this.generateTokens({
			id: createdUser.id,
			email: createdUser.email,
			role: createdUser.role,
			stripeCustomerId: createdUser.stripeCustomerId,
			subscription: createdUser.subscriptionId,
		});
		const hashedRefreshToken = await argon2.hash(refreshToken);
		await this.updateHashedRefreshToken(createdUser.id, hashedRefreshToken);
		return createdUser;
	}
}
