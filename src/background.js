// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'searchClothes',
    title: 'Search for similar clothes',
    contexts: ['image']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchClothes') {
    // Get the image URL
    const imageUrl = info.srcUrl;
    
    // For now, just show an alert with the image URL
    // Later this will connect to the backend API
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (url) => {
        alert(`Searching for clothes in image: ${url}\n\nAPI connection coming soon!`);
      },
      args: [imageUrl]
    });
  }
});
