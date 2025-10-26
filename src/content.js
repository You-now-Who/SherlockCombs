// content.js
// SherlockCombs - Fashion shopping assistant

(function() {
  const OVERLAY_CLASS = 'sherlockcombs-panel';
  const BADGE_CLASS = 'sherlockcombs-img-badge';
  
  // Cache for shopping results
  const resultsCache = new Map();
  const styleCache = new Map();

  function cleanPrice(priceText) {
    if (!priceText) return priceText;
    // Remove the Â character and other encoding artifacts
    return priceText.replace(/Â/g, '').replace(/\u00A0/g, ' ').trim();
  }

  function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
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
    
    const iconSpan = document.createElement('span');
    iconSpan.className = BADGE_CLASS + '__icon';
    iconSpan.innerHTML = icons.tag;
    
    const priceSpan = document.createElement('span');
    priceSpan.className = BADGE_CLASS + '__price';
    priceSpan.textContent = lowestPrice;
    
    badge.appendChild(iconSpan);
    badge.appendChild(priceSpan);
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

  function createOverlay(url, match, shoppingResults = null, loadingStage = null, styleDescription = null) {
    removeExisting();

    const panel = document.createElement('div');
    panel.className = OVERLAY_CLASS;
    panel.id = 'sherlockcombs-panel';

    // Create header
    const header = document.createElement('div');
    header.className = OVERLAY_CLASS + '__header';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = OVERLAY_CLASS + '__title';
    
    const logoSpan = document.createElement('span');
    logoSpan.className = OVERLAY_CLASS + '__logo';
    logoSpan.innerHTML = icons.search;
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'SherlockCombs';
    
    titleDiv.appendChild(logoSpan);
    titleDiv.appendChild(titleSpan);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = OVERLAY_CLASS + '__actions';
    
    const headerPinBtn = document.createElement('button');
    headerPinBtn.className = OVERLAY_CLASS + '__pin-btn';
    headerPinBtn.title = 'Pin panel';
    headerPinBtn.innerHTML = icons.pin;
    
    const headerCloseBtn = document.createElement('button');
    headerCloseBtn.className = OVERLAY_CLASS + '__close-btn';
    headerCloseBtn.title = 'Close';
    headerCloseBtn.innerHTML = icons.close;
    
    actionsDiv.appendChild(headerPinBtn);
    actionsDiv.appendChild(headerCloseBtn);
    
    header.appendChild(titleDiv);
    header.appendChild(actionsDiv);
    panel.appendChild(header);

    // Style description banner
    if (styleDescription) {
      const styleBanner = document.createElement('div');
      styleBanner.className = OVERLAY_CLASS + '__style-banner';
      styleBanner.textContent = `This looks like a ${styleDescription} style`;
      panel.appendChild(styleBanner);
    }

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
        
        // Card thumbnail
        const cardThumb = document.createElement('div');
        cardThumb.className = OVERLAY_CLASS + '__card-thumb';
        
        if (result.thumbnail) {
          try {
            let thumbnailSrc = result.thumbnail.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
              return String.fromCharCode(parseInt(hex, 16));
            });
            
            if (thumbnailSrc.startsWith('data:image/')) {
              const img = document.createElement('img');
              img.src = thumbnailSrc;
              img.className = OVERLAY_CLASS + '__thumb';
              img.alt = result.title;
              
              const placeholder = document.createElement('div');
              placeholder.className = OVERLAY_CLASS + '__thumb-placeholder';
              placeholder.innerHTML = icons.shoppingBag;
              placeholder.style.display = 'none';
              
              img.onerror = function() {
                this.style.display = 'none';
                placeholder.style.display = 'flex';
              };
              
              cardThumb.appendChild(img);
              cardThumb.appendChild(placeholder);
            } else {
              const placeholder = document.createElement('div');
              placeholder.className = OVERLAY_CLASS + '__thumb-placeholder';
              placeholder.innerHTML = icons.shoppingBag;
              cardThumb.appendChild(placeholder);
            }
          } catch (e) {
            const placeholder = document.createElement('div');
            placeholder.className = OVERLAY_CLASS + '__thumb-placeholder';
            placeholder.innerHTML = icons.shoppingBag;
            cardThumb.appendChild(placeholder);
            console.warn('Thumbnail decode failed:', e);
          }
        } else {
          const placeholder = document.createElement('div');
          placeholder.className = OVERLAY_CLASS + '__thumb-placeholder';
          placeholder.innerHTML = icons.shoppingBag;
          cardThumb.appendChild(placeholder);
        }
        
        const isLowest = index === 0;
        if (isLowest) {
          const bestBadge = document.createElement('div');
          bestBadge.className = OVERLAY_CLASS + '__best-badge';
          bestBadge.textContent = 'Best';
          cardThumb.appendChild(bestBadge);
        }
        
        // Card info
        const cardInfo = document.createElement('div');
        cardInfo.className = OVERLAY_CLASS + '__card-info';
        
        const cardTitle = document.createElement('div');
        cardTitle.className = OVERLAY_CLASS + '__card-title';
        cardTitle.textContent = result.title;
        
        const cardMeta = document.createElement('div');
        cardMeta.className = OVERLAY_CLASS + '__card-meta';
        
        const cardPrice = document.createElement('span');
        cardPrice.className = OVERLAY_CLASS + '__card-price';
        cardPrice.textContent = cleanPrice(result.price);
        
        const cardRating = document.createElement('span');
        cardRating.className = OVERLAY_CLASS + '__card-rating';
        cardRating.innerHTML = icons.star;
        const ratingText = document.createTextNode(' ' + result.rating);
        cardRating.appendChild(ratingText);
        
        cardMeta.appendChild(cardPrice);
        cardMeta.appendChild(cardRating);
        
        const cardSource = document.createElement('div');
        cardSource.className = OVERLAY_CLASS + '__card-source';
        cardSource.textContent = result.source || 'Store';
        
        cardInfo.appendChild(cardTitle);
        cardInfo.appendChild(cardMeta);
        cardInfo.appendChild(cardSource);
        
        card.appendChild(cardThumb);
        card.appendChild(cardInfo);
        
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
      
      const spinner = document.createElement('div');
      spinner.className = OVERLAY_CLASS + '__spinner';
      spinner.innerHTML = icons.spinner;
      
      const loadingTextEl = document.createElement('div');
      loadingTextEl.className = OVERLAY_CLASS + '__loading-text';
      loadingTextEl.id = 'loading-text';
      
      loading.appendChild(spinner);
      loading.appendChild(loadingTextEl);
      panel.appendChild(loading);
      
      // Set loading message based on stage
      if (loadingStage === 'analyzing') {
        const messages = [
          { icon: icons.analyze, text: ' Analyzing fashion elements...' },
          { icon: icons.shirt, text: ' Identifying clothing items...' },
          { icon: icons.palette, text: ' Detecting colors and styles...' },
          { icon: icons.sparkle, text: ' Understanding the look...' }
        ];
        let messageIndex = 0;
        loadingTextEl.innerHTML = messages[0].icon;
        loadingTextEl.appendChild(document.createTextNode(messages[0].text));
        
        // Cycle through messages
        const interval = setInterval(() => {
          messageIndex = (messageIndex + 1) % messages.length;
          if (loadingTextEl.isConnected) {
            loadingTextEl.innerHTML = messages[messageIndex].icon;
            loadingTextEl.appendChild(document.createTextNode(messages[messageIndex].text));
          } else {
            clearInterval(interval);
          }
        }, 5000);
      } else if (loadingStage === 'shopping') {
        loadingTextEl.innerHTML = icons.shoppingBag;
        loadingTextEl.appendChild(document.createTextNode(' Finding the best deals...'));
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
      // Filter out watches and ties, pick the next available item
      const excludedItems = ['watch', 'tie'];
      let selectedItem = analysisData.items[0];
      
      for (let item of analysisData.items) {
        const itemName = item.name.toLowerCase();
        if (!excludedItems.some(excluded => itemName.includes(excluded))) {
          selectedItem = item;
          break;
        }
      }
      
      let queryString = "Buy " + analysisData.colors[0].color + " " + selectedItem.name;
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
          const cachedStyle = styleCache.get(url);
          createOverlay(url, match, cachedResults, null, cachedStyle);
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
            
            // Get style description
            const styleDescription = analysis.styles && analysis.styles.length > 0 
              ? analysis.styles[0].style 
              : null;
            styleCache.set(url, styleDescription);
            
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
            
            createOverlay(url, match, shoppingResults, null, styleDescription);
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
