// content.js
// Listens for messages from the background/service worker and shows a small
// "superscript" thumbnail overlay near the matched image on the page.

(function() {
  const OVERLAY_CLASS = 'sherlockcombs-superscript';

  function removeExisting() {
    document.querySelectorAll('.' + OVERLAY_CLASS).forEach(el => el.remove());
  }

  function createOverlay(url, match, shoppingResults = null) {
    console.log(url)
    console.log(match)
    removeExisting();

    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;

    const thumb = document.createElement('img');
    thumb.src = url;
    thumb.alt = 'SherlockCombs thumbnail';
    thumb.className = OVERLAY_CLASS + '__img';

    overlay.appendChild(thumb);

    // If we have shopping results, create shopping cards to the right
    if (shoppingResults && shoppingResults.length > 0) {
      const shoppingContainer = document.createElement('div');
      shoppingContainer.className = OVERLAY_CLASS + '__shopping';
      
      shoppingResults.forEach((result) => {
        const card = document.createElement('div');
        card.className = OVERLAY_CLASS + '__card';
        
        console.log('Shopping result:', result);
        
        // The backend is returning escaped strings - need to unescape them
        let thumbnailSrc = '';
        let usePlaceholder = false;
        
        if (result.thumbnail) {
          try {
            // Replace hex escapes like \x3d with actual characters
            thumbnailSrc = result.thumbnail.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
              return String.fromCharCode(parseInt(hex, 16));
            });
            
            // Validate it's a proper data URL
            if (!thumbnailSrc.startsWith('data:image/')) {
              console.warn('Invalid thumbnail URL, using placeholder');
              usePlaceholder = true;
            }
          } catch (e) {
            console.error('Failed to decode thumbnail:', e);
            usePlaceholder = true;
          }
        } else {
          usePlaceholder = true;
        }
        
        // Create thumbnail or placeholder
        const thumbnail = usePlaceholder ? 
          `<div class="${OVERLAY_CLASS}__card-placeholder">🛍️</div>` :
          `<img src="${thumbnailSrc}" class="${OVERLAY_CLASS}__card-thumb" alt="${result.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="${OVERLAY_CLASS}__card-placeholder" style="display:none;">🛍️</div>`;
        
        card.innerHTML = `
          ${thumbnail}
          <div class="${OVERLAY_CLASS}__card-content">
            <div class="${OVERLAY_CLASS}__card-header">
              <strong>${result.title}</strong>
            </div>
            <div class="${OVERLAY_CLASS}__card-body">
              <div class="${OVERLAY_CLASS}__price">${result.price}</div>
              <div class="${OVERLAY_CLASS}__rating">⭐ ${result.rating} (${result.reviews})</div>
            </div>
            <a href="${result.product_link}" target="_blank" class="${OVERLAY_CLASS}__shop-link">View →</a>
          </div>
        `;
        
        card.addEventListener('click', (e) => {
          if (!e.target.classList.contains(OVERLAY_CLASS + '__shop-link')) {
            e.stopPropagation();
          }
        });
        
        shoppingContainer.appendChild(card);
      });
      
      overlay.appendChild(shoppingContainer);
    }

    // Allow click to dismiss
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === thumb) {
        e.stopPropagation();
        overlay.remove();
      }
    });

    // Positioning
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '2147483647';
    overlay.style.pointerEvents = 'auto';

    if (match) {
      try {
        const rect = match.getBoundingClientRect();
        const left = Math.min(window.innerWidth - 400, Math.round(rect.left + rect.width - 24));
        const top = Math.max(8, Math.round(rect.top - 28));
        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';
      } catch (e) {
        overlay.style.right = '16px';
        overlay.style.top = '16px';
      }
    } else {
      overlay.style.right = '16px';
      overlay.style.top = '16px';
    }

    document.body.appendChild(overlay);

    // Auto-remove after 20 seconds (longer to give time to view shopping results)
    setTimeout(() => { try { overlay.remove(); } catch (e) {} }, 20000);
  }

  function findMatchingImage(url) {
    const imgs = Array.from(document.images || []);
    return imgs.find(img => {
      if (!img || !img.src) return false;
      if (img.src === url) return true;
      if (img.currentSrc === url) return true;
      try {
        const a = new URL(img.src, location.href).href;
        const b = new URL(url, location.href).href;
        if (a === b) return true;
      } catch (e) {}
      if (img.src && url && img.src.endsWith(url)) return true;
      if (url && img.src && url.endsWith(img.src)) return true;
      return false;
    });
  }

  async function getShoppingResults(analysisData) {
    try {

      let queryString = "Buy " + analysisData.colors[0].color + " " + analysisData.items[0].name;
      // Send the analysis data to get shopping results
      const response = await fetch(`http://localhost:8000/get_shopping?query=${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Shopping request failed: ' + response.statusText);
      }

      const data = await response.json();
      console.log('SherlockCombs shopping results:', data);
      
      // Return top 2 results from shopping_results array
      return data.shopping_results ? data.shopping_results.slice(0, 2) : [];
    } catch (error) {
      console.error('SherlockCombs shopping error:', error);
      return [];
    }
  }

  async function sendToBackend(url) {
    try {
      // Fetch the image as a blob
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image: ' + response.statusText);
      const blob = await response.blob();

      // Create FormData and append the image file
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');

      console.log("Hello, im sending this stuff I hope this work oh boy");

      // Send to backend
      const backendResponse = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData
      });

      if (!backendResponse.ok) {
        throw new Error('Backend request failed: ' + backendResponse.statusText);
      }

      const result = await backendResponse.json();
      console.log('SherlockCombs backend analysis:', result);
      return result;
    } catch (error) {
      console.error('SherlockCombs backend error:', error);
      return null;
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'showThumbnail') return;
    const url = message.url;
    if (!url) return;

    (async () => {
      try {
        const match = findMatchingImage(url);
        
        // Show overlay immediately (loading state)
        createOverlay(url, match);
        
        // Send image to backend and get analysis
        const analysis = await sendToBackend(url);
        
        if (analysis) {
          // Get shopping results based on analysis
          const shoppingResults = await getShoppingResults(analysis);
          
          // Update overlay with shopping results
          if (shoppingResults.length > 0) {
            createOverlay(url, match, shoppingResults);
          }
        }
        
        sendResponse({ ok: true });
      } catch (e) {
        console.error('content.js error', e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();

    // Indicate we'll respond asynchronously
    return true;
  });
})();
