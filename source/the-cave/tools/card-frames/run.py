import sys; sys.path.insert(0,'/tmp/cf/gen')
import tiers,importlib
out={}
for n in ['bronze','silver','gold','diamond']:
    s=getattr(tiers,'tier_'+n)(); open(f'/tmp/cf/gen/{n}.svg','w').write(s); out[n]=s
from playwright.sync_api import sync_playwright
import base64
card=base64.b64encode(open('/tmp/cf/explore.png','rb').read()).decode()
html='<body style="margin:0;background:#2a3a4c;display:flex;gap:10px;padding:10px">'
for n,s in out.items():
    b=base64.b64encode(s.encode()).decode()
    html+=f'<div style="position:relative;width:356px;height:503px"><img style="position:absolute;left:{100/712*356}px;top:{110/1006*503}px;width:{512/712*356}px;height:{786/1006*503}px" src="data:image/png;base64,{card}"><img style="position:absolute;inset:0;width:100%;height:100%" src="data:image/svg+xml;base64,{b}"></div>'
open('/tmp/cf/gen/p.html','w').write(html)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1480,'height':525},device_scale_factor=1)
    pg.goto('file:///tmp/cf/gen/p.html');pg.wait_for_timeout(500);pg.screenshot(path='/tmp/cf/gen/all.png')
    pg=b.new_page(viewport={'width':712,'height':1006});
    for n in out:
        pg.goto(f'file:///tmp/cf/gen/{n}.svg');pg.screenshot(path=f'/tmp/cf/gen/{n}.png',omit_background=True)
    b.close()
