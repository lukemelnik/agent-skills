#!/usr/bin/env node
// cdp.mjs - unified Chrome DevTools Protocol CLI
// Persistent per-tab daemon architecture, zero dependencies (Node 22+).
// Connects to your existing Chrome — no separate browser instance needed.

import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import { spawn } from 'child_process';
import net from 'net';

const TIMEOUT = 15000;
const NAVIGATION_TIMEOUT = 30000;
const IDLE_TIMEOUT = 20 * 60 * 1000;
const DAEMON_CONNECT_RETRIES = 20;
const DAEMON_CONNECT_DELAY = 300;
const MIN_TARGET_PREFIX_LEN = 8;
const SOCK_PREFIX = '/tmp/cdp-';
const PAGES_CACHE = '/tmp/cdp-pages.json';

function sockPath(targetId) { return `${SOCK_PREFIX}${targetId}.sock`; }

async function getWsUrl() {
  // Try DevToolsActivePort files first (no HTTP request needed)
  const candidates = [
    resolve(homedir(), 'Library/Application Support/Google/Chrome/DevToolsActivePort'),
    resolve(homedir(), '.config/google-chrome/DevToolsActivePort'),
    resolve(homedir(), '.cache/scraping/DevToolsActivePort'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const lines = readFileSync(path, 'utf8').trim().split('\n');
        if (lines.length >= 2) {
          const port = parseInt(lines[0]);
          // Verify port is actually listening before returning
          const listening = await new Promise(r => {
            const sock = net.connect(port, '127.0.0.1');
            sock.on('connect', () => { sock.destroy(); r(true); });
            sock.on('error', () => r(false));
            setTimeout(() => { sock.destroy(); r(false); }, 1000);
          });
          if (listening) return `ws://127.0.0.1:${lines[0]}${lines[1]}`;
        }
      } catch {}
    }
  }

  // Fall back to HTTP debugging endpoint (start.js, --remote-debugging-port)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('http://127.0.0.1:9222/json/version', { signal: controller.signal });
    const { webSocketDebuggerUrl } = await resp.json();
    clearTimeout(timer);
    if (webSocketDebuggerUrl) return webSocketDebuggerUrl;
  } catch {}

  throw new Error(
    'Cannot connect to Chrome. Either:\n' +
    '  1. Enable remote debugging: chrome://inspect/#remote-debugging\n' +
    '  2. Run ./scripts/start.js to launch a debug instance'
  );
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function listDaemonSockets() {
  return readdirSync('/tmp')
    .filter(f => f.startsWith('cdp-') && f.endsWith('.sock'))
    .map(f => ({
      targetId: f.slice(4, -5),
      socketPath: `/tmp/${f}`,
    }));
}

function resolvePrefix(prefix, candidates, noun = 'target', missingHint = '') {
  const upper = prefix.toUpperCase();
  const matches = candidates.filter(c => c.toUpperCase().startsWith(upper));
  if (matches.length === 0) {
    const hint = missingHint ? ` ${missingHint}` : '';
    throw new Error(`No ${noun} matching prefix "${prefix}".${hint}`);
  }
  if (matches.length > 1) {
    throw new Error(`Ambiguous prefix "${prefix}" — matches ${matches.length} ${noun}s. Use more characters.`);
  }
  return matches[0];
}

function getDisplayPrefixLength(targetIds) {
  if (targetIds.length === 0) return MIN_TARGET_PREFIX_LEN;
  const maxLen = Math.max(...targetIds.map(id => id.length));
  for (let len = MIN_TARGET_PREFIX_LEN; len <= maxLen; len++) {
    const prefixes = new Set(targetIds.map(id => id.slice(0, len).toUpperCase()));
    if (prefixes.size === targetIds.length) return len;
  }
  return maxLen;
}

// ---------------------------------------------------------------------------
// CDP WebSocket client
// ---------------------------------------------------------------------------

class CDP {
  #ws; #id = 0; #pending = new Map(); #eventHandlers = new Map(); #closeHandlers = [];

