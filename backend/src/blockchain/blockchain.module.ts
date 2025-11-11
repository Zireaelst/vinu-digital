import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../firebase/firebase.module';
import { BlockchainService } from './blockchain.service';
import { UsdtMonitorService } from './usdt-monitor.service';

@Module({
  imports: [ConfigModule, FirebaseModule],
  providers: [BlockchainService, UsdtMonitorService],
  exports: [BlockchainService, UsdtMonitorService],
})
export class BlockchainModule {}
