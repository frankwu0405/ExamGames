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
    for k in range(0,len(d),70):
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
            x,y,nx,ny=dd[i];a=(bw*.3)*math.sin(2*math.pi*i/(Td/ (13+v*2))+ph);vp.append((x+nx*a,y+ny*a))
        vp.append(vp[0])
        C.add(ribbon(C,vp,lambda t:5.5,[p[1],p[2],p[3],p[5]],grain=False))
    # clusters
    corners=[((0,0),-135,(-1,-1)),((W,0),-45,(1,-1)),((0,H),135,(-1,1)),((W,H),45,(1,1))]
    for (cx,cy),out,sg in corners:
        x,y,nx,ny=at(c,(cx,cy));o=deg(nx,ny)
        C.add(foliage(C,x,y,o,rng.randint(7,9),66,rng.uniform(64,78),pal_leaf,rng))
        C.add(tendril(C,x,y,o+rng.uniform(-60,60),rng.uniform(34,44)))
        C.add(flowers(C,x,y,o,rng))
    mids=[(W*.5,0,'t'),(W*.5,H,'b'),(0,H*.5,'l'),(W,H*.5,'r')]
    for k,(mx,my,_) in enumerate(mids):
        x,y,nx,ny=at(c,(mx,my));o=deg(nx,ny);big=k<4
        C.add(foliage(C,x,y,o,rng.randint(4,5),50,rng.uniform(50,62),pal_leaf,rng))
        if k in (0,3): C.add(flowers(C,x,y,o,rng,small=True))
        else:
            for q in range(rng.randint(2,4)):
                a=rng.uniform(-.5,.5);C.add(berry(C,x+nx*(10+q*8)+(-ny)*rng.uniform(-8,8),y+ny*(10+q*8)+nx*rng.uniform(-8,8),rng.uniform(6,9.5),berries_col))
    return C
def flowers_bronze(C,x,y,o,rng,small=False):
    s=''
    for q in range(rng.randint(2,3) if not small else 2):
        a=math.radians(o-90+rng.uniform(-70,70));r=rng.uniform(20,46);bx=x+math.cos(a)*r+rng.uniform(-6,6);by=y+math.sin(a)*r+rng.uniform(-6,6)
        s+=berry(C,bx,by,rng.uniform(7,11),('#ff7a4a','#ffd0a0','#c02a10'))
    return s
def bronze():
    C=organic('bronze',11,40,GREEN,flowers_bronze,('#ff7a4a','#ffd0a0','#c02a10'))
    return C.svg()
def flowers_silver(C,x,y,o,rng,small=False):
    s=''
    for q in range(2 if small else 3):
        a=math.radians(o-90+rng.uniform(-60,60));r=rng.uniform(20,40);s+=pearl(C,x+math.cos(a)*r,y+math.sin(a)*r,rng.uniform(4.5,7))
    return s
    cols=[]
    n=2 if small else rng.randint(3,4)
    for q in range(n):
        a=math.radians(o-90+rng.uniform(-60,60));r=(rng.uniform(8,22) if q==0 else rng.uniform(44,66));bx=x+math.cos(a)*r;by=y+math.sin(a)*r
        R=rng.uniform(32,40) if q==0 else rng.uniform(20,26)
        s+=blossom(C,bx,by,R*(0.85 if small else 1),rng.uniform(0,72),rng.choice(cols),rng.choice(['sapph','aqua','ameth']))
    for q in range(rng.randint(2,4)):
        a=math.radians(o-90+rng.uniform(-80,80));r=rng.uniform(40,62);s+=pearl(C,x+math.cos(a)*r,y+math.sin(a)*r,rng.uniform(3.4,5.5))
    return s
def silver():
    C=organic('silver',23,40,BLUE,flowers_silver,('#bfe8ff','#ffffff','#5a9ad0'),vines=2)
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

# ================= DIAMOND (flat-vector crystal wreath, after reference)
def mix(h1,h2,t):
    a=[int(h1[i:i+2],16) for i in (1,3,5)];b=[int(h2[i:i+2],16) for i in (1,3,5)]
    return '#%02x%02x%02x'%tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
PAIRS=[('#2f55f0','#ff9bf0'),('#6a3cf0','#5fc8ff'),('#4aa8ff','#c79bff'),('#8a4cf0','#ffb0f4'),('#3f6cff','#8ef0ff'),('#7a3cf0','#ff9ae8'),('#2a7af0','#b49cff')]
def fgrad(C,pair,t_light,ang=135):
    a=mix(pair[0],'#ffffff',t_light) if t_light>0 else mix(pair[0],'#10186e',-t_light)
    b=mix(pair[1],'#ffffff',t_light) if t_light>0 else mix(pair[1],'#10186e',-t_light)
    r=math.radians(ang);x2=.5+.5*math.cos(r);y2=.5+.5*math.sin(r)
    return C.grad([(0,a),(1,b)],1-x2,1-y2,x2,y2)
