# 🚀 USDT Transfer Monitor Backend

A NestJS-based backend service that monitors large USDT transfers on Ethereum mainnet and sends real-time notifications via Firebase Cloud Messaging (FCM).

## 🎯 Features

- **Real-time USDT Transfer Monitoring**: Watches for USDT transfers ≥ 100,000 USDT on Ethereum mainnet
- **Firebase Push Notifications**: Sends instant notifications for large transfers
- **WebSocket Connection**: Uses reliable WebSocket connection to Ethereum network
- **Automatic Reconnection**: Handles connection drops with automatic retry logic
- **Transfer History**: Maintains recent transfer history with statistics
- **Docker Support**: Ready-to-deploy Docker configuration
- **Environment Configuration**: Secure configuration management

## 🛠 Tech Stack

- **Framework**: NestJS (Node.js)
- **Blockchain**: Ethers.js for Ethereum interaction
- **Notifications**: Firebase Admin SDK
- **Configuration**: @nestjs/config with environment validation
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Ethereum RPC Provider** (Alchemy, Infura, etc.) with WebSocket support
3. **Firebase Project** with Admin SDK credentials
4. **npm** or **yarn** package manager

## ⚙️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Ethereum WebSocket URL (Required)
ETHEREUM_WSS_URL=wss://eth-mainnet.ws.alchemyapi.io/v2/YOUR_API_KEY

# Firebase Admin SDK Config Path (Required)
FIREBASE_ADMIN_CONFIG_PATH=./firebase-service-account.json
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Download the JSON file and save it as `firebase-service-account.json` in the backend directory
6. **Important**: Add `firebase-service-account.json` to your `.gitignore`

### 4. Ethereum RPC Provider Setup

Get a WebSocket endpoint from providers like:

- **Alchemy**: `wss://eth-mainnet.ws.alchemyapi.io/v2/YOUR_API_KEY`
- **Infura**: `wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID`
- **QuickNode**: Custom WebSocket endpoint

## 🚀 Running the Application

### Development Mode

```bash
# Start in development mode with auto-reload
npm run start:dev

# Start with debugging
npm run start:debug
```

### Production Mode

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f usdt-monitor

# Stop the service
docker-compose down
```

## 📊 Monitoring Configuration

### USDT Contract Details
- **Contract Address**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Decimals**: 6
- **Threshold**: 100,000 USDT (configurable in code)
- **Network**: Ethereum Mainnet

### Transfer Event Structure
```typescript
{
  from: string;        // Sender address
  to: string;          // Recipient address  
  amount: string;      // Formatted USDT amount
  txHash: string;      // Transaction hash
}
```

## 🔧 Available Scripts

```bash
# Development
npm run start:dev         # Start with hot reload
npm run start:debug      # Start with debugger

# Production  
npm run build            # Build application
npm run start:prod       # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage

# Utilities
npm run check:env        # Verify environment variables
npm run validate:config  # Validate configuration
```

## 📱 Firebase Notification Format

Notifications are sent to the `largeTransfers` topic with this structure:

```json
{
  "notification": {
    "title": "🚨 Large USDT Transfer Detected",
    "body": "150,000.00 USDT transferred from 0x1234...5678 to 0xabcd...efgh"
  },
  "data": {
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef", 
    "amount": "150000.00",
    "txHash": "0x...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🏗 Project Structure

```
src/
├── blockchain/
│   ├── blockchain.module.ts          # Blockchain module
│   ├── blockchain.service.ts         # Main monitoring service
│   └── usdt-monitor.service.ts       # Transfer tracking service
├── firebase/
│   ├── firebase.module.ts            # Firebase module
│   └── firebase.service.ts           # FCM notification service
├── config/
│   ├── configuration.ts              # App configuration
│   └── config-validation.service.ts  # Config validation
├── app.module.ts                     # Root application module
└── main.ts                          # Application entry point
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files or Firebase credentials
2. **Network Security**: Use WSS (WebSocket Secure) connections
3. **Rate Limiting**: Consider implementing rate limits for notifications
4. **Error Handling**: Comprehensive error handling prevents crashes
5. **Logging**: Secure logging without exposing sensitive data

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**
```bash
# Check if your WebSocket URL is correct
npm run check:env

# Verify network connectivity
curl -I https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
```

**Firebase Authentication Errors**
```bash
# Verify Firebase credentials file exists
ls -la firebase-service-account.json

# Check file permissions
chmod 600 firebase-service-account.json
```

**Build Issues**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### Debug Logs

Enable debug logging by setting `NODE_ENV=development`:

```bash
NODE_ENV=development npm run start:dev
```

## 📈 Performance & Scaling

- **Memory Usage**: ~50-100MB baseline
- **CPU Usage**: Low, event-driven architecture
- **Network**: Persistent WebSocket connection
- **Scaling**: Stateless design allows horizontal scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`  
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check existing documentation
- Review logs for error details

---

**⚠️ Disclaimer**: This software is for educational and monitoring purposes only. Ensure compliance with relevant regulations and terms of service when monitoring blockchain data.
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
