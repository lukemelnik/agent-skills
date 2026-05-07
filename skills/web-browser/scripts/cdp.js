/**
 * Minimal CDP client library — used by watch.js and pick.js
 * Zero dependencies (Node 22+ built-in WebSocket)
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

function getDevToolsWsUrl() {
  const candidates = [
    resolve(homedir(), "Library/Application Support/Google/Chrome/DevToolsActivePort"),
    resolve(homedir(), ".config/google-chrome/DevToolsActivePort"),
    resolve(homedir(), ".cache/scraping/DevToolsActivePort"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const lines = readFileSync(path, "utf8").trim().split("\n");
        if (lines.length >= 2) return `ws://127.0.0.1:${lines[0]}${lines[1]}`;
      } catch {}
    }
  }
  return null;
}

function connectWs(url, timeout) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connect timeout"));
    }, timeout);
    ws.onopen = () => {
      clearTimeout(timer);
      resolve(new CDP(ws));
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error("WebSocket error"));
    };
  });
}

export async function connect(timeout = 5000) {
  // Try DevToolsActivePort first (user's Chrome with remote debugging)
  const devToolsUrl = getDevToolsWsUrl();
  if (devToolsUrl) {
    try {
      return await connectWs(devToolsUrl, timeout);
    } catch {
      // DevToolsActivePort may be stale, try HTTP fallback
    }
  }

  // Fall back to HTTP endpoint (start.js / --remote-debugging-port)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const resp = await fetch("http://localhost:9222/json/version", {
      signal: controller.signal,
    });
    const { webSocketDebuggerUrl } = await resp.json();
    clearTimeout(timeoutId);
    return await connectWs(webSocketDebuggerUrl, timeout);
  } catch {}

  throw new Error(
    "Cannot connect to Chrome. Either:\n" +
      "  1. Enable remote debugging: chrome://inspect/#remote-debugging\n" +
      "  2. Run ./scripts/start.js to launch a debug instance",
  );
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.callbacks = new Map();
    this.sessions = new Map();
    this.eventHandlers = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message));
        } else {
          resolve(msg.result);
        }
        return;
      }

      if (msg.method) {
        this.emit(msg.method, msg.params || {}, msg.sessionId || null);
      }
    };
  }

  on(method, handler) {
    if (!this.eventHandlers.has(method)) {
      this.eventHandlers.set(method, new Set());
    }
    this.eventHandlers.get(method).add(handler);
    return () => this.off(method, handler);
  }

  off(method, handler) {
    const handlers = this.eventHandlers.get(method);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.eventHandlers.delete(method);
    }
  }

  emit(method, params, sessionId) {
    const handlers = this.eventHandlers.get(method);
    if (!handlers || handlers.size === 0) return;
    for (const handler of handlers) {
      try {
        handler(params, sessionId);
      } catch {
        // Ignore handler errors to keep CDP session alive.
      }
    }
  }

  send(method, params = {}, sessionId = null, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const msgId = ++this.id;
      const msg = { id: msgId, method, params };
      if (sessionId) msg.sessionId = sessionId;

      const timeoutId = setTimeout(() => {
        this.callbacks.delete(msgId);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeout);

      this.callbacks.set(msgId, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
      });

      this.ws.send(JSON.stringify(msg));
    });
  }

  async getPages() {
    const { targetInfos } = await this.send("Target.getTargets");
    return targetInfos.filter((t) => t.type === "page");
  }

  async attachToPage(targetId) {
    const { sessionId } = await this.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    return sessionId;
  }

  async evaluate(sessionId, expression, timeout = 30000) {
    const result = await this.send(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
        awaitPromise: true,
      },
      sessionId,
      timeout,
    );

    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    }
    return result.result?.value;
  }

  async screenshot(sessionId, timeout = 10000) {
    const { data } = await this.send(
      "Page.captureScreenshot",
      { format: "png" },
      sessionId,
      timeout,
    );
    return Buffer.from(data, "base64");
  }

  async navigate(sessionId, url, timeout = 30000) {
    await this.send("Page.navigate", { url }, sessionId, timeout);
  }

  async getFrameTree(sessionId) {
    const { frameTree } = await this.send("Page.getFrameTree", {}, sessionId);
    return frameTree;
  }

  async evaluateInFrame(sessionId, frameId, expression, timeout = 30000) {
    const { executionContextId } = await this.send(
      "Page.createIsolatedWorld",
      { frameId, worldName: "cdp-eval" },
      sessionId,
    );

    const result = await this.send(
      "Runtime.evaluate",
      {
        expression,
        contextId: executionContextId,
        returnByValue: true,
        awaitPromise: true,
      },
      sessionId,
      timeout,
    );

    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    }
    return result.result?.value;
  }

  close() {
    this.ws.close();
  }
}
