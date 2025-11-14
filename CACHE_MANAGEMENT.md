# 🧹 Cache Management Guide

## Version 3.0.0 - Theme Selector Update

This update includes a complete cache refresh system to ensure all users see the latest version with the new visible theme selector.

---

## 🚀 What's Been Done

### Automatic Cache Clearing
✅ **Version Bump:** Updated from v2.3.4 to v3.0.0  
✅ **Service Worker Update:** Forces all old caches to be deleted  
✅ **Auto-Reload:** Automatically reloads page when new version is detected  
✅ **Cache Busting:** Added version parameters to all CSS/JS files (?v=3.0.0)  
✅ **Periodic Checks:** Checks for updates every 60 seconds

### Files Updated
- `sw.js` - Service worker with new cache version
- `sw-register.js` - Added auto-reload and periodic update checks
- `clear-cache.js` - New script that runs on page load to clear old caches
- `index.html` - Added cache-busting parameters to all resources
- `clear-cache.html` - Manual cache clearing tool

---

## 🔄 How It Works

### For Users (Automatic)
1. User visits website
2. `clear-cache.js` runs immediately and checks cache version
3. If old version detected:
   - Clears old service worker caches
   - Forces a hard reload
4. New service worker installs with v3.0.0
5. User sees updated website with visible theme selector

### Ongoing Updates
- Service worker checks for updates every 60 seconds
- When new version is detected, page auto-reloads after 2 seconds
- No user action required

---

## 🛠️ Manual Cache Clearing (If Needed)

### Option 1: Use Clear Cache Page
1. Navigate to: `clear-cache.html`
2. Click "🗑️ Clear All Caches" button
3. Page automatically redirects to dashboard

### Option 2: Browser Developer Tools
```
1. Press F12 (or Ctrl+Shift+I)
2. Go to "Application" tab
3. Click "Clear storage" in left sidebar
4. Check all boxes
5. Click "Clear site data"
6. Refresh page (F5)
```

### Option 3: Browser Settings
```
Chrome/Edge:
1. Ctrl+Shift+Delete
2. Select "Cached images and files"
3. Click "Clear data"

Firefox:
1. Ctrl+Shift+Delete
2. Select "Cache"
3. Click "Clear Now"
```

---

## 📊 Cache Version History

| Version | Date | Changes |
|---------|------|---------|
| v3.0.0 | 2025-11-14 | Added visible theme selector, new UI components |
| v2.3.4 | Previous | Original version |

---

## 🔍 Troubleshooting

### Problem: Still seeing old version
**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Open `clear-cache.html` and run manual clear
3. Clear browser data via settings
4. Try incognito/private window

### Problem: Theme selector not visible
**Solution:**
1. Check browser console for errors (F12)
2. Verify `themes.css` and `theme-manager.js` are loading
3. Clear cache and hard reload
4. Check if JavaScript is enabled

### Problem: Service worker not updating
**Solution:**
1. Open DevTools → Application → Service Workers
2. Check "Update on reload"
3. Click "Unregister" on old workers
4. Refresh page

---

## 🎯 For Developers

### Testing Cache Clearing
```javascript
// Check current cache version
console.log(localStorage.getItem('cacheVersion'));

// Manually trigger cache clear
await caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
);

// Check service worker status
navigator.serviceWorker.getRegistrations().then(regs => 
  console.log('Active workers:', regs.length)
);
```

### Updating Version for Future Changes
When making significant updates:

1. **Update sw.js:**
```javascript
const CACHE_NAME = 'greentrack-v3.1.0'; // Increment version
const STATIC_CACHE = 'greentrack-static-v3.1.0';
const DYNAMIC_CACHE = 'greentrack-dynamic-v3.1.0';
const API_CACHE = 'greentrack-api-v3.1.0';
```

2. **Update clear-cache.js:**
```javascript
const currentCacheVersion = 'v3.1.0'; // Match above
```

3. **Update index.html:**
```html
<link rel="stylesheet" href="style.css?v=3.1.0">
<script src="script.js?v=3.1.0"></script>
```

---

## 📱 Testing Checklist

Before deploying updates:

- [ ] Version numbers updated in all files
- [ ] `clear-cache.js` loads first in `<head>`
- [ ] All CSS/JS files have version parameters
- [ ] Service worker updates old cache names
- [ ] Test in Chrome DevTools → Application → Service Workers
- [ ] Test hard refresh (Ctrl+Shift+R)
- [ ] Test incognito window
- [ ] Verify theme selector is visible
- [ ] Check auto-reload works on update

---

## 📚 Additional Resources

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Chrome DevTools: Service Workers](https://developer.chrome.com/docs/devtools/progressive-web-apps/)

---

## ✅ Summary

Your cache management system is now fully configured to:
1. ✅ Automatically clear old caches on page load
2. ✅ Force users to get the latest version
3. ✅ Check for updates every 60 seconds
4. ✅ Auto-reload when updates are detected
5. ✅ Provide manual clearing tools if needed

**Users will always see the latest version with the visible theme selector!** 🎨
