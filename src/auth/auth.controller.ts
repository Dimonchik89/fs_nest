import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	Post,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import {
	ALREADY_REGISTERED_ERROR,
	INVALID_PASSWORD_EXAMPLE,
	USER_ACCESS_TOKEN_EXAMPLE,
	USER_ALREADY_REGISTERED_EXAMPLE,
	USER_NOT_FOUND_EXAMPLE,
} from './auth.constants';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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
		description: ALREADY_REGISTERED_ERROR,
		example: USER_ALREADY_REGISTERED_EXAMPLE,
	})
	@UsePipes(new ValidationPipe())
	@Post('register')
	async register(@Body() dto: AuthDto) {
		const oldUser = await this.authService.findUser(dto);

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
		description: 'Unauthorized',
		examples: {
			USER_NOT_FOUND_ERROR: USER_NOT_FOUND_EXAMPLE,
			WRONG_PASSWORD_ERROR: INVALID_PASSWORD_EXAMPLE,
		},
	})
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login')
	async login(@Body() dto: AuthDto) {
		const user = await this.authService.validateUser(dto);

		return await this.authService.login(user);
	}
}
