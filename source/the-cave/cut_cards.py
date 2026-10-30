import numpy as np, json, os
from PIL import Image, ImageDraw, ImageFilter
SRC = "/mnt/user-data/uploads/Desktop/The Cave Cards"
WORDS = {1:['cart','explore','pit','rumble'],2:['drop','flush','loop','swift'],3:['cliff','fetch','thick','tunnel'],4:['clear','island','sign','flag'],
 5:['lie','smash','wave','voice'],6:['fog','kind','greedy','treasure'],7:['pocket','trail','paddle','beam'],8:['swarm','horn','fault','escape'],
 9:['piece','promise','sailor','trust'],10:['crew','snatch','ditch','jewel']}
def gaps(prof, n):  # find the split nearest the middle where the profile is ~empty
    mid = n // 2; empty = np.where(prof < 0.02)[0]
    if len(empty) == 0: return mid
    return int(empty[np.argmin(abs(empty - mid))])
out = {}
for ep, words in WORDS.items():
    f = f"{SRC}/The Cave Cards{'' if ep == 1 else ' ' + str(ep)}.png"
    im = Image.open(f).convert('RGB'); a = np.asarray(im).astype(int)
    ink = (a.min(axis=2) < 232)
    cx = gaps(ink.mean(axis=0), im.width); cy = gaps(ink.mean(axis=1), im.height)
    quads = [(0, 0, cx, cy), (cx, 0, im.width, cy), (0, cy, cx, im.height), (cx, cy, im.width, im.height)]
    for (x0, y0, x1, y1), w in zip(quads, words):
        sub = ink[y0:y1, x0:x1]; ys, xs = np.where(sub)
        bx0, by0, bx1, by1 = x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1
        card = im.crop((bx0, by0, bx1, by1))
        # transparent corners: flood the near-white outside area from the four corners
        m = Image.fromarray(((np.asarray(card).min(axis=2) >= 232) * 255).astype('uint8'))
        for c in [(0, 0), (m.width - 1, 0), (0, m.height - 1), (m.width - 1, m.height - 1)]:
            if m.getpixel(c) == 255: ImageDraw.floodfill(m, c, 128)
        alpha = Image.fromarray(np.where(np.asarray(m) == 128, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
        card = card.convert('RGBA'); card.putalpha(alpha)
        W = 512; card = card.resize((W, round(card.height * W / card.width)), Image.LANCZOS)
        os.makedirs(f'cards/ep{ep}', exist_ok=True); p = f'cards/ep{ep}/{w}.webp'; card.save(p, 'WEBP', quality=84, method=6)
        out[w] = (ep, card.size, os.path.getsize(p))
tot = sum(v[2] for v in out.values()); print(len(out), 'cards', round(tot/1024), 'KB total; avg', round(tot/len(out)/1024), 'KB')
print({k: v[1] for k, v in list(out.items())[:6]})
