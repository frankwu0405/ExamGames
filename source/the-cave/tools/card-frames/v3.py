import math,random
W,H=512,786
_n=[0]
def uid(p='i'): _n[0]+=1; return f'{p}{_n[0]}'
PAL={
 'bronze':['#2a1206','#5e2c10','#9a521e','#d0813e','#f0b070','#ffe3b8'],
 'silver':['#1c2640','#46567a','#8091b2','#bccbe0','#ecf3fb','#ffffff'],
 'gold':  ['#3f1d03','#85470a','#c47a14','#f0b52c','#ffe074','#fff8d0'],
 'diamond':['#17195a','#3a49b0','#6aa6e6','#b4e8fb','#effeff','#ffffff'],
}
class Ctx:
    def __init__(s,pal): s.p=PAL[pal]; s.defs=[]; s.body=[]
    def add(s,x): s.body.append(x)
    def grad(s,stops,x1=0,y1=0,x2=1,y2=1,units='objectBoundingBox'):
        i=uid('g'); st=''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o,c in stops)
        s.defs.append(f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" gradientUnits="{units}">{st}</linearGradient>'); return f'url(#{i})'
    def rad(s,stops,cx=.5,cy=.5,r=.5):
        i=uid('r'); st=''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o,c,a in stops)
        s.defs.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{st}</radialGradient>'); return f'url(#{i})'
    def svg(s):
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -110 712 1006"><defs>{"".join(s.defs)}</defs>{"".join(s.body)}</svg>'

def rect_ring(c,w,col,extra='',dx=0,dy=0):
    x=-c; return f'<rect x="{x+dx}" y="{x+dy}" width="{W+2*c}" height="{H+2*c}" rx="{max(2,30+c)}" fill="none" stroke="{col}" stroke-width="{w}" {extra}/>'
def tube(cx,c,w,pal,ol=None):
    """polished convex tube centred c px outside the card edge"""
    p=pal; ol=ol or p[0]; o=rect_ring(c,w+5,ol)
    prof=[(1,1),(.88,2),(.68,3),(.46,4),(.24,5)]
    k=w*.07
    cols=[p[1],p[2],p[3],p[4],p[5]]
    o+=rect_ring(c,w,p[1])
    for i,(f,ci) in enumerate(prof[1:],1):
        o+=rect_ring(c,w*f,p[ci],dx=-k*i*.55,dy=-k*i*.7)
    o+=rect_ring(c,max(1.6,w*.07),'#fff',extra='opacity=".85"',dx=-k*3.2,dy=-k*3.8)
    return o
def channel(cx,c,w,pal):
    p=pal
    return rect_ring(c,w+2,p[0])+rect_ring(c,w-2,p[1])+rect_ring(c,w-5,p[2],extra='opacity=".55"',dx=1.6,dy=2)+rect_ring(c,w-9,p[1],extra='opacity=".8"',dx=-.5,dy=-.5)

def perim_dense(o):
    R=30+o;x0,y0,x1,y1=-o,-o,W+o,H+o;cx=W/2
    segs=[('l',(cx,y0),(x1-R,y0)),('a',(x1-R,y0+R),-90,0),('l',(x1,y0+R),(x1,y1-R)),('a',(x1-R,y1-R),0,90),('l',(x1-R,y1),(x0+R,y1)),
          ('a',(x0+R,y1-R),90,180),('l',(x0,y1-R),(x0,y0+R)),('a',(x0+R,y0+R),180,270),('l',(x0+R,y0),(cx,y0))]
    d=[]
    for s in segs:
        if s[0]=='l':
            a,b=s[1],s[2];L=math.hypot(b[0]-a[0],b[1]-a[1]);k=max(2,int(L));ux,uy=(b[0]-a[0])/L,(b[1]-a[1])/L
            for i in range(k): t=i/k;d.append((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,uy,-ux))
        else:
            c,a0,a1=s[1],s[2],s[3];k=max(2,int(R*math.pi/2))
            for i in range(k):
                th=math.radians(a0+(a1-a0)*i/k);d.append((c[0]+R*math.cos(th),c[1]+R*math.sin(th),math.cos(th),math.sin(th)))
    return d
def perim(o,n,start=0.0):
    d=perim_dense(o);T=len(d);return [(*d[int((i+start)*T/n)%T],i) for i in range(n)]
def zones(rc,rm,rs): return [(0,0,rc),(W,0,rc),(0,H,rc),(W,H,rc),(W/2,0,rm),(W/2,H,rm),(0,H/2,rs),(W,H/2,rs)]
def inz(x,y,z): return any(math.hypot(x-a,y-b)<r for a,b,r in z)
def deg(nx,ny): return math.degrees(math.atan2(nx,-ny))

def mirror4(fn):
    s=''
    for tx,ty,sx,sy in [(0,0,1,1),(W,0,-1,1),(0,H,1,-1),(W,H,-1,-1)]:
        s+=f'<g transform="translate({tx} {ty}) scale({sx} {sy})">{fn()}</g>'
    return s

# ---------- components
def leaf(C,x,y,L,wd,ang,fold=True,ol=None):
    p=C.p;ol=ol or p[0]
    l=f'M0 0C{-wd} {-L*.3} {-wd*.85} {-L*.78} 0 {-L}Z'; r=f'M0 0C{wd} {-L*.3} {wd*.85} {-L*.78} 0 {-L}Z'
    gl=C.grad([(0,p[3]),(.6,p[4]),(1,p[5])],0,1,0,0); gr=C.grad([(0,p[1]),(1,p[2])],0,1,0,0)
    full=f'M0 0C{-wd} {-L*.3} {-wd*.85} {-L*.78} 0 {-L}C{wd*.85} {-L*.78} {wd} {-L*.3} 0 0Z'
    g=f'<g transform="translate({x} {y}) rotate({ang})"><path d="{full}" fill="{ol}" stroke="{ol}" stroke-width="6" stroke-linejoin="round"/>'
    g+=f'<path d="{l}" fill="{gl}"/><path d="{r}" fill="{gr}"/>'
    g+=f'<path d="M0 -2L0 {-L*.9}" stroke="{p[0]}" stroke-width="2" opacity=".7"/>'
    for t in (.3,.5,.7):
        g+=f'<path d="M0 {-L*t}Q{wd*.35} {-L*t-wd*.1} {wd*.62} {-L*t-wd*.45}" fill="none" stroke="{p[1]}" stroke-width="1.5" opacity=".6"/>'
        g+=f'<path d="M0 {-L*t}Q{-wd*.35} {-L*t-wd*.1} {-wd*.62} {-L*t-wd*.45}" fill="none" stroke="{p[2]}" stroke-width="1.5" opacity=".45"/>'
    return g+f'<path d="M{-wd*.35} {-L*.22}Q{-wd*.55} {-L*.45} {-wd*.3} {-L*.7}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>'
def bead(C,x,y,r,col=None):
    p=C.p; g=C.rad([(0,'#fff',1),(.25,col or p[5],1),(.7,col or p[3],1),(1,p[2],1)],.35,.3,.75)
    return f'<circle cx="{x}" cy="{y}" r="{r+1.8}" fill="{p[0]}"/><circle cx="{x}" cy="{y}" r="{r}" fill="{g}"/>'
def pearl(C,x,y,r):
    g=C.rad([(0,'#fff',1),(.4,'#f1f5ff',1),(1,'#9fb0cf',1)],.35,.3,.8)
    return f'<circle cx="{x}" cy="{y}" r="{r+1.8}" fill="{C.p[0]}"/><circle cx="{x}" cy="{y}" r="{r}" fill="{g}"/>'
def star(x,y,r,col='#fff',op=1):
    return f'<path transform="translate({x} {y})" d="M0 {-r}Q{r*.12} {-r*.12} {r} 0Q{r*.12} {r*.12} 0 {r}Q{-r*.12} {r*.12} {-r} 0Q{-r*.12} {-r*.12} 0 {-r}Z" fill="{col}" opacity="{op}"/>'
GEM={'ruby':('#ff4a63','#ffc0c8','#a8102c','#6b0818'),'sapph':('#3d8dee','#b4dcff','#1a52b8','#0d2c78'),'emer':('#2fcf72','#b4f8cc','#14893f','#0a5426'),
     'ameth':('#b383ff','#eadcff','#7345d4','#43238c'),'topaz':('#ffd23d','#fff4b0','#e29a0c','#8e5a06'),'aqua':('#6fe0f6','#eaffff','#2f9dd6','#17608e')}
def gem(C,x,y,r,kind,glow=True,setting=True,rot=0):
    mid,hi,lo,dk=GEM[kind];p=C.p
    g=f'<g transform="translate({x} {y}) rotate({rot})">'
    if glow: g+=f'<circle r="{r*2.2}" fill="{C.rad([(0,mid,.55),(1,mid,0)])}"/>'
    if setting:
        g+=f'<circle r="{r*1.38}" fill="{p[0]}"/><circle r="{r*1.22}" fill="{C.grad([(0,p[5]),(.4,p[3]),(1,p[1])],0,0,1,1)}"/><circle r="{r*1.02}" fill="{p[0]}"/>'
        for k in range(8):
            a=k*45;g+=f'<circle cx="{r*1.2*math.cos(math.radians(a))}" cy="{r*1.2*math.sin(math.radians(a))}" r="{r*.17}" fill="{p[5]}" stroke="{p[0]}" stroke-width="1.2"/>'
    pts=[(r*math.cos(math.radians(a-90+22.5)),r*math.sin(math.radians(a-90+22.5))) for a in range(0,360,45)]
    g+=f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a,b in pts)}" fill="{dk}"/>'
    tb=[(a*.52,b*.52) for a,b in pts]
    for i in range(8):
        a,b=pts[i],pts[(i+1)%8];c,d=tb[(i+1)%8],tb[i]
        col=[hi,mid,lo,dk,lo,mid,hi,hi][i] if False else ([hi,hi,mid,lo,dk,dk,lo,mid][i])
        g+=f'<polygon points="{a[0]:.1f},{a[1]:.1f} {b[0]:.1f},{b[1]:.1f} {c[0]:.1f},{c[1]:.1f} {d[0]:.1f},{d[1]:.1f}" fill="{col}" stroke="{dk}" stroke-width=".8"/>'
    g+=f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a,b in tb)}" fill="{C.rad([(0,"#fff",.95),(.5,hi,1),(1,mid,1)],.4,.35,.8)}"/>'
    g+=f'<path d="M{-r*.55} {-r*.45}L{-r*.2} {-r*.7}" stroke="#fff" stroke-width="{max(1.5,r*.14)}" stroke-linecap="round"/>'
    return g+star(r*.35,-r*.3,r*.5)+'</g>'
