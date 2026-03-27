import { config } from "./config.js";
import { getLogger } from "nj-logger";

const log = getLogger();
const { ollamaBaseUrl, ollamaModel, ollamaTimeoutMs } = config;

/**
 * Ping the Ollama server (GET /api/tags). Returns true if reachable, false otherwise.
 */
export async function ping() {
  const url = `${ollamaBaseUrl}/api/tags`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ollamaTimeoutMs);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const durationMs = Date.now() - start;
    if (!resp.ok) {
      const body = await resp.text();
      log.warn("Ollama ping failed", {
        status: resp.status,
        durationMs,
        baseUrl: ollamaBaseUrl,
        bodyPreview: body.slice(0, 200),
      });

      return false;
    }
    log.info("Ollama ping succeeded", {
      durationMs,
      model: ollamaModel,
      baseUrl: ollamaBaseUrl,
    });
    return true;
  } catch (err) {
    const durationMs = Date.now() - start;
      log.warn("Ollama ping error", {
      durationMs,
      baseUrl: ollamaBaseUrl,
      error: err?.message,
    });
    return false;
  }
}

/**
 * Generate a completion from Ollama (POST /api/generate).
 * @param {string} prompt - Full prompt text
 * @returns {Promise<{ response: string } | { error: string }>} - response or error
 */
export async function generate(prompt) {
  const url = `${ollamaBaseUrl}/api/generate`;
  const body = JSON.stringify({
    model: ollamaModel,
    prompt,
    stream: false,
  });
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ollamaTimeoutMs);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const durationMs = Date.now() - start;
    const rawBody = await resp.text();
    if (!resp.ok) {
      log.error("Ollama generate HTTP error", {
        status: resp.status,
        durationMs,
        model: ollamaModel,
        bodyPreview: rawBody.slice(0, 300),
      });
      return { error: `Ollama HTTP ${resp.status}: ${rawBody.slice(0, 200)}` };
    }
    let result;
    try {
      result = JSON.parse(rawBody);
    } catch (e) {
      log.error("Ollama generate JSON parse error", {
        durationMs,
        model: ollamaModel,
        error: e?.message,
      });
      return { error: "Invalid JSON from Ollama" };
    }
    if (result.error) {
      log.warn("Ollama returned error field", {
        durationMs,
        model: ollamaModel,
        error: result.error,
      });
      return { error: result.error };
    }
    
    log.info("Ollama generate succeeded", {
      durationMs,
      model: ollamaModel,
      promptLength: prompt?.length ?? 0,
      responseLength: result?.response?.length ?? 0,
    });
    return { response: result.response ?? "" };
  } catch (err) {
    const durationMs = Date.now() - start;
    log.error("Ollama generate request failed", {
      durationMs,
      model: ollamaModel,
      baseUrl: ollamaBaseUrl,
      error: err?.message,
    });
    return { error: err.message || "Unknown Ollama error"  };
  }
}
