# SherlockCombs Fashion API

FastAPI backend for real-time fashion analysis using Fashion-CLIP.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the API Server
```bash
python main.py
```

The server will start at: **http://localhost:8000**

## 📚 API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **API Info**: http://localhost:8000/

## 🔌 API Endpoints

### 1. **POST /analyze** - Analyze Single Image

Upload an image and get fashion analysis.

**Request:**
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "file=@photo.jpg"
```

**Response:**
```json
{
  "success": true,
  "items": [
    {"name": "t-shirt", "confidence": 0.85},
    {"name": "jeans", "confidence": 0.78}
  ],
  "colors": [
    {"color": "blue", "confidence": 0.89},
    {"color": "white", "confidence": 0.76}
  ],
  "styles": [
    {"style": "casual", "confidence": 0.91},
    {"style": "modern", "confidence": 0.79}
  ],
  "message": "Analysis completed successfully"
}
```

**Optional Parameters:**
- `top_items` (int): Number of items to return (default: 10)
- `top_colors` (int): Number of colors to return (default: 5)
- `top_styles` (int): Number of styles to return (default: 5)

### 2. **POST /analyze/batch** - Analyze Multiple Images

Upload up to 10 images at once.

**Request:**
```bash
curl -X POST "http://localhost:8000/analyze/batch" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg"
```

### 3. **GET /health** - Health Check

Check if the API is running and model is loaded.

```bash
curl http://localhost:8000/health
```

### 4. **GET /categories** - Get Available Categories

List all fashion categories, colors, and styles.

```bash
curl http://localhost:8000/categories
```

## 🧪 Testing

### Using Python Test Client

```bash
# Test API connection
python test_client.py

# Analyze an image
python test_client.py path/to/image.jpg
```

### Using Python requests

```python
import requests

# Analyze image
with open('photo.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/analyze', files=files)
    print(response.json())
```

### Using JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/analyze', {
    method: 'POST',
    body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

## 📦 What It Detects

### Fashion Items (40+ categories)
- **Tops**: t-shirt, shirt, blouse, hoodie, sweater, vest
- **Outerwear**: jacket, coat, cardigan, blazer
- **Bottoms**: pants, jeans, shorts, skirt, trousers
- **Dresses**: dress, maxi dress, short/long sleeve dress
- **Accessories**: bag, shoes, hat, sunglasses, watch, belt

### Colors (13 options)
red, blue, green, black, white, yellow, pink, purple, brown, gray, orange, navy, beige

### Styles (7 categories)
casual, formal, sporty, elegant, vintage, modern, streetwear

## 🔧 Configuration

Edit `main.py` to customize:
- Port number (default: 8000)
- CORS settings
- Model parameters
- Categories/colors/styles

## 📝 Response Format

All successful responses include:
```json
{
  "success": true,
  "items": [{"name": "...", "confidence": 0.0}],
  "colors": [{"color": "...", "confidence": 0.0}],
  "styles": [{"style": "...", "confidence": 0.0}],
  "message": "..."
}
```

Confidence scores range from 0.0 to 1.0 (0% to 100%).

## 🚨 Error Handling

### 400 Bad Request
- Invalid file type
- Too many files in batch

### 500 Internal Server Error
- Analysis failed
- Model error

### 503 Service Unavailable
- Model not loaded

## 🔐 Production Considerations

Before deploying to production:

1. **Update CORS settings** in `main.py`:
   ```python
   allow_origins=["https://yourdomain.com"]
   ```

2. **Add authentication** if needed

3. **Set rate limiting**

4. **Use proper hosting** (not the built-in server)

5. **Add logging and monitoring**

## 💡 Additional Tools

- **`upload_analyzer.py`** - GUI version with file picker
- **`simple_analyzer.py`** - Command-line single image analyzer
- **`test_client.py`** - API testing script

## 🐛 Troubleshooting

**Model not loading:**
- Ensure all dependencies are installed
- Check internet connection (first run downloads model)

**Port already in use:**
- Change port in `main.py`: `uvicorn.run(app, port=8001)`

**CORS errors:**
- Update `allow_origins` in CORS middleware

---

**Built for HackNotts 2025** 🚀
