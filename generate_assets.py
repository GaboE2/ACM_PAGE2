import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_logo():
    # Width 360, Height 90, Transparent RGBA
    img = Image.new('RGBA', (360, 90), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw ACM diamond logo
    # Center of diamond at (45, 45), radius 30
    cx, cy, r = 45, 45, 32
    # Diamond points (rotated square)
    diamond = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
    draw.polygon(diamond, fill=(255, 255, 255, 255))
    
    # Inner circle or diamond cutout in primary blue (#2E4CBC)
    inner_r = 23
    draw.ellipse((cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r), fill=(46, 76, 188, 255))
    
    # Inner ACM text or styling inside circle
    try:
        font_acm = ImageFont.truetype("arialbd.ttf", 15)
        font_sub = ImageFont.truetype("arialbd.ttf", 28)
        font_small = ImageFont.truetype("arial.ttf", 11)
    except:
        font_acm = ImageFont.load_default()
        font_sub = font_acm
        font_small = font_acm
        
    draw.text((cx, cy), "acm", fill=(255, 255, 255, 255), anchor="mm", font=font_acm)
    
    # Next to logo: "UCSP" in bold white
    draw.text((95, 34), "UCSP", fill=(255, 255, 255, 255), font=font_sub)
    # Chapter subtitle
    draw.text((97, 62), "STUDENT CHAPTER", fill=(255, 244, 226, 210), font=font_small)
    
    img.save('logos/acm_ucsp.png', 'PNG')
    print("Created logos/acm_ucsp.png")

def create_auditorium_photo():
    # 1200 x 750 realistic auditorium event photo
    w, h = 1200, 750
    img = Image.new('RGB', (w, h), (18, 26, 48))
    draw = ImageDraw.Draw(img)
    
    # Warm auditorium ceiling and wood paneled walls
    # Ceiling lights gradient
    for y in range(h):
        ratio = y / h
        # Top is warm wooden panels and ceiling lights, bottom is tiered seating
        if y < 280:
            r = int(190 * (1 - ratio*0.7) + 30 * ratio)
            g = int(140 * (1 - ratio*0.7) + 38 * ratio)
            b = int(90 * (1 - ratio*0.7) + 65 * ratio)
        else:
            # Auditorium seats & crowd
            r = int(25 + (y - 280) * 0.08)
            g = int(35 + (y - 280) * 0.08)
            b = int(60 + (y - 280) * 0.06)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
        
    # Auditorium stage screen (left/center)
    screen_rect = [(200, 100), (900, 360)]
    draw.rectangle(screen_rect, fill=(28, 48, 120), outline=(255, 244, 226), width=3)
    
    # Stage lighting beam
    for i in range(15):
        alpha = int(40 - i * 2)
        draw.polygon([(150 + i*10, 50), (950 - i*10, 50), (1050 - i*15, 450), (50 + i*15, 450)], 
                     fill=None, outline=(255, 240, 200))
    
    # Presentation title on screen
    try:
        font_scr_title = ImageFont.truetype("arialbd.ttf", 36)
        font_scr_sub = ImageFont.truetype("arial.ttf", 20)
        font_watermark = ImageFont.truetype("arialbd.ttf", 22)
    except:
        font_scr_title = ImageFont.load_default()
        font_scr_sub = font_scr_title
        font_watermark = font_scr_title

    draw.text((550, 190), "Capítulo Estudiantil ACM UCSP", fill=(255, 255, 255), anchor="mm", font=font_scr_title)
    draw.text((550, 240), "Inauguración de Actividades Académicas 2026", fill=(255, 210, 180), anchor="mm", font=font_scr_sub)
    draw.text((550, 280), "Auditorio San Juan Pablo II · UCSP Arequipa", fill=(200, 220, 255), anchor="mm", font=font_scr_sub)
    
    # Audience silhouettes in tiered seating
    # Rows of heads
    import random
    random.seed(42)
    rows = [
        (380, 70, 14, 18),
        (430, 85, 17, 22),
        (490, 100, 20, 26),
        (560, 115, 24, 32),
        (640, 130, 28, 38),
        (720, 145, 34, 45)
    ]
    for row_y, count, head_w, head_h in rows:
        # Desk row line
        draw.line([(0, row_y + 10), (w, row_y + 10)], fill=(45, 55, 75), width=4)
        step = w / (count + 1)
        for c in range(count):
            hx = int((c + 1) * step + random.randint(-8, 8))
            hy = row_y - head_h + random.randint(-4, 4)
            # Head
            draw.ellipse((hx - head_w//2, hy - head_h, hx + head_w//2, hy), fill=(20, 24, 38))
            # Shoulders
            draw.chord((hx - head_w*1.4, hy - 4, hx + head_w*1.4, hy + head_h*1.5), 180, 360, fill=(28, 34, 52))
            
            # Some laptops open with subtle warm/blue screen glow
            if random.random() > 0.5:
                lx = hx + random.randint(-5, 5)
                ly = row_y - 2
                draw.rectangle((lx - 12, ly - 10, lx + 12, ly), fill=(180, 210, 255))

    # Badge overlay in top right
    draw.rounded_rectangle([(w - 260, 30), (w - 30, 75)], radius=8, fill=(46, 76, 188))
    draw.text((w - 145, 52), "ACM UCSP 2026", fill=(255, 255, 255), anchor="mm", font=font_watermark)

    img.save('fotosacm/evento_principal.jpg', 'JPEG', quality=92)
    print("Created fotosacm/evento_principal.jpg")

def create_event_card_photos():
    events = [
        ("hackathon.jpg", "Hackathon UCSP 2026", "Desarrollo & Algoritmos", (30, 41, 79)),
        ("workshop_cxx.jpg", "Workshop C++ Avanzado", "Sistemas y Memoria", (46, 76, 188)),
        ("tech_talk.jpg", "Charla de Inteligencia Artificial", "IA & Redes Neuronales", (20, 80, 95)),
        ("icpc_contest.jpg", "Torneo Algorítmico ICPC", "Programación Competitiva", (130, 30, 25))
    ]
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 26)
        font_sub = ImageFont.truetype("arial.ttf", 16)
    except:
        font_title = ImageFont.load_default()
        font_sub = font_title

    for filename, title, cat, base_color in events:
        w, h = 600, 380
        img = Image.new('RGB', (w, h), base_color)
        draw = ImageDraw.Draw(img)
        
        # Diagonal accent pattern
        for x in range(-h, w, 40):
            draw.line([(x, 0), (x + h, h)], fill=(base_color[0]+15, base_color[1]+15, base_color[2]+20), width=3)
            
        # Tech geometric shapes
        draw.rectangle([(40, 40), (w-40, h-40)], outline=(255, 255, 255, 60), width=2)
        draw.rounded_rectangle([(60, 60), (220, 95)], radius=6, fill=(250, 45, 26))
        draw.text((140, 77), cat.upper(), fill=(255, 255, 255), anchor="mm", font=font_sub)
        
        draw.text((60, 200), title, fill=(255, 255, 255), font=font_title)
        draw.text((60, 245), "Capítulo Estudiantil ACM UCSP", fill=(255, 244, 226), font=font_sub)
        draw.text((60, 275), "Campus Campiña Paisajista · Arequipa", fill=(200, 210, 230), font=font_sub)
        
        img.save(f'fotosacm/{filename}', 'JPEG', quality=90)
        print(f"Created fotosacm/{filename}")

def create_team_photos():
    members = [
        ("fernando_peralta.jpg", "Fernando Peralta", "Chair", (46, 76, 188)),
        ("valeria_torres.jpg", "Valeria Torres", "Vice Chair", (28, 90, 110)),
        ("diego_mendoza.jpg", "Diego Mendoza", "Secretario", (45, 60, 90)),
        ("camila_rojas.jpg", "Camila Rojas", "Tesorera", (120, 40, 60)),
        ("gabriel_baca.jpg", "Gabriel Baca", "Lead Webmaster", (35, 75, 140)),
        ("alejandro_quispe.jpg", "Alejandro Quispe", "Competitive Prog.", (40, 85, 70)),
        ("sofia_herrera.jpg", "Sofía Herrera", "Academic & Workshops", (90, 45, 110)),
        ("lucas_vargas.jpg", "Lucas Vargas", "Logistics & Outreach", (60, 70, 80))
    ]
    try:
        font_initials = ImageFont.truetype("arialbd.ttf", 90)
        font_name = ImageFont.truetype("arialbd.ttf", 22)
    except:
        font_initials = ImageFont.load_default()
        font_name = font_initials

    for filename, name, role, color in members:
        w, h = 400, 400
        img = Image.new('RGB', (w, h), (245, 246, 250))
        draw = ImageDraw.Draw(img)
        
        # Circle avatar background
        draw.ellipse((40, 40, 360, 360), fill=color)
        
        # Initials
        initials = "".join([part[0] for part in name.split()[:2]])
        draw.text((200, 190), initials, fill=(255, 255, 255), anchor="mm", font=font_initials)
        
        # Subtle ring
        draw.arc((30, 30, 370, 370), 0, 360, fill=(250, 45, 26), width=4)
        
        img.save(f'fotosacm/{filename}', 'JPEG', quality=90)
        print(f"Created fotosacm/{filename}")

create_logo()
create_auditorium_photo()
create_event_card_photos()
create_team_photos()
print("All initial images created successfully!")
