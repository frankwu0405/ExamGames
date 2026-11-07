import sys,base64; sys.path.insert(0,'/tmp/cf/gen')
import d5,lowpoly,ref3
from playwright.sync_api import sync_playwright
seed=int(sys.argv[1]) if len(sys.argv)>1 else 3
s=ref3.frame(seed);open('/tmp/cf/gen/diamond.svg','w').write(s)
b64=base64.b64encode(s.encode()).decode()
cards=['explore','rumble']
def tile(card,bg,wd):
    c=base64.b64encode(open(f'/tmp/cf/{card}.png','rb').read()).decode();h=wd*1006/712
    return f'<div style="background:{bg};padding:14px"><div style="position:relative;width:{wd}px;height:{h}px"><img style="position:absolute;left:{100/712*100}%;top:{110/1006*100}%;width:{512/712*100}%;height:{786/1006*100}%;border-radius:6.5%/4.3%" src="data:image/png;base64,{c}"><img style="position:absolute;inset:0;width:100%;height:100%" src="data:image/svg+xml;base64,{b64}"></div></div>'
html='<body style="margin:0;display:flex;align-items:flex-start;background:#888">'+tile('explore','#06070D',420)+tile('rumble','#FFFDF4',420)+tile('explore','#06070D',220)+'</body>'
open('/tmp/cf/gen/p5.html','w').write(html)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1180,'height':650})
    pg.goto('file:///tmp/cf/gen/p5.html');pg.wait_for_timeout(600);pg.screenshot(path='/tmp/cf/gen/d5.png')
    pg=b.new_page(viewport={'width':712,'height':1006},device_scale_factor=1)
    pg.goto('file:///tmp/cf/gen/diamond.svg');pg.screenshot(path='/tmp/cf/gen/d5full.png',omit_background=True)
    b.close()
