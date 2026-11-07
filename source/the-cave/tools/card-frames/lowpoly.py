import math,random,numpy as np
from scipy.spatial import Delaunay
from matplotlib.path import Path
from v3 import W,H,perim_dense
FAMS={'bl':['#3440c0','#4f7ff0','#82c2f8','#bce6fc','#ecf9ff'],
      'li':['#5528b8','#8656e6','#b48ef3','#dac4fb','#f5eeff'],
      'pk':['#7428a8','#b052d2','#e08ce6','#f7c4f1','#fdedfb']}
def hx(h): return [int(h[i:i+2],16) for i in (1,3,5)]
def mixc(a,b,t): return [a[i]+(b[i]-a[i])*t for i in range(3)]
def ramp(f,b):
    r=[hx(c) for c in FAMS[f]];x=max(0,min(3.999,b*4));i=int(x);return mixc(r[i],r[i+1],x-i)
def colour(hf,b):
    if hf<.5: c=mixc(ramp('bl',b),ramp('li',b),hf/.5)
    else: c=mixc(ramp('li',b),ramp('pk',b),(hf-.5)/.5)
    return '#%02x%02x%02x'%tuple(int(max(0,min(255,v))) for v in c)

def build(seed=7):
    rng=random.Random(seed)
    base=perim_dense(0);T=len(base)
    # --- outer silhouette: angular crystal peaks
    def maxh(nx,ny):
        return 96 if abs(nx)>.7 else 104
    prof=np.zeros(T)
    i=0;keys=[]
    # corners first get the biggest peaks
    corner_idx=[min(range(T),key=lambda k:(base[k][0]-cx)**2+(base[k][1]-cy)**2) for cx,cy in ((0,0),(W,0),(W,H),(0,H))]
    s=rng.randint(0,30);kind=0
    while s<T:
        near=min(min(abs(s-c),T-abs(s-c)) for c in corner_idx)
        if near<40: s+=20;continue
        if kind%2==0: keys.append((s,rng.uniform(64,90)))
        else: keys.append((s,rng.uniform(34,46)))
        s+=int(rng.uniform(34,52));kind+=1
    for c in corner_idx: keys.append((c,rng.uniform(98,112)));keys.append(((c-26)%T,rng.uniform(52,64)));keys.append(((c+26)%T,rng.uniform(52,64)))
    keys.sort()
    # piecewise-linear profile between keys (angular), wrapping
    ks=[k for k,_ in keys];hs=[h for _,h in keys]
    ks2=ks+[ks[0]+T];hs2=hs+[hs[0]]
    for j in range(len(ks)):
        a,b=ks2[j],ks2[j+1];ha,hb=hs2[j],hs2[j+1]
        for k in range(a,b):
            t=(k-a)/max(1,b-a);prof[k%T]=ha+(hb-ha)*t
    for k in range(T):
        x,y,nx,ny=base[k];prof[k]=min(prof[k],maxh(nx,ny)/max(abs(nx)*.0+1,1) if abs(nx)<.99 and abs(ny)<.99 else maxh(nx,ny))
    def outer_pt(k):
        x,y,nx,ny=base[k%T];h=prof[k%T];return (x+nx*h,y+ny*h)
    outer=[outer_pt(k) for k in range(0,T,3)]
    inner_d=perim_dense(-6);inner=[(x,y) for x,y,_,_ in inner_d[::3]]
    # --- points
    pts=[];z=[]
    def zfun(k,hfrac):
        Hh=prof[k%T];return Hh*.62*math.sin(math.pi*min(1,max(0,hfrac)))**.8
    # outer key vertices + subdivisions
    for k,_ in keys:
        pts.append(outer_pt(k));z.append(0)
    for k in range(0,T,30):
        pts.append(outer_pt(k));z.append(0)
    for k in range(0,T,40):
        x,y,nx,ny=inner_d[int(k*len(inner_d)/T)];pts.append((x,y));z.append(0)
    # ridge + interior
    for k,h in keys:
        x,y,nx,ny=base[k];f=rng.uniform(.4,.55);hh=-6+(h+6)*f
        pts.append((x+nx*hh,y+ny*hh));z.append(zfun(k,(hh+6)/(prof[k]+6))+rng.uniform(-4,4))
    for _ in range(int(T/24)):
        k=rng.randrange(T);x,y,nx,ny=base[k];f=rng.uniform(.15,.85);hh=-6+(prof[k]+6)*f
        pts.append((x+nx*hh,y+ny*hh));z.append(zfun(k,f)+rng.uniform(-8,8))
    P=np.array(pts);Z=np.array(z)
    tri=Delaunay(P)
    op=Path(np.array(outer));ip=Path(np.array(inner))
    L=np.array([-.42,-.62,.66]);L/=np.linalg.norm(L)
    # smooth hue field
    ph=[rng.uniform(0,6.28) for _ in range(4)]
    def hue(x,y):
        v=.5+.28*math.sin(x/95+ph[0])*math.cos(y/130+ph[1])+.22*math.sin((x+y)/160+ph[2])
        return max(0,min(1,v+rng.uniform(-.14,.14)))
    polys=[]
    for t in tri.simplices:
        c=P[t].mean(0)
        if not op.contains_point(c) or ip.contains_point(c): continue
        a,b,cc=[np.array([*P[i],Z[i]]) for i in t]
        n=np.cross(b-a,cc-a)
        if n[2]<0: n=-n
        n/=np.linalg.norm(n)
        br=float(np.dot(n,L));br=(br-.35)/.65;br=max(0,min(1,br*.9+.08+rng.uniform(-.07,.07)))
        polys.append((P[t],colour(hue(*c),br)))
    return polys,outer

