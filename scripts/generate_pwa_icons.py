import zlib
import struct
import math

def create_png(width, height, filename):
    # Generates a smooth, rounded gradient icon with a petal/vitality motif
    raw_rows = []
    
    # Corner radius
    radius = int(width * 0.22)
    center_x = width / 2.0
    center_y = height / 2.0
    
    for y in range(height):
        row = bytearray([0]) # Filter byte 0 (None)
        ny = (y - center_y) / (height / 2.0) # -1.0 to 1.0
        
        for x in range(width):
            nx = (x - center_x) / (width / 2.0) # -1.0 to 1.0
            dist_center = math.sqrt(nx*nx + ny*ny)
            
            # Check rounded box bounds
            dx = max(0, abs(x - center_x) - (width/2 - radius))
            dy = max(0, abs(y - center_y) - (height/2 - radius))
            dist_corner = math.sqrt(dx*dx + dy*dy)
            
            if dist_corner > radius:
                # Transparent outside rounded box
                row.extend([0, 0, 0, 0])
                continue
                
            # Base dark emerald gradient (#1B3B2B to #2D6A4F to #3B8A68)
            t = (x + y) / (width + height)
            r = int(27 + t * 32)
            g = int(59 + t * 79)
            b = int(43 + t * 61)
            a = 255
            
            # Circle guide line
            if abs(dist_center - 0.62) < 0.02:
                r = int(r * 0.4 + 82 * 0.6)
                g = int(g * 0.4 + 183 * 0.6)
                b = int(b * 0.4 + 136 * 0.6)
                
            # Crescent motif
            # Outer circle at center (0, 0) radius 0.46
            # Inner cutout circle at (-0.18, 0.0) radius 0.36
            d_outer = math.sqrt(nx*nx + ny*ny)
            d_inner = math.sqrt((nx + 0.18)**2 + (ny)**2)
            
            if d_outer <= 0.45 and d_inner >= 0.28:
                # Soft mint gradient (#95D5B2 to #D8F3DC)
                mt = (ny + 0.5)
                mr = int(149 + mt * 67)
                mg = int(213 + mt * 30)
                mb = int(178 + mt * 42)
                r, g, b = max(0, min(255, mr)), max(0, min(255, mg)), max(0, min(255, mb))
                
            # Central Vitality Dot (orange #F4A261)
            d_dot = math.sqrt((nx - 0.04)**2 + (ny)**2)
            if d_dot <= 0.11:
                r, g, b = 244, 162, 97
                
            row.extend([r, g, b, a])
            
        raw_rows.append(bytes(row))
        
    raw_data = b''.join(raw_rows)
    compressed_data = zlib.compress(raw_data, 9)
    
    def chunk(chunk_type, data):
        length = struct.pack('!I', len(data))
        crc = struct.pack('!I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return length + chunk_type + data + crc
        
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('!IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr_data))
    png.extend(chunk(b'IDAT', compressed_data))
    png.extend(chunk(b'IEND', b''))
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")

create_png(192, 192, 'public/pwa-192x192.png')
create_png(512, 512, 'public/pwa-512x512.png')
create_png(180, 180, 'public/apple-touch-icon.png')
create_png(180, 180, 'public/apple-touch-icon-180x180.png')
