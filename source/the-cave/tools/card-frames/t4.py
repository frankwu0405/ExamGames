from v4 import *
import t3
GREEN=[('#0f3d2a','#1f7a4d','#6fd49a','#c8ffe0'),('#12453a','#2a8f78','#7ce6cf','#d2fff4'),('#2a4a12','#5a9a24','#bde86a','#eaffc0'),('#0e3a44','#1f7f8f','#6ee0ee','#d0fbff')]
BLUE=[('#1b3a6e','#3f7fcf','#a8d4ff','#eaf5ff'),('#14506a','#2d9bb5','#8ae6f2','#e0fcff'),('#2a3a7a','#5a72d0','#b8c4ff','#eef0ff'),('#164a5a','#3aa68f','#9ef0d4','#e6fff6')]
def foliage(C,x,y,out,n,spread,Lmax,pal,rng,bias=0):
    items=[]
    for k in range(n):
        a=out+rng.uniform(-spread,spread)+bias;L=rng.uniform(.55,1)*Lmax;items.append((L,a))
    items.sort(reverse=True);s=''
    for L,a in items:
        s+=oleaf(C,x,y,L,L*rng.uniform(.28,.38),a,rng.choice(pal),curve=rng.uniform(-L*.18,L*.18))
    return s
def organic(name,seed,bw,pal_leaf,flowers,berries_col,petal_cols=None,vines=1):
    C=Ctx(name);p=C.p;rng=random.Random(seed);s=''
    cols=[p[1],p[2],p[3],p[4]]
    c=bw/2+2
    pts,d=branch_pts(c,rng,wob=3.2)
    T=len(pts)
    nz2=noise(rng,T,.22,3)
    wf=lambda t:bw*(1+nz2(t*T))
    # back foliage (behind branch): along edges, small leaves poking outward
    back=''
    for k in range(0,len(d),46):
        x,y,nx,ny=d[k];
        if rng.random()<.8:
            a=deg(nx,ny)+rng.choice([-1,1])*rng.uniform(25,60);L=rng.uniform(30,46)
            back+=oleaf(C,x+nx*c,y+ny*c,L,L*.34,a,rng.choice(pal_leaf),curve=rng.uniform(-6,6))
    C.add(back)
    C.add(ribbon(C,pts,wf,cols))
    # knots
    for k in range(5):
        i=rng.randrange(T);x,y=pts[i];C.add(f'<ellipse cx="{x}" cy="{y}" rx="{bw*.2}" ry="{bw*.14}" fill="{p[1]}" stroke="{p[0]}" stroke-width="2" transform="rotate({rng.uniform(0,180)} {x} {y})"/><ellipse cx="{x-.8}" cy="{y-.8}" rx="{bw*.09}" ry="{bw*.06}" fill="{p[4]}" opacity=".7"/>')
    # wrapping vines
    for v in range(vines):
        vp=[];dd=perim_dense(c);Td=len(dd);ph=v*math.pi
        for i in range(0,Td,2):
            x,y,nx,ny=dd[i];a=(bw*.42)*math.sin(2*math.pi*i/(Td/ (13+v*2))+ph);vp.append((x+nx*a,y+ny*a))
        vp.append(vp[0])
        C.add(ribbon(C,vp,lambda t:5.5,[p[1],p[2],p[3],p[5]],grain=False))
    # clusters
    corners=[((0,0),-135,(-1,-1)),((W,0),-45,(1,-1)),((0,H),135,(-1,1)),((W,H),45,(1,1))]
    for (cx,cy),out,sg in corners:
        x,y,nx,ny=at(c,(cx,cy));o=deg(nx,ny)
        C.add(foliage(C,x,y,o,rng.randint(9,12),78,rng.uniform(78,92),pal_leaf,rng))
        for k in range(rng.randint(2,3)): C.add(tendril(C,x,y,o+rng.uniform(-70,70),rng.uniform(30,44)))
        C.add(flowers(C,x,y,o,rng))
    mids=[(W*.5+rng.uniform(-20,20),0,'t'),(W*.5+rng.uniform(-20,20),H,'b'),(0,H*.5+rng.uniform(-40,40),'l'),(W,H*.5+rng.uniform(-40,40),'r'),
          (W*.22,0,'t'),(W*.78,H,'b'),(0,H*.22,'l'),(W,H*.8,'r')]
    for k,(mx,my,_) in enumerate(mids):
        x,y,nx,ny=at(c,(mx,my));o=deg(nx,ny);big=k<4
        C.add(foliage(C,x,y,o,rng.randint(6,8) if big else rng.randint(3,4),60 if big else 50,rng.uniform(58,72) if big else rng.uniform(40,52),pal_leaf,rng))
        if big: C.add(flowers(C,x,y,o,rng,small=True))
        else:
            for q in range(rng.randint(2,4)):
                a=rng.uniform(-.5,.5);C.add(berry(C,x+nx*(10+q*8)+(-ny)*rng.uniform(-8,8),y+ny*(10+q*8)+nx*rng.uniform(-8,8),rng.uniform(6,9.5),berries_col))
    return C
