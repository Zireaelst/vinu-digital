import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../firebase/firebase.module';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [ConfigModule, FirebaseModule],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
