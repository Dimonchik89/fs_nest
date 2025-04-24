import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	HttpCode,
	Post,
	Req,
	Res,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RegisterDto } from './dto/auth.dto';
import {
	ALREADY_REGISTERED_ERROR,
	INVALID_PASSWORD_EXAMPLE,
	USER_ACCESS_TOKEN_EXAMPLE,
	USER_ALREADY_REGISTERED_EXAMPLE,
	USER_NOT_FOUND_EXAMPLE,
	INVALID_TOKEN_EXAMPLE,
	PROPERTY_SHOULD_NOT_EXIST_EXAMPLE,
} from './auth.constants';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { RolesGuard } from './guards/roles.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@ApiOperation({ summary: 'User registration' })
	@ApiBody({
		description: 'JSON with login and password for registration',
		type: AuthDto,
	})
	@ApiResponse({
		status: 201,
		description: 'User has been successfully registered',
		example: USER_ACCESS_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: 'User is already registered or incorrect property',
		examples: {
			USER_ALREADY_REGISTERED: USER_ALREADY_REGISTERED_EXAMPLE,
			PROPERTY_SHOULD_NOT_EXIST: PROPERTY_SHOULD_NOT_EXIST_EXAMPLE,
		},
	})
	// @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Post('register')
	async register(@Body() dto: RegisterDto) {
		const oldUser = await this.authService.findUser(dto.login);
		if (oldUser) {
			throw new BadRequestException(ALREADY_REGISTERED_ERROR);
		}
		return await this.authService.createUser(dto);
	}

	@ApiOperation({ summary: 'User Login' })
	@ApiBody({
		description: 'JSON with login and password for Login',
		type: AuthDto,
	})
	@ApiResponse({
		status: 200,
		description: 'User successfully logged in',
		example: USER_ACCESS_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: 'Unauthorized or incorrect property',
		examples: {
			USER_NOT_FOUND_ERROR: USER_NOT_FOUND_EXAMPLE,
			WRONG_PASSWORD_ERROR: INVALID_PASSWORD_EXAMPLE,
			PROPERTY_SHOULD_NOT_EXIST: PROPERTY_SHOULD_NOT_EXIST_EXAMPLE,
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@HttpCode(200)
	@Post('login')
	async login(@Body() dto: AuthDto) {
		const user = await this.authService.validateUser(dto);

		return await this.authService.login(user);
	}

	// -------------------------------- Посмотреть на необходимость наличия этого ендпоинта возможно оставить только refresh
	@ApiOperation({ summary: 'Checking the token and returning a new one' })
	@ApiResponse({
		status: 200,
		description: 'Token is valid, return new token',
		example: USER_ACCESS_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		examples: {
			UNAUTHORIZED_ERROR: INVALID_TOKEN_EXAMPLE,
		},
	})
	@ApiBearerAuth('access_token')
	@HttpCode(200)
	@Get('')
	async isAuth(@Headers('Authorization') token: string) {
		return this.authService.isAuth(token);
	}

	// -------------------------------- Посмотреть на необходимость наличия этого ендпоинта
	@UseGuards(JwtAuthGuard)
	@Get('profile')
	getProfile(@Req() req) {
		return this.authService.getProfile(req.user.id);
	}

	// -------------------------------- Посмотреть на необходимость наличия этого ендпоинта (отправляем рефреш токен и получаем аксеес токен(который жевет не долго и мы используем его дня всех проверок))
	@UseGuards(RefreshAuthGuard)
	@Post('refresh')
	refresh(@Req() req) {
		return this.authService.refreshToken(req.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('signout')
	signOut(@Req() req) {
		this.authService.signOut(req.user.id);
	}

	// ------------------------- Роут для входа и регистрации через GOOGLE
	@UseGuards(GoogleAuthGuard)
	@Get('google/login')
	googleLogin() {}

	@UseGuards(GoogleAuthGuard)
	@Get('google/callback')
	async googleCallback(@Req() req, @Res() res) {
		const response = await this.authService.login(req.user);
		res.redirect(`http://localhost:5173?token=${response.access_token}`);
	}

	// -------------------- Тестовый брекпоинт для проверки доступа к роуту по роли
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@Get('test')
	getObject() {
		return { message: 'lalala' };
	}
}
