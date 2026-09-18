(function () {
  'use strict';
  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches('[data-language-selector]')) {
      localStorage.setItem('egonar_language', event.target.value === 'en' ? 'en' : 'fr');
      window.location.reload();
    }
  }, true);
})();
