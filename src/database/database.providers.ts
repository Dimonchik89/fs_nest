import { Sequelize } from 'sequelize-typescript';
import { User } from '../user/user.model';
import { File } from '../files/file.model';

export const databaseProviders = [
	{
		provide: 'SEQUELIZE',
		useFactory: async () => {
			const sequelize = new Sequelize({
				dialect: 'postgres',
				host: 'localhost',
				port: 5430,
				username: 'admin',
				password: '123456',
				database: 'fl_studio_data',
			});
			sequelize.addModels([User, File]);
			await sequelize.sync();
			return sequelize;
		},
	},
];