  async connect(wsUrl, connectTimeout = 5000) {
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        try { this.#ws?.close(); } catch {}
        rej(new Error('WebSocket connect timeout'));
      }, connectTimeout);
      this.#ws = new WebSocket(wsUrl);
      this.#ws.onopen = () => { clearTimeout(timer); res(); };
      this.#ws.onerror = () => { clearTimeout(timer); rej(new Error('WebSocket error')); };
      this.#ws.onclose = () => this.#closeHandlers.forEach(h => h());
      this.#ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && this.#pending.has(msg.id)) {
          const { resolve, reject } = this.#pending.get(msg.id);
          this.#pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method && this.#eventHandlers.has(msg.method)) {
          for (const handler of [...this.#eventHandlers.get(msg.method)]) {
            handler(msg.params || {}, msg);
          }
        }
      };
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      const msg = { id, method, params };
      if (sessionId) msg.sessionId = sessionId;
      this.#ws.send(JSON.stringify(msg));
      setTimeout(() => {
        if (this.#pending.has(id)) {
          this.#pending.delete(id);
          reject(new Error(`Timeout: ${method}`));
        }
      }, TIMEOUT);
    });
  }

  onEvent(method, handler) {
    if (!this.#eventHandlers.has(method)) this.#eventHandlers.set(method, new Set());
    const handlers = this.#eventHandlers.get(method);
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) this.#eventHandlers.delete(method);
    };
  }

  waitForEvent(method, timeout = TIMEOUT) {
    let settled = false;
    let off;
    let timer;
    const promise = new Promise((resolve, reject) => {
      off = this.onEvent(method, (params) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        off();
        resolve(params);
      });
      timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        off();
        reject(new Error(`Timeout waiting for event: ${method}`));
      }, timeout);
    });
    return {
      promise,
      cancel() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        off?.();
      },
    };
  }

  onClose(handler) { this.#closeHandlers.push(handler); }
  close() { this.#ws.close(); }
}

// ---------------------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------------------

async function getPages(cdp) {
  const { targetInfos } = await cdp.send('Target.getTargets');
  return targetInfos.filter(t => t.type === 'page' && !t.url.startsWith('chrome://'));
}

function formatPageList(pages) {
  const prefixLen = getDisplayPrefixLength(pages.map(p => p.targetId));
  return pages.map(p => {
    const id = p.targetId.slice(0, prefixLen).padEnd(prefixLen);
    const title = p.title.substring(0, 54).padEnd(54);
    return `${id}  ${title}  ${p.url}`;
  }).join('\n');
}

// -- Accessibility tree snapshot --

function shouldShowAxNode(node) {
  const role = node.role?.value || '';
  const name = node.name?.value ?? '';
  const value = node.value?.value;
  if (role === 'InlineTextBox') return false;
  return role !== 'none' && role !== 'generic' && !(name === '' && (value === '' || value == null));
}

function formatAxNode(node, depth) {
  const role = node.role?.value || '';
  const name = node.name?.value ?? '';
  const value = node.value?.value;
  const indent = '  '.repeat(Math.min(depth, 10));
  let line = `${indent}[${role}]`;
  if (name !== '') line += ` ${name}`;
  if (!(value === '' || value == null)) line += ` = ${JSON.stringify(value)}`;
  return line;
}

function orderedAxChildren(node, nodesById, childrenByParent) {
  const children = [];
  const seen = new Set();
  for (const childId of node.childIds || []) {
    const child = nodesById.get(childId);
    if (child && !seen.has(child.nodeId)) { seen.add(child.nodeId); children.push(child); }
  }
  for (const child of childrenByParent.get(node.nodeId) || []) {
    if (!seen.has(child.nodeId)) { seen.add(child.nodeId); children.push(child); }
  }
  return children;
}

async function snapshotStr(cdp, sid) {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree', {}, sid);
  const nodesById = new Map(nodes.map(n => [n.nodeId, n]));
  const childrenByParent = new Map();
  for (const node of nodes) {
    if (!node.parentId) continue;
    if (!childrenByParent.has(node.parentId)) childrenByParent.set(node.parentId, []);
    childrenByParent.get(node.parentId).push(node);
  }
  const lines = [];
  const visited = new Set();
  function visit(node, depth) {
    if (!node || visited.has(node.nodeId)) return;
    visited.add(node.nodeId);
    if (shouldShowAxNode(node)) lines.push(formatAxNode(node, depth));
    for (const child of orderedAxChildren(node, nodesById, childrenByParent)) visit(child, depth + 1);
  }
  const roots = nodes.filter(n => !n.parentId || !nodesById.has(n.parentId));
  for (const root of roots) visit(root, 0);
  for (const node of nodes) visit(node, 0);
  return lines.join('\n');
}

// -- Evaluate JS --

async function evalStr(cdp, sid, expression) {
  await cdp.send('Runtime.enable', {}, sid);
  const result = await cdp.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  }, sid);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || result.exceptionDetails.exception?.description);
  }
  const val = result.result.value;
  return typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '');
}

// -- Screenshot --

async function shotStr(cdp, sid, filePath) {
  let dpr = 1;
  try {
    const raw = await evalStr(cdp, sid, 'window.devicePixelRatio');
    const parsed = parseFloat(raw);
    if (parsed > 0) dpr = parsed;
  } catch {}

  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sid);
  const out = filePath || '/tmp/screenshot.png';
  writeFileSync(out, Buffer.from(data, 'base64'));

  const lines = [out];
  lines.push(`DPR: ${dpr}. Coordinate mapping: CSS px = screenshot px / ${dpr}`);
  lines.push(`  e.g. screenshot (${Math.round(100 * dpr)}, ${Math.round(200 * dpr)}) → clickxy <target> 100 200`);
  return lines.join('\n');
}

