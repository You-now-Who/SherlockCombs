"""
Fashion-CLIP FastAPI Backend
Analyze fashion images via REST API endpoints
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import torch
import numpy as np
from PIL import Image
from fashion_clip.fashion_clip import FashionCLIP
import io
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SherlockCombs Fashion API",
    description="AI-powered fashion analysis using Fashion-CLIP",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
fashion_model = None

# Fashion categories
CATEGORIES = [
    "short sleeve top", "long sleeve top", "t-shirt", "shirt", "blouse",
    "jacket", "coat", "hoodie", "cardigan", "blazer",
    "pants", "jeans", "trousers", "shorts", "skirt",
    "dress", "short sleeve dress", "long sleeve dress", "maxi dress",
    "bag", "handbag", "backpack", "shoes", "sneakers", "boots",
    "hat", "cap", "sunglasses", "watch", "belt",
    "sweater", "vest", "scarf", "tie"
]

COLORS = [
    "red", "blue", "green", "black", "white", 
    "yellow", "pink", "purple", "brown", "gray",
    "orange", "navy", "beige"
]

STYLES = [
    "casual", "formal", "sporty", "elegant", 
    "vintage", "modern", "streetwear"
]


# Response models
class FashionItem(BaseModel):
    name: str
    confidence: float


class ColorResult(BaseModel):
    color: str
    confidence: float


class StyleResult(BaseModel):
    style: str
    confidence: float


class AnalysisResponse(BaseModel):
    success: bool
    items: List[FashionItem]
    colors: List[ColorResult]
    styles: List[StyleResult]
    message: str = ""


@app.on_event("startup")
async def load_model():
    """Load the Fashion-CLIP model on startup"""
    global fashion_model
    try:
        logger.info("Loading Fashion-CLIP model...")
        fashion_model = FashionCLIP('fashion-clip')
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "SherlockCombs Fashion API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "/analyze": "POST - Analyze fashion image",
            "/health": "GET - Health check",
            "/docs": "GET - API documentation"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = "loaded" if fashion_model is not None else "not loaded"
    return {
        "status": "healthy",
        "model": model_status
    }


def analyze_fashion_image(pil_image: Image.Image, top_items: int = 10, top_colors: int = 5, top_styles: int = 5) -> Dict:
    """
    Analyze a fashion image using Fashion-CLIP
    
    Args:
        pil_image: PIL Image object
        top_items: Number of top fashion items to return
        top_colors: Number of top colors to return
        top_styles: Number of top styles to return
        
    Returns:
        Dictionary containing items, colors, and styles
    """
    if fashion_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Ensure RGB mode
    if pil_image.mode != 'RGB':
        pil_image = pil_image.convert('RGB')
    
    # Get image embeddings
    image_embeds = fashion_model.encode_images([pil_image], batch_size=1)
    
    # Convert to torch if needed
    if isinstance(image_embeds, np.ndarray):
        image_embeds = torch.from_numpy(image_embeds)
    
    # Normalize
    image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)
    
    results = {}
    
    # Analyze fashion items
    text_embeds = fashion_model.encode_text(CATEGORIES, batch_size=32)
    if isinstance(text_embeds, np.ndarray):
        text_embeds = torch.from_numpy(text_embeds)
    
    text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)
    similarities = (image_embeds @ text_embeds.T).squeeze(0)
    scores, indices = torch.topk(similarities, min(top_items, len(CATEGORIES)))
    
    results['items'] = [
        {"name": CATEGORIES[idx], "confidence": float(score.item())}
        for idx, score in zip(indices, scores)
    ]
    
    # Analyze colors
    color_embeds = fashion_model.encode_text(COLORS, batch_size=32)
    if isinstance(color_embeds, np.ndarray):
        color_embeds = torch.from_numpy(color_embeds)
    
    color_embeds = color_embeds / color_embeds.norm(dim=-1, keepdim=True)
    color_sims = (image_embeds @ color_embeds.T).squeeze(0)
    color_scores, color_indices = torch.topk(color_sims, min(top_colors, len(COLORS)))
    
    results['colors'] = [
        {"color": COLORS[idx], "confidence": float(score.item())}
        for idx, score in zip(color_indices, color_scores)
    ]
    
    # Analyze styles
    style_embeds = fashion_model.encode_text(STYLES, batch_size=32)
    if isinstance(style_embeds, np.ndarray):
        style_embeds = torch.from_numpy(style_embeds)
    
    style_embeds = style_embeds / style_embeds.norm(dim=-1, keepdim=True)
    style_sims = (image_embeds @ style_embeds.T).squeeze(0)
    style_scores, style_indices = torch.topk(style_sims, min(top_styles, len(STYLES)))
    
    results['styles'] = [
        {"style": STYLES[idx], "confidence": float(score.item())}
        for idx, score in zip(style_indices, style_scores)
    ]
    
    return results


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    top_items: int = 10,
    top_colors: int = 5,
    top_styles: int = 5
):
    """
    Analyze a fashion image
    
    Args:
        file: Image file (jpg, png, etc.)
        top_items: Number of top fashion items to return (default: 10)
        top_colors: Number of top colors to return (default: 5)
        top_styles: Number of top styles to return (default: 5)
        
    Returns:
        JSON response with detected items, colors, and styles
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents))
        
        # Analyze
        logger.info(f"Analyzing image: {file.filename}")
        results = analyze_fashion_image(pil_image, top_items, top_colors, top_styles)
        
        logger.info(f"Analysis complete for {file.filename}")
        
        return AnalysisResponse(
            success=True,
            items=[FashionItem(**item) for item in results['items']],
            colors=[ColorResult(**color) for color in results['colors']],
            styles=[StyleResult(**style) for style in results['styles']],
            message="Analysis completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze/batch")
async def analyze_batch(files: List[UploadFile] = File(...)):
    """
    Analyze multiple fashion images
    
    Args:
        files: List of image files
        
    Returns:
        JSON response with analysis for each image
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed per batch")
    
    results = []
    
    for file in files:
        if not file.content_type.startswith('image/'):
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "Not an image file"
            })
            continue
        
        try:
            contents = await file.read()
            pil_image = Image.open(io.BytesIO(contents))
            
            analysis = analyze_fashion_image(pil_image)
            
            results.append({
                "filename": file.filename,
                "success": True,
                "items": analysis['items'],
                "colors": analysis['colors'],
                "styles": analysis['styles']
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {"results": results}


@app.get("/categories")
async def get_categories():
    """Get available fashion categories"""
    return {
        "items": CATEGORIES,
        "colors": COLORS,
        "styles": STYLES
    }


if __name__ == "__main__":
    import uvicorn
    
    print("="*60)
    print("SherlockCombs Fashion API")
    print("="*60)
    print("Starting server...")
    print("API will be available at: http://localhost:8000")
    print("Documentation: http://localhost:8000/docs")
    print("="*60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
