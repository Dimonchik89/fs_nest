import { BAD_REQUEST } from '../app.constants';

const REQUIRE_FIELDS = 'Required fields';

export const POST_EXAMPLE = {
	id: 'ff6a1126-5397-41e0-8f36-bec68f3b8a9a',
	title: 'first update Title',
	text: 'first update text',
	link: 'first update Link',
	subtitle: 'Optional first Title',
	additionalLink: 'Additiona first Link',
	requiredFiles: [
		{
			title: 'sale-banner.svg',
			src: 'posts/8c74f6f5-e70d-4ca6-8313-9c72750859c8.svg',
		},
		{
			title: 'sale-backdrop.svg',
			src: 'posts/c5ae191b-bf08-44f1-865e-c541a0c0475a.svg',
		},
	],
	optionalFiles: [
		{
			title: 'Violin Fantasy (1).mp3',
			src: 'posts/6e2d6965-1cf7-4f09-a4c7-742f839264de.mp3',
		},
		{
			title: 'Violin Fantasy.mp3',
			src: 'posts/d7c09aec-7961-4228-aa71-571e98953d7f.mp3',
		},
	],
	updatedAt: '2025-10-13T07:10:36.351Z',
	createdAt: '2025-10-13T07:10:36.351Z',
	subtext: null,
};

export const CREATE_FILE_ERROR_REQUIRE_FIELDS_EXAMPLE = {
	message: ['title must be a string', 'text must be a string'],
	error: 'Bad Request',
	statusCode: 400,
};

export const GET_POSTS_SUCCESS_EXAMPLE = {
	count: 1,
	rows: [POST_EXAMPLE],
};

export const DELETE_FILE_EXAMPLE = {
	statusCode: 200,
	message: 'the post ff6a1126-5397-41e0-8f36-bec68f3b8a9a was deleted',
};