// -- HTML --

async function htmlStr(cdp, sid, selector) {
  const expr = selector
    ? `document.querySelector(${JSON.stringify(selector)})?.outerHTML || 'Element not found'`
    : `document.documentElement.outerHTML`;
  return evalStr(cdp, sid, expr);
}

// -- Navigate --

async function waitForDocumentReady(cdp, sid, timeoutMs = NAVIGATION_TIMEOUT) {
  const deadline = Date.now() + timeoutMs;
  let lastState = '';
  let lastError;
  while (Date.now() < deadline) {
    try {
      const state = await evalStr(cdp, sid, 'document.readyState');
      lastState = state;
      if (state === 'complete') return;
    } catch (e) { lastError = e; }
    await sleep(200);
  }
  if (lastState) throw new Error(`Timed out (last readyState: ${lastState})`);
  if (lastError) throw new Error(`Timed out (${lastError.message})`);
  throw new Error('Timed out waiting for navigation');
}

async function navStr(cdp, sid, url) {
  await cdp.send('Page.enable', {}, sid);
  const loadEvent = cdp.waitForEvent('Page.loadEventFired', NAVIGATION_TIMEOUT);
  const result = await cdp.send('Page.navigate', { url }, sid);
  if (result.errorText) { loadEvent.cancel(); throw new Error(result.errorText); }
  if (result.loaderId) await loadEvent.promise;
  else loadEvent.cancel();
  await waitForDocumentReady(cdp, sid, 5000);
  return `Navigated to ${url}`;
}

// -- Network timing --

async function netStr(cdp, sid) {
  const raw = await evalStr(cdp, sid, `JSON.stringify(performance.getEntriesByType('resource').map(e => ({
    name: e.name.substring(0, 120), type: e.initiatorType,
    duration: Math.round(e.duration), size: e.transferSize
  })))`);
  return JSON.parse(raw).map(e =>
    `${String(e.duration).padStart(5)}ms  ${String(e.size || '?').padStart(8)}B  ${e.type.padEnd(8)}  ${e.name}`
  ).join('\n');
}

// -- Click by selector --

async function clickStr(cdp, sid, selector) {
  if (!selector) throw new Error('CSS selector required');
  const expr = `(function() {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { ok: false, error: 'Element not found: ' + ${JSON.stringify(selector)} };
    el.scrollIntoView({ block: 'center' });
    el.click();
    return { ok: true, tag: el.tagName, text: el.textContent.trim().substring(0, 80) };
  })()`;
  const result = await evalStr(cdp, sid, expr);
  const r = JSON.parse(result);
  if (!r.ok) throw new Error(r.error);
  return `Clicked <${r.tag}> "${r.text}"`;
}

// -- Click at coordinates --

async function clickXyStr(cdp, sid, x, y) {
  const cx = parseFloat(x);
  const cy = parseFloat(y);
  if (isNaN(cx) || isNaN(cy)) throw new Error('x and y must be numbers (CSS pixels)');
  const base = { x: cx, y: cy, button: 'left', clickCount: 1, modifiers: 0 };
  await cdp.send('Input.dispatchMouseEvent', { ...base, type: 'mouseMoved' }, sid);
  await cdp.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' }, sid);
  await sleep(50);
  await cdp.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' }, sid);
  return `Clicked at CSS (${cx}, ${cy})`;
}

// -- Type text --

async function typeStr(cdp, sid, text) {
  if (text == null || text === '') throw new Error('text required');
  await cdp.send('Input.insertText', { text }, sid);
  return `Typed ${text.length} characters`;
}

// -- Load more --

async function loadAllStr(cdp, sid, selector, intervalMs = 1500) {
  if (!selector) throw new Error('CSS selector required');
  let clicks = 0;
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    const exists = await evalStr(cdp, sid, `!!document.querySelector(${JSON.stringify(selector)})`);
    if (exists !== 'true') break;
    const clicked = await evalStr(cdp, sid, `(function() {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    })()`);
    if (clicked !== 'true') break;
    clicks++;
    await sleep(intervalMs);
  }
  return `Clicked "${selector}" ${clicks} time(s) until it disappeared`;
}

// -- Raw CDP passthrough --

async function evalRawStr(cdp, sid, method, paramsJson) {
  if (!method) throw new Error('CDP method required (e.g. "DOM.getDocument")');
  let params = {};
  if (paramsJson) {
    try { params = JSON.parse(paramsJson); }
    catch { throw new Error(`Invalid JSON params: ${paramsJson}`); }
  }
  const result = await cdp.send(method, params, sid);
  return JSON.stringify(result, null, 2);
}

// ---------------------------------------------------------------------------
// Cookie dismissal
// ---------------------------------------------------------------------------

