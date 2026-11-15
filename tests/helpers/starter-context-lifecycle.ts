import type { CDPSession, Page, TestInfo } from '@playwright/test';

const EVENT_LIMIT = 100;
const SETUP_LIMIT_MS = 3000;
const CLEANUP_LIMIT_MS = 1000;
type Metadata = Record<string, string | number | boolean | null>;
type Capture = {
  started: number; status: 'starting' | 'available' | 'unavailable'; reason?: string;
  events: Metadata[]; discarded: number; stopped: boolean; session?: CDPSession;
  listeners: Array<[string, (data: any) => void]>;
  cleanupResult?: string;
};
const captures = new WeakMap<Page, Capture>();

function safeURL(raw: unknown): string {
  try {
    const url = new URL(String(raw));
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin + url.pathname;
    return url.href === 'about:blank' ? 'about:blank' : url.protocol;
  } catch { return 'unavailable'; }
}

async function bounded(work: Promise<unknown>, ms: number): Promise<'done' | 'failed' | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work.then(() => 'done' as const, () => 'failed' as const),
      new Promise<'timeout'>(resolve => { timer = setTimeout(() => resolve('timeout'), ms); })
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

async function cleanup(capture: Capture): Promise<string> {
  capture.stopped = true;
  if (capture.cleanupResult) return capture.cleanupResult;
  const session = capture.session;
  if (!session) return 'no-session';
  for (const [name, listener] of capture.listeners) session.removeListener(name, listener);
  capture.listeners = [];
  capture.cleanupResult = await bounded(Promise.resolve().then(() => session.detach()), CLEANUP_LIMIT_MS);
  return capture.cleanupResult;
}

/** Passive Chromium metadata only; installed before the first navigation, never in the game gesture. */
export async function startStarterContextLifecycle(page: Page): Promise<void> {
  const capture: Capture = { started: performance.now(), status: 'starting', events: [],
    discarded: 0, stopped: false, listeners: [] };
  captures.set(page, capture);
  const append = (event: string, metadata: Metadata) => {
    if (capture.stopped) return;
    if (capture.events.length === EVENT_LIMIT) { capture.events.shift(); capture.discarded++; }
    capture.events.push({ event, timeMs: Math.round((performance.now() - capture.started) * 1000) / 1000, ...metadata });
  };
  const setup = async () => {
    const session = await page.context().newCDPSession(page);
    if (capture.stopped) { await bounded(session.detach(), CLEANUP_LIMIT_MS); return; }
    capture.session = session;
    const listen = (name: string, project: (data: any) => Metadata) => {
      const listener = (data: any) => append(name, project(data));
      capture.listeners.push([name, listener]);
      session.on(name as any, listener);
    };
    listen('Runtime.executionContextCreated', data => ({
      id: data.context.id, isDefault: data.context.auxData?.isDefault === true,
      frameId: data.context.auxData?.frameId || null
    }));
    listen('Runtime.executionContextDestroyed', data => ({ id: data.executionContextId }));
    listen('Runtime.executionContextsCleared', () => ({}));
    listen('Page.frameNavigated', data => ({ frameId: data.frame.id,
      parentId: data.frame.parentId || null, loaderId: data.frame.loaderId || null, url: safeURL(data.frame.url) }));
    listen('Page.navigatedWithinDocument', data => ({ frameId: data.frameId, url: safeURL(data.url) }));
    listen('Page.frameDetached', data => ({ frameId: data.frameId }));
    const lifecycleNames = new Set(['init', 'DOMContentLoaded', 'load', 'networkAlmostIdle', 'networkIdle',
      'firstMeaningfulPaintCandidate', 'firstContentfulPaint', 'firstPaint']);
    listen('Page.lifecycleEvent', data => ({ frameId: data.frameId, loaderId: data.loaderId,
      name: lifecycleNames.has(data.name) ? data.name : 'other' }));
    await session.send('Page.enable');
    if (capture.stopped) return;
    await session.send('Page.setLifecycleEventsEnabled', { enabled: true });
    if (capture.stopped) return;
    await session.send('Runtime.enable');
    if (!capture.stopped) capture.status = 'available';
  };
  try {
    const result = await bounded(setup(), SETUP_LIMIT_MS);
    if (result !== 'done') {
      capture.status = 'unavailable';
      capture.reason = result === 'timeout' ? 'setup-timeout' : 'setup-failed';
      await cleanup(capture);
    }
  } catch {
    capture.status = 'unavailable'; capture.reason = 'setup-failed';
    try { await cleanup(capture); } catch { /* Preserve the test's own outcome. */ }
  }
}

/** Attach only after an unexpected result; always retire this page's CDP listeners/session. */
export async function finishStarterContextLifecycle(page: Page, info: TestInfo): Promise<void> {
  const capture = captures.get(page);
  captures.delete(page);
  let cleanupResult = 'no-capture';
  try { if (capture) cleanupResult = await cleanup(capture); }
  catch { cleanupResult = 'failed'; }
  if (info.status === info.expectedStatus) return;
  try {
    await info.attach('starter-context-lifecycle', { contentType: 'application/json', body: JSON.stringify({
      schema: 1, eventLimit: EVENT_LIMIT, setupLimitMs: SETUP_LIMIT_MS, cleanupLimitMs: CLEANUP_LIMIT_MS,
      status: capture?.status === 'available' ? 'available' : 'unavailable',
      reason: capture?.reason || (capture ? undefined : 'missing-capture'),
      discarded: capture?.discarded || 0, events: capture?.events || [], cleanup: cleanupResult,
      urlSearchAndHashOmitted: true, originalPlaywrightProtocolErrorCaptured: false,
      limits: 'A separate public CDP session observes lifecycle metadata, not Playwright internal command responses. Enabling domains may affect timing.'
    }) });
  } catch { /* Diagnostic attachment must not replace the already recorded error. */ }
}
