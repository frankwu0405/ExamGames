import math,random
from v3 import W,H,Ctx,uid,perim_dense
from v3 import rect_ring,perim,deg
from v4 import ribbon,noise
TONES={ # outline, shade, base, light, shine
 'bronze':['#3a1a08','#8a4518','#c4742f','#eba862','#fff0d6'],
 'silver':['#1e2740','#7d8cab','#b9c6dc','#e4ecf7','#ffffff'],
 'gold':  ['#4a2400','#c27a0a','#f2b625','#ffdf62','#fff8d2'],
}
def ring_path(o_out,o_in,rng,amp=1.6):
    def edge(o,rev):
        d=perim_dense(o);T=len(d);nz=noise(rng,T,amp,5)
        pts=[(x+nx*nz(i),y+ny*nz(i)) for i,(x,y,nx,ny) in enumerate(d)][::3]
        if rev: pts=pts[::-1]
        return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+'Z'
    return edge(o_out,False)+' '+edge(o_in,True)
def cel(C,d,t,sw=5,shift=(4,5),fr='evenodd',shine=True):
    """cartoon cel-shaded shape: outline, base, shade on lower-right, light rim on upper-left"""
    ol,sh,ba,li,wh=t;i=uid('c')
    s=f'<defs><clipPath id="{i}"><path d="{d}" fill-rule="{fr}" clip-rule="{fr}"/></clipPath></defs>'
    s+=f'<path d="{d}" fill="{ol}" fill-rule="{fr}" stroke="{ol}" stroke-width="{sw*2}" stroke-linejoin="round"/>'
    s+=f'<g clip-path="url(#{i})"><rect x="-300" y="-300" width="1200" height="1500" fill="{sh}"/>'
    s+=f'<path d="{d}" fill="{ba}" fill-rule="{fr}" transform="translate({-shift[0]} {-shift[1]})"/>'
    if shine:
        s+=f'<path d="{d}" fill="{sh}" fill-rule="{fr}" transform="translate({-shift[0]*2.2:.1f} {-shift[1]*2.2:.1f})" opacity="0"/>'
        s+=f'<path d="{d}" fill="none" stroke="{li}" stroke-width="{shift[0]*1.5:.1f}" transform="translate({shift[0]*.9:.1f} {shift[1]*.9:.1f})" opacity=".95"/>'
    s+='</g>'
    return s
def streaks(C,t,o,n,rng,length=(18,40),zones=()):
    s=''
    d=perim_dense(o);T=len(d)
    for k in range(n):
        i=rng.randrange(T);x,y,nx,ny=d[i]
        if nx*-.56+ny*-.83<-.2 and rng.random()<.7: continue  # mostly on lit sides
        L=rng.uniform(*length);tx,ty=-ny,nx
        s+=f'<path d="M{x-tx*L/2:.1f} {y-ty*L/2:.1f}L{x+tx*L/2:.1f} {y+ty*L/2:.1f}" stroke="{t[4]}" stroke-width="{rng.uniform(2.6,4):.1f}" stroke-linecap="round" opacity=".95"/>'
        if rng.random()<.5: s+=f'<circle cx="{x+tx*(L/2+7):.1f}" cy="{y+ty*(L/2+7):.1f}" r="2" fill="{t[4]}"/>'
    return s
def sparkle(x,y,r,t,ol=True):
    d=f'M0 {-r}Q{r*.13} {-r*.13} {r} 0Q{r*.13} {r*.13} 0 {r}Q{-r*.13} {r*.13} {-r} 0Q{-r*.13} {-r*.13} 0 {-r}Z'
    return (f'<g transform="translate({x:.1f} {y:.1f})">'+(f'<path d="{d}" fill="none" stroke="{t[0]}" stroke-width="3" stroke-linejoin="round" opacity=".5"/>' if ol else '')+f'<path d="{d}" fill="#fff"/></g>')
def scroll(C,t,pts_ctrl,curl_c,R0,th0,dirn,w0,turns=1.4):
    """tapered C/S scroll, cartoon outlined (uses ribbon outline)"""
    p0,p1,p2,p3=pts_ctrl;pts=[]
    for i in range(31):
        u=i/30;v=1-u;pts.append((v**3*p0[0]+3*v*v*u*p1[0]+3*v*u*u*p2[0]+u**3*p3[0],v**3*p0[1]+3*v*v*u*p1[1]+3*v*u*u*p2[1]+u**3*p3[1]))
    for i in range(1,56):
        u=i/55;r=R0*(1-.82*u);th=th0+dirn*u*turns*2*math.pi;pts.append((curl_c[0]+r*math.cos(th),curl_c[1]+r*math.sin(th)))
    C.p=[t[0]]+C.p[1:]
    return ribbon(C,pts,lambda u:max(4,w0*(1-.7*u)),[t[1],t[2],t[3],t[4]],ol=t[0],grain=False)