const COOKIE_DISMISS_SCRIPT = `(acceptCookies) => {
  const clicked = [];
  const isVisible = (el) => {
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           (el.offsetParent !== null || style.position === 'fixed' || style.position === 'sticky');
  };
  const tryClick = (selector, description) => {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (isVisible(el)) { el.click(); clicked.push(description || selector); return true; }
    return false;
  };
  const findButtonByText = (patterns, container = document) => {
    const buttons = Array.from(container.querySelectorAll('button, [role="button"], a.button, input[type="submit"], input[type="button"]'));
    const sortedPatterns = [...patterns].sort((a, b) => b.length - a.length);
    for (const pattern of sortedPatterns) {
      for (const btn of buttons) {
        const text = (btn.textContent || btn.value || '').trim().toLowerCase();
        if (text.length > 100) continue;
        if (!isVisible(btn)) continue;
        if (typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)) return btn;
      }
    }
    return null;
  };
  const acceptPatterns = [
    'accept all', 'accept cookies', 'allow all', 'allow cookies',
    'i agree', 'i accept', 'yes, i agree', 'agree and continue',
    'alle akzeptieren', 'akzeptieren', 'alle zulassen', 'zustimmen', 'annehmen', 'einverstanden',
    'accepter tout', 'tout accepter', "j'accepte", 'accepter et continuer', 'accepter',
    'accetta tutti', 'accetta', 'accetto',
    'aceptar todo', 'aceptar', 'acepto',
    'aceitar tudo', 'aceitar',
    'continue', 'agree',
  ];
  const rejectPatterns = [
    'reject all', 'decline all', 'deny all', 'refuse all',
    'i do not agree', 'i disagree', 'no thanks',
    'alle ablehnen', 'ablehnen', 'nicht zustimmen',
    'refuser tout', 'tout refuser', 'refuser',
    'rifiuta tutti', 'rifiuta',
    'rechazar todo', 'rechazar',
    'rejeitar tudo', 'rejeitar',
    'only necessary', 'necessary only', 'nur notwendige',
    'essential only', 'nur essentielle',
  ];
  const patterns = acceptCookies ? acceptPatterns : rejectPatterns;

  // OneTrust
  if (document.querySelector('#onetrust-banner-sdk')) {
    const s = acceptCookies ? '#onetrust-accept-btn-handler' : '#onetrust-reject-all-handler';
    if (tryClick(s, 'OneTrust')) return clicked;
  }
  // Google
  if (document.querySelector('[data-consent-dialog]') || document.querySelector('form[action*="consent.google"]') || document.querySelector('#CXQnmb')) {
    if (tryClick(acceptCookies ? '#L2AGLb' : '#W0wltc', 'Google Consent')) return clicked;
  }
  // YouTube
  if (document.querySelector('ytd-consent-bump-v2-lightbox')) {
    const btn = Array.from(document.querySelectorAll('ytd-consent-bump-v2-lightbox button'))
      .find(b => acceptCookies
        ? b.textContent.includes('Accept all') || b.ariaLabel?.includes('Accept')
        : b.textContent.includes('Reject all') || b.ariaLabel?.includes('Reject'));
    if (btn) { btn.click(); clicked.push('YouTube'); return clicked; }
  }
  // Cookiebot
  if (document.querySelector('#CybotCookiebotDialog')) {
    const s = acceptCookies
      ? '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll, #CybotCookiebotDialogBodyButtonAccept'
      : '#CybotCookiebotDialogBodyButtonDecline, #CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll';
    if (tryClick(s, 'Cookiebot')) return clicked;
  }
  // Didomi
  if (document.querySelector('#didomi-host') || window.Didomi) {
    const s = acceptCookies ? '#didomi-notice-agree-button' : '#didomi-notice-disagree-button, [data-testid="disagree-button"]';
    if (tryClick(s, 'Didomi')) return clicked;
  }
  // Quantcast
  if (document.querySelector('.qc-cmp2-container')) {
    const s = acceptCookies
      ? '.qc-cmp2-summary-buttons button[mode="primary"], .qc-cmp2-button[data-testid="accept-all"]'
      : '.qc-cmp2-summary-buttons button[mode="secondary"], .qc-cmp2-button[data-testid="reject-all"]';
    if (tryClick(s, 'Quantcast')) return clicked;
  }
  // Usercentrics (shadow DOM)
  const ucRoot = document.querySelector('#usercentrics-root');
  if (ucRoot && ucRoot.shadowRoot) {
    const btn = acceptCookies
      ? ucRoot.shadowRoot.querySelector('[data-testid="uc-accept-all-button"]')
      : ucRoot.shadowRoot.querySelector('[data-testid="uc-deny-all-button"]');
    if (btn) { btn.click(); clicked.push('Usercentrics'); return clicked; }
  }
  // TrustArc
  if (document.querySelector('#truste-consent-track') || document.querySelector('.trustarc-banner')) {
    const s = acceptCookies ? '#truste-consent-button, .trustarc-agree-btn' : '.trustarc-decline-btn';
    if (tryClick(s, 'TrustArc')) return clicked;
  }
  // Klaro
  if (document.querySelector('.klaro')) {
    const s = acceptCookies ? '.klaro .cm-btn-accept-all, .klaro .cm-btn-success' : '.klaro .cm-btn-decline';
    if (tryClick(s, 'Klaro')) return clicked;
  }
  // BBC
  if (document.querySelector('#bbccookies, .bbccookies-banner')) {
    if (acceptCookies && tryClick('#bbccookies-continue-button', 'BBC')) return clicked;
  }
  // Amazon
  if (document.querySelector('#sp-cc') || document.querySelector('#sp-cc-accept')) {
    const s = acceptCookies ? '#sp-cc-accept' : '#sp-cc-rejectall-link, #sp-cc-decline';
    if (tryClick(s, 'Amazon')) return clicked;
  }
  // CookieYes
  if (document.querySelector('#cookie-law-info-bar') || document.querySelector('.cky-consent-container')) {
    const s = acceptCookies ? '#cookie_action_close_header, .cky-btn-accept' : '.cky-btn-reject';
    if (tryClick(s, 'CookieYes')) return clicked;
  }
  // Generic containers
  const consentContainers = [
    '[class*="cookie-banner"]', '[class*="cookie-consent"]', '[class*="cookie-notice"]',
    '[class*="cookieBanner"]', '[class*="cookieConsent"]', '[class*="cookieNotice"]',
    '[id*="cookie-banner"]', '[id*="cookie-consent"]', '[id*="cookie-notice"]',
    '[class*="consent-banner"]', '[class*="consent-modal"]', '[class*="consent-dialog"]',
    '[class*="gdpr"]', '[id*="gdpr"]', '[class*="privacy-banner"]', '[class*="privacy-notice"]',
    '[role="dialog"][aria-label*="cookie" i]', '[role="dialog"][aria-label*="consent" i]',
  ];
  for (const sel of consentContainers) {
    const containers = document.querySelectorAll(sel);
    for (const container of containers) {
      if (!isVisible(container)) continue;
      if (container.tagName === 'HTML' || container.tagName === 'BODY') continue;
      const btn = findButtonByText(patterns, container);
      if (btn) { btn.click(); clicked.push('Generic (' + sel + ')'); return clicked; }
    }
  }
  // Last resort: containers mentioning "cookie"
  const allContainers = document.querySelectorAll('div, section, aside, [class*="modal"], [class*="dialog"], [role="dialog"]');
  for (const container of allContainers) {
    if (!isVisible(container)) continue;
    const text = container.textContent?.toLowerCase() || '';
    if (text.includes('cookie') && text.length > 100 && text.length < 3000) {
      const btn = findButtonByText(patterns, container);
      if (btn && isVisible(btn)) { btn.click(); clicked.push('Generic (text-based)'); return clicked; }
    }
  }
  // Final fallback: exact text match
  if (document.body.textContent?.toLowerCase().includes('cookie')) {
    const exactPatterns = acceptCookies
      ? ['accept all', 'accept cookies', 'allow all', 'i agree', 'alle akzeptieren']
      : ['reject all', 'decline all', 'reject optional', 'alle ablehnen'];
    const singleWordPatterns = acceptCookies ? ['accept', 'agree'] : ['reject', 'decline'];
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const btn of buttons) {
      if (!isVisible(btn)) continue;
      const text = (btn.textContent || '').trim().toLowerCase();
      if (exactPatterns.some(p => text.includes(p))) { btn.click(); clicked.push('Generic (exact match)'); return clicked; }
    }
    for (const btn of buttons) {
      if (!isVisible(btn)) continue;
      const text = (btn.textContent || '').trim().toLowerCase();
      if (singleWordPatterns.some(p => text === p)) { btn.click(); clicked.push('Generic (single word)'); return clicked; }
    }
  }
  return clicked;
}`;

