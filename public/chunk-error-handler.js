// Chunk load error handler
(function() {
  const originalError = window.Error;
  
  window.addEventListener('error', function(event) {
    if (event.error && event.error.name === 'ChunkLoadError') {
      console.warn('ChunkLoadError detected, attempting recovery...');
      
      // Clear module cache
      if (window.__webpack_require__ && window.__webpack_require__.cache) {
        for (const key in window.__webpack_require__.cache) {
          delete window.__webpack_require__.cache[key];
        }
      }
      
      // Attempt to reload the page once
      const hasReloaded = sessionStorage.getItem('chunk-error-reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-error-reloaded', 'true');
        setTimeout(() => {
          sessionStorage.removeItem('chunk-error-reloaded');
        }, 5000);
        window.location.reload();
      }
    }
  });
})();