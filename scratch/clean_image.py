import sys
import os
from PIL import Image

def clean_background(image_path, output_path):
    img = Image.open(image_path).convert("RGB")
    width, height = img.size
    pixels = img.load()
    
    # Target color: #0a0e1a => (10, 14, 26)
    target_color = (10, 14, 26)
    
    # BFS Queue
    seeds = [(10, 10), (width - 11, 10), (10, height - 11), (width - 11, height - 11)]
    ref_color = pixels[10, 10]
    
    queue = list(seeds)
    visited = set(seeds)
    
    threshold = 45  # Threshold for color distance
    
    def color_dist(c1, c2):
        return sum((a - b)**2 for a, b in zip(c1, c2))**0.5
        
    while queue:
        x, y = queue.pop(0)
        pixels[x, y] = target_color
        
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    curr_color = pixels[nx, ny]
                    if color_dist(curr_color, ref_color) < threshold:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
    # Trim 4px outer border
    border_px = 4
    for x in range(width):
        for y in range(height):
            if x < border_px or x >= width - border_px or y < border_px or y >= height - border_px:
                pixels[x, y] = target_color
                
    img.save(output_path, "PNG")
    print(f"Cleaned image saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python clean_image.py <input_path> <output_path>")
    else:
        clean_background(sys.argv[1], sys.argv[2])