const IFRAME_DISMISS_SCRIPT = `(acceptCookies) => {
  const clicked = [];
  const isVisible = (el) => {
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' &&
           (el.offsetParent !== null || style.position === 'fixed' || style.position === 'sticky');
  };
  const rejectIndicators = ['do not', "don't", 'nicht', 'no ', 'refuse', 'reject', 'decline', 'deny', 'disagree', 'ablehnen', 'refuser', 'rifiuta', 'rechazar', 'manage', 'settings', 'options', 'customize'];
  const acceptIndicators = ['accept', 'agree', 'allow', 'yes', 'ok', 'got it', 'continue', 'akzeptieren', 'zustimmen', 'accepter', 'accetta', 'aceptar'];
  const isRejectButton = (text) => rejectIndicators.some(p => text.includes(p));
  const isAcceptButton = (text) => acceptIndicators.some(p => text.includes(p)) && !isRejectButton(text);
  const buttons = document.querySelectorAll('button, [role="button"]');
  for (const btn of buttons) {
    const text = (btn.textContent || '').trim().toLowerCase();
    if (!isVisible(btn)) continue;
    if (acceptCookies ? isAcceptButton(text) : isRejectButton(text)) { btn.click(); clicked.push('iframe: ' + text.slice(0, 30)); return clicked; }
  }
  const spBtn = acceptCookies
    ? document.querySelector('[title="Accept All"], [title="Accept"], [aria-label*="Accept"]')
    : document.querySelector('[title="Reject All"], [title="Reject"], [aria-label*="Reject"]');
  if (spBtn) { spBtn.click(); clicked.push('Sourcepoint iframe'); return clicked; }
  return clicked;
}`;