def mirror4(fn):
    s=''
    for tx,ty,sx,sy in [(0,0,1,1),(W,0,-1,1),(0,H,1,-1),(W,H,-1,-1)]: s+=f'<g transform="translate({tx} {ty}) scale({sx} {sy})">{fn()}</g>'
    return s
def wob(pts,rng,a=1.4):
    return [(x+rng.uniform(-a,a),y+rng.uniform(-a,a)) for x,y in pts]
def poly(pts): return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+'Z'
def smooth_closed(pts):
    n=len(pts);d=f'M{(pts[0][0]+pts[1][0])/2:.1f} {(pts[0][1]+pts[1][1])/2:.1f}'
    for i in range(1,n+1):
        a=pts[i%n];b=pts[(i+1)%n];d+=f'Q{a[0]:.1f} {a[1]:.1f} {(a[0]+b[0])/2:.1f} {(a[1]+b[1])/2:.1f}'
    return d+'Z'

# ======================================== BRONZE: chunky cast bar + bolted corner brackets
def bronze():
    t=TONES['bronze'];C=Ctx('bronze');rng=random.Random(3)
    body=cel(C,ring_path(40,-10,rng,1.8),t,5,(4,5))
    body+=cel(C,ring_path(-2,-12,rng,1.0),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)   # inner lip
    # dents & scratches
    for k in range(26):
        d=perim_dense(15);x,y,nx,ny=d[rng.randrange(len(d))]
        body+=f'<path d="M{x-4:.1f} {y:.1f}q4 {rng.uniform(-4,4):.1f} 8 0" fill="none" stroke="{t[1]}" stroke-width="2" stroke-linecap="round" opacity=".7"/>'
    body+=streaks(C,t,24,18,rng,(16,34))
    def corner():
        pts=wob([(-46,-46),(70,-46),(84,-32),(70,-18),(-18,-18),(-18,70),(-32,84),(-46,70)],rng,1.5)
        s=cel(C,smooth_closed(pts),t,5,(4,5))
        s+=f'<path d="M-36 -34L58 -34M-34 -36L-34 58" stroke="{t[4]}" stroke-width="3.4" stroke-linecap="round"/>'
        for x,y in ((56,-32),(-32,56),(-32,-32)):
            s+=f'<circle cx="{x}" cy="{y}" r="6.5" fill="{t[1]}" stroke="{t[0]}" stroke-width="3"/><circle cx="{x-1.8}" cy="{y-2}" r="2.4" fill="{t[4]}"/>'
        return s
    body+=mirror4(corner)
    # mid-edge straps
    def strap(x,y,rot):
        pts=wob([(-30,-50),(30,-50),(34,-40),(34,6),(30,16),(-30,16),(-34,6),(-34,-40)],rng,1.2)
        s=f'<g transform="translate({x} {y}) rotate({rot})">'+cel(C,smooth_closed(pts),t,5,(3,4))
        s+=f'<path d="M-24 -40L-24 4" stroke="{t[4]}" stroke-width="3" stroke-linecap="round"/>'
        for xx in (-18,18): s+=f'<circle cx="{xx}" cy="-17" r="5.5" fill="{t[1]}" stroke="{t[0]}" stroke-width="3"/><circle cx="{xx-1.6}" cy="-18.8" r="2" fill="{t[4]}"/>'
        return s+'</g>'
    body+=strap(W/2,0,0)+strap(W/2,H,180)+strap(0,H/2,-90)+strap(W,H/2,90)
    C.add(body)
    for x,y,r in ((-56,170,8),(W+58,H-190,7)): C.add(sparkle(x,y,r,t))
    return C.svg()

def heart_corner(C,t,R,w,k=1.0):
    """two chunky scrolls rolling outward over the corner, meeting like a heart"""
    s=scroll(C,t,[(-4*k,-4*k),(-30*k,-26*k),(-74*k,-30*k),(-88*k,-58*k)],(-64*k,-66*k),R,math.pi,1,w,1.3)
    s+=scroll(C,t,[(-4*k,-4*k),(-26*k,-30*k),(-30*k,-74*k),(-58*k,-88*k)],(-66*k,-64*k),R,-math.pi/2,-1,w,1.3)
    return s
