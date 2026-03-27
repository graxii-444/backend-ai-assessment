# NOTES

## Market API choice
Used Binance public REST API (`ticker/price`, `klines`) to avoid API keys and keep setup simple.

## Design goals
- Clear modular separation (`market`, `ollama`, `config`)
- Stable API responses
- Structured logging
- Fast local run with minimal dependencies

## Trade-offs
- No cache layer yet
- Q&A context includes only latest price (not full kline summary)
- Non-streaming Ollama responses for simplicity

## Known issues
- Model inference latency depends on host CPU/RAM
- Upstream Binance/Ollama outages return 502 from backend

## Future improvements
- Add response caching for market endpoints
- Add streaming responses from Ollama
- Add retries with backoff for transient upstream failures
- Add auth/rate limiting and broader input validation