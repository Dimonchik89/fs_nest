import { File } from './file.model';

export const fileProviders = [
	{
		provide: 'FILE_REPOSITORY',
		useValue: File,
	},
];
