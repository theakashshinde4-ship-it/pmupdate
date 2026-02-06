const app = require('./app');
const env = require('./config/env');
const { initDb } = require('./config/db');

const cluster = require('cluster');
const os = require('os');

async function start() {
  try {
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialized successfully');
    app.listen(env.port, () => {
      console.log(`API server listening on port ${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    console.error('Error details:', err.message);
    process.exit(1);
  }
}

if (env.nodeEnv === 'production' && (cluster.isPrimary || cluster.isMaster)) {
  const numCPUs = os.cpus().length;
  console.log(`Forking ${numCPUs} processes for production`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  start();
}

