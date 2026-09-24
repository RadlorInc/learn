// The text size chosen on this device (src/infra/storage/textSize.ts). A static file, not an inline script (the app
// ships none — see sw-register.js), loaded in <head> without defer so the page never paints at the wrong size first.
(function () {
  try {
    var s = localStorage.getItem('al-text-size');
    if (s === 'large' || s === 'xl') document.documentElement.setAttribute('data-text', s);
  } catch (e) { /* storage blocked: Normal */ }
})();
