import sys,base64; sys.path.insert(0,'/tmp/cf/gen')
import t6
from playwright.sync_api import sync_playwright
out={n:getattr(t6,n)() for n in ['bronze','silver','gold']}
for n,s in out.items(): open(f'/tmp/cf/gen/{n}.svg','w').write(s)
card=base64.b64encode(open('/tmp/cf/rumble.png','rb').read()).decode()
html='<body style="margin:0;background:#172c43;display:flex;gap:20px;padding:20px">'
for n,s in out.items():
    st='left:-5.618%;top:-3.976%;width:111.236%;height:107.952%' if n=='gold' else 'inset:0;width:100%;height:100%'
    b=base64.b64encode(s.encode()).decode()
    html+=f'<div style="position:relative;width:400px;height:565px"><img style="position:absolute;left:14.045%;top:10.934%;width:71.91%;height:78.13%;border-radius:6.5%/4.3%" src="data:image/png;base64,{card}"><img style="position:absolute;{st}" src="data:image/svg+xml;base64,{b}"></div>'
open('/tmp/cf/gen/p6.html','w').write(html)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':605})
    pg.goto('file:///tmp/cf/gen/p6.html');pg.wait_for_timeout(800);pg.screenshot(path='/tmp/cf/gen/t6.png')
    for n in out:
        pg=b.new_page(viewport={'width':792,'height':1086} if n=='gold' else {'width':712,'height':1006}); pg.goto(f'file:///tmp/cf/gen/{n}.svg');pg.screenshot(path=f'/tmp/cf/gen/{n}6.png',omit_background=True)
    b.close()
from PIL import Image
m=Image.new('RGB',(1068,300),'#172c43')
for i,n in enumerate(out):
    im=Image.open(f'/tmp/cf/gen/{n}6.png').crop((0,0,356,300));m.paste(im,(i*356,0),im)
m.save('/tmp/cf/gen/t6c.png')
