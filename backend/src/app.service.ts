import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🚀 USDT Monitor Backend - Real-time large USDT transfer monitoring with Firebase notifications';
  }
}