def crown(C,t,R,w,span):
    """back-to-back C-scrolls forming a crest silhouette"""
    s=''
    for sg in (-1,1):
        s+=scroll(C,t,[(sg*span,-2),(sg*(span+40),-8),(sg*(span+70),4),(sg*(span+92),-12)],(sg*(span+86),-36),R*.8,math.pi*(0 if sg>0 else 1),-sg,w*.85,1.3)
        s+=scroll(C,t,[(sg*2,4),(sg*6,-30),(sg*22,-62),(sg*44,-62)],(sg*40,-38),R,-math.pi/2,sg,w,1.35)
    return s

# ======================================== SILVER: rolled bar + chunky scrollwork
def silver():
    t=TONES['silver'];C=Ctx('silver');rng=random.Random(8)
    body=cel(C,ring_path(44,-10,rng,1.2),t,5,(4,5))
    body+=cel(C,ring_path(-1,-12,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
    for o in (20,27):
        body+=f'<rect x="{-o}" y="{-o}" width="{W+2*o}" height="{H+2*o}" rx="{30+o}" fill="none" stroke="{t[1]}" stroke-width="2.4" opacity=".8"/>'
    body+=streaks(C,t,32,22,rng,(22,44))+streaks(C,t,8,10,rng,(14,26))
    body+=mirror4(lambda:heart_corner(C,t,20,20,.9))
    def crest(x,y,rot,sc=1):
        return f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})">'+crown(C,t,18,17,8)+'</g>'
    body+=crest(W/2,-30,0,.8)+crest(W/2,H+30,180,.8)+crest(-32,H/2,-90,.66)+crest(W+32,H/2,90,.66)
    C.add(body)
    for x,y,r in ((-64,170,9),(W+66,H-170,9),(150,-90,7),(W-150,H+92,7)): C.add(sparkle(x,y,r,t))
    return C.svg()

# ======================================== GOLD: thick baroque bar + big chunky scroll clusters
def gold():
    t=TONES['gold'];C=Ctx('gold');rng=random.Random(5)
    body=cel(C,ring_path(56,-12,rng,1.2),t,5,(5,6))
    body+=cel(C,ring_path(-1,-14,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
    d=perim_dense(26);T=len(d)
    body+=f'<rect x="-26" y="-26" width="{W+52}" height="{H+52}" rx="56" fill="none" stroke="{t[1]}" stroke-width="15"/>'
    for i in range(0,T,13):
        x,y,nx,ny=d[i];body+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.6" fill="{t[2]}" stroke="{t[0]}" stroke-width="2"/><circle cx="{x-1.6:.1f}" cy="{y-1.8:.1f}" r="2" fill="{t[4]}"/>'
    body+=streaks(C,t,44,24,rng,(22,48))+streaks(C,t,8,12,rng,(14,28))
    def corner():
        s=scroll(C,t,[(30,-40),(60,-76),(100,-80),(126,-64)],(124,-90),20,math.pi*.5,-1,20)
        s+=scroll(C,t,[(-40,30),(-76,60),(-80,100),(-64,126)],(-90,124),20,0,1,20)
        s+=heart_corner(C,t,26,26,1.15)
        return s
    body+=mirror4(corner)
    def crest(x,y,rot,sc=1):
        return f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})">'+crown(C,t,24,23,10)+'</g>'
    body+=crest(W/2,-44,0)+crest(W/2,H+44,180)+crest(-46,H/2,-90,.8)+crest(W+46,H/2,90,.8)
    C.add(body)
    for x,y,r in ((-100,190,11),(W+100,H-190,11),(170,-124,9),(W-170,H+124,9),(-112,H-130,7),(W+112,140,7)): C.add(sparkle(x,y,r,t))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')

# ---------------- integral lobed corners / cartouches
def lobed(cx,cy,base,lobes,notch=0,nn=8,rot=0):
    pts=[]
    for k in range(120):
        th=2*math.pi*k/120
        r=base
        for ang,amp,w in lobes:
            dlt=math.atan2(math.sin(th-math.radians(ang)),math.cos(th-math.radians(ang)));r+=amp*math.exp(-(dlt/math.radians(w))**2)
        if notch: r*=1-notch*abs(math.sin(nn*(th-math.radians(rot))/2))**3
        pts.append((cx+r*math.cos(th),cy+r*math.sin(th)))
    return smooth_closed(pts)
def relief_spiral(cx,cy,R,th0,dirn,t,turns=1.3,w=4):
    pts=[]
    for i in range(50):
        u=i/49;r=R*(1-.85*u);th=th0+dirn*u*turns*2*math.pi;pts.append((cx+r*math.cos(th),cy+r*math.sin(th)))
    d='M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)
    return (f'<path d="{d}" fill="none" stroke="{t[1]}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{t[4]}" stroke-width="{w*.45:.1f}" stroke-linecap="round" transform="translate(-1.6 -1.8)" opacity=".9"/>')
