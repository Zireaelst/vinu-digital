import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { FirebaseService } from './firebase/firebase.service';
import { UsdtMonitorService } from './blockchain/usdt-monitor.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly firebaseService: FirebaseService,
    private readonly usdtMonitorService: UsdtMonitorService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string; service: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'USDT Monitor Backend',
    };
  }

  @Get('status')
  getStatus(): {
    status: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    version: string;
  } {
    return {
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };
  }

  @Get('notifications/count')
  async getNotificationCount(): Promise<{
    count: number;
    lastTransferAt?: string;
  }> {
    const result = await this.firebaseService.getNotificationCount();
    return {
      count: result.count,
      lastTransferAt: result.lastTransferAt
        ? result.lastTransferAt.toDate().toISOString()
        : undefined,
    };
  }

  @Get('transfers/recent')
  getRecentTransfers(@Query('since') since?: string) {
    const sinceTimestamp = since ? new Date(parseInt(since)) : undefined;
    const transfers = this.usdtMonitorService.getRecentTransfers(20);

    // Since parametresi varsa filtrele
    const filteredTransfers = sinceTimestamp
      ? transfers.filter((t) => t.timestamp > sinceTimestamp)
      : transfers;

    // Frontend formatına çevir
    const formattedTransfers = filteredTransfers.map((transfer) => ({
      id: transfer.txHash,
      title: 'Large USDT Transfer Detected',
      body: `${transfer.formattedAmount} USDT transferred`,
      fromAddress: transfer.from,
      toAddress: transfer.to,
      amount: transfer.formattedAmount,
      txHash: transfer.txHash,
      timestamp: transfer.timestamp.getTime(),
    }));

    return {
      success: true,
      transfers: formattedTransfers,
    };
  }
}
