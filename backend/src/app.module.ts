import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './blockchain/blockchain.module';
import { FirebaseModule } from './firebase/firebase.module';
import configuration from './config/configuration';
import { ConfigValidationService } from './config/config-validation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: (config) => ConfigValidationService.validate(config),
      envFilePath: '.env',
    }),
    FirebaseModule,
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
