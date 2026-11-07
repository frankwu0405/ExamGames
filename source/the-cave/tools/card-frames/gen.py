import math,sys
W,H=512,786
_id=[0]
def uid(): _id[0]+=1; return f"c{_id[0]}"
def shape(d,base,light,dark,ol,sw=5,hi=True,off=(-3.5,-4.5)):
    """cel-shaded closed path: outline, shadow base, lit area offset, highlight"""
    i=uid()
    s=f'<defs><clipPath id="{i}"><path d="{d}"/></clipPath></defs>'
    s+=f'<path d="{d}" fill="{dark}" stroke="{ol}" stroke-width="{sw}" stroke-linejoin="round"/>'
    s+=f'<g clip-path="url(#{i})"><path d="{d}" fill="{base}" transform="translate({off[0]} {off[1]})"/>'
    if hi: s+=f'<path d="{d}" fill="{light}" transform="translate({off[0]*2.2} {off[1]*2.2}) scale(.97)" opacity=".0"/>'
    s+='</g>'
    return s
def stroke3(d,w,base,light,ol,olw=5):
    return (f'<path d="{d}" fill="none" stroke="{ol}" stroke-width="{w+olw*2}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{base}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{light}" stroke-width="{max(2,w*.28)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(-{w*.12} -{w*.14})" opacity=".9"/>')
def rr(x,y,w,h,r): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/>'
def ring(inset,w,color,r0=30,extra=''):
    x=-inset;
    return f'<rect x="{x}" y="{x}" width="{W+2*inset}" height="{H+2*inset}" rx="{r0+inset}" fill="none" stroke="{color}" stroke-width="{w}" {extra}/>'
def band(w,P,gap=0):
    """beveled band hugging the card; w total width outward"""
    o=w+gap
    s=ring(o/2+0.0,w+10,P['ol'])            # outline
    s+=ring(o/2,w,P['shade'])
    s+=ring(o/2+w*.12,w*.76,P['base'])
    s+=ring(o/2+w*.26,w*.30,P['light'],extra='opacity=".85"')
    # inner dark keyline against the card
    s+=ring(0.5,3,P['ol'])
    return s
def rivet(x,y,r,P):
    return (f'<circle cx="{x}" cy="{y}" r="{r+2.5}" fill="{P["ol"]}"/><circle cx="{x}" cy="{y}" r="{r}" fill="{P["shade"]}"/>'
            f'<circle cx="{x-r*.15}" cy="{y-r*.2}" r="{r*.78}" fill="{P["base"]}"/><circle cx="{x-r*.38}" cy="{y-r*.42}" r="{r*.28}" fill="#fff" opacity=".9"/>')
def gem(x,y,s,col,ol,rot=0):
    c,l,d=col
    a=f'translate({x} {y}) rotate({rot})'
    pts=[(0,-s),(s*.75,0),(0,s*1.1),(-s*.75,0)]
    P=' '.join(f'{px},{py}' for px,py in pts)
    t=f'<g transform="{a}"><polygon points="{P}" fill="{d}" stroke="{ol}" stroke-width="4.5" stroke-linejoin="round"/>'
    t+=f'<polygon points="0,{-s} {s*.75},0 0,{s*.12} " fill="{c}"/><polygon points="0,{-s} {-s*.75},0 0,{s*.12}" fill="{l}"/>'
    t+=f'<polygon points="{-s*.75},0 0,{s*1.1} 0,{s*.12}" fill="{c}" opacity=".85"/>'
    t+=f'<path d="M{-s*.28},{-s*.45} L{-s*.1},{-s*.7}" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>'
    return t
def leaf(x,y,L,wd,ang,P):
    d=f'M0 0C{-wd} {-L*.28} {-wd*.8} {-L*.8} 0 {-L}C{wd*.8} {-L*.8} {wd} {-L*.28} 0 0Z'
    g=f'<g transform="translate({x} {y}) rotate({ang})">'+shape(d,P['base'],P['light'],P['shade'],P['ol'],4.5)
    g+=f'<path d="M0 -4Q{-2} {-L*.5} 0 {-L*.82}" fill="none" stroke="{P["light"]}" stroke-width="3" stroke-linecap="round"/>'
    g+=f'<path d="M{-wd*.3} {-L*.22}Q{-wd*.7} {-L*.35} {-wd*.78} {-L*.5}" fill="none" stroke="{P["light"]}" stroke-width="2" opacity=".6" stroke-linecap="round"/></g>'
    return g
def crystal(x,y,L,wd,ang,C,ol):
    """pointed hexagonal prism crystal, base at (0,0), tip up"""
    c,l,d=C
    pts=[(-wd/2,0),(-wd*.62,-L*.62),(0,-L),(wd*.62,-L*.62),(wd/2,0)]
    P=' '.join(f'{a},{b}' for a,b in pts)
    g=f'<g transform="translate({x} {y}) rotate({ang})"><polygon points="{P}" fill="{d}" stroke="{ol}" stroke-width="4.5" stroke-linejoin="round"/>'
    g+=f'<polygon points="{-wd/2},0 {-wd*.62},{-L*.62} 0,{-L} {-wd*.08},{-L*.62} {-wd*.06},0" fill="{l}"/>'
    g+=f'<polygon points="{-wd*.08},{-L*.62} 0,{-L} {wd*.62},{-L*.62} {wd*.5},0 {-wd*.06},0" fill="{c}"/>'
    g+=f'<path d="M{-wd*.3},{-L*.2} L{-wd*.3},{-L*.55}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>'
    g+=f'<polyline points="{-wd*.62},{-L*.62} {-wd*.08},{-L*.62} 0,{-L}" fill="none" stroke="{ol}" stroke-width="2" opacity=".5"/></g>'
    return g
def star(x,y,r,col='#fff'):
    return f'<path transform="translate({x} {y})" d="M0 {-r}Q{r*.15} {-r*.15} {r} 0Q{r*.15} {r*.15} 0 {r}Q{-r*.15} {r*.15} {-r} 0Q{-r*.15} {-r*.15} 0 {-r}Z" fill="{col}" stroke="#0003" stroke-width="1"/>'
def mirror4(fn):
    """draw fn() at top-left corner (origin 0,0 = card corner) and mirror to 4 corners"""
    s=''
    for tx,ty,sx,sy in [(0,0,1,1),(W,0,-1,1),(0,H,1,-1),(W,H,-1,-1)]:
        s+=f'<g transform="translate({tx} {ty}) scale({sx} {sy})">{fn()}</g>'
    return s
def svg(body,defs=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -110 712 1006">{body}</svg>'
