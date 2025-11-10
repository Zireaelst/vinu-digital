import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigValidationService {
  static validate(config: Record<string, unknown>) {
    const requiredVars = ['ETHEREUM_WSS_URL', 'FIREBASE_ADMIN_CONFIG_PATH'];

    for (const varName of requiredVars) {
      if (!config[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    return config;
  }
}
