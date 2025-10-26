// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'searchClothes',
    title: 'Search for similar clothes',
    contexts: ['image']
  });
});

// When the user clicks the context menu on an image, inject a small overlay
// thumbnail (superscript-like) on the page near that image.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'searchClothes') return;
  const imageUrl = info.srcUrl;
  if (!imageUrl) return;

  // Send a message to the content script running in the tab. The content
  // script will handle positioning and DOM updates. Using message passing is
  // more reliable than injecting ad-hoc scripts for longer-lived UI.
  if (tab && tab.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, { type: 'showThumbnail', url: imageUrl }, (resp) => {
      // Optional: handle acknowledgement or errors
      const err = chrome.runtime.lastError;
      if (err) {
        // If the content script is not present (e.g., not injected), fall
        // back to programmatic injection as a last resort.
        console.warn('sendMessage failed, falling back to executeScript:', err.message);
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (url) => {
            // Minimal fallback: create a fixed top-right thumbnail
            try {
              const overlay = document.createElement('div');
              overlay.style.position = 'fixed';
              overlay.style.right = '16px';
              overlay.style.top = '16px';
              overlay.style.zIndex = '2147483647';
              const img = document.createElement('img');
              img.src = url;
              img.style.width = '48px';
              img.style.height = '48px';
              img.style.objectFit = 'cover';
              img.style.border = '2px solid white';
              img.style.borderRadius = '6px';
              img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
              overlay.appendChild(img);
              document.body.appendChild(overlay);
              setTimeout(() => { try { overlay.remove(); } catch (e) {} }, 6000);
            } catch (e) { console.error(e); }
          },
          args: [imageUrl]
        }).catch(e => console.error('executeScript fallback failed', e));
      }
    });
  }
});
