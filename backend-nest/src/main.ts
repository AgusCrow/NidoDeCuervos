import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('GremioRPG-Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para frontend Angular
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🛡️ Servidor NestJS "El Gremio de la Taberna RPG v4.0.0" escuchando en puerto ${port}`);
}
bootstrap();
