import { Sequelize } from 'sequelize-typescript';
import { User } from '../entities/user.entity';
import { File } from '../entities/file.entity';

export const databaseProviders = [
	{
		provide: 'SEQUELIZE',
		useFactory: async () => {
			const sequelize = new Sequelize({
				dialect: 'postgres',
				host: 'localhost',
				port: Number(process.env.POSTGRES_PORT),
				username: process.env.POSTGRES_USER,
				password: process.env.POSTGRES_PASSWORD,
				database: process.env.POSTGRES_DB,
			});
			sequelize.addModels([User, File]);
			// sequelize.addModels([__dirname + '../**/*.entity{.ts,.js}']); work with typeorm
			await sequelize.sync();
			return sequelize;
		},
	},
];
