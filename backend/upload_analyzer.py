"""
Fashion Detection from Uploaded Images using Fashion-CLIP
Simple GUI version - upload images and get fashion analysis
"""

import cv2
import torch
import numpy as np
from PIL import Image
from fashion_clip.fashion_clip import FashionCLIP
import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
import os

class FashionAnalyzerGUI:
    def __init__(self):
        """Initialize the Fashion-CLIP analyzer with GUI"""
        print("Loading Fashion-CLIP model...")
        self.fclip = FashionCLIP('fashion-clip')
        
        # Define fashion categories
        self.categories = [
            "short sleeve top", "long sleeve top", "t-shirt", "shirt", "blouse",
            "jacket", "coat", "hoodie", "cardigan", "blazer",
            "pants", "jeans", "trousers", "shorts", "skirt",
            "dress", "short sleeve dress", "long sleeve dress", "maxi dress",
            "bag", "handbag", "backpack", "shoes", "sneakers", "boots",
            "hat", "cap", "sunglasses", "watch", "belt",
            "sweater", "vest", "scarf", "tie"
        ]
        
        self.colors = [
            "red", "blue", "green", "black", "white", 
            "yellow", "pink", "purple", "brown", "gray",
            "orange", "navy", "beige"
        ]
        
        self.styles = [
            "casual", "formal", "sporty", "elegant", 
            "vintage", "modern", "streetwear"
        ]
        
        print("Model loaded!")
        self.setup_gui()
        
    def setup_gui(self):
        """Setup the GUI window"""
        self.root = tk.Tk()
        self.root.title("Fashion-CLIP Analyzer - Upload Images")
        self.root.geometry("800x600")
        
        # Title
        title_label = tk.Label(
            self.root, 
            text="Fashion-CLIP Image Analyzer",
            font=("Arial", 20, "bold"),
            pady=20
        )
        title_label.pack()
        
        # Upload button
        upload_btn = tk.Button(
            self.root,
            text="Upload Image",
            command=self.upload_image,
            font=("Arial", 14),
            bg="#4CAF50",
            fg="white",
            padx=20,
            pady=10
        )
        upload_btn.pack(pady=10)
        
        # Current file label
        self.file_label = tk.Label(
            self.root,
            text="No file selected",
            font=("Arial", 10),
            fg="gray"
        )
        self.file_label.pack()
        
        # Results frame
        results_frame = tk.Frame(self.root, pady=20)
        results_frame.pack(fill="both", expand=True, padx=20)
        
        # Fashion Items
        items_label = tk.Label(
            results_frame,
            text="Fashion Items:",
            font=("Arial", 12, "bold"),
            anchor="w"
        )
        items_label.grid(row=0, column=0, sticky="w", pady=5)
        
        self.items_text = tk.Text(results_frame, height=8, width=50, font=("Arial", 10))
        self.items_text.grid(row=1, column=0, padx=10, pady=5)
        
        # Colors
        colors_label = tk.Label(
            results_frame,
            text="Colors:",
            font=("Arial", 12, "bold"),
            anchor="w"
        )
        colors_label.grid(row=2, column=0, sticky="w", pady=5)
        
        self.colors_text = tk.Text(results_frame, height=5, width=50, font=("Arial", 10))
        self.colors_text.grid(row=3, column=0, padx=10, pady=5)
        
        # Styles
        styles_label = tk.Label(
            results_frame,
            text="Styles:",
            font=("Arial", 12, "bold"),
            anchor="w"
        )
        styles_label.grid(row=4, column=0, sticky="w", pady=5)
        
        self.styles_text = tk.Text(results_frame, height=5, width=50, font=("Arial", 10))
        self.styles_text.grid(row=5, column=0, padx=10, pady=5)
        
        # Status bar
        self.status_label = tk.Label(
            self.root,
            text="Ready to analyze fashion images!",
            font=("Arial", 9),
            bg="#f0f0f0",
            anchor="w",
            padx=10
        )
        self.status_label.pack(side="bottom", fill="x")
        
    def upload_image(self):
        """Handle image upload"""
        file_path = filedialog.askopenfilename(
            title="Select an image",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            self.file_label.config(text=f"File: {os.path.basename(file_path)}")
            self.status_label.config(text="Analyzing image...")
            self.root.update()
            
            try:
                self.analyze_image(file_path)
                self.status_label.config(text="Analysis complete!")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to analyze image:\n{str(e)}")
                self.status_label.config(text="Analysis failed")
    
    def analyze_image(self, image_path):
        """Analyze the uploaded image"""
        # Load image
        pil_image = Image.open(image_path).convert('RGB')
        
        # Analyze fashion items
        image_embeds = self.fclip.encode_images([pil_image], batch_size=1)
        text_embeds = self.fclip.encode_text(self.categories, batch_size=32)
        
        # Convert to torch tensors if needed
        if isinstance(image_embeds, np.ndarray):
            image_embeds = torch.from_numpy(image_embeds)
        if isinstance(text_embeds, np.ndarray):
            text_embeds = torch.from_numpy(text_embeds)
        
        # Normalize and compute similarity
        image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)
        text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)
        similarities = (image_embeds @ text_embeds.T).squeeze(0)
        scores, indices = torch.topk(similarities, 10)
        
        # Update fashion items
        self.items_text.delete(1.0, tk.END)
        for i, (idx, score) in enumerate(zip(indices, scores), 1):
            item_text = f"{i}. {self.categories[idx]:<25} {score.item():.1%}\n"
            self.items_text.insert(tk.END, item_text)
        
        # Analyze colors
        color_embeds = self.fclip.encode_text(self.colors, batch_size=32)
        if isinstance(color_embeds, np.ndarray):
            color_embeds = torch.from_numpy(color_embeds)
        
        color_embeds = color_embeds / color_embeds.norm(dim=-1, keepdim=True)
        color_sims = (image_embeds @ color_embeds.T).squeeze(0)
        color_scores, color_indices = torch.topk(color_sims, 5)
        
        self.colors_text.delete(1.0, tk.END)
        for i, (idx, score) in enumerate(zip(color_indices, color_scores), 1):
            color_text = f"{i}. {self.colors[idx]:<15} {score.item():.1%}\n"
            self.colors_text.insert(tk.END, color_text)
        
        # Analyze styles
        style_embeds = self.fclip.encode_text(self.styles, batch_size=32)
        if isinstance(style_embeds, np.ndarray):
            style_embeds = torch.from_numpy(style_embeds)
        
        style_embeds = style_embeds / style_embeds.norm(dim=-1, keepdim=True)
        style_sims = (image_embeds @ style_embeds.T).squeeze(0)
        style_scores, style_indices = torch.topk(style_sims, 5)
        
        self.styles_text.delete(1.0, tk.END)
        for i, (idx, score) in enumerate(zip(style_indices, style_scores), 1):
            style_text = f"{i}. {self.styles[idx]:<15} {score.item():.1%}\n"
            self.styles_text.insert(tk.END, style_text)
        
        # Also show image in a popup
        self.show_image_preview(image_path)
    
    def show_image_preview(self, image_path):
        """Show image preview in a popup"""
        preview_window = tk.Toplevel(self.root)
        preview_window.title("Image Preview")
        
        # Load and resize image
        img = Image.open(image_path)
        img.thumbnail((600, 600))
        
        # Convert to PhotoImage (need to keep reference)
        from PIL import ImageTk
        photo = ImageTk.PhotoImage(img)
        
        label = tk.Label(preview_window, image=photo)
        label.image = photo  # Keep a reference
        label.pack()
    
    def run(self):
        """Run the GUI"""
        self.root.mainloop()


def main():
    """Main function"""
    print("="*50)
    print("Fashion-CLIP Image Analyzer")
    print("Upload images to analyze fashion items!")
    print("="*50)
    
    app = FashionAnalyzerGUI()
    app.run()


if __name__ == "__main__":
    main()