def flowers_bronze(C,x,y,o,rng,small=False):
    s=''
    for q in range(rng.randint(4,6) if not small else rng.randint(2,4)):
        a=math.radians(o-90+rng.uniform(-70,70));r=rng.uniform(20,46);bx=x+math.cos(a)*r+rng.uniform(-6,6);by=y+math.sin(a)*r+rng.uniform(-6,6)
        s+=berry(C,bx,by,rng.uniform(7,11),('#ff7a4a','#ffd0a0','#c02a10'))
    return s
def bronze():
    C=organic('bronze',11,34,GREEN,flowers_bronze,('#ff7a4a','#ffd0a0','#c02a10'))
    return C.svg()
def flowers_silver(C,x,y,o,rng,small=False):
    s='';cols=[('#6a52c8','#b9a4ff','#f0eaff','#ffffff'),('#3a62c8','#9fc0ff','#eef4ff','#ffffff'),('#8a58c0','#d8b4ff','#fbf0ff','#ffffff')]
    n=2 if small else rng.randint(3,4)
    for q in range(n):
        a=math.radians(o-90+rng.uniform(-60,60));r=(rng.uniform(8,22) if q==0 else rng.uniform(44,66));bx=x+math.cos(a)*r;by=y+math.sin(a)*r
        R=rng.uniform(32,40) if q==0 else rng.uniform(20,26)
        s+=blossom(C,bx,by,R*(0.85 if small else 1),rng.uniform(0,72),rng.choice(cols),rng.choice(['sapph','aqua','ameth']))
    for q in range(rng.randint(2,4)):
        a=math.radians(o-90+rng.uniform(-80,80));r=rng.uniform(40,62);s+=pearl(C,x+math.cos(a)*r,y+math.sin(a)*r,rng.uniform(3.4,5.5))
    return s
def silver():
    C=organic('silver',23,38,BLUE,flowers_silver,('#bfe8ff','#ffffff','#5a9ad0'),vines=2)
    return C.svg()

# ================= GOLD (baroque, carved)
def spiral(C,cx,cy,R0,th0,dirn,turns,w0,cols,ol=None):
    pts=[]
    for i in range(61):
        t=i/60;r=R0*(1-.88*t);th=th0+dirn*t*turns*2*math.pi;pts.append((cx+r*math.cos(th),cy+r*math.sin(th)))
    return ribbon(C,pts,lambda t:max(3.2,w0*(1-.8*t)),cols,grain=False)
def sscroll(C,p0,p1,p2,p3,w0,cols,curl_c,R0,th0,dirn,turns=1.35):
    """tail bezier then spiral end"""
    pts=[]
    for i in range(31):
        t=i/30;u=1-t;pts.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0],u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
    sp=[]
    for i in range(1,61):
        t=i/60;r=R0*(1-.85*t);th=th0+dirn*t*turns*2*math.pi;sp.append((curl_c[0]+r*math.cos(th),curl_c[1]+r*math.sin(th)))
    allp=pts+sp
    return ribbon(C,allp,lambda t:max(3,w0*(1-.75*t)),cols,grain=False)
