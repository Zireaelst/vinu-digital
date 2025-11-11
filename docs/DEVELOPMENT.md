# 🛠️ Development Guide

Bu dokümanda USDT Transfer Monitörü projesinin development süreci, debugging, testing ve optimization konuları detaylandırılmıştır.

## 🔄 Development Environment Setup

### Quick Development Setup

#### Minimum Requirements
```bash
# System requirements
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0
VS Code (önerilen)

# Global packages
npm install -g @nestjs/cli
npm install -g typescript
npm install -g nodemon
```

#### Multi-Terminal Development
```bash
# Terminal 1: Backend development
cd backend
npm run start:dev

# Terminal 2: Frontend development  
cd frontend
npm run dev

# Terminal 3: Log monitoring
tail -f backend/logs/app.log

# Terminal 4: Git operations
git status
git log --oneline -10
```

### VS Code Configuration

#### Recommended Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.quoteStyle": "single",
  "typescript.suggest.autoImports": true,
  "eslint.format.enable": true,
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "files.associations": {
    "*.env*": "properties"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  }
}
```

#### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/main.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/backend/.env",
      "runtimeArgs": [
        "-r", "ts-node/register",
        "-r", "tsconfig-paths/register"
      ],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Next.js Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/frontend",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## 🧪 Testing Strategy

### Backend Testing

#### Unit Tests Setup
```typescript
// backend/test/setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

export const createTestingModule = async (providers: any[]) => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
            const config = {
              'ethereumWssUrl': 'ws://localhost:8545',
              'firebaseAdminConfigPath': './test-firebase.json'
            };
            return config[key];
          })
        }
      }
    ]
  }).compile();

  return module;
};
```

#### Service Testing Example
```typescript
// backend/src/blockchain/blockchain.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { UsdtMonitorService } from './usdt-monitor.service';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configService: ConfigService;
  let firebaseService: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('wss://test-url')
          }
        },
        {
          provide: FirebaseService,
          useValue: {
            sendNotification: jest.fn().mockResolvedValue(true)
          }
        },
        {
          provide: UsdtMonitorService,
          useValue: {
            processTransfer: jest.fn().mockResolvedValue(true)
          }
        }
      ]
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    configService = module.get<ConfigService>(ConfigService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate transfer threshold', () => {
    const largeTransfer = BigInt('100000000000'); // 100,000 USDT (6 decimals)
    const smallTransfer = BigInt('50000000000');  // 50,000 USDT
    
    expect(service['isLargeTransfer'](largeTransfer)).toBe(true);
    expect(service['isLargeTransfer'](smallTransfer)).toBe(false);
  });

  it('should format USDT amount correctly', () => {
    const amount = BigInt('1500000000000'); // 1,500,000 USDT
    const formatted = service['formatUSDTAmount'](amount);
    
    expect(formatted).toBe('1500000.00');
  });
});
```

#### Integration Tests
```typescript
// backend/test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('blockchain');
      });
  });

  it('/status (GET)', () => {
    return request(app.getHttpServer())
      .get('/status')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('blockchain');
        expect(res.body).toHaveProperty('transfers');
      });
  });
});
```

### Frontend Testing

#### Component Testing
```typescript
// frontend/src/components/__tests__/ControlPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPanel } from '../ControlPanel';
import { SettingsProvider } from '../../contexts/SettingsContext';

const MockedSettingsProvider = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('ControlPanel', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    totalNotifications: 42,
    lastTransferAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    mockProps.onClose.mockClear();
  });

  it('renders control panel when open', () => {
    render(
      <MockedSettingsProvider>
        <ControlPanel {...mockProps} />
      </MockedSettingsProvider>
    );

    expect(screen.getByText('Bildirim Ayarları')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(
      <MockedSettingsProvider>
        <ControlPanel {...mockProps} />
      </MockedSettingsProvider>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles sound notification setting', () => {
    render(
      <MockedSettingsProvider>
        <ControlPanel {...mockProps} />
      </MockedSettingsProvider>
    );

    const soundToggle = screen.getByRole('button', { name: /ses bildirimleri/i });
    fireEvent.click(soundToggle);

    // Check if localStorage is updated
    expect(localStorage.getItem('soundEnabled')).toBeTruthy();
  });
});
```

#### Jest Configuration
```javascript
// frontend/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/firebase/admin.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// frontend/jest.setup.js
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(),
  getToken: jest.fn(),
  onMessage: jest.fn(),
  isSupported: jest.fn(() => Promise.resolve(true)),
}));
```

### Testing Commands

```bash
# Backend testing
cd backend

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- blockchain.service.spec.ts

# Generate coverage report
npm run test:cov
open coverage/lcov-report/index.html

# Run E2E tests
npm run test:e2e

