module.exports = {
  apps: [
    {
      name: 'phenex-listener',
      script: 'phenex-listener.mjs',
      cwd: 'C:/Users/Administrator/goldfoundry',
      env: {
        METAAPI_TOKEN: process.env.METAAPI_TOKEN || 'YOUR_METAAPI_TOKEN_HERE',
        METAAPI_ACCOUNT_ID: process.env.METAAPI_ACCOUNT_ID || 'YOUR_ACCOUNT_ID',
      },
      max_restarts: 100,
      restart_delay: 5000,
      autorestart: true,
    },
    {
      name: 'phenex-market-scanner',
      script: 'phenex-market-scanner.mjs',
      cwd: 'C:/Users/Administrator/goldfoundry',
      env: {
        METAAPI_TOKEN: process.env.METAAPI_TOKEN || 'YOUR_METAAPI_TOKEN_HERE',
        METAAPI_ACCOUNT_ID: process.env.METAAPI_ACCOUNT_ID || 'YOUR_ACCOUNT_ID',
        SCAN_SYMBOL: 'XAUUSD',
        SCAN_INTERVAL_MS: '30000',
      },
      max_restarts: 100,
      restart_delay: 5000,
      autorestart: true,
    },
  ],
};