def vine(C,c,amp,lam,pal_idx=3,w=5,zs=None):
    d=perim_dense(c);T=len(d);pts=[]
    for i,(x,y,nx,ny) in enumerate(d):
        a=amp*math.sin(2*math.pi*i/lam);pts.append((x+nx*a,y+ny*a))
    pts.append(pts[0])
    path='M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts[::3])+'Z'
    p=C.p
    return (f'<path d="{path}" fill="none" stroke="{p[0]}" stroke-width="{w+4}" stroke-linejoin="round"/>'
            f'<path d="{path}" fill="none" stroke="{p[3]}" stroke-width="{w}" stroke-linejoin="round"/>'
            f'<path d="{path}" fill="none" stroke="{p[5]}" stroke-width="{w*.3}" stroke-linejoin="round" transform="translate(-.8 -1)" opacity=".9"/>'),d
def vine_leaves(C,c,amp,lam,z,size=20):
    d=perim_dense(c);T=len(d);s=''
    n=int(T/ (lam/2))
    for k in range(n):
        i=int((k+.5)*T/n)%T;x,y,nx,ny=d[i];sg=1 if k%2==0 else -1
        a=amp*math.sin(2*math.pi*i/lam)
        if inz(x,y,z): continue
        ang=deg(nx,ny)
        # leaf grows along tangent, bending outward/inward with the crest
        tx,ty=-ny,nx
        s+=leaf(C,x+nx*a,y+ny*a,size,size*.34,ang+90*(1 if k%2 else -1)*0+ (70 if k%2 else -70) ,ol=C.p[0])
    return s