# Frontend testing
cd frontend

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test
npm run test -- ControlPanel.test.tsx
```

## 🔍 Debugging Guide

### Backend Debugging

#### Environment Debugging
```bash
# Check environment variables
cd backend
npm run check:env

# Validate configuration
npm run validate:config

# Test WebSocket connection
DEBUG=ethers:* npm run start:dev

# Test Firebase connection
npm run test:firebase
```

#### Advanced Debugging
```typescript
// backend/src/debug/debug.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);

  logTransferEvent(event: any) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Transfer Event Details:', {
        from: event.args.from,
        to: event.args.to,
        value: event.args.value.toString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        gasUsed: event.gasUsed,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testEthereumConnection() {
    try {
      const provider = this.blockchainService.getProvider();
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      
      return {
        connected: true,
        network: network.name,
        chainId: network.chainId,
        blockNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
```

#### Memory Monitoring
```typescript
// backend/src/monitoring/memory.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MemoryMonitorService {
  private readonly logger = new Logger(MemoryMonitorService.name);

  startMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      this.logger.debug('System Resources:', {
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime()
      });

      // Alert if memory usage is too high
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        this.logger.warn('High memory usage detected');
      }
    }, 60000); // Every minute
  }
}
```

### Frontend Debugging

#### Browser Debugging
```typescript
// frontend/src/lib/debug.ts
export class DebugHelper {
  static isDebug = process.env.NODE_ENV === 'development';

  static log(message: string, data?: any) {
    if (this.isDebug) {
      console.log(`[USDT Monitor] ${message}`, data);
    }
  }

  static error(message: string, error?: any) {
    if (this.isDebug) {
      console.error(`[USDT Monitor] ${message}`, error);
    }
  }

  static trackFCMToken(token: string | null) {
    if (this.isDebug) {
      console.log('[FCM] Token status:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.slice(0, 10)}...` : 'No token'
      });
    }
  }

  static trackNotification(payload: any) {
    if (this.isDebug) {
      console.log('[Notification] Received:', {
        title: payload.notification?.title,
        hasData: !!payload.data,
        dataKeys: payload.data ? Object.keys(payload.data) : [],
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

#### Service Worker Debugging
```javascript
// frontend/public/debug-sw.js (development only)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
  });

  // Check service worker registration
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.log('[SW] Active registrations:', registrations.length);
    registrations.forEach((registration, index) => {
      console.log(`[SW] Registration ${index}:`, {
        scope: registration.scope,
        active: !!registration.active,
        installing: !!registration.installing,
        waiting: !!registration.waiting
      });
    });
  });
}
```

## 🚀 Performance Optimization

### Backend Optimization

#### Connection Pooling
```typescript
// backend/src/blockchain/connection-pool.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class ConnectionPoolService {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private providers: ethers.WebSocketProvider[] = [];
  private currentProviderIndex = 0;
  private readonly maxConnections = 3;

  async initializePool(urls: string[]) {
    for (let i = 0; i < Math.min(urls.length, this.maxConnections); i++) {
      try {
        const provider = new ethers.WebSocketProvider(urls[i], {
          reconnect: {
            auto: true,
            delay: 5000,
            maxAttempts: 5,
            onTimeout: false
          }
        });

        await provider.getNetwork(); // Test connection
        this.providers.push(provider);
        this.logger.log(`Provider ${i} connected: ${urls[i]}`);
      } catch (error) {
        this.logger.error(`Failed to connect provider ${i}:`, error.message);
      }
    }

    if (this.providers.length === 0) {
      throw new Error('No providers could be connected');
    }
  }

  getProvider(): ethers.WebSocketProvider {
    if (this.providers.length === 0) {
      throw new Error('No active providers');
    }

    const provider = this.providers[this.currentProviderIndex];
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    return provider;
  }

  async healthCheck() {
    const results = await Promise.allSettled(
      this.providers.map(async (provider, index) => {
        try {
          await provider.getBlockNumber();
          return { index, status: 'healthy' };
        } catch (error) {
          return { index, status: 'unhealthy', error: error.message };
        }
      })
    );

    return results.map((result, index) => ({
      provider: index,
      ...result
    }));
  }
}
```

#### Memory Optimization
```typescript
// backend/src/optimization/memory-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private cache = new Map<string, CacheItem<any>>();
  private readonly maxSize = 1000;
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Cleanup expired items periodically
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  set<T>(key: string, value: T, ttl: number = 60000): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired cache items`);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercentage: (this.cache.size / this.maxSize) * 100
    };
  }
}
```

### Frontend Optimization

#### Code Splitting
```typescript
// frontend/src/components/LazyComponents.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Lazy load heavy components
const ControlPanel = lazy(() => import('./ControlPanel'));
const TransferHistory = lazy(() => import('./TransferHistory'));
const Analytics = lazy(() => import('./Analytics'));

