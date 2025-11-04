type Level = 'debug' | 'info' | 'warn' | 'error';

// Detect environments safely (process may be undefined in browser/RSC client side)
const hasProcess = typeof process !== 'undefined' && typeof process.env !== 'undefined';
const isNodeDev = hasProcess && (process.env.NODE_ENV === 'development' || process.env.WINDASH_DEBUG === '1');
// Vite provides import.meta.env.DEV; allow local override via localStorage WINDASH_DEBUG
const isBrowser = typeof window !== 'undefined';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viteDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
let browserDebug = false;
if (isBrowser) {
  try { browserDebug = !!window.localStorage.getItem('WINDASH_DEBUG'); } catch { /* ignore */ }
}

const ENABLE_DEBUG = isNodeDev || (viteDev && browserDebug);

function fmt(level: Level, category: string, msg: string, extra?: Record<string, any>) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] [${category}] ${msg}`;
  if (!extra || Object.keys(extra).length === 0) return base;
  try {
    return `${base} ${JSON.stringify(extra)}`;
  } catch {
    return base;
  }
}

export function logDebug(category: string, msg: string, extra?: Record<string, any>) {
  if (!ENABLE_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(fmt('debug', category, msg, extra));
}
export function logInfo(category: string, msg: string, extra?: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.log(fmt('info', category, msg, extra));
}
export function logWarn(category: string, msg: string, extra?: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.warn(fmt('warn', category, msg, extra));
}
export function logError(category: string, msg: string, extra?: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.error(fmt('error', category, msg, extra));
}
