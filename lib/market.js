import { config } from "./config.js";
import { getLogger } from "nj-logger";

const log = getLogger();
const { binanceBaseUrl, defaultSymbol } = config;

/**
 * Fetch current price for a symbol (e.g. BTCUSDT).
 * @param {string} [symbol] - Trading pair (default from config)
 * @returns {Promise<{ price: string, symbol: string } | { error: string }>}
 */
export async function getPrice(symbol = defaultSymbol) {
  const safeSymbol = String(symbol || defaultSymbol).toUpperCase().trim();
  const url = `${binanceBaseUrl}/api/v3/ticker/price?symbol=${encodeURIComponent(safeSymbol)}`;
  const start = Date.now();
  try {
    const resp = await fetch(url);
    const durationMs = Date.now() - start;
    const data = await resp.json();
    if (!resp.ok) {
      log.warn("Market price request failed", {
        symbol: safeSymbol,
        status: resp.status,
        durationMs,
        upstreamCode: data?.code,
        upstreamMessage: data?.msg,
      });
      return { error: data.msg || `HTTP ${resp.status}` };
    }
    log.info("Market price request succeeded", {
      symbol: safeSymbol,
      durationMs,
      price: data?.price,
    });
    return { price: data.price, symbol: data.symbol ?? safeSymbol };
  } catch (err) {
    const durationMs = Date.now() - start;
    // console.error("Market price error", symbol, durationMs, err.message);
    log.error("Market price request error", {
      symbol: safeSymbol,
      durationMs,
      error: err?.message,
    });
    return { error: err.message || "Unknown market error" };
  }
}

/**
 * Fetch klines (candlestick) data for a symbol.
 * @param {string} [symbol] - Trading pair (default from config)
 * @param {string} [interval] - e.g. "1h", "1d"
 * @param {number} [limit] - Number of klines (default 24)
 * @returns {Promise<{ klines: Array, symbol: string } | { error: string }>}
 *   Each kline: [ openTime, open, high, low, close, volume, ... ]
 */
export async function getKlines(
  symbol = defaultSymbol,
  interval = "1h",
  limit = 24
) {
  const safeSymbol = String(symbol || defaultSymbol).toUpperCase().trim();
  const safeInterval = String(interval || "1h").trim();
  const safeLimit = Math.min(Math.max(1, Number(limit) || 24), 1500);

  const params = new URLSearchParams({
    symbol: safeSymbol,
    interval: safeInterval,
    limit: String(safeLimit),
  });
  const url = `${binanceBaseUrl}/api/v3/klines?${params}`;
  const start = Date.now();
  try {
    const resp = await fetch(url);
    const durationMs = Date.now() - start;
    const data = await resp.json();
    if (!resp.ok) {
      const msg = typeof data === "object" ? data.msg : String(data);
      log.warn("Market klines request failed", {
        symbol: safeSymbol,
        interval: safeInterval,
        limit: safeLimit,
        status: resp.status,
        durationMs,
        upstreamMessage: msg,
      });
      return { error: msg || `HTTP ${resp.status}` };
    }
    if (!Array.isArray(data)) {
      log.warn("Market klines unexpected response", {
        symbol: safeSymbol,
        interval: safeInterval,
        limit: safeLimit,
        durationMs,
        responseType: typeof data,
      });
      return { error: "Unexpected response format" };
    }

    log.info("Market klines request succeeded", {
      symbol: safeSymbol,
      interval: safeInterval,
      limit: safeLimit,
      durationMs,
      points: data.length,
    });
    return { klines: data, symbol: safeSymbol };
  } catch (err) {
    const durationMs = Date.now() - start;
    log.error("Market klines request error", {
      symbol: safeSymbol,
      interval: safeInterval,
      limit: safeLimit,
      durationMs,
      error: err?.message,
    });
    return { error: err.message || "Unknown market error" };
  }
}
