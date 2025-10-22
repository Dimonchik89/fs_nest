import { Sequelize } from 'sequelize-typescript';
import { User } from '../entities/user.entity';
import { File } from '../entities/file.entity';
import { Post } from '../entities/post.entity';

// ----------------------------------------- DEV MODE
// export const databaseProviders = [
// 	{
// 		provide: 'SEQUELIZE',
// 		useFactory: async () => {
// 			const sequelize = new Sequelize({
// 				dialect: 'postgres',
// 				host: process.env.POSTGRES_HOST,
// 				port: Number(process.env.POSTGRES_PORT),
// 				username: process.env.POSTGRES_USER,
// 				password: process.env.POSTGRES_PASSWORD,
// 				database: process.env.POSTGRES_DB,
// 				dialectOptions: {
// 					ssl: {
// 						require: true,
// 						rejectUnauthorized: false,
// 					},
// 				},
// 				logging: false,
// 			});
// 			sequelize.addModels([User, File, Post]);
// 			// sequelize.addModels([__dirname + '../**/*.entity{.ts,.js}']); work with typeorm
// 			await sequelize.sync();
// 			return sequelize;
// 		},
// 	},
// ];

// --------------------------------------- PROD MODE
// export const databaseProviders = [
// 	{
// 		provide: 'SEQUELIZE',
// 		useFactory: async () => {
// 			const sequelize = new Sequelize({
// 				dialect: 'postgres',
// 				host: process.env.POSTGRES_HOST,
// 				port: Number(process.env.POSTGRES_PORT),
// 				username: process.env.POSTGRES_USER,
// 				password: process.env.POSTGRES_PASSWORD,
// 				database: process.env.POSTGRES_DB,
// 				dialectOptions: {
// 					ssl: {
// 						require: true,
// 						rejectUnauthorized: false,
// 					},
// 				},
// 				logging: false,
// 			});
// 			sequelize.addModels([User, File, Post]);
// 			// sequelize.addModels([__dirname + '../**/*.entity{.ts,.js}']); work with typeorm
// 			await sequelize.sync();
// 			return sequelize;
// 		},
// 	},
// ];

export const databaseProviders = [
	{
		provide: 'SEQUELIZE',
		useFactory: async () => {
			const sequelize = new Sequelize({
				dialect: 'postgres',
				host: 'ep-snowy-morning-a9stup3p-pooler.gwc.azure.neon.tech',
				port: 5432,
				username: 'neondb_owner',
				password: 'npg_dqbAcw1F7zin',
				database: 'neondb',
				dialectOptions: {
					ssl: {
						require: true,
						rejectUnauthorized: false,
					},
				},
				logging: false,
			});
			sequelize.addModels([User, File, Post]);
			// sequelize.addModels([__dirname + '../**/*.entity{.ts,.js}']); work with typeorm
			await sequelize.sync();
			return sequelize;
		},
	},
];