def gold():
    C=Ctx('gold');p=C.p;rng=random.Random(5)
    gc=[p[1],p[3],p[4],p[5]]
    C.defs.append('<filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2.5" dy="3.5" stdDeviation="2.2" flood-color="#2a1000" flood-opacity=".75"/></filter>')
    C.add(tube(C,60,7,p))
    for w_,col,dx,dy in ((30,p[1],0,0),(27,p[2],.6,.8),(21,p[2],-.3,-.4),(12,p[3],-1.2,-1.6)):
        C.add(rect_ring(43,w_,col,dx=dx,dy=dy))
    C.add(tube(C,27,7,p))
    d=perim_dense(19);T=len(d)
    C.add(rect_ring(19,11,p[1]));C.add(rect_ring(19,9,p[2]))
    for i in range(0,T,10):
        x,y,nx,ny=d[i];a=deg(nx,ny)
        C.add(f'<g transform="translate({x} {y}) rotate({a})"><ellipse rx="2.8" ry="3.8" fill="{p[4]}" stroke="{p[0]}" stroke-width="1.3"/></g>')
    C.add(tube(C,10,12,p))
    for x,y,nx,ny,i in perim(2.2,170): C.add(bead(C,x,y,2.4,p[4]))
    C.add(rect_ring(.6,2.2,p[0]))
    # ---- sprigs lying on the cove
    d=perim_dense(43);T=len(d)
    for k in range(10,T-10,150):
        x,y,nx,ny=d[k]
        if min(math.hypot(x-a,y-b) for a,b in ((0,0),(W,0),(0,H),(W,H),(W/2,0),(W/2,H),(0,H/2),(W,H/2)))<130: continue
        t=deg(-ny,nx)+90*0; a0=deg(nx,ny)+90
        for sg in (-1,1):
            C.add(oleaf(C,x,y,34,11,a0+(0 if sg>0 else 180)+sg*-18,[p[1],p[3],p[5],p[5]],curve=sg*4))
        C.add(bead(C,x,y,3.6,p[4]))
    def corner():
        t=''
        c=-30
        for a,L,w in ((-130,66,24),(-50,66,24),(-160,52,18),(-20,52,18),(-90,90,32),(-135,100,36),(-45,100,36)):
            pass
        for a,L,w in ((-212,64,24),(-58,64,24),(-185,78,30),(-85,78,30),(-160,90,34),(-110,90,34),(-135,96,38)):
            t+=oleaf(C,c,c,L,w,a+0,[p[1],p[3],p[4],p[5]],curve=(8 if a<-135 else -8))
        t+=sscroll(C,(-14,-40),(20,-62),(48,-58),(70,-44),12,gc,(76,-60),16,math.pi*.5,-1,1.5)
        t+=sscroll(C,(-40,-14),(-62,20),(-58,48),(-44,70),12,gc,(-60,76),16,0,1,1.5)
        t+=sscroll(C,(-30,-30),(10,-70),(50,-40),(60,-60),12,gc,(48,-66),14,.8,-1,1.4) if False else ''
        t+=f'<circle cx="{c}" cy="{c}" r="26" fill="{p[0]}"/>'
        for k in range(10):
            a=k*36;t+=f'<g transform="translate({c} {c}) rotate({a})"><path d="M0 0C-10 -6 -9 -20 0 -26C9 -20 10 -6 0 0Z" fill="{p[3]}" stroke="{p[0]}" stroke-width="2"/><path d="M0 -4L0 -20" stroke="{p[5]}" stroke-width="2"/></g>'
        t+=gem(C,c,c,13,'ruby')
        return t
    C.add('<g filter="url(#ds)">'+mirror4(corner)+'</g>')
    def centre(x,y,rot,sc=1):
        g=f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})">'
        for sg in (-1,1):
            g+=sscroll(C,(sg*14,0),(sg*34,-6),(sg*56,-4),(sg*76,-14),11,gc,(sg*82,-30),16,math.pi*.5,-sg,1.5)
        for a,L,w,cv in ((-76,46,21,5),(76,46,21,-5),(-54,56,25,4),(54,56,25,-4),(-30,62,28,3),(30,62,28,-3),(0,66,32,0)):
            g+=oleaf(C,0,-6,L,w,a,[p[1],p[3],p[4],p[5]],curve=cv)
        g+=f'<ellipse cx="0" cy="-2" rx="16" ry="20" fill="{p[0]}"/>'+gem(C,0,-4,12,'ruby')
        g+=pearl(C,0,22,5)+pearl(C,0,34,4)
        return g+'</g>'
    C.add('<g filter="url(#ds)">'+centre(W/2,-38,0)+centre(W/2,H+38,180)+centre(-38,H/2,-90,.9)+centre(W+38,H/2,90,.9)+'</g>')
    for px,py,r in ((-76,130,9),(W+76,H-130,9),(150,-92,8),(W-150,H+92,8)): C.add(star(px,py,r,'#fff8d0',.9))
    return C.svg()

