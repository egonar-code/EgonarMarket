(function () {
  'use strict';
  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches('[data-language-selector]')) {
      window.location.reload();
    }
  }, true);
})();