function collectFrames(frameTree, frames = []) {
  frames.push({ id: frameTree.frame.id, url: frameTree.frame.url });
  if (frameTree.childFrames) {
    for (const child of frameTree.childFrames) collectFrames(child, frames);
  }
  return frames;
}

async function cookiesStr(cdp, sid, reject = false) {
  const acceptCookies = !reject;

  await cdp.send('Page.enable', {}, sid);
  await cdp.send('Runtime.enable', {}, sid);
  await sleep(500);

  // Try main page
  const mainResult = await cdp.send('Runtime.evaluate', {
    expression: `(${COOKIE_DISMISS_SCRIPT})(${acceptCookies})`,
    returnByValue: true, awaitPromise: true,
  }, sid);

  let result = mainResult.result?.value || [];

  // If nothing found, try consent-related iframes
  if (result.length === 0) {
    try {
      const { frameTree } = await cdp.send('Page.getFrameTree', {}, sid);
      const frames = collectFrames(frameTree);
      for (const frame of frames) {
        if (frame.url === 'about:blank' || frame.url.startsWith('javascript:')) continue;
        if (/sp_message|consent|privacy|cmp|sourcepoint|cookie|privacy-mgmt/i.test(frame.url)) {
          try {
            const { executionContextId } = await cdp.send('Page.createIsolatedWorld', {
              frameId: frame.id, worldName: 'cdp-cookies',
            }, sid);
            const frameResult = await cdp.send('Runtime.evaluate', {
              expression: `(${IFRAME_DISMISS_SCRIPT})(${acceptCookies})`,
              contextId: executionContextId,
              returnByValue: true, awaitPromise: true,
            }, sid);
            if (frameResult.result?.value?.length > 0) { result = frameResult.result.value; break; }
          } catch {}
        }
      }
    } catch {}
  }

  const mode = reject ? 'reject' : 'accept';
  return result.length > 0
    ? `Dismissed cookie dialog (${mode}): ${result.join(', ')}`
    : `No cookie dialog found to ${mode}`;
}

// ---------------------------------------------------------------------------
// Per-tab daemon
// ---------------------------------------------------------------------------

async function runDaemon(targetId) {
  const sp = sockPath(targetId);

  const cdp = new CDP();
  try {
    await cdp.connect(await getWsUrl());
  } catch (e) {
    process.stderr.write(`Daemon: cannot connect to Chrome: ${e.message}\n`);
    process.exit(1);
  }

  let sessionId;
  try {
    const res = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    sessionId = res.sessionId;
  } catch (e) {
    process.stderr.write(`Daemon: attach failed: ${e.message}\n`);
    cdp.close();
    process.exit(1);
  }

  let alive = true;
  function shutdown() {
    if (!alive) return;
    alive = false;
    server.close();
    try { unlinkSync(sp); } catch {}
    cdp.close();
    process.exit(0);
  }

  cdp.onEvent('Target.targetDestroyed', (params) => {
    if (params.targetId === targetId) shutdown();
  });
  cdp.onEvent('Target.detachedFromTarget', (params) => {
    if (params.sessionId === sessionId) shutdown();
  });
  cdp.onClose(() => shutdown());
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  let idleTimer = setTimeout(shutdown, IDLE_TIMEOUT);
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(shutdown, IDLE_TIMEOUT);
  }

  async function handleCommand({ cmd, args }) {
    resetIdle();
    try {
      let result;
      switch (cmd) {
        case 'list': result = formatPageList(await getPages(cdp)); break;
        case 'list_raw': result = JSON.stringify(await getPages(cdp)); break;
        case 'snap': case 'snapshot': result = await snapshotStr(cdp, sessionId); break;
        case 'eval': result = await evalStr(cdp, sessionId, args[0]); break;
        case 'shot': case 'screenshot': result = await shotStr(cdp, sessionId, args[0]); break;
        case 'html': result = await htmlStr(cdp, sessionId, args[0]); break;
        case 'nav': case 'navigate': result = await navStr(cdp, sessionId, args[0]); break;
        case 'net': case 'network': result = await netStr(cdp, sessionId); break;
        case 'click': result = await clickStr(cdp, sessionId, args[0]); break;
        case 'clickxy': result = await clickXyStr(cdp, sessionId, args[0], args[1]); break;
        case 'type': result = await typeStr(cdp, sessionId, args[0]); break;
        case 'loadall': result = await loadAllStr(cdp, sessionId, args[0], args[1] ? parseInt(args[1]) : 1500); break;
        case 'evalraw': result = await evalRawStr(cdp, sessionId, args[0], args[1]); break;
        case 'cookies': result = await cookiesStr(cdp, sessionId, args.includes('--reject')); break;
        case 'stop': return { ok: true, result: '', stopAfter: true };
        default: return { ok: false, error: `Unknown command: ${cmd}` };
      }
      return { ok: true, result: result ?? '' };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  const server = net.createServer((conn) => {
    let buf = '';
    conn.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        let req;
        try { req = JSON.parse(line); }
        catch { conn.write(JSON.stringify({ ok: false, error: 'Invalid JSON', id: null }) + '\n'); continue; }
        handleCommand(req).then((res) => {
          const payload = JSON.stringify({ ...res, id: req.id }) + '\n';
          if (res.stopAfter) conn.end(payload, shutdown);
          else conn.write(payload);
        });
      }
    });
  });

  try { unlinkSync(sp); } catch {}
  server.listen(sp, () => { try { chmodSync(sp, 0o600); } catch {} });
}

