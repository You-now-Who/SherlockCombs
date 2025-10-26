"""
Simple CLI version - Analyze a single image file
"""

import sys
import torch
import numpy as np
from PIL import Image
from fashion_clip.fashion_clip import FashionCLIP


def analyze_image(image_path):
    """Analyze a fashion image"""
    print("Loading Fashion-CLIP model...")
    fclip = FashionCLIP('fashion-clip')
    
    categories = [
        "short sleeve top", "long sleeve top", "t-shirt", "shirt", "blouse",
        "jacket", "coat", "hoodie", "cardigan", "blazer",
        "pants", "jeans", "trousers", "shorts", "skirt",
        "dress", "short sleeve dress", "long sleeve dress", "maxi dress",
        "bag", "handbag", "backpack", "shoes", "sneakers", "boots",
        "hat", "cap", "sunglasses", "watch", "belt",
        "sweater", "vest", "scarf", "tie"
    ]
    
    colors = ["red", "blue", "green", "black", "white", "yellow", 
              "pink", "purple", "brown", "gray", "orange", "navy", "beige"]
    
    styles = ["casual", "formal", "sporty", "elegant", "vintage", "modern", "streetwear"]
    
    print(f"\nAnalyzing: {image_path}\n")
    
    # Load image
    pil_image = Image.open(image_path).convert('RGB')
    
    # Get embeddings
    image_embeds = fclip.encode_images([pil_image], batch_size=1)
    
    # Items
    text_embeds = fclip.encode_text(categories, batch_size=32)
    if isinstance(image_embeds, np.ndarray):
        image_embeds = torch.from_numpy(image_embeds)
    if isinstance(text_embeds, np.ndarray):
        text_embeds = torch.from_numpy(text_embeds)
    
    image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)
    text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)
    similarities = (image_embeds @ text_embeds.T).squeeze(0)
    scores, indices = torch.topk(similarities, 10)
    
    print("Fashion Items:")
    for i, (idx, score) in enumerate(zip(indices, scores), 1):
        print(f"  {i}. {categories[idx]:<25} {score.item():.1%}")
    
    # Colors
    color_embeds = fclip.encode_text(colors, batch_size=32)
    if isinstance(color_embeds, np.ndarray):
        color_embeds = torch.from_numpy(color_embeds)
    color_embeds = color_embeds / color_embeds.norm(dim=-1, keepdim=True)
    color_sims = (image_embeds @ color_embeds.T).squeeze(0)
    color_scores, color_indices = torch.topk(color_sims, 5)
    
    print("\nColors:")
    for i, (idx, score) in enumerate(zip(color_indices, color_scores), 1):
        print(f"  {i}. {colors[idx]:<15} {score.item():.1%}")
    
    # Styles
    style_embeds = fclip.encode_text(styles, batch_size=32)
    if isinstance(style_embeds, np.ndarray):
        style_embeds = torch.from_numpy(style_embeds)
    style_embeds = style_embeds / style_embeds.norm(dim=-1, keepdim=True)
    style_sims = (image_embeds @ style_embeds.T).squeeze(0)
    style_scores, style_indices = torch.topk(style_sims, 5)
    
    print("\nStyles:")
    for i, (idx, score) in enumerate(zip(style_indices, style_scores), 1):
        print(f"  {i}. {styles[idx]:<15} {score.item():.1%}")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python simple_analyzer.py <image_path>")
        print("Example: python simple_analyzer.py photo.jpg")
    else:
        analyze_image(sys.argv[1])
