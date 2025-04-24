import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, isEmail } from 'class-validator';

export class RegisterDto {
	@ApiProperty({
		description: 'User email',
		example: 'test@gmail.com',
	})
	@IsString()
	@Length(10, 50)
	login: string;

	@ApiProperty({
		description: 'User Role',
		example: 'USER',
	})
	@IsString()
	role?: string;

	@ApiProperty({
		description: 'User password',
		example: 'password123',
	})
	@Length(6, 50)
	@IsString()
	password: string;
}

export class AuthDto {
	@ApiProperty({
		description: 'User email',
		example: 'test@gmail.com',
	})
	@IsString()
	@Length(10, 50)
	login: string;

	@ApiProperty({
		description: 'User password',
		example: 'password123',
	})
	@Length(6, 50)
	@IsString()
	password: string;
}