export const LazyControlPanel = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <ControlPanel {...props} />
  </Suspense>
);

export const LazyTransferHistory = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <TransferHistory {...props} />
  </Suspense>
);

export const LazyAnalytics = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Analytics {...props} />
  </Suspense>
);
```

#### Service Worker Optimization
```javascript
// frontend/public/sw-optimization.js
const CACHE_NAME = 'usdt-monitor-v1';
const STATIC_ASSETS = [
  '/',
  '/firebase-logo.png',
  '/notification-sound.mp3',
  '/_next/static/css/',
  '/_next/static/js/'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event with optimization
self.addEventListener('fetch', (event) => {
  // Cache-first strategy for static assets
  if (event.request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
});
```

#### React Optimization
```typescript
// frontend/src/hooks/useOptimizedState.ts
import { useState, useCallback, useMemo } from 'react';

export const useOptimizedNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Memoized notification processing
  const processedNotifications = useMemo(() => {
    return notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50) // Limit to prevent performance issues
      .map(notification => ({
        ...notification,
        formattedAmount: parseFloat(notification.amount || '0').toLocaleString(),
        shortAddress: `${notification.fromAddress?.slice(0, 6)}...${notification.fromAddress?.slice(-4)}`
      }));
  }, [notifications]);

  // Optimized add notification
  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => {
      // Prevent duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }

      // Add new notification and maintain max size
      const updated = [notification, ...prev].slice(0, 100);
      return updated;
    });
  }, []);

  return {
    notifications: processedNotifications,
    addNotification
  };
};
```

## 🔧 Development Tools

### Automation Scripts

#### Development Automation
```bash
#!/bin/bash
# scripts/dev-setup.sh - Development environment setup

echo "🚀 Setting up USDT Monitor development environment..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js version must be 18 or higher"
        exit 1
    fi
    
    echo "✅ Node.js $(node --version) found"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Backend dependencies
    cd backend && npm install && cd ..
    echo "✅ Backend dependencies installed"
    
    # Frontend dependencies
    cd frontend && npm install && cd ..
    echo "✅ Frontend dependencies installed"
}

# Setup environment files
setup_environment() {
    echo "⚙️ Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        echo "📝 Created backend/.env - Please update with your values"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.example frontend/.env.local
        echo "📝 Created frontend/.env.local - Please update with your values"
    fi
}

# Create development shortcuts
create_shortcuts() {
    echo "🔗 Creating development shortcuts..."
    
    cat > start-dev.sh << 'EOF'
#!/bin/bash
# Start development servers
echo "Starting USDT Monitor development servers..."

# Start backend
cd backend && npm run start:dev &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF

    chmod +x start-dev.sh
    echo "✅ Created start-dev.sh script"
}

# Run setup
check_prerequisites
install_dependencies
setup_environment
create_shortcuts

echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your Ethereum WSS URL and Firebase config"
echo "2. Update frontend/.env.local with your Firebase client config"
echo "3. Run ./start-dev.sh to start both servers"
```

#### Testing Automation
```bash
#!/bin/bash
# scripts/run-tests.sh - Comprehensive testing

echo "🧪 Running USDT Monitor test suite..."

# Backend tests
echo "🖥️ Running backend tests..."
cd backend

# Unit tests
echo "  📝 Unit tests..."
npm run test -- --coverage --silent

# E2E tests
echo "  🔗 Integration tests..."
npm run test:e2e -- --silent

cd ..

# Frontend tests
echo "💻 Running frontend tests..."
cd frontend

# Component tests
echo "  🧩 Component tests..."
npm run test -- --coverage --watchAll=false

cd ..

# Generate combined coverage report
echo "📊 Generating coverage report..."
mkdir -p coverage/combined
# Combine coverage reports if needed

echo "✅ All tests completed!"
```

### Code Quality Tools

#### Pre-commit Hooks
```bash
#!/bin/bash
# .husky/pre-commit
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Check for forbidden files
if git diff --cached --name-only | grep -E "\.(env|key|pem)$|firebase.*\.json$"; then
    echo "❌ Sensitive files detected in commit!"
    exit 1
fi

# Run linting
npm run lint:check || exit 1

# Run type checking
npm run type-check || exit 1

# Run tests
npm run test:quick || exit 1

echo "✅ Pre-commit checks passed!"
```

#### Code Formatting
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "jsxSingleQuote": true,
  "quoteProps": "as-needed",
  "rangeStart": 0,
  "requirePragma": false,
  "insertPragma": false,
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css"
}
```

---

**🛠️ Development Ready**: Bu guide ile development sürecinde maksimum verimlilik ve code quality sağlanabilir.