def lowpoly_svg(seed=7):
    polys,outer=build(seed)
    s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -110 712 1006"><defs><filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#2a1660" flood-opacity=".45"/></filter></defs><g filter="url(#ds)" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round">'
    for p,c in polys:
        s+=f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in p)}" fill="{c}"/>'
    s+='</g></svg>'
    return s

# ================== fused crystal chunks ==================
def chunk_polys(rng,cx,cy,ang,a,b,kind,hue_fn,L3,ch=None):
    """elongated hexagon crystal: footprint V, table U, kite facets. returns list of (pts,colour)"""
    ca,sa=math.cos(math.radians(ang)),math.sin(math.radians(ang))
    def w(lx,ly): return (cx+lx*ca-ly*sa,cy+lx*sa+ly*ca)
    if kind=='point':
        loc=[(-a,0),(-a*.55,-b),(a*.45,-b*.92),(a,-b*.1),(a*1.05,b*.15),(a*.4,b),(-a*.6,b*.95)]
    else:
        loc=[(-a,-b*.15),(-a*.5,-b),(a*.5,-b*.95),(a,0),(a*.55,b),(-a*.45,b*.98)]
    loc=[(x*rng.uniform(.92,1.06),y*rng.uniform(.9,1.06)) for x,y in loc]
    n=len(loc);tc=(-a*.08+rng.uniform(-a*.1,a*.1),-b*.12)
    sc=rng.uniform(.38,.52)
    tab=[(tc[0]+(x-tc[0])*sc,tc[1]+(y-tc[1])*sc) for x,y in loc]
    out=[]
    def shade(nrm,px,py,boost=0):
        nrm=np.array(nrm,float);nrm/=np.linalg.norm(nrm)
        br=float(np.dot(nrm,L3));br=(br-.2)/.8+boost
        h=ch+rng.uniform(-.14,.14) if ch is not None else hue_fn(px,py)
        br=.22+.78*max(0,min(1,br*.92+rng.uniform(-.08,.08)))
        return colour(max(0,min(1,h)),br)
    for i in range(n):
        j=(i+1)%n
        mx,my=(loc[i][0]+loc[j][0])/2,(loc[i][1]+loc[j][1])/2
        dl=math.hypot(mx-tc[0],my-tc[1]) or 1
        dx,dy=(mx-tc[0])/dl,(my-tc[1])/dl
        # world-space outward direction
        wx,wy=dx*ca-dy*sa,dx*sa+dy*ca
        slope=rng.uniform(.75,1.1)
        mid=((loc[i][0]+loc[j][0])/2+rng.uniform(-3,3),(loc[i][1]+loc[j][1])/2+rng.uniform(-3,3))
        # split each crown facet into two kites/triangles with slightly different normals (like the reference)
        tw=.28
        n1=(wx*slope-wy*tw,wy*slope+wx*tw,1);n2=(wx*slope+wy*tw,wy*slope-wx*tw,1)
        P1=[w(*loc[i]),w(*mid),w(*tab[j]),w(*tab[i])];P2=[w(*mid),w(*loc[j]),w(*tab[j])]
        cxw,cyw=w(mx,my)
        out.append((P1,shade(n1,cxw,cyw)));out.append((P2,shade(n2,cxw,cyw)))
    # table split in two along a ridge
    k=n//2
    T1=[w(*p) for p in tab[:k+1]];T2=[w(*p) for p in tab[k:]+tab[:1]]
    tx,ty=w(*tc)
    out.append((T1,shade((-.25,-.35,1),tx,ty,.08)));out.append((T2,shade((.2,.25,1),tx,ty)))
    return out