def tangent_scroll(C,t,x0,len_,R,w,up=True):
    """C-scroll lying along the top bar's outer edge, starting at x0 heading +x, curling outward (up)"""
    return scroll(C,t,[(x0,0),(x0+len_*.35,-4),(x0+len_*.7,-2),(x0+len_,-R)],(x0+len_-R*.2,-R*1.9),R,math.pi*.5,-1,w,1.3)

def silver2():
    t=TONES['silver'];C=Ctx('silver');rng=random.Random(8)
    body=cel(C,ring_path(44,-10,rng,1.2),t,5,(4,5))
    body+=cel(C,ring_path(-1,-12,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
    for o in (20,27):
        body+=f'<rect x="{-o}" y="{-o}" width="{W+2*o}" height="{H+2*o}" rx="{30+o}" fill="none" stroke="{t[1]}" stroke-width="2.4" opacity=".8"/>'
    body+=streaks(C,t,32,22,rng,(22,44))+streaks(C,t,8,10,rng,(14,26))
    def corner():
        s=tangent_scroll(C,t,40,70,13,14).replace('<path','<path',1)
        s=f'<g transform="translate(0 -44)">{s}</g><g transform="translate(-44 0) rotate(90) scale(1 -1)">{tangent_scroll(C,t,40,70,13,14)}</g>'
        s+=cel(C,lobed(-22,-22,40,[(-135,22,30),(-180,8,22),(-90,8,22)],notch=.1,nn=6,rot=-135),t,5,(4,5))
        s+=relief_spiral(-40,-22,14,math.pi*.5,1,t)+relief_spiral(-22,-40,14,math.pi,-1,t)
        return s
    body+=mirror4(corner)
    def cart(x,y,rot,sc):
        s=f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})">'
        s+=cel(C,lobed(0,-6,30,[(-90,16,28),(-150,8,24),(-30,8,24)],notch=.1,nn=6,rot=-90),t,5,(4,5))
        s+=relief_spiral(-12,-10,11,0,1,t,1.2,3.6)+relief_spiral(12,-10,11,math.pi,-1,t,1.2,3.6)
        return s+'</g>'
    body+=cart(W/2,-24,0,1)+cart(W/2,H+24,180,1)+cart(-24,H/2,-90,.85)+cart(W+24,H/2,90,.85)
    C.add(body)
    for x,y,r in ((-64,170,9),(W+66,H-170,9),(150,-90,7),(W-150,H+92,7)): C.add(sparkle(x,y,r,t))
    return C.svg()

def gold2():
    t=TONES['gold'];C=Ctx('gold');rng=random.Random(5)
    body=cel(C,ring_path(56,-12,rng,1.2),t,5,(5,6))
    body+=cel(C,ring_path(-1,-14,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
    d=perim_dense(26);T=len(d)
    body+=f'<rect x="-26" y="-26" width="{W+52}" height="{H+52}" rx="56" fill="none" stroke="{t[1]}" stroke-width="15"/>'
    for i in range(0,T,13):
        x,y,nx,ny=d[i];body+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.6" fill="{t[2]}" stroke="{t[0]}" stroke-width="2"/><circle cx="{x-1.6:.1f}" cy="{y-1.8:.1f}" r="2" fill="{t[4]}"/>'
    body+=streaks(C,t,44,24,rng,(22,48))+streaks(C,t,8,12,rng,(14,28))
    def corner():
        s=f'<g transform="translate(0 -56)">{tangent_scroll(C,t,56,96,18,19)}</g><g transform="translate(-56 0) rotate(90) scale(1 -1)">{tangent_scroll(C,t,56,96,18,19)}</g>'
        s+=cel(C,lobed(-28,-28,54,[(-135,30,26),(-180,14,20),(-90,14,20),(-158,10,12),(-112,10,12)],notch=.12,nn=8,rot=-135),t,5,(5,6))
        s+=relief_spiral(-54,-30,19,math.pi*.5,1,t,1.3,5)+relief_spiral(-30,-54,19,math.pi,-1,t,1.3,5)
        s+=f'<path d="M-40 -40Q-60 -60 -78 -78" stroke="{t[1]}" stroke-width="5" stroke-linecap="round"/><path d="M-42 -43Q-60 -62 -76 -80" stroke="{t[4]}" stroke-width="2.2" stroke-linecap="round"/>'
        return s
    body+=mirror4(corner)
    def cart(x,y,rot,sc):
        s=f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})">'
        for sg in (-1,1):
            s+=f'<g transform="scale({sg} 1)"><g transform="translate(36 -2)">{tangent_scroll(C,t,0,70,15,16)}</g></g>'
        s+=cel(C,lobed(0,-10,40,[(-90,26,24),(-135,12,18),(-45,12,18),(-160,8,14),(-20,8,14)],notch=.12,nn=8,rot=-90),t,5,(5,6))
        s+=relief_spiral(-16,-14,15,0,1,t,1.25,4.6)+relief_spiral(16,-14,15,math.pi,-1,t,1.25,4.6)
        s+=f'<path d="M0 -36L0 -62" stroke="{t[1]}" stroke-width="5" stroke-linecap="round"/><path d="M-1.6 -38L-1.6 -60" stroke="{t[4]}" stroke-width="2.2" stroke-linecap="round"/>'
        return s+'</g>'
    body+=cart(W/2,-40,0,1)+cart(W/2,H+40,180,1)+cart(-40,H/2,-90,.85)+cart(W+40,H/2,90,.85)
    C.add(body)
    for x,y,r in ((-104,200,11),(W+104,H-200,11),(180,-126,9),(W-180,H+126,9)): C.add(sparkle(x,y,r,t))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')
