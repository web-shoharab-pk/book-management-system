import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService); // Get from DI
  const port = configService.get<number>('PORT') || 1234;
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix(configService.get<string>('API_PREFIX') || 'api');
  await app.listen(port);
  console.log(
    `Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode /n url: http://localhost:${port}`,
  );
}
void bootstrap();
