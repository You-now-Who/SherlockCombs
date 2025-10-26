// content.js
// SherlockCombs - Fashion shopping assistant

(function() {
  const OVERLAY_CLASS = 'sherlockcombs-panel';
  const BADGE_CLASS = 'sherlockcombs-img-badge';
  
  // Cache for shopping results
  const resultsCache = new Map();

  function cleanPrice(priceText) {
    if (!priceText) return priceText;
    // Remove the Â character and other encoding artifacts
    return priceText.replace(/Â/g, '').replace(/\u00A0/g, ' ').trim();
  }

  function removeExisting() {
    document.querySelectorAll('.' + OVERLAY_CLASS).forEach(el => el.remove());
  }
  
  function removeBadge(imageElement) {
    const existingBadge = imageElement.parentElement?.querySelector('.' + BADGE_CLASS);
    if (existingBadge) existingBadge.remove();
  }
  
  function createPriceBadge(imageElement, lowestPrice, url, shoppingResults) {
    removeBadge(imageElement);
    
    const badge = document.createElement('button');
    badge.className = BADGE_CLASS;
    badge.innerHTML = `
      <span class="${BADGE_CLASS}__icon">${icons.tag}</span>
      <span class="${BADGE_CLASS}__price">${lowestPrice}</span>
    `;
    badge.title = 'View shopping results';
    
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const match = findMatchingImage(url);
      createOverlay(url, match, shoppingResults);
    });
    
    // Position relative to image
    const parent = imageElement.parentElement;
    if (parent && parent.style.position !== 'relative' && parent.style.position !== 'absolute') {
      parent.style.position = 'relative';
    }
    
    parent?.appendChild(badge);
  }

  function createOverlay(url, match, shoppingResults = null, loadingStage = null) {
    removeExisting();

    const panel = document.createElement('div');
    panel.className = OVERLAY_CLASS;
    panel.id = 'sherlockcombs-panel';

    // Create header
    const header = document.createElement('div');
    header.className = OVERLAY_CLASS + '__header';
    header.innerHTML = `
      <div class="${OVERLAY_CLASS}__title">
        <span class="${OVERLAY_CLASS}__logo">${icons.search}</span>
        <span>SherlockCombs</span>
      </div>
      <div class="${OVERLAY_CLASS}__actions">
        <button class="${OVERLAY_CLASS}__pin-btn" title="Pin panel">${icons.pin}</button>
        <button class="${OVERLAY_CLASS}__close-btn" title="Close">${icons.close}</button>
      </div>
    `;
    panel.appendChild(header);

    // If we have shopping results
    if (shoppingResults && shoppingResults.length > 0) {
      // Sort by price (lowest first)
      const sortedResults = [...shoppingResults].sort((a, b) => {
        const priceA = parseFloat(a.extracted_price || a.price.replace(/[^0-9.]/g, '') || '999999');
        const priceB = parseFloat(b.extracted_price || b.price.replace(/[^0-9.]/g, '') || '999999');
        return priceA - priceB;
      });

      // Lowest price badge
      const lowestPrice = cleanPrice(sortedResults[0].price);
      const priceBadge = document.createElement('div');
      priceBadge.className = OVERLAY_CLASS + '__price-badge';
      priceBadge.textContent = `Best Price: ${lowestPrice}`;
      panel.appendChild(priceBadge);

      // Results container
      const resultsContainer = document.createElement('div');
      resultsContainer.className = OVERLAY_CLASS + '__results';
      
      sortedResults.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = OVERLAY_CLASS + '__card';
        card.style.animationDelay = `${index * 0.04}s`;
        
        // Decode thumbnail
        let thumbnailHTML = `<div class="${OVERLAY_CLASS}__thumb-placeholder">${icons.shoppingBag}</div>`;
        
        if (result.thumbnail) {
          try {
            let thumbnailSrc = result.thumbnail.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
              return String.fromCharCode(parseInt(hex, 16));
            });
            
            if (thumbnailSrc.startsWith('data:image/')) {
              thumbnailHTML = `
                <img src="${thumbnailSrc}" class="${OVERLAY_CLASS}__thumb" alt="${result.title}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="${OVERLAY_CLASS}__thumb-placeholder" style="display:none;">${icons.shoppingBag}</div>
              `;
            }
          } catch (e) {
            console.warn('Thumbnail decode failed:', e);
          }
        }
        
        const isLowest = index === 0;
        
        card.innerHTML = `
          <div class="${OVERLAY_CLASS}__card-thumb">
            ${thumbnailHTML}
            ${isLowest ? `<div class="${OVERLAY_CLASS}__best-badge">Best</div>` : ''}
          </div>
          <div class="${OVERLAY_CLASS}__card-info">
            <div class="${OVERLAY_CLASS}__card-title">${result.title}</div>
            <div class="${OVERLAY_CLASS}__card-meta">
              <span class="${OVERLAY_CLASS}__card-price">${cleanPrice(result.price)}</span>
              <span class="${OVERLAY_CLASS}__card-rating">${icons.star} ${result.rating}</span>
            </div>
            <div class="${OVERLAY_CLASS}__card-source">${result.source || 'Store'}</div>
          </div>
        `;
        
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(result.product_link, '_blank');
        });
        
        resultsContainer.appendChild(card);
      });
      
      panel.appendChild(resultsContainer);
    } else {
      // Loading state with dynamic messages
      const loading = document.createElement('div');
      loading.className = OVERLAY_CLASS + '__loading';
      loading.innerHTML = `
        <div class="${OVERLAY_CLASS}__spinner">${icons.spinner}</div>
        <div class="${OVERLAY_CLASS}__loading-text" id="loading-text"></div>
      `;
      panel.appendChild(loading);
      
      // Set loading message based on stage
      const loadingTextEl = loading.querySelector('#loading-text');
      if (loadingStage === 'analyzing') {
        const messages = [
          `${icons.analyze} Analyzing fashion elements...`,
          `${icons.shirt} Identifying clothing items...`,
          `${icons.palette} Detecting colors and styles...`,
          `${icons.sparkle} Understanding the look...`
        ];
        let messageIndex = 0;
        loadingTextEl.textContent = messages[0];
        
        // Cycle through messages
        const interval = setInterval(() => {
          messageIndex = (messageIndex + 1) % messages.length;
          if (loadingTextEl.isConnected) {
            loadingTextEl.textContent = messages[messageIndex];
          } else {
            clearInterval(interval);
          }
        }, 5000);
      } else if (loadingStage === 'shopping') {
        loadingTextEl.textContent = '';
        loadingTextEl.innerHTML = `${icons.shoppingBag} Finding the best deals...`;
      } else {
        loadingTextEl.textContent = 'Loading...';
      }
    }

    document.body.appendChild(panel);

    // Slide in animation
    requestAnimationFrame(() => {
      panel.classList.add(OVERLAY_CLASS + '--visible');
    });

    // Handle pin/unpin
    const pinBtn = panel.querySelector('.' + OVERLAY_CLASS + '__pin-btn');
    const closeBtn = panel.querySelector('.' + OVERLAY_CLASS + '__close-btn');
    let isPinned = false;

    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isPinned = !isPinned;
      panel.classList.toggle(OVERLAY_CLASS + '--pinned', isPinned);
      pinBtn.innerHTML = isPinned ? icons.pinFilled : icons.pin;
      pinBtn.title = isPinned ? 'Unpin panel' : 'Pin panel';
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.remove(OVERLAY_CLASS + '--visible');
      setTimeout(() => panel.remove(), 300);
    });

    // Auto-remove after 30 seconds if not pinned
    setTimeout(() => {
      if (!isPinned && panel.parentNode) {
        panel.classList.remove(OVERLAY_CLASS + '--visible');
        setTimeout(() => {
          if (panel.parentNode) panel.remove();
        }, 300);
      }
    }, 30000);
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
      const encodedQuery = encodeURIComponent(queryString);
      const response = await fetch(`http://localhost:8000/get_shopping?query=${encodedQuery}`);

      if (!response.ok) {
        throw new Error('Shopping request failed: ' + response.statusText);
      }

      const data = await response.json();
      console.log('SherlockCombs shopping results:', data);
      
      // Return up to 10 results
      return data.shopping_results ? data.shopping_results.slice(0, 10) : [];
    } catch (error) {
      console.error('SherlockCombs shopping error:', error);
      return [];
    }
  }

  async function sendToBackend(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image: ' + response.statusText);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');

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
        
        // Check cache first
        if (resultsCache.has(url)) {
          const cachedResults = resultsCache.get(url);
          createOverlay(url, match, cachedResults);
          sendResponse({ ok: true, cached: true });
          return;
        }
        
        // Show loading panel with analyzing stage
        createOverlay(url, match, null, 'analyzing');
        
        // Send image to backend and get analysis
        const analysis = await sendToBackend(url);
        
        if (analysis) {
          // Update to shopping stage
          createOverlay(url, match, null, 'shopping');
          
          // Get shopping results based on analysis
          const shoppingResults = await getShoppingResults(analysis);
          
          // Update panel with shopping results and cache them
          if (shoppingResults.length > 0) {
            resultsCache.set(url, shoppingResults);
            
            // Sort by price to get lowest
            const sortedResults = [...shoppingResults].sort((a, b) => {
              const priceA = parseFloat(a.extracted_price || a.price.replace(/[^0-9.]/g, '') || '999999');
              const priceB = parseFloat(b.extracted_price || b.price.replace(/[^0-9.]/g, '') || '999999');
              return priceA - priceB;
            });
            const lowestPrice = cleanPrice(sortedResults[0].price);
            
            // Create price badge on the image
            if (match) {
              createPriceBadge(match, lowestPrice, url, shoppingResults);
            }
            
            createOverlay(url, match, shoppingResults);
          }
        }
        
        sendResponse({ ok: true });
      } catch (e) {
        console.error('content.js error', e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();

    return true;
  });
})();
