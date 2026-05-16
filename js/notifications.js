// NefroQuest — Push Notification Subscription (Web Push / VAPID)
// Plain script — shares global scope with game.js

// VAPID public key — must match VAPID_PUBLIC_KEY env var on the edge function.
// Set window._VAPID_PUBLIC_KEY in index.html before this script loads, e.g.:
//   <script>window._VAPID_PUBLIC_KEY = 'BExampleKeyHere...';</script>
// Generate a key pair with: npx web-push generate-vapid-keys --non-interactive
const PUSH_VAPID_PUBLIC_KEY = window._VAPID_PUBLIC_KEY ?? '';

const PUSH_SUB_KEY     = 'nq-push-subscribed';
const SUPA_PUSH_TABLE  = 'push_subscriptions';

function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function _getSupaClientForPush() {
  // _supaClient is defined in auth.js (shared global scope)
  return typeof _supaClient !== 'undefined' ? _supaClient : null;
}

/** True if browser supports push and SW is registered */
function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Current push permission state: 'default' | 'granted' | 'denied' */
function pushPermission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

/**
 * Subscribe this device to push notifications.
 * Returns true on success, false on denial/error.
 */
async function subscribePush() {
  if (!pushSupported()) return false;
  if (!PUSH_VAPID_PUBLIC_KEY) {
    console.warn('[push] VAPID public key not configured — set window._VAPID_PUBLIC_KEY before loading notifications.js');
    return false;
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(PUSH_VAPID_PUBLIC_KEY),
      });
    }

    const supa = await _getSupaClientForPush();
    if (supa) {
      const key   = sub.getKey('p256dh');
      const token = sub.getKey('auth');
      await supa.from(SUPA_PUSH_TABLE).upsert({
        user_id:   (typeof authUser !== 'undefined' ? authUser?.id : null) ?? null,
        endpoint:  sub.endpoint,
        p256dh:    btoa(Array.from(new Uint8Array(key),   b => String.fromCharCode(b)).join('')),
        auth_key:  btoa(Array.from(new Uint8Array(token), b => String.fromCharCode(b)).join('')),
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });
    }

    localStorage.setItem(PUSH_SUB_KEY, '1');
    return true;
  } catch (e) {
    console.error('[push] subscribe error', e);
    return false;
  }
}

/**
 * Unsubscribe this device from push notifications.
 */
async function unsubscribePush() {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const supa = await _getSupaClientForPush();
    if (supa) {
      await supa.from(SUPA_PUSH_TABLE).delete().eq('endpoint', sub.endpoint);
    }
    await sub.unsubscribe();
    localStorage.removeItem(PUSH_SUB_KEY);
  } catch (e) {
    console.error('[push] unsubscribe error', e);
  }
}

/**
 * Called on page load: if user previously subscribed, refresh the subscription
 * record in Supabase (endpoint may change after SW update) and update last_seen_at.
 */
async function _initPushOnLoad() {
  if (!pushSupported()) return;
  if (localStorage.getItem(PUSH_SUB_KEY) !== '1') return;
  if (pushPermission() !== 'granted') { localStorage.removeItem(PUSH_SUB_KEY); return; }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) { localStorage.removeItem(PUSH_SUB_KEY); return; }

    const supa = await _getSupaClientForPush();
    if (!supa) return;
    const key   = sub.getKey('p256dh');
    const token = sub.getKey('auth');
    await supa.from(SUPA_PUSH_TABLE).upsert({
      user_id:   (typeof authUser !== 'undefined' ? authUser?.id : null) ?? null,
      endpoint:  sub.endpoint,
      p256dh:    btoa(String.fromCharCode(...new Uint8Array(key))),
      auth_key:  btoa(String.fromCharCode(...new Uint8Array(token))),
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Toggle push subscription (for use in settings UI).
 * Returns the new subscribed state (true = subscribed).
 */
async function togglePushSubscription() {
  if (localStorage.getItem(PUSH_SUB_KEY) === '1') {
    await unsubscribePush();
    return false;
  } else {
    return subscribePush();
  }
}

window.subscribePush         = subscribePush;
window.unsubscribePush       = unsubscribePush;
window.togglePushSubscription = togglePushSubscription;
window.pushSupported         = pushSupported;
window.pushPermission        = pushPermission;

// Auto-refresh subscription record when page loads (after auth.js has run)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(_initPushOnLoad, 2000));
} else {
  setTimeout(_initPushOnLoad, 2000);
}
