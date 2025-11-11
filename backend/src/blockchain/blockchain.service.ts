import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, ContractEventPayload } from 'ethers';
import {
  FirebaseService,
  NotificationPayload,
} from '../firebase/firebase.service';
import { UsdtMonitorService, TransferEvent } from './usdt-monitor.service';
import { AppConfig } from '../config/configuration';

@Injectable()
export class BlockchainService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.WebSocketProvider | null = null;
  private usdtContract: ethers.Contract | null = null;

  // USDT Contract Configuration
  private readonly USDT_CONTRACT_ADDRESS =
    '0xdAC17F958D2ee523a2206206994597C13D831ec7';
  private readonly USDT_DECIMALS = 6;
  private readonly TRANSFER_THRESHOLD = ethers.parseUnits(
    '100000',
    this.USDT_DECIMALS,
  ); // 100,000 USDT

  // Minimal ABI for Transfer event
  private readonly USDT_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ];

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly firebaseService: FirebaseService,
    private readonly usdtMonitorService: UsdtMonitorService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.initializeBlockchainConnection();
      this.startUSDTMonitoring();
    } catch (error) {
      this.logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  private async initializeBlockchainConnection(): Promise<void> {
    try {
      const wssUrl = this.configService.get('ethereumWssUrl') as string;

      if (!wssUrl) {
        throw new Error('ETHEREUM_WSS_URL is not configured');
      }

      this.logger.log('Connecting to Ethereum network...');
      this.provider = new ethers.WebSocketProvider(wssUrl);

      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.log(
        `Connected to Ethereum network: ${network.name} (Chain ID: ${network.chainId})`,
      );

      // Initialize USDT contract
      this.usdtContract = new ethers.Contract(
        this.USDT_CONTRACT_ADDRESS,
        this.USDT_ABI,
        this.provider,
      );

      this.logger.log(
        `USDT Contract initialized at: ${this.USDT_CONTRACT_ADDRESS}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize blockchain connection:', error);
      throw error;
    }
  }

  private startUSDTMonitoring(): void {
    if (!this.usdtContract) {
      throw new Error('USDT contract not initialized');
    }

    this.logger.log('Starting USDT transfer monitoring...');
    this.logger.log(
      `Monitoring transfers >= ${ethers.formatUnits(this.TRANSFER_THRESHOLD, this.USDT_DECIMALS)} USDT`,
    );
    this.logger.log(
      '🔥 USDT Monitoring is ACTIVE - Listening for large transfers...',
    );

    // Listen for Transfer events with proper ethers.js v6 syntax
    this.usdtContract.on(
      'Transfer',
      (
        from: string,
        to: string,
        value: bigint,
        event: ContractEventPayload,
      ) => {
        void this.handleTransferEvent(from, to, value, event).catch((error) => {
          this.logger.error('Error handling transfer event:', error);
        });
      },
    );

    // Handle connection errors
    if (this.provider) {
      this.provider.on('error', (error) => {
        this.logger.error('WebSocket connection error:', error);
        void this.handleConnectionError().catch((err) => {
          this.logger.error('Error in connection error handler:', err);
        });
      });

      // Note: WebSocket close event handling is built into ethers.js v6
      // The provider will automatically handle disconnections
      this.logger.log('Connection error handlers set up successfully');
    }

    this.logger.log('USDT monitoring started successfully');
  }

  private async handleTransferEvent(
    from: string,
    to: string,
    value: bigint,
    event: ContractEventPayload,
  ): Promise<void> {
    try {
      // Check if transfer meets threshold
      if (value < this.TRANSFER_THRESHOLD) {
        return; // Skip small transfers
      }

      const formattedAmount = ethers.formatUnits(value, this.USDT_DECIMALS);
      
      // Extract transaction hash from ContractEventPayload
      // In ethers.js v6, transaction hash is in event.log.transactionHash
      const txHash: string = event.log.transactionHash;

      this.logger.log(
        `🚨 Large USDT transfer detected: ${formattedAmount} USDT from ${from} to ${to} (tx: ${txHash})`,
      );

      // Create transfer event object
      const transferEvent: TransferEvent = {
        from,
        to,
        value,
        formattedAmount,
        txHash,
        blockNumber: event.log.blockNumber,
        timestamp: new Date(),
      };

      // Store transfer in UsdtMonitorService
      await this.usdtMonitorService.processTransfer(transferEvent);

      // Prepare notification payload
      const payload: NotificationPayload = {
        from,
        to,
        amount: formattedAmount,
        txHash: txHash,
      };

      // Send Firebase notification
      await this.firebaseService.sendNotification(payload);
    } catch (error) {
      this.logger.error('Error processing transfer event:', error);
    }
  }

  private async handleConnectionError(): Promise<void> {
    try {
      // Wait before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 5000));

      this.logger.log('Attempting to reconnect...');
      await this.initializeBlockchainConnection();
      this.startUSDTMonitoring();

      this.logger.log('Reconnected successfully');
    } catch (error) {
      this.logger.error('Reconnection failed:', error);
      // Try again after longer delay
      setTimeout(() => {
        void this.handleConnectionError().catch((err) => {
          this.logger.error('Error in delayed reconnection:', err);
        });
      }, 30000);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.usdtContract) {
        void this.usdtContract.removeAllListeners();
      }

      if (this.provider) {
        await this.provider.destroy();
      }

      this.logger.log('Blockchain service destroyed successfully');
    } catch (error) {
      this.logger.error('Error destroying blockchain service:', error);
    }
  }
}
