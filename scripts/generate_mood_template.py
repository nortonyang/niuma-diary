from PIL import Image, ImageDraw, ImageFont
import os

# Dimensions
width = 626
height = 980

# Colors
bg_sunny = (223, 240, 181) # Sunny sky color
bg_storm = (185, 201, 199) # Stormy color
line_color = (38, 31, 25)

def create_mood_template(path, main_color):
    img = Image.new('RGB', (width, height), color=(255, 253, 248))
    draw = ImageDraw.Draw(img, 'RGBA')

    # 1. Background Scene Area (505 - 609 in Canvas units)
    draw.rounded_rectangle([163, 505, 463, 609], radius=48, fill=main_color)

    # 2. Main Character Icons at bottom
    def draw_character_simple(d, x, y, s, type='cow'):
        if type == 'cow':
            d.rounded_rectangle([x-15*s, y, x+15*s, y+20*s], radius=5*s, fill=(255,255,255), outline=line_color, width=2)
            d.rounded_rectangle([x-12*s, y-15*s, x+12*s, y], radius=6*s, fill=(255,255,255), outline=line_color, width=2)
        else:
            d.rounded_rectangle([x-13*s, y, x+13*s, y+25*s], radius=7*s, fill=(245, 239, 223), outline=line_color, width=2)
            d.rounded_rectangle([x-10*s, y-20*s, x+10*s, y-5*s], radius=5*s, fill=(245, 239, 223), outline=line_color, width=2)

    # Decorative bottom icons
    draw_character_simple(draw, 100, 880, 1.5, 'cow')
    draw_character_simple(draw, 526, 880, 1.5, 'horse')

    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, quality=95)

# Generate a more stylized template
output_path = 'assets/images/share-cards/mood-card-template.jpg'
create_mood_template(output_path, bg_sunny)
print(f"Template saved to {output_path}")