def chunky_svg(seed=5):
    rng=random.Random(seed)
    L3=np.array([-.45,-.62,.64]);L3/=np.linalg.norm(L3)
    ph=[rng.uniform(0,6.28) for _ in range(4)]
    def hue(x,y):
        v=.5+.3*math.sin(x/80+ph[0])*math.cos(y/110+ph[1])+.25*math.sin((x-y)/140+ph[2])
        return max(0,min(1,v+rng.uniform(-.22,.22)))
    base=perim_dense(0);T=len(base)
    chunks=[]
    corner_idx=[min(range(T),key=lambda k:(base[k][0]-cx)**2+(base[k][1]-cy)**2) for cx,cy in ((0,0),(W,0),(W,H),(0,H))]
    s=rng.randint(0,20)
    while s<T:
        x,y,nx,ny=base[s];edge=math.degrees(math.atan2(ny,nx))+90
        near=min(min(abs(s-c),T-abs(s-c)) for c in corner_idx)
        if near<36: s+=36;continue
        a=rng.uniform(62,82);b=rng.uniform(38,46)
        off=rng.uniform(26,34)
        ang=edge+rng.choice([-1,1])*rng.uniform(4,24)
        lim=(96 if abs(nx)>.7 else 104)
        reach=off+b+a*abs(math.sin(math.radians(ang-edge)))
        if reach>lim: a*= (lim-off-b)/max(1,reach-off-b)
        chunks.append((rng.random(),x+nx*off,y+ny*off,ang,a,b,rng.choice(['cut','point','cut'])))
        s+=int(a*rng.uniform(1.4,1.6))
    for c in corner_idx:
        x,y,nx,ny=base[c]
        diag=math.degrees(math.atan2(ny,nx))
        chunks.append((1.5,x+nx*36,y+ny*36,diag+rng.uniform(-15,15),70,52,'cut'))
        for sgn in (-1,1):
            chunks.append((rng.uniform(.2,.9),x+nx*26+(-ny)*sgn*50,y+ny*26+nx*sgn*50,diag+sgn*58+rng.uniform(-10,10),64,40,'point'))
    chunks.sort(key=lambda c:c[0])
    polys=[]
    for _,cx,cy,ang,a,b,kind in chunks:
        ch=rng.choice([.08,.2,.45,.55,.8,.92])
        polys+=chunk_polys(rng,cx,cy,ang,a,b,kind,hue,L3,ch)
    # mask out the card interior so the inner edge is clean
    card=f'M-6 24Q-6 -6 24 -6L{W-24+6} -6Q{W+6} -6 {W+6} 24L{W+6} {H-24+6}Q{W+6} {H+6} {W-24+6} {H+6}L24 {H+6}Q-6 {H+6} -6 {H-24+6}Z'
    inner=f'M26 4L{W-26} 4Q{W-4} 4 {W-4} 26L{W-4} {H-26}Q{W-4} {H-4} {W-26} {H-4}L26 {H-4}Q4 {H-4} 4 {H-26}L4 26Q4 4 26 4Z'
    s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -110 712 1006"><defs>'
    s+='<filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#2a1660" flood-opacity=".4"/></filter>'
    s+=f'<clipPath id="ring"><path clip-rule="evenodd" d="M-100 -110H612V896H-100Z {inner}"/></clipPath></defs>'
    s+='<g filter="url(#ds)"><g clip-path="url(#ring)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round">'
    for p,c in polys:
        s+=f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in p)}" fill="{c}"/>'
    s+='</g></g></svg>'
    return s
