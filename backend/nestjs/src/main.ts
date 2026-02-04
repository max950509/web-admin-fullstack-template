import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add a global prefix to all routes
  app.setGlobalPrefix('api');

  // Use global pipes for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away non-whitelisted properties
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // const enableSwagger = process.env.ENABLE_SWAGGER === 'true';
  const enableSwagger = true;
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Web Admin API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
        },
        'Authorization',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    document.security = [{ Authorization: [] }];
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
