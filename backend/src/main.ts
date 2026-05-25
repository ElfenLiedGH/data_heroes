import './telemetry';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { resolveApiKey } from './shared/config/api-key.config';
import { OtelLoggerService } from './shared/logging/otel-logger.service';

async function bootstrap() {
  resolveApiKey();

  const app = await NestFactory.create(AppModule, {
   logger: new OtelLoggerService(),
   bufferLogs: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
   new ValidationPipe({
     whitelist: true,
     forbidNonWhitelisted: true,
     transform: true,
   }),
  );

  const config = new DocumentBuilder()
   .setTitle('Notification Preferences Service')
   .setDescription('API for managing notification preferences and evaluating delivery')
   .setVersion('1.0')
   .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'apiKey')
   .addServer('/api/v1')
   .build();

  const document = SwaggerModule.createDocument(app, config, {
   ignoreGlobalPrefix: true,
  });
  SwaggerModule.setup('api/docs', app, document);

  app.getHttpAdapter().get('/api/openapi.json', (_req, res) => {
   res.json(document);
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
