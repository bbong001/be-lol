import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Add validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Main Swagger setup
  const config = new DocumentBuilder()
    .setTitle('LOL Check API')
    .setDescription(
      'API documentation for the League of Legends checker application',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('summoners', 'Summoner-related endpoints')
    .addTag('champions', 'Champion data endpoints')
    .addTag('matches', 'Match history and stats endpoints')
    .addTag('stats', 'Game statistics endpoints')
    .addTag('news', 'News and articles endpoints')
    .addTag('comments', 'Comments for news articles')
    .addTag('pc-builds', 'PC build recommendations')
    .addTag('tft', 'Teamfight Tactics endpoints')
    .addTag('wildrift', 'Wild Rift endpoints')
    .addTag('default', 'Misc endpoints')
    .build();

  // Create document excluding TFT and WildRift paths
  const document = SwaggerModule.createDocument(app, config);
  // Filter out TFT and WildRift paths
  // const filteredPaths = {};
  // for (const path in document.paths) {
  //   if (!path.includes('/api/tft') && !path.includes('/api/wildrift')) {
  //     filteredPaths[path] = document.paths[path];
  //   }
  // }
  // document.paths = filteredPaths;
  SwaggerModule.setup('api/docs', app, document);

  // Start the application
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
  console.log(`Application URL: ${await app.getUrl()}`);
  console.log(`Swagger documentation: ${await app.getUrl()}/api/docs`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Using config file: config.env`);
  console.log(
    `Connected to MongoDB at: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/lol-check-db'}`,
  );
}
bootstrap();