# ================= DIAMOND (clustered crystals)
RAMP={'bl':['#1c2aa0','#3b5de6','#6ba2ff','#aad6ff','#e6f5ff'],'vi':['#44168f','#7338dc','#a870fa','#d0b0ff','#f3e8ff'],'pk':['#8e2682','#d054c0','#f484dc','#ffbcee','#fff0fb'],'cy':['#0f6496','#26a4d6','#6cd6f4','#b0efff','#eaffff']}
def chunk(C,x,y,R,rot,k,rng,elong=1.0):
    r=RAMP[k];n=rng.choice([6,7,7,8]);ol='#16134f'
    ang=sorted(rng.uniform(0,6.283) for _ in range(n)) if False else [i*2*math.pi/n+rng.uniform(-.25,.25) for i in range(n)]
    V=[(R*rng.uniform(.8,1.1)*math.cos(a)*elong,R*rng.uniform(.8,1.1)*math.sin(a)) for a in ang]
    c0=(rng.uniform(-.12,.12)*R-R*.1,rng.uniform(-.12,.12)*R-R*.1)
    U=[(c0[0]+(v[0]-c0[0])*.5,c0[1]+(v[1]-c0[1])*.5) for v in V]
    def br(mx,my):
        a=math.atan2(my,mx);b=math.cos(a-math.radians(-135));return b
    s=f'<g transform="translate({x} {y}) rotate({rot})"><polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a,b in V)}" fill="{ol}" stroke="{ol}" stroke-width="6" stroke-linejoin="round"/>'
    for i in range(n):
        j=(i+1)%n;mx=(V[i][0]+V[j][0])/2;my=(V[i][1]+V[j][1])/2
        ci=max(0,min(4,int((br(mx,my)+1)/2*4.99)+rng.choice([-1,0,0,1])))
        s+=f'<polygon points="{V[i][0]:.1f},{V[i][1]:.1f} {V[j][0]:.1f},{V[j][1]:.1f} {U[j][0]:.1f},{U[j][1]:.1f} {U[i][0]:.1f},{U[i][1]:.1f}" fill="{r[ci]}" stroke="{ol}" stroke-width="1.2" stroke-linejoin="round"/>'
    g=C.rad([(0,'#fff',1),(.6,r[4],1),(1,r[3],1)],.35,.3,.9)
    s+=f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a,b in U)}" fill="{g}" stroke="{ol}" stroke-width="1.4"/>'
    for i in range(0,n,2):
        s+=f'<path d="M{U[i][0]:.1f} {U[i][1]:.1f}L{c0[0]:.1f} {c0[1]:.1f}" stroke="{r[2]}" stroke-width="1" opacity=".6"/>'
    s+=f'<path d="M{-R*.5:.1f} {-R*.35:.1f}L{-R*.2:.1f} {-R*.6:.1f}" stroke="#fff" stroke-width="{max(2,R*.08):.1f}" stroke-linecap="round" opacity=".95"/></g>'
    return s
def prism(C,x,y,L,wd,ang,k,rng):
    return t3.crystal(C,x,y,L,wd,ang,{'bl':'cy','vi':'vi','pk':'pk','cy':'cy'}[k])
def diamond():
    C=Ctx('diamond');p=C.p;rng=random.Random(9)
    C.defs.append('<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>')
    C.add(f'<rect x="-34" y="-34" width="{W+68}" height="{H+68}" rx="62" fill="none" stroke="#a8c8ff" stroke-width="64" opacity=".5" filter="url(#bl)"/>')
    # geode matrix
    pts,_=branch_pts(15,rng,wob=3)
    N=len(pts);nz=noise(rng,N,.25,3)
    C.add(ribbon(C,pts,lambda t:34*(1+nz(t*N)),['#2a1a78','#4a34b8','#7a62e8','#b8a8ff'],grain=False))
    kinds=['bl','vi','pk','cy','bl','vi']
    items=[]
    def ring(c,n,Rr,jit,lenr):
        for x,y,nx,ny,i in perim(c,n,rng.random()):
            if rng.random()<.0: continue
            o=deg(nx,ny)
            items.append((c,x+rng.uniform(-jit,jit),y+rng.uniform(-jit,jit),o,rng.uniform(*Rr),rng.choice(kinds),rng.random()<.3,rng.uniform(*lenr)))
    ring(50,20,(32,48),8,(64,92)); ring(34,28,(24,34),6,(46,70)); ring(20,30,(14,19),4,(30,46))
    # bigger cluster boosts at corners & mid-edges
    for cx,cy in ((0,0),(W,0),(0,H),(W,H),(W/2,0),(W/2,H),(0,H/2),(W,H/2),(W*.25,0),(W*.75,H),(0,H*.25),(W,H*.75)):
        x,y,nx,ny=at(46,(cx,cy));o=deg(nx,ny)
        for q in range(rng.randint(2,3)):
            items.append((60,x+rng.uniform(-14,14),y+rng.uniform(-14,14),o,rng.uniform(46,66),rng.choice(kinds),rng.random()<.3,rng.uniform(80,100)))
    items.sort(key=lambda t:-t[0])
    for c,x,y,o,R,k,isp,L in items:
        # clamp to canvas
        if isp: C.add(prism(C,x,y,L*.8 if c<60 else L,R*.95,o+rng.uniform(-38,38),k,rng))
        else: C.add(chunk(C,x,y,R,rng.uniform(0,360),k,rng,rng.uniform(.8,1.35)))
    for x,y in [(-70,150),(W+70,H-140),(150,-92),(W-140,H+92),(-60,H-200),(W+62,210)]: C.add(star(x,y,rng.uniform(8,13),'#fff',1))
    return C.svg()