silver=silver2;gold=gold2

# ---------------- one-piece frames with a shaped silhouette
def bumps_fn(T,d,specs,scallop=None):
    idx_c=[min(range(T),key=lambda k:(d[k][0]-cx)**2+(d[k][1]-cy)**2) for cx,cy in ((0,0),(W,0),(W,H),(0,H))]
    idx_m=[min(range(T),key=lambda k:(d[k][0]-cx)**2+(d[k][1]-cy)**2) for cx,cy in ((W/2,0),(W,H/2),(W/2,H),(0,H/2))]
    def plateau(dist,half,soft):
        x=(abs(dist)-half)/soft
        return 1 if x<=0 else (0 if x>=1 else 1-x*x*(3-2*x))
    def f(i):
        base,cA,cHalf,cSoft,mA,mHalf,mSoft=specs
        v=base
        for c in idx_c: v+=cA*plateau(min(abs(i-c),T-abs(i-c)),cHalf,cSoft)
        for m in idx_m: v+=mA*plateau(min(abs(i-m),T-abs(i-m)),mHalf,mSoft)
        if scallop: per,amp=scallop; v-=amp*abs(math.sin(math.pi*i/per))**.6
        return v
    return f,idx_c,idx_m
def shaped_ring(fn,o_in,T,d):
    outer=[(x+nx*fn(i),y+ny*fn(i)) for i,(x,y,nx,ny) in enumerate(d)][::2]
    di=perim_dense(o_in);inner=[(x,y) for x,y,_,_ in di][::3][::-1]
    return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in outer)+'Z M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in inner)+'Z'
def follow(fn,frac,add,T,d,step=3):
    pts=[(x+nx*(fn(i)*frac+add),y+ny*(fn(i)*frac+add)) for i,(x,y,nx,ny) in enumerate(d)][::step]
    return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+'Z'
def groove(dpath,t,w=3):
    return (f'<path d="{dpath}" fill="none" stroke="{t[1]}" stroke-width="{w}" stroke-linejoin="round"/>'
            f'<path d="{dpath}" fill="none" stroke="{t[4]}" stroke-width="{w*.45:.1f}" stroke-linejoin="round" transform="translate(1.2 1.4)" opacity=".85"/>')

