from PIL import Image, ImageDraw, ImageFont
import os

# Dimensions
width = 626
height = 980

# Colors
bg_color = (252, 250, 242) # #fcfaf2
grid_color = (143, 129, 114, 20) # Subtle grid
header_color = (37, 59, 54) # #253b36
cow_white = (255, 255, 255)
horse_tan = (245, 239, 223)
line_color = (38, 31, 25)

# Create image
img = Image.new('RGB', (width, height), color=bg_color)
draw = ImageDraw.Draw(img, 'RGBA')

# 1. Draw Grid
grid_spacing = 40
for x in range(0, width, grid_spacing):
    draw.line([(x, 0), (x, height)], fill=(143, 129, 114, 30), width=1)
for y in range(0, height, grid_spacing):
    draw.line([(0, y), (width, y)], fill=(143, 129, 114, 30), width=1)

# 2. Header Bar
draw.rectangle([0, 0, width, 120], fill=header_color)

# 3. Decorative Circles
draw.ellipse([width-150, -150, width+150, 150], fill=(37, 59, 54, 15))

# 4. Draw Characters at the bottom
def draw_cow(d, x, y, s):
    # Body
    d.rounded_rectangle([x-20*s, y, x+20*s, y+30*s], radius=8*s, fill=cow_white, outline=line_color, width=2)
    # Head
    d.rounded_rectangle([x-15*s, y-25*s, x+15*s, y], radius=10*s, fill=cow_white, outline=line_color, width=2)
    # Horns
    d.line([x-10*s, y-25*s, x-15*s, y-35*s], fill=line_color, width=2)
    d.line([x+10*s, y-25*s, x+15*s, y-35*s], fill=line_color, width=2)
    # Snout
    d.rounded_rectangle([x-10*s, y-10*s, x+10*s, y+2*s], radius=6*s, fill=(248, 215, 218), outline=line_color, width=1)
    # Eyes
    d.ellipse([x-7*s, y-16*s, x-3*s, y-12*s], fill=line_color)
    d.ellipse([x+3*s, y-16*s, x+7*s, y-12*s], fill=line_color)

def draw_horse(d, x, y, s):
    # Body
    d.rounded_rectangle([x-18*s, y, x+18*s, y+35*s], radius=10*s, fill=horse_tan, outline=line_color, width=2)
    # Neck
    d.rounded_rectangle([x-12*s, y-15*s, x+3*s, y+5*s], radius=5*s, fill=horse_tan, outline=line_color, width=2)
    # Head
    d.rounded_rectangle([x-12*s, y-35*s, x+16*s, y-13*s], radius=8*s, fill=horse_tan, outline=line_color, width=2)
    # Mane
    d.polygon([(x-12*s, y-35*s), (x-18*s, y-45*s), (x-5*s, y-40*s), (x-5*s, y-15*s)], fill=(139, 69, 19))
    # Eyes
    d.ellipse([x+4*s, y-28*s, x+8*s, y-24*s], fill=line_color)
    d.ellipse([x+12*s, y-28*s, x+16*s, y-24*s], fill=line_color)

# Characters position
draw_cow(draw, 120, 850, 2.0)
draw_horse(draw, 500, 850, 2.0)

# 5. Accent lines
draw.line([40, 140, 100, 140], fill=header_color, width=4)
draw.line([40, 140, 40, 200], fill=header_color, width=4)

# Save
output_path = 'assets/images/share-cards/report-card.jpg'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, quality=95)
print(f"Image saved to {output_path}")
