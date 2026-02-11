import otelSDK from './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  try {
    otelSDK.start();
  } catch (err) {
    console.error('OTel SDK failed to start', err);
  }
  const usePino = process.env.LOG_DRIVER === 'pino';
  const app = await NestFactory.create(AppModule, { bufferLogs: usePino });
  if (usePino) {
    app.useLogger(app.get(Logger));
    app.flushLogs();
  }

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
