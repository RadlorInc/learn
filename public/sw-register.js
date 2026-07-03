// Service-worker registration. Externalized from an inline <script> in layout.tsx so the app
// ships ZERO inline scripts of its own — a prerequisite for a strict Content-Security-Policy
// (script-src 'self', no 'unsafe-inline'). See next.config.ts headers + docs/security.md.
(function () {
  var isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (isLocalDev && 'serviceWorker' in navigator) {
    // In local dev, make sure no stale SW is intercepting requests
    // (it caches prod chunks and returns 503s once the dev server restarts).
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
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
