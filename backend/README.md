# SherlockCombs Backend - Fashion-CLIP Detection

Real-time fashion detection using **Fashion-CLIP** (trained on fashion datasets) and OpenCV.

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

## ⌨️ Keyboard Controls

- **`q`** - Quit
- **`s`** - Save frame
- **`c`** - Detailed analysis (console)
- **`a`** - Toggle auto-analysis (improves FPS)

## 🎯 Features

✅ **Real-time Fashion Detection** - 40+ clothing categories  
✅ **Color Analysis** - 13 color options  
✅ **Style Recognition** - casual, formal, sporty, etc.  
✅ **Fashion-Specific Model** - Trained on fashion datasets  
✅ **High Performance** - Optimized for real-time

## 🎨 What It Detects

**Clothing**: t-shirt, jeans, dress, jacket, shoes, bag, etc.  
**Colors**: red, blue, black, white, etc.  
**Styles**: casual, formal, sporty, vintage, modern

## ⚙️ Configuration

Edit `main.py`:
```python
detector.run_camera(
    camera_id=0,          # Camera ID
    analysis_interval=15  # Higher = faster FPS
)
```

## 🔮 Coming Soon
- Flask API for clothing image search
- Database for search results
- Custom text queries
- Similar item retrieval

FLASK IM COMING FOR YOUUUUUUU 🚀