// ---------------------------------------------------------------------------
// CLI <-> daemon communication
// ---------------------------------------------------------------------------

function connectToSocket(sp) {
  return new Promise((resolve, reject) => {
    const conn = net.connect(sp);
    conn.on('connect', () => resolve(conn));
    conn.on('error', reject);
  });
}

async function getOrStartTabDaemon(targetId) {
  const sp = sockPath(targetId);
  try { return await connectToSocket(sp); } catch {}
  try { unlinkSync(sp); } catch {}

  const child = spawn(process.execPath, [process.argv[1], '_daemon', targetId], {
    detached: true, stdio: 'ignore',
  });
  child.unref();

  for (let i = 0; i < DAEMON_CONNECT_RETRIES; i++) {
    await sleep(DAEMON_CONNECT_DELAY);
    try { return await connectToSocket(sp); } catch {}
  }
  throw new Error('Daemon failed to start — did you click Allow in Chrome?');
}

function sendCommand(conn, req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    let settled = false;
    const cleanup = () => { conn.off('data', onData); conn.off('error', onError); conn.off('end', onEnd); conn.off('close', onClose); };
    const onData = (chunk) => {
      buf += chunk.toString();
      const idx = buf.indexOf('\n');
      if (idx === -1) return;
      settled = true; cleanup();
      resolve(JSON.parse(buf.slice(0, idx)));
      conn.end();
    };
    const onError = (e) => { if (settled) return; settled = true; cleanup(); reject(e); };
    const onEnd = () => { if (settled) return; settled = true; cleanup(); reject(new Error('Connection closed before response')); };
    const onClose = () => { if (settled) return; settled = true; cleanup(); reject(new Error('Connection closed before response')); };
    conn.on('data', onData); conn.on('error', onError); conn.on('end', onEnd); conn.on('close', onClose);
    req.id = 1;
    conn.write(JSON.stringify(req) + '\n');
  });
}

function findAnyDaemonSocket() {
  return listDaemonSockets()[0]?.socketPath || null;
}

// ---------------------------------------------------------------------------
// Stop daemons
// ---------------------------------------------------------------------------

