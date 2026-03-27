import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — allow web app and TMA origins
  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      'https://web.telegram.org',
    ],
    credentials: true,
  });

  // WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`PythFolio API running on port ${port}`);
}

bootstrap();
