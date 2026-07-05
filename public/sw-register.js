// Service-worker registration. Externalized from an inline <script> in layout.tsx so the app
// ships ZERO inline scripts of its own — a prerequisite for a strict Content-Security-Policy
// (script-src 'self', no 'unsafe-inline'). See next.config.ts headers + docs/security.md.
(function () {
  var isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (isLocalDev && 'serviceWorker' in navigator) {
    // In local dev, self-heal from any stale SW state. Unregistering alone is not
    // enough: a SW that is currently CONTROLLING this page keeps intercepting its
    // requests (serving dead cached chunks after a dev-server restart — Safari then
    // never hydrates and sits on the splash forever). So: unregister every SW,
    // delete every cache, and if a SW was controlling us, reload once (guarded by
    // sessionStorage so a persistently-controlling SW can't cause a reload loop).
    // Every step is timeout-raced: Safari's storage APIs can HANG (fire neither
    // success nor error) when the origin's storage is wedged — a hung promise must
    // not block the escape reload.
    var withTimeout = function (p, ms) {
      return Promise.race([p, new Promise(function (res) { setTimeout(res, ms); })]);
    };
    var wasControlled = !!navigator.serviceWorker.controller;

    var killSWs = withTimeout(
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }),
      2500
    ).catch(function () {});

    var killCaches = ('caches' in window)
      ? withTimeout(
          caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          }),
          2500
        ).catch(function () {})
      : Promise.resolve();

    Promise.all([killSWs, killCaches]).then(function () {
      if (!wasControlled) return;
      var FLAG = 'milo_sw_selfheal_reloaded';
      try {
        if (sessionStorage.getItem(FLAG)) return;
        sessionStorage.setItem(FLAG, '1');
      } catch (e) { return; } // no sessionStorage → skip the reload rather than risk a loop
      console.warn('[Milo SW] Stale service worker was controlling this page — cleared it, reloading once.');
      location.reload();
    });
  }

  if (!isLocalDev && 'serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js')
        .then(function (reg) {
          console.log('[Milo SW] Registered:', reg.scope);

          // After page loads, tell SW to cache all loaded JS chunks
          // This ensures offline works after one online session
          window.setTimeout(function () {
            var scripts = Array.from(document.querySelectorAll('script[src]'))
              .map(function (s) { return s.src; })
              .filter(function (s) { return s.includes('/_next/static/'); });
            var links = Array.from(document.querySelectorAll('link[rel=stylesheet][href]'))
              .map(function (l) { return l.href; })
              .filter(function (h) { return h.includes('/_next/static/'); });
            var urls = scripts.concat(links);
            if (urls.length > 0 && reg.active) {
              reg.active.postMessage({ type: 'CACHE_URLS', urls: urls });
              console.log('[Milo SW] Requested caching of', urls.length, 'chunks');
            }
          }, 2000);
        })
        .catch(function (err) { console.warn('[Milo SW] Failed:', err); });
    });
  }
})();
