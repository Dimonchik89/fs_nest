import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { rawBody: true });
	// app.enableCors({
	// 	origin: 'http://localhost:3002',
	// });
	app.enableCors();
	app.setGlobalPrefix('api');
	// проверка соотвецтвие входящих с клиента данных во всем проекте
	// app.useGlobalPipes(
	// 	new ValidationPipe({
	// 		whitelist: true,
	// 		forbidNonWhitelisted: true,
	// 	}),
	// );

	const options = new DocumentBuilder()
		.setTitle('Fl studio API')
		.setDescription('Documentation for Fl studio API')
		.setVersion('1.0')
		.addBearerAuth(
			{
				description: `Please enter token in following format: Bearer <JWT>`,
				name: 'Authorization',
				bearerFormat: 'Bearer',
				scheme: 'Bearer',
				type: 'http',
				in: 'Header',
			},
			'access_token',
		)
		.addBearerAuth(
			{
				description: `Refresh token: Bearer <JWT>`,
				name: 'Authorization',
				bearerFormat: 'Bearer',
				scheme: 'Bearer',
				type: 'http',
				in: 'Header',
			},
			'refresh_token',
		)
		.build();

	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('api/swagger', app, document);

	await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

// stripe listen --forward-to localhost:3000/stripe/webhook



// проверь пожалуйста сервис validateRefreshToken  у меня почемуто ошибка при проверке токена который приходит от клиента и захешированного токена который мы получаем с сервера. когда происходит метод argon2.verify то он всегда возвращает false, тоесть токени не совпадают. но вроде все написано нормально и должно быть нормально. проверь все ли там правильно и в логике работы этого сервиса. и напиш все ли правльно. только не исправляй код а напиши в чат что нужно исправить. ответь на руском