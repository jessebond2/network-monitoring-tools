// internet-monitor.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'internet-log.csv');
const CHECK_INTERVAL = 30000; // 30 seconds
const TARGETS = [
  { host: 'google.com', path: '/' },
  { host: 'cloudflare.com', path: '/' },
  { host: '1.1.1.1', path: '/' }
];

// Initialize CSV if doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, 'timestamp,target,status,responseTime\n');
}

async function checkConnection(target) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ 
        target: target.host, 
        status: 'timeout', 
        responseTime: Date.now() - startTime 
      });
    }, 5000);

    https.get({
      host: target.host,
      path: target.path,
      timeout: 5000
    }, (res) => {
      clearTimeout(timeout);
      resolve({
        target: target.host,
        status: 'online',
        responseTime: Date.now() - startTime
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        target: target.host,
        status: 'offline',
        responseTime: Date.now() - startTime
      });
    });
  });
}

async function monitor() {
  const results = await Promise.all(TARGETS.map(checkConnection));
  const timestamp = new Date().toISOString();
  const isOnline = results.some(r => r.status === 'online');
  
  // Log each result
  results.forEach(result => {
    const logEntry = `${timestamp},${result.target},${result.status},${result.responseTime}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
  });

  // Console output
  console.log(`[${timestamp}] Internet: ${isOnline ? 'UP' : 'DOWN'}`);
  
  if (!isOnline) {
    console.log('⚠️  Connection lost at', timestamp);
  }
}

// Run monitoring
setInterval(monitor, CHECK_INTERVAL);
monitor(); // Initial check

console.log(`Monitoring started. Logging to ${LOG_FILE}`);
console.log(`Checking every ${CHECK_INTERVAL/1000} seconds...`);