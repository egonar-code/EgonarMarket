(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    const selector = document.querySelector('[data-language-selector]');
    if (!selector) return;
    selector.addEventListener('change', function () {
      window.location.reload();
    });
  });
})();
