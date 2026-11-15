import type { Page, TestInfo } from '@playwright/test';

const READ_LIMIT_MS = 3000;
type Evidence = { status: 'available'; snapshot: unknown } | { status: 'unavailable'; reason: string };

function safeURL(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin + url.pathname;
    return url.href === 'about:blank' ? 'about:blank' : url.protocol;
  } catch { return 'unavailable'; }
}

/** Final observation only: never runs in the gesture or changes the test failure. */
export async function attachFailureEvidence(page: Page, info: TestInfo): Promise<void> {
  if (info.status === info.expectedStatus) return;
  let url = 'unavailable';
  try { url = safeURL(page.url()); } catch { /* The context may already be gone. */ }
  let evidence: Evidence = { status: 'unavailable', reason: 'page-closed' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!page.isClosed()) {
      const observation: Promise<Evidence> = page.evaluate(() => {
        const shape = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) return { selector, present: false };
          const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
          const hiddenAncestor = !!element.closest('[hidden], .hidden');
          const inertAncestor = !!element.closest('[inert]');
          return {
            selector, present: true,
            ownBoxVisible: !!element.getClientRects().length && rect.width > 0 && rect.height > 0 &&
              style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0 && !hiddenAncestor,
            hidden: element.hidden, inert: element.inert, hiddenAncestor, inertAncestor,
            ariaHidden: element.getAttribute('aria-hidden'),
            rect: { x: rect.x, y: rect.y, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
            scroll: { top: element.scrollTop, left: element.scrollLeft, height: element.scrollHeight, width: element.scrollWidth,
              clientHeight: element.clientHeight, clientWidth: element.clientWidth },
            style: { display: style.display, visibility: style.visibility, opacity: style.opacity, overflowX: style.overflowX,
              overflowY: style.overflowY, position: style.position, transform: style.transform,
              transitionProperty: style.transitionProperty, transitionDuration: style.transitionDuration }
          };
        };
        const active = document.activeElement;
        const viewport = window.visualViewport;
        return {
          readyState: document.readyState,
          url: location.protocol === 'http:' || location.protocol === 'https:' ? location.origin + location.pathname : location.protocol,
          visibility: { state: document.visibilityState, hidden: document.hidden },
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
          viewport: { width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio,
            visual: viewport && { width: viewport.width, height: viewport.height, offsetTop: viewport.offsetTop,
              offsetLeft: viewport.offsetLeft, pageTop: viewport.pageTop, pageLeft: viewport.pageLeft, scale: viewport.scale } },
          scroll: { x: scrollX, y: scrollY, scrollingElement: document.scrollingElement?.tagName || null },
          activeElement: active ? { tag: active.tagName, id: active.id } : null,
          fonts: { status: document.fonts.status },
          regions: ['html', 'body', '#authStartup', '#landingScreen', '#portalMain', '#welcomeScreen', '#mainApp',
            '#studyModePage', '#studyQuestionArea', '#studyFeedback', '#acidBaseOverlay', '#acidBaseOverlay .ab-card',
            '#acidBaseOverlay .ab-clinical', '#acidBaseOverlay .ab-reading', '#abFeedback', '#abGrimoirePanel', '#nqEntryCinema',
            '.nqnarr-card[data-nq-chapter]', '.nqnarr-card[data-nq-chapter] .nqnarr-reading']
            .map(shape)
        };
      }).then((snapshot): Evidence => ({ status: 'available', snapshot }), (): Evidence => ({ status: 'unavailable', reason: 'evaluation-failed' }));
      evidence = await Promise.race([observation, new Promise<Evidence>(resolve => {
        timer = setTimeout(() => resolve({ status: 'unavailable', reason: 'evaluation-timeout' }), READ_LIMIT_MS);
      })]);
    }
  } catch { evidence = { status: 'unavailable', reason: 'diagnostic-failed' }; }
  finally { if (timer) clearTimeout(timer); }

  try {
    await info.attach('failure-evidence', {
      contentType: 'application/json',
      body: JSON.stringify({ schema: 1, readLimitMs: READ_LIMIT_MS, url, urlSearchAndHashOmitted: true, ...evidence })
    });
  } catch {
    // A teardown/attachment failure must not replace the already recorded error.
  }
}