async function stopDaemons(targetPrefix) {
  const daemons = listDaemonSockets();
  if (targetPrefix) {
    const targetId = resolvePrefix(targetPrefix, daemons.map(d => d.targetId), 'daemon');
    const daemon = daemons.find(d => d.targetId === targetId);
    try { const conn = await connectToSocket(daemon.socketPath); await sendCommand(conn, { cmd: 'stop' }); }
    catch { try { unlinkSync(daemon.socketPath); } catch {} }
    return;
  }
  for (const daemon of daemons) {
    try { const conn = await connectToSocket(daemon.socketPath); await sendCommand(conn, { cmd: 'stop' }); }
    catch { try { unlinkSync(daemon.socketPath); } catch {} }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const USAGE = `cdp - Chrome DevTools Protocol CLI

Connects to your existing Chrome browser. No separate instance needed.
Enable remote debugging: chrome://inspect/#remote-debugging

Usage: cdp.mjs <command> [args]

  list                              List open pages (target prefixes for other commands)
  snap  <target>                    Accessibility tree snapshot (semantic page structure)
  eval  <target> <expr>             Evaluate JS expression
  shot  <target> [file]             Screenshot viewport (default: /tmp/screenshot.png)
  html  <target> [selector]         Get HTML (full page or CSS selector)
  nav   <target> <url>              Navigate to URL
  net   <target>                    Network performance entries
  click   <target> <selector>       Click element by CSS selector
  clickxy <target> <x> <y>          Click at CSS pixel coordinates
  type    <target> <text>           Type text at focused element (works cross-origin)
  loadall <target> <selector> [ms]  Click "load more" until gone (default 1500ms interval)
  evalraw <target> <method> [json]  Raw CDP command passthrough
  cookies <target> [--reject]       Dismiss cookie consent dialogs
  stop  [target]                    Stop daemon(s)

<target> is a unique prefix from "list". Use more characters if ambiguous.

COORDINATES: shot saves at native resolution (CSS px * DPR).
  CDP events (clickxy) use CSS pixels: CSS px = screenshot px / DPR.
  shot prints the DPR for coordinate conversion.

DAEMON: Each tab gets a persistent daemon at /tmp/cdp-<targetId>.sock.
  Chrome's "Allow debugging" modal fires once per tab. Daemons auto-exit
  after 20 minutes of inactivity.
`;

const NEEDS_TARGET = new Set([
  'snap', 'snapshot', 'eval', 'shot', 'screenshot', 'html', 'nav', 'navigate',
  'net', 'network', 'click', 'clickxy', 'type', 'loadall', 'evalraw', 'cookies',
]);

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (cmd === '_daemon') { await runDaemon(args[0]); return; }

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(USAGE); process.exit(0);
  }

  // List
  if (cmd === 'list' || cmd === 'ls') {
    let pages;
    const existingSock = findAnyDaemonSocket();
    if (existingSock) {
      try {
        const conn = await connectToSocket(existingSock);
        const resp = await sendCommand(conn, { cmd: 'list_raw' });
        if (resp.ok) pages = JSON.parse(resp.result);
      } catch {}
    }
    if (!pages) {
      const cdp = new CDP();
      await cdp.connect(await getWsUrl());
      pages = await getPages(cdp);
      cdp.close();
    }
    writeFileSync(PAGES_CACHE, JSON.stringify(pages));
    try { chmodSync(PAGES_CACHE, 0o600); } catch {}
    console.log(formatPageList(pages));
    setTimeout(() => process.exit(0), 100);
    return;
  }

  // Stop
  if (cmd === 'stop') { await stopDaemons(args[0]); return; }

  // Commands that need a target
  if (!NEEDS_TARGET.has(cmd)) {
    console.error(`Unknown command: ${cmd}\n`);
    console.log(USAGE);
    process.exit(1);
  }

  const targetPrefix = args[0];
  if (!targetPrefix) {
    console.error('Error: target ID required. Run "cdp.mjs list" first.');
    process.exit(1);
  }

  // Resolve prefix
  let targetId;
  const daemonTargetIds = listDaemonSockets().map(d => d.targetId);
  const daemonMatches = daemonTargetIds.filter(id => id.toUpperCase().startsWith(targetPrefix.toUpperCase()));

  if (daemonMatches.length > 0) {
    targetId = resolvePrefix(targetPrefix, daemonTargetIds, 'daemon');
  } else {
    if (!existsSync(PAGES_CACHE)) {
      console.error('No page list cached. Run "cdp.mjs list" first.');
      process.exit(1);
    }
    const pages = JSON.parse(readFileSync(PAGES_CACHE, 'utf8'));
    targetId = resolvePrefix(targetPrefix, pages.map(p => p.targetId), 'target', 'Run "cdp.mjs list".');
  }

  const conn = await getOrStartTabDaemon(targetId);
  const cmdArgs = args.slice(1);

  if (cmd === 'eval') {
    const expr = cmdArgs.join(' ');
    if (!expr) { console.error('Error: expression required'); process.exit(1); }
    cmdArgs[0] = expr;
  } else if (cmd === 'type') {
    const text = cmdArgs.join(' ');
    if (!text) { console.error('Error: text required'); process.exit(1); }
    cmdArgs[0] = text;
  } else if (cmd === 'evalraw') {
    if (!cmdArgs[0]) { console.error('Error: CDP method required'); process.exit(1); }
    if (cmdArgs.length > 2) cmdArgs[1] = cmdArgs.slice(1).join(' ');
  }

  if ((cmd === 'nav' || cmd === 'navigate') && !cmdArgs[0]) {
    console.error('Error: URL required');
    process.exit(1);
  }

  const response = await sendCommand(conn, { cmd, args: cmdArgs });

  if (response.ok) {
    if (response.result) console.log(response.result);
  } else {
    console.error('Error:', response.error);
    process.exitCode = 1;
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
