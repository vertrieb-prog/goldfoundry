# Exchange Integration
Universal connector pattern: src/lib/exchanges/[exchange].ts
Supported: Binance, Bybit, Bitget, OKX, KuCoin, Bitpanda, MEXC, Coinbase, Kraken, Crypto.com
API Key handling: ONLY trade permission. NEVER withdrawal permission.
REST + WebSocket for each exchange. Rate limit handling.
Order types: Market, Limit, Stop-Loss, Take-Profit.
Copy trading flow: Leader trade detected → replicate on follower accounts → adjust lot size → risk check → execute.
Config in src/lib/config.ts: EXCHANGES object with api URL, ws URL, features, maxLeverage.
Exchange-specific LPs: /exchange/[slug] with setup guide + partner ref support.
Broker-specific LPs: /broker/[slug] for MT4/MT5 brokers.
