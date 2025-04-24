import { BAD_REQUEST } from '../app.constants';

export const ALREADY_REGISTERED_ERROR = 'This user is already registered';
export const USER_EMAIL_NOT_FOUND_ERROR = 'No user with this email found';
export const WRONG_PASSWORD_ERROR = 'Invalid password';
export const UNAUTHORIZED_ERROR = 'Unauthorized';
export const INVALID_TOKEN_ERROR = 'Invalid token';
export const PROPERTY_SHOULD_NOT_EXIST_ERROR = 'property should not exist';

export const jwtConstants = {
	secret: process.env.JWT_SECRET,
	expire: process.env.JWT_EXPIRE_IN,
};

// userAlreadyRegistered
export const USER_ALREADY_REGISTERED_EXAMPLE = {
	summary: ALREADY_REGISTERED_ERROR,
	value: {
		message: ALREADY_REGISTERED_ERROR,
		error: BAD_REQUEST,
		statusCode: 400,
	},
};

export const PROPERTY_SHOULD_NOT_EXIST_EXAMPLE = {
	summary: PROPERTY_SHOULD_NOT_EXIST_ERROR,
	value: {
		message: 'Property role should not exist',
		error: BAD_REQUEST,
		statusCode: 400,
	},
};

export const USER_NOT_FOUND_EXAMPLE = {
	summary: USER_EMAIL_NOT_FOUND_ERROR,
	value: {
		message: USER_EMAIL_NOT_FOUND_ERROR,
		error: 'Unauthorized',
		statusCode: 401,
	},
};

export const INVALID_PASSWORD_EXAMPLE = {
	summary: WRONG_PASSWORD_ERROR,
	value: {
		message: WRONG_PASSWORD_ERROR,
		error: 'Unauthorized',
		statusCode: 401,
	},
};

export const INVALID_TOKEN_EXAMPLE = {
	summary: INVALID_TOKEN_ERROR,
	value: {
		message: INVALID_TOKEN_ERROR,
		error: 'Unauthorized',
		statusCode: 401,
	},
};

// userAccessTokenResponse
export const USER_ACCESS_TOKEN_EXAMPLE = {
	access_token:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
};
