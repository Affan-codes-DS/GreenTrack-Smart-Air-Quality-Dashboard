// Cache Clear Script - Force refresh to latest version
// Run this immediately on page load to clear old caches

(async function clearOldCaches() {
  try {
    // Clear all old service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('greentrack') && !name.includes('v3.0.0')
      );
      
      if (oldCaches.length > 0) {
        console.log('[Cache] Clearing old caches:', oldCaches);
        await Promise.all(
          oldCaches.map(cacheName => caches.delete(cacheName))
        );
        console.log('[Cache] Old caches cleared successfully');
      }
    }

    // Unregister old service workers and force update
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Force update to get latest service worker
        await registration.update();
      }
    }

    // Clear localStorage flag for cache version
    const currentCacheVersion = 'v3.0.4';
    const lastCacheVersion = localStorage.getItem('cacheVersion');
    
    if (lastCacheVersion !== currentCacheVersion) {
      console.log('[Cache] Cache version mismatch, forcing reload');
      localStorage.setItem('cacheVersion', currentCacheVersion);
      
      // Clear browser cache using Cache-Control
      if (!sessionStorage.getItem('cacheCleared')) {
        sessionStorage.setItem('cacheCleared', 'true');
        // Hard reload to bypass cache
        window.location.reload(true);
      }
    }

  } catch (error) {
    console.error('[Cache] Error clearing caches:', error);
  }
})();

// Add cache-busting query parameter to all resource requests
(function addCacheBusting() {
  // Only run once per session
  if (sessionStorage.getItem('cacheBustingApplied')) return;
  
  const version = 'v3.0.4';
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  const scripts = document.querySelectorAll('script[src]');
  
  // Add version parameter to stylesheets
  links.forEach(link => {
    if (link.href && !link.href.includes('?v=')) {
      const url = new URL(link.href);
      url.searchParams.set('v', version);
      link.href = url.toString();
    }
  });
  
  // Mark as applied
  sessionStorage.setItem('cacheBustingApplied', 'true');
})();

console.log('[Cache] Cache management initialized - Version 3.0.0');
