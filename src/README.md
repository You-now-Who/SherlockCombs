# SherlockCombs Chrome Extension

This is the source code for the SherlockCombs Chrome Extension (Manifest V3).

## Features
- 🔍 Right-click context menu on images to search for similar clothes
- 💜 Beautiful popup with gradient design
- 🚀 Manifest V3 compatible
- 🔌 Ready for backend API integration

## Installation

### Load Unpacked Extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" button
4. Select the `src` directory from this repository
5. The extension should now be loaded and visible in your extensions list

## Usage

### Using the Popup
- Click the SherlockCombs icon in your browser toolbar to see the popup

### Searching for Clothes
1. Navigate to any webpage with images
2. Right-click on any image
3. Select "Search for similar clothes" from the context menu
4. An alert will show with the image URL (API integration coming soon!)

## File Structure

```
src/
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html         # Popup HTML structure
├── popup.css          # Popup styles with gradient design
├── background.js      # Service worker for context menu
└── icons/            # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Next Steps
- Connect to Flask backend API for actual clothing search
- Add image upload functionality
- Implement search results display
- Add user preferences and settings
