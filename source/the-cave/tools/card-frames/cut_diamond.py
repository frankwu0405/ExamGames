# Cuts the crystal frame out of diamond-reference.jpg: removes the white background (flood fill from the
# image border), punches out the card, and maps the card hole onto the game's 512x786 card.
# Output covers card-space x -200..712, y -200..986 at 1.4 px/unit (see .wt-tier-4 .wt-ornament in cave-test2.html).
import numpy as np
from PIL import Image,ImageFilter,ImageDraw
from scipy import ndimage as nd
src=Image.open('diamond-reference.jpg').convert('RGB');a=np.array(src).astype(int)
mn=a.min(2);mx=a.max(2);white=(mn>228)&((mx-mn)<22)
lab,n=nd.label(white);border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
fg=nd.binary_opening(~np.isin(lab,list(border)),iterations=2)
lab2,n2=nd.label(fg);sizes=nd.sum(fg,lab2,range(1,n2+1));keep=np.zeros_like(fg)
for i,s in enumerate(sizes):
    if s>400: keep|=lab2==i+1
fg=nd.binary_erosion(keep,iterations=1)
fr=src.copy();fr.putalpha(Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1)))
x0,x1,y0,y1=327,1072,723,1853   # card box in the reference (outer edge of its gold border)
m=Image.new('L',fr.size,255);ImageDraw.Draw(m).rounded_rectangle((x0+1,y0+1,x1-1,y1-1),radius=50,fill=0)
fr.putalpha(Image.fromarray(np.minimum(np.array(fr.getchannel('A')),np.array(m))))
k=1.4;sx=512/(x1-x0);sy=786/(y1-y0)
big=fr.resize((round(fr.size[0]*sx*k),round(fr.size[1]*sy*k)),Image.LANCZOS)
can=Image.new('RGBA',(round(912*k),round(1186*k)),(0,0,0,0))
can.paste(big,(round((200-x0*sx)*k),round((200-y0*sy)*k)),big)
can.save('diamond-frame.webp',quality=88,method=6)

# --- Overlap pass: keep the crystals that sit ON TOP of the card in the reference ---
# Crystal pixels inside the card box are grown from the frame outside it, through anything that is not a
# card colour (gold/cream/brown), never entering the art window. Those pixels stay opaque over our card.
# (In practice run this before the hole punch above and combine: alpha = min(frame, max(hole, keep)).)
