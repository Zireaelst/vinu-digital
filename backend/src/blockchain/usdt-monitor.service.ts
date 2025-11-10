import { Injectable, Logger } from '@nestjs/common';
import {
  FirebaseService,
  NotificationPayload,
} from '../firebase/firebase.service';

export interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
  formattedAmount: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
}

@Injectable()
export class UsdtMonitorService {
  private readonly logger = new Logger(UsdtMonitorService.name);
  private readonly recentTransfers = new Map<string, TransferEvent>();
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly TRANSFER_HISTORY_LIMIT = 1000;

  constructor(private readonly firebaseService: FirebaseService) {
    // Clean up old transfers periodically
    setInterval(() => {
      this.cleanupOldTransfers();
    }, this.CLEANUP_INTERVAL);
  }

  async processTransfer(transferEvent: TransferEvent): Promise<void> {
    try {
      // Store the transfer
      this.recentTransfers.set(transferEvent.txHash, transferEvent);

      // Log the transfer
      this.logger.log(
        `Processing large USDT transfer: ${transferEvent.formattedAmount} USDT`,
      );
      this.logger.log(`From: ${transferEvent.from} To: ${transferEvent.to}`);
      this.logger.log(
        `Block: ${transferEvent.blockNumber} TX: ${transferEvent.txHash}`,
      );

      // Prepare notification payload
      const payload: NotificationPayload = {
        from: transferEvent.from,
        to: transferEvent.to,
        amount: transferEvent.formattedAmount,
        txHash: transferEvent.txHash,
      };

      // Send notification
      await this.firebaseService.sendNotification(payload);

      this.logger.log(`Notification sent for transfer ${transferEvent.txHash}`);
    } catch (error) {
      this.logger.error('Error processing transfer:', error);
      throw error;
    }
  }

  getRecentTransfers(limit = 10): TransferEvent[] {
    const transfers = Array.from(this.recentTransfers.values());
    return transfers
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getTransferByHash(txHash: string): TransferEvent | undefined {
    return this.recentTransfers.get(txHash);
  }

  getTransferStats(): {
    totalCount: number;
    totalVolume: string;
    averageAmount: string;
    timeRange: string;
  } {
    const transfers = Array.from(this.recentTransfers.values());

    if (transfers.length === 0) {
      return {
        totalCount: 0,
        totalVolume: '0',
        averageAmount: '0',
        timeRange: 'No transfers',
      };
    }

    const totalVolume = transfers.reduce((sum, transfer) => {
      return sum + parseFloat(transfer.formattedAmount);
    }, 0);

    const averageAmount = totalVolume / transfers.length;

    const timestamps = transfers.map((t) => t.timestamp.getTime());
    const minTime = new Date(Math.min(...timestamps));
    const maxTime = new Date(Math.max(...timestamps));

    return {
      totalCount: transfers.length,
      totalVolume: totalVolume.toFixed(2),
      averageAmount: averageAmount.toFixed(2),
      timeRange: `${minTime.toISOString()} - ${maxTime.toISOString()}`,
    };
  }

  private cleanupOldTransfers(): void {
    const now = Date.now();
    const cutoffTime = now - this.CLEANUP_INTERVAL;

    let removedCount = 0;

    for (const [txHash, transfer] of this.recentTransfers.entries()) {
      if (transfer.timestamp.getTime() < cutoffTime) {
        this.recentTransfers.delete(txHash);
        removedCount++;
      }
    }

    // Also limit the total number of transfers
    if (this.recentTransfers.size > this.TRANSFER_HISTORY_LIMIT) {
      const transfers = Array.from(this.recentTransfers.entries());
      transfers.sort(
        ([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime(),
      );

      // Keep only the most recent transfers
      const toKeep = transfers.slice(0, this.TRANSFER_HISTORY_LIMIT);
      this.recentTransfers.clear();

      for (const [txHash, transfer] of toKeep) {
        this.recentTransfers.set(txHash, transfer);
      }

      removedCount += transfers.length - this.TRANSFER_HISTORY_LIMIT;
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} old transfer records`);
    }
  }
}
