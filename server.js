import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDatabase } from './src/config/database.js';

const requiredEnvVars = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    console.error('Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}

const startServer = async () => {
  await connectDatabase();

  const server = app.listen(env.port, () => {
    const apiUrl = `http://127.0.0.1:${env.port}/api/v1`;
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    console.log(`API base URL: ${apiUrl}`);
    if (env.port === 5000) {
      console.warn(
        'WARNING: Port 5000 is used by macOS AirPlay on many Macs. Use PORT=5001 in .env if you get 403 errors.'
      );
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.port} is already in use. On macOS, port 5000 is often taken by AirPlay — set PORT=5001 in .env`
      );
    } else {
      console.error('Server failed to start:', error.message);
    }
    process.exit(1);
  });
};

startServer();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
