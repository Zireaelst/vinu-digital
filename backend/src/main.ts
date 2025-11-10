import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    // Enable graceful shutdown
    app.enableShutdownHooks();

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    logger.log(`🚀 USDT Monitor Backend started successfully on port ${port}`);
    logger.log(`🔗 Blockchain monitoring is now active`);
    logger.log(`📱 Firebase notifications are ready`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
