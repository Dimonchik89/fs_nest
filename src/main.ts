import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: 'http://localhost:3002',
	});
	app.setGlobalPrefix('api');
	app.useGlobalPipes(new ValidationPipe());

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
		.build();

	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('api/swagger', app, document);

	await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
