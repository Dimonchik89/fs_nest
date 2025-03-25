import { BAD_REQUEST } from '../app.constants';

const FILE_IS_REQUIRE = 'File is required';
const FILE_VALIDATION_FAILED = 'Validation failed';
export const FILE_NOT_FOUND = 'File not found';

// fileUploadSuccessfully

export const FILE_UPLOAD_SUCCESSFULLY_EXAMPLE = {
	id: '7295a143-a82c-47f9-b8d7-7d14bb89dwed',
	filePath: '/example/womens-collection_13-03-2025.png',
	userId: '9427bcbf-fbf1-41a3-978e-36318ce9fewe',
	fileExt: 'png',
	updatedAt: '2025-03-13T08:28:09.289Z',
	createdAt: '2025-03-13T08:28:09.289Z',
};

export const FILE_IS_REQUIRED_EXAMPLE = {
	summary: FILE_IS_REQUIRE,
	value: {
		message: FILE_IS_REQUIRE,
		error: BAD_REQUEST,
		statusCode: 400,
	},
};

export const FILE_VALIDATION_FAILED_EXAMPLE = {
	summary: FILE_VALIDATION_FAILED,
	value: {
		message:
			'Validation failed (current file type is video/mp4, expected type is .(flp|zip))',
		error: BAD_REQUEST,
		statusCode: 400,
	},
};

export const FILE_NOT_FOUND_EXAMPLE = {
	message: FILE_NOT_FOUND,
	error: BAD_REQUEST,
	statusCode: 400,
};
export const FILE_SUCCESSFULLY_DELETED_EXAMPLE = {
	statusCode: 200,
	message: 'womens-collection_13-03-2025.png file was deleted',
};

export const GET_USER_FILES_SUCCESS_EXAMPLE = [
	{
		id: '483f5d46-7392-47c8-932d-cd2d1f3a902a',
		filePath: '/example/womens-collection_14-03-2025.png',
		fileExt: 'png',
		userId: '9427bcbf-fbf1-41a3-978e-36318cw9febe',
		createdAt: '2025-03-14T07:26:53.814Z',
		updatedAt: '2025-03-14T07:26:53.814Z',
	},
];
