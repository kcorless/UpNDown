# Cross-Platform Infrastructure Considerations

## 1. Database Layer
✅ **SQLite**: Natively cross-platform
- Works identically on Windows, MacOS, Linux
- No changes needed to schema or queries
- File paths need to use platform-agnostic separators

## 2. Server Configuration
### Path Management
```typescript
// Need to use path.join instead of hardcoded separators
import path from 'path';

const dbPath = path.join(__dirname, '..', 'data', 'game.db');
const logPath = path.join(__dirname, '..', 'logs');
```

### Environment Variables
```typescript
// config.ts should use platform-agnostic paths and defaults
interface ServerConfig {
  port: number;
  dbPath: string;
  logDir: string;
  tempDir: string;
  maxConnections: number;
}

const defaultConfig: ServerConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'data', 'game.db'),
  logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
  tempDir: process.env.TEMP_DIR || path.join(process.cwd(), 'temp'),
  maxConnections: process.env.MAX_CONNECTIONS ? parseInt(process.env.MAX_CONNECTIONS) : 100
};
```

## 3. Installation Scripts
Need separate scripts for:
- Windows (.bat or .ps1)
- Unix-based (MacOS/Linux) (.sh)

```plaintext
scripts/
├── windows/
│   ├── install-dependencies.ps1
│   ├── init-database.ps1
│   └── start-server.ps1
└── unix/
    ├── install-dependencies.sh
    ├── init-database.sh
    └── start-server.sh
```

## 4. Process Management
```typescript
// Handle process signals appropriately for each platform
process.on('SIGINT', () => {
  // Windows doesn't support SIGTERM
  cleanup().then(() => process.exit(0));
});

if (process.platform !== 'win32') {
  process.on('SIGTERM', () => {
    cleanup().then(() => process.exit(0));
  });
}
```

## 5. File System Operations
```typescript
// Use fs.promises for modern async file operations
import { promises as fs } from 'fs';

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
```

## 6. Platform-Specific Dependencies
```json
{
  "dependencies": {
    "sqlite3": "^5.1.6",
    "express": "^4.18.2",
    "ws": "^8.13.0"
  },
  "optionalDependencies": {
    "fsevents": "^2.3.3"  // MacOS-specific file watching
  }
}
```

## 7. Development Tooling
- Use `cross-env` for environment variables
- Use `npm-run-all` for script orchestration
```json
{
  "scripts": {
    "start": "cross-env NODE_ENV=production node dist/server.js",
    "dev": "cross-env NODE_ENV=development nodemon src/server.ts",
    "build": "npm-run-all clean compile",
    "clean": "rimraf dist",
    "compile": "tsc"
  }
}
```

## 8. Logging Configuration
```typescript
// logging-config.ts
import path from 'path';

export const loggingConfig = {
  directory: path.join(process.cwd(), 'logs'),
  filename: `game-${process.env.NODE_ENV}.log`,
  separateErrors: true,
  errorFile: `error-${process.env.NODE_ENV}.log`,
  rotation: {
    size: '10M',
    interval: '1d'
  }
};
```

## 9. Additional Requirements

### For Windows:
- Node.js Windows installer
- Windows-compatible SQLite binary
- PowerShell execution policy configuration
- Service installation scripts (optional)

### For MacOS/Linux:
- Node.js installation via package manager
- Build tools for native modules
- Service configuration (systemd/launchd)
- Proper file permissions handling
