"""
Test client for the Fashion API
Shows how to send images to the API
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{API_URL}/health")
    print("Health Check:", response.json())
    print()


def analyze_image(image_path):
    """
    Analyze a single image
    
    Args:
        image_path: Path to the image file
    """
    print(f"Analyzing: {image_path}")
    print("-" * 50)
    
    # Open and send the image
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/analyze", files=files)
    
    if response.status_code == 200:
        data = response.json()
        
        print("\nAnalysis Complete!\n")
        
        # Fashion Items
        print("Fashion Items:")
        for item in data['items']:
            print(f"  - {item['name']:<25} {item['confidence']:.1%}")
        
        # Colors
        print("\nColors:")
        for color in data['colors']:
            print(f"  - {color['color']:<15} {color['confidence']:.1%}")
        
        # Styles
        print("\nStyles:")
        for style in data['styles']:
            print(f"  - {style['style']:<15} {style['confidence']:.1%}")
        
        print("\n" + "="*50)
    else:
        print(f"Error: {response.status_code}")
        print(response.json())


def analyze_with_options(image_path, top_items=5, top_colors=3, top_styles=3):
    """Analyze with custom number of results"""
    print(f"Analyzing: {image_path} (custom options)")
    print("-" * 50)
    
    with open(image_path, 'rb') as f:
        files = {'file': f}
        params = {
            'top_items': top_items,
            'top_colors': top_colors,
            'top_styles': top_styles
        }
        response = requests.post(f"{API_URL}/analyze", files=files, params=params)
    
    if response.status_code == 200:
        print("Success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")


def get_categories():
    """Get available categories"""
    response = requests.get(f"{API_URL}/categories")
    data = response.json()
    
    print("\nAvailable Categories:")
    print(f"\nItems ({len(data['items'])}):")
    print(", ".join(data['items']))
    
    print(f"\nColors ({len(data['colors'])}):")
    print(", ".join(data['colors']))
    
    print(f"\nStyles ({len(data['styles'])}):")
    print(", ".join(data['styles']))
    print()


if __name__ == "__main__":
    import sys
    
    print("="*50)
    print("Fashion API Test Client")
    print("="*50)
    
    # Test health
    try:
        test_health()
    except Exception as e:
        print(f"Cannot connect to API: {e}")
        print("Make sure the API is running: python main.py")
        sys.exit(1)
    
    # Get categories
    get_categories()
    
    # Test image analysis if path provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        analyze_image(image_path)
    else:
        print("\nUsage: python test_client.py <image_path>")
        print("Example: python test_client.py photo.jpg")