def D_prism(C,x,y,L,wd,ang,pair):
    bl=(-wd/2,0);br=(wd/2,0);sl=(-wd*.5,-.62*L);sr=(wd*.5,-.62*L);m1=(-wd*.1,-.7*L);m2=(wd*.24,-.7*L);b1=(-wd*.1,0);b2=(wd*.24,0);tip=(wd*.07,-L)
    P=lambda *a:' '.join(f'{u:.1f},{v:.1f}' for u,v in a)
    g=f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})">'
    g+=f'<polygon points="{P(bl,sl,m1,b1)}" fill="{fgrad(C,pair,.3,90)}"/><polygon points="{P(b1,m1,m2,b2)}" fill="{fgrad(C,pair,.05,120)}"/><polygon points="{P(b2,m2,sr,br)}" fill="{fgrad(C,pair,-.3,120)}"/>'
    g+=f'<polygon points="{P(sl,tip,m1)}" fill="{fgrad(C,pair,.5,45)}"/><polygon points="{P(m1,tip,m2)}" fill="{fgrad(C,pair,.2,60)}"/><polygon points="{P(m2,tip,sr)}" fill="{fgrad(C,pair,-.15,60)}"/>'
    return g+'</g>'
def D_gem(C,x,y,R,rot,pair,rng,n=None):
    n=n or rng.choice([5,6,6,7]);el=rng.uniform(.8,1.25)
    ang=[i*2*math.pi/n+rng.uniform(-.18,.18)+.3 for i in range(n)]
    V=[(R*rng.uniform(.9,1.08)*math.cos(a)*el,R*rng.uniform(.9,1.08)*math.sin(a)/el) for a in ang]
    c0=(-R*.12,-R*.14);U=[(c0[0]+(v[0]-c0[0])*.46,c0[1]+(v[1]-c0[1])*.46) for v in V]
    g=f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.1f})">'
    for i in range(n):
        j=(i+1)%n;mx=(V[i][0]+V[j][0])/2;my=(V[i][1]+V[j][1])/2;b=math.cos(math.atan2(my,mx)-math.radians(-135))
        g+=f'<polygon points="{V[i][0]:.1f},{V[i][1]:.1f} {V[j][0]:.1f},{V[j][1]:.1f} {U[j][0]:.1f},{U[j][1]:.1f} {U[i][0]:.1f},{U[i][1]:.1f}" fill="{fgrad(C,pair,b*.38,rng.choice([60,100,140]))}"/>'
    # table, split into 3 facets
    k=len(U)
    for i in range(1,k-1):
        g+=f'<polygon points="{U[0][0]:.1f},{U[0][1]:.1f} {U[i][0]:.1f},{U[i][1]:.1f} {U[i+1][0]:.1f},{U[i+1][1]:.1f}" fill="{fgrad(C,pair,[.45,.2,.0,.3][i%4],rng.choice([45,90,150]))}"/>'
    return g+'</g>'
def D_spray(C,x,y,ang,sc,pair,rng,count=5):
    g=''
    items=[]
    for q in range(count):
        a=ang+(q-(count-1)/2)*rng.uniform(20,30)+rng.uniform(-6,6)
        L=rng.uniform(50,84)*sc*(1-.12*abs(q-(count-1)/2));items.append((L,a))
    for L,a in sorted(items,reverse=True):
        pr=pair if rng.random()<.6 else rng.choice(PAIRS)
        g+=D_prism(C,x+rng.uniform(-5,5),y+rng.uniform(-5,5),L,L*rng.uniform(.34,.46),a,pr)
    return g
def diamond():
    C=Ctx('diamond');rng=random.Random(33)
    d=perim_dense(34);T=len(d);n=35
    slots=[]
    for i in range(n):
        slots.append(d[int((i+.5+rng.uniform(-.12,.12))*T/n)%T])
    # corners get an extra big piece
    corners=[min(d,key=lambda q:(q[0]-cx)**2+(q[1]-cy)**2) for cx,cy in ((0,0),(W,0),(0,H),(W,H))]
    out=[]
    for kind,(x,y,nx,ny) in [('s',s_) for s_ in slots]+[('c',c_) for c_ in corners]:
        o=deg(nx,ny);tan=o+90
        pair=rng.choice(PAIRS)
        r=rng.random()
        if kind=='c':
            out.append((1,lambda x=x,y=y,o=o,pair=pair:D_spray(C,x,y,o,1.35,pair,rng,7)))
            out.append((3,lambda x=x+nx*16,y=y+ny*16,pair=rng.choice(PAIRS):D_gem(C,x,y,48,rng.uniform(0,360),pair,rng)))
        elif r<.34:   # lying prisms along the edge
            a=tan+rng.choice([0,180])+rng.uniform(-14,14)
            out.append((1,lambda x=x,y=y,a=a,pair=pair:D_prism(C,x,y,rng.uniform(96,126),40,a,pair)))
            out.append((2,lambda x=x+nx*18,y=y+ny*18,a=a+rng.uniform(-18,18),pair=rng.choice(PAIRS):D_prism(C,x,y,rng.uniform(70,96),32,a,pair)))
        elif r<.68:   # hero gem + small spray
            out.append((1,lambda x=x,y=y,o=o,pair=pair:D_spray(C,x+nx*10,y+ny*10,o+rng.uniform(-30,30),1.0,pair,rng,4)))
            out.append((3,lambda x=x,y=y,pair=pair:D_gem(C,x,y,rng.uniform(34,48),rng.uniform(0,360),pair,rng)))
        else:         # spray
            out.append((2,lambda x=x,y=y,o=o,pair=pair:D_spray(C,x,y,o+rng.uniform(-35,35),1.15,pair,rng,rng.randint(4,6))))
            out.append((3,lambda x=x-nx*4,y=y-ny*4,pair=rng.choice(PAIRS):D_gem(C,x,y,rng.uniform(24,32),rng.uniform(0,360),pair,rng,5)))
    for z,f in sorted(out,key=lambda t:t[0]): C.add(f())
    return C.svg()
