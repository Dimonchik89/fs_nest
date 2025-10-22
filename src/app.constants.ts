export const BAD_REQUEST = 'Bad Request';
export const UNAUTHORIZED_EXAMPLE = {
	message: 'Unauthorized',
	statusCode: 401,
};
export const INTERVAL_SERVER_ERROR = {
	statusCode: 500,
	message: 'Internal server error',
};

export const NO_SUCH_FILE_OR_DIRECTORY = {
	message: "ENOENT: no such file or directory, stat '/home/example/index.html'",
	error: 'Not Found',
	statusCode: 404,
};

export const BAD_REQUEST_EXAMPLE = {
	message: 'Error message',
	error: BAD_REQUEST,
	statusCode: 400,
};