def silver3():
    t=TONES['silver'];C=Ctx('silver');rng=random.Random(8)
    d=perim_dense(0);T=len(d)
    fn,ic,im=bumps_fn(T,d,(38,26,26,22,14,30,26))
    body=cel(C,shaped_ring(fn,-10,T,d),t,5,(4,5))
    body+=cel(C,ring_path(-1,-12,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
    body+=groove(follow(fn,.72,-4,T,d),t,3)+groove(follow(fn,.4,-2,T,d),t,2.4)
    # fluting across the swellings
    for idx,L in [(c,1) for c in ic]+[(m,.8) for m in im]:
        for k in range(-3,4):
            i=(idx+k*9)%T;x,y,nx,ny=d[i];a=fn(i)
            body+=f'<path d="M{x+nx*a*.42:.1f} {y+ny*a*.42:.1f}L{x+nx*a*.68:.1f} {y+ny*a*.68:.1f}" stroke="{t[1]}" stroke-width="2.6" stroke-linecap="round"/>'
    body+=streaks(C,t,30,22,rng,(22,44))+streaks(C,t,6,10,rng,(14,26))
    C.add(body)
    for x,y,r in ((-64,170,9),(W+66,H-170,9),(150,-90,7),(W-150,H+92,7)): C.add(sparkle(x,y,r,t))
    return C.svg()

def gold3():
    t=TONES['gold'];C=Ctx('gold');rng=random.Random(5)
    d=perim_dense(0);T=len(d)
    fn,ic,im=bumps_fn(T,d,(54,40,30,30,26,34,30),scallop=(30,7))
    body=cel(C,shaped_ring(fn,-12,T,d),t,5,(5,6))
    body+=cel(C,ring_path(-1,-14,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
    body+=groove(follow(fn,.78,-6,T,d),t,3.4)
    # bead row inside
    d26=perim_dense(24);T2=len(d26)
    body+=f'<rect x="-24" y="-24" width="{W+48}" height="{H+48}" rx="54" fill="none" stroke="{t[1]}" stroke-width="14"/>'
    for i in range(0,T2,13):
        x,y,nx,ny=d26[i];body+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.4" fill="{t[2]}" stroke="{t[0]}" stroke-width="2"/><circle cx="{x-1.6:.1f}" cy="{y-1.8:.1f}" r="2" fill="{t[4]}"/>'
    # ribs fanning into every scallop
    for i in range(0,T,30):
        x,y,nx,ny=d[(i+15)%T];a=fn((i+15)%T)
        body+=f'<path d="M{x+nx*38:.1f} {y+ny*38:.1f}L{x+nx*(a-5):.1f} {y+ny*(a-5):.1f}" stroke="{t[1]}" stroke-width="3" stroke-linecap="round"/>'
    # big fanned ribs on the swellings
    for idx in ic+im:
        for k in range(-4,5):
            i=(idx+k*8)%T;x,y,nx,ny=d[i];a=fn(i)
            body+=f'<path d="M{x+nx*36:.1f} {y+ny*36:.1f}L{x+nx*(a-8):.1f} {y+ny*(a-8):.1f}" stroke="{t[1]}" stroke-width="3.4" stroke-linecap="round"/><path d="M{x+nx*38-1.5:.1f} {y+ny*38-1.6:.1f}L{x+nx*(a-10)-1.5:.1f} {y+ny*(a-10)-1.6:.1f}" stroke="{t[4]}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>'
    body+=streaks(C,t,46,20,rng,(22,48))+streaks(C,t,6,12,rng,(14,28))
    C.add(body)
    for x,y,r in ((-104,200,11),(W+104,H-200,11),(180,-126,9),(W-180,H+126,9)): C.add(sparkle(x,y,r,t))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')
silver=silver3;gold=gold3

# ---------------- material frames: piled nuggets, like the crystal frame
def nugget_path(cx,cy,r,rng,el=1.0,rot=0,n=None):
    n=n or rng.randint(8,11);pts=[]
    a0=math.radians(rot)
    for k in range(n):
        th=2*math.pi*k/n+rng.uniform(-.18,.18);rr=r*rng.uniform(.78,1.08)
        lx,ly=rr*math.cos(th)*el,rr*math.sin(th)/el
        pts.append((cx+lx*math.cos(a0)-ly*math.sin(a0),cy+lx*math.sin(a0)+ly*math.cos(a0)))
    return smooth_closed(pts)
def nugget(C,t,cx,cy,r,rng,el=1.0,rot=0):
    d=nugget_path(cx,cy,r,rng,el,rot)
    s=cel(C,d,t,4.5,(r*.16,r*.2))
    # surface dents and a bright specular
    for _ in range(rng.randint(1,2)):
        dx,dy=rng.uniform(-.3,.4)*r,rng.uniform(-.2,.4)*r
        s+=f'<path d="M{cx+dx-r*.18:.1f} {cy+dy:.1f}q{r*.18:.1f} {r*.12:.1f} {r*.36:.1f} 0" fill="none" stroke="{t[1]}" stroke-width="{max(2,r*.07):.1f}" stroke-linecap="round" opacity=".8"/>'
    s+=f'<ellipse cx="{cx-r*.32:.1f}" cy="{cy-r*.36:.1f}" rx="{r*.2:.1f}" ry="{r*.12:.1f}" transform="rotate(-35 {cx-r*.32:.1f} {cy-r*.36:.1f})" fill="{t[4]}"/>'
    s+=f'<circle cx="{cx-r*.05:.1f}" cy="{cy-r*.5:.1f}" r="{max(1.6,r*.06):.1f}" fill="{t[4]}"/>'
    return s
def pile(C,t,rng,inner=8,specs=((24,34),(20,30)),corner=(42,54),cn=6,sparks=6,big_mid=True):
    items=[]
    d=perim_dense(0);T=len(d)
    # two staggered rows of nuggets around the card
    for row,(o,(rmin,rmax)) in enumerate(((inner+14,specs[0]),(inner+44,specs[1]))):
        s_=rng.uniform(0,20)
        while s_<T:
            x,y,nx,ny=d[int(s_)%T];r=rng.uniform(rmin,rmax)
            items.append((row,x+nx*(o+rng.uniform(-4,4)),y+ny*(o+rng.uniform(-4,4)),r))
            s_+=r*rng.uniform(1.25,1.5)
    for cx,cy in ((0,0),(W,0),(W,H),(0,H)):
        sx=-1 if cx==0 else 1;sy=-1 if cy==0 else 1
        for k in range(cn):
            a=math.radians(rng.uniform(-60,60)+math.degrees(math.atan2(sy,sx)));dist=rng.uniform(10,60)
            items.append((2,cx+math.cos(a)*dist,cy+math.sin(a)*dist,rng.uniform(*corner)*(1-dist/160)))
    if big_mid:
        for cx,cy,nx,ny in ((W/2,0,0,-1),(W/2,H,0,1),(0,H/2,-1,0),(W,H/2,1,0)):
            for k in range(3):
                items.append((2,cx+nx*rng.uniform(24,44)+ny*rng.uniform(-30,30),cy+ny*rng.uniform(24,44)+nx*rng.uniform(-30,30),rng.uniform(26,36)))
    # outer row first, then inner, then the big clusters on top; larger after smaller within a layer
    items.sort(key=lambda q:(-q[0] if q[0]<2 else 2,q[3]) if q[0]<2 else (3,q[3]))
    items.sort(key=lambda q:(0 if q[0]==1 else 1 if q[0]==0 else 2,q[3]))
    s=''.join(nugget(C,t,x,y,r,rng,rng.uniform(.85,1.25),rng.uniform(0,180)) for _,x,y,r in items)
    return s
def gold4():
    t=TONES['gold'];C=Ctx('gold');rng=random.Random(11)
    C.add(pile(C,t,rng))
    for x,y,r in ((-104,200,11),(W+104,H-200,11),(180,-126,9),(W-180,H+126,9),(-90,H-140,8),(W+90,150,8)): C.add(sparkle(x,y,r,t))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')
gold=gold4

# ================= option builders (all cartoon, outlined, cel-shaded)
def forged(tier):
    t=TONES[tier];C=Ctx(tier);rng=random.Random({'bronze':3,'silver':6,'gold':9}[tier])
    bw={'bronze':40,'silver':46,'gold':54}[tier]
    body=cel(C,ring_path(bw,-10,rng,1.8),t,5,(4,5))
    body+=cel(C,ring_path(-2,-12,rng,1.0),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
    if tier!='bronze':
        body+=f'<rect x="{-bw*.55}" y="{-bw*.55}" width="{W+bw*1.1}" height="{H+bw*1.1}" rx="{30+bw*.55}" fill="none" stroke="{t[1]}" stroke-width="3"/>'
    if tier=='gold':
        d=perim_dense(bw*.55);T=len(d)
        for i in range(0,T,14):
            x,y,nx,ny=d[i];body+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.6" fill="{t[2]}" stroke="{t[0]}" stroke-width="2"/><circle cx="{x-1.4:.1f}" cy="{y-1.6:.1f}" r="1.7" fill="{t[4]}"/>'
    body+=streaks(C,t,bw*.6,18,rng,(16,36))
    k=bw/40
    def corner():
        pts=wob([(-46*k,-46*k),(70*k,-46*k),(84*k,-32*k),(70*k,-18*k),(-18*k,-18*k),(-18*k,70*k),(-32*k,84*k),(-46*k,70*k)],rng,1.5)
        s=cel(C,smooth_closed(pts),[t[0],t[1],t[1] if tier=='bronze' else t[2],t[3],t[4]],5,(4,5))
        s+=f'<path d="M{-36*k:.1f} {-34*k:.1f}L{58*k:.1f} {-34*k:.1f}M{-34*k:.1f} {-36*k:.1f}L{-34*k:.1f} {58*k:.1f}" stroke="{t[4]}" stroke-width="3.4" stroke-linecap="round"/>'
        for x,y in ((56*k,-32*k),(-32*k,56*k),(-32*k,-32*k)):
            s+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="6.5" fill="{t[1]}" stroke="{t[0]}" stroke-width="3"/><circle cx="{x-1.8:.1f}" cy="{y-2:.1f}" r="2.4" fill="{t[4]}"/>'
        return s
    body+=mirror4(corner)
    def strap(x,y,rot):
        pts=wob([(-30,-50*k),(30,-50*k),(34,-40*k),(34,6),(30,16),(-30,16),(-34,6),(-34,-40*k)],rng,1.2)
        s=f'<g transform="translate({x} {y}) rotate({rot})">'+cel(C,smooth_closed(pts),t,5,(3,4))
        for xx in (-18,18): s+=f'<circle cx="{xx}" cy="{-17*k:.1f}" r="5.5" fill="{t[1]}" stroke="{t[0]}" stroke-width="3"/><circle cx="{xx-1.6}" cy="{-17*k-1.8:.1f}" r="2" fill="{t[4]}"/>'
        return s+'</g>'
    body+=strap(W/2,0,0)+strap(W/2,H,180)+strap(0,H/2,-90)+strap(W,H/2,90)
    C.add(body)
    for x,y,r in ((-62,170,8),(W+62,H-190,7)): C.add(sparkle(x,y,r,t))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')

def nuggets(tier):
    t=TONES[tier];C=Ctx(tier);rng=random.Random({'bronze':21,'silver':13,'gold':11}[tier])
    if tier=='bronze': C.add(pile(C,t,rng,specs=((18,24),(14,20)),corner=(30,38),cn=4,big_mid=False))
    elif tier=='silver': C.add(pile(C,t,rng,specs=((20,28),(18,26)),corner=(36,46),cn=5,big_mid=False))
    else: C.add(pile(C,t,rng))
    n={'bronze':2,'silver':4,'gold':6}[tier]
    for x,y,r in ((-104,200,11),(W+104,H-200,11),(180,-126,9),(W-180,H+126,9),(-90,H-140,8),(W+90,150,8))[:n]: C.add(sparkle(x,y,r,t))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')

def rope_ring(C,t,c,w,step=10):
    s=rect_ring(c,w+6,t[0])+rect_ring(c,w,t[1])
    for x,y,nx,ny,i in perim(c,int(2*(W+H+4*c)/step)):
        a=deg(nx,ny)
        s+=(f'<g transform="translate({x:.1f} {y:.1f}) rotate({a+40:.1f})"><rect x="{-w*.24:.1f}" y="{-w*.62:.1f}" width="{w*.48:.1f}" height="{w*1.24:.1f}" rx="{w*.24:.1f}" fill="{t[2]}" stroke="{t[0]}" stroke-width="2"/>'
            f'<rect x="{-w*.14:.1f}" y="{-w*.48:.1f}" width="{w*.1:.1f}" height="{w*.6:.1f}" rx="{w*.05:.1f}" fill="{t[4]}"/></g>')
    return s
def moulding(tier):
    t=TONES[tier];C=Ctx(tier);rng=random.Random({'bronze':4,'silver':7,'gold':2}[tier])
    if tier=='bronze':
        b=cel(C,ring_path(36,-10,rng,1.4),t,5,(4,5))
        b+=cel(C,ring_path(-2,-12,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
        b+=streaks(C,t,22,16,rng,(16,34))
    elif tier=='silver':
        b=cel(C,ring_path(52,-10,rng,1.2),t,5,(4,5))
        b+=rope_ring(C,t,30,14)
        b+=cel(C,ring_path(-2,-12,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
        b+=streaks(C,t,46,16,rng,(16,30))+streaks(C,t,8,10,rng,(14,26))
    else:
        # scalloped outer lip
        d=perim_dense(64);T=len(d);lip=''
        for i in range(0,T,24):
            x,y,nx,ny=d[i];lip+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="14"/>'
        b=f'<g fill="{t[0]}" stroke="{t[0]}" stroke-width="10">{lip}</g><g fill="{t[2]}">{lip}</g>'
        b+=cel(C,ring_path(64,-12,rng,1.0),t,5,(5,6))
        b+=rope_ring(C,t,46,13)
        d=perim_dense(22);T=len(d)
        b+=f'<rect x="-22" y="-22" width="{W+44}" height="{H+44}" rx="52" fill="none" stroke="{t[1]}" stroke-width="14"/>'
        for i in range(0,T,13):
            x,y,nx,ny=d[i];b+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.4" fill="{t[2]}" stroke="{t[0]}" stroke-width="2"/><circle cx="{x-1.6:.1f}" cy="{y-1.8:.1f}" r="2" fill="{t[4]}"/>'
        b+=cel(C,ring_path(-2,-14,rng,.8),[t[0],t[1],t[1],t[2],t[3]],3,(2,2),shine=False)
        b+=streaks(C,t,58,16,rng,(16,30))
    C.add(b)
    n={'bronze':2,'silver':4,'gold':6}[tier]
    for x,y,r in ((-104,200,11),(W+104,H-200,11),(180,-126,9),(W-180,H+126,9),(-90,H-140,8),(W+90,150,8))[:n]: C.add(sparkle(x,y,r,t))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')
