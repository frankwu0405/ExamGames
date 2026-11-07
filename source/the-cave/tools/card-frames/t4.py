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

# ================= DIAMOND (flat vector crystal clusters)
GR={'bl':[('#2f4cf2','#6c9bff'),('#4f7dff','#9ed0ff'),('#233fd0','#4f7dff')],'vi':[('#5a2fe0','#9a63ff'),('#7b4cf5','#c49cff'),('#4423b8','#7b4cf5')],
    'pk':[('#c45ae8','#ffa8f2'),('#e07af0','#ffd0f8'),('#9a3cc8','#d070ec')],'cy':[('#2f9af2','#7de0ff'),('#5cc4ff','#c8f4ff'),('#2278d0','#4fb0f4')]}
def fg(C,k,tone,vert=True):
    a,b=GR[k][tone];return C.grad([(0,a),(1,b)],0,1,1,0)
def prism5(C,x,y,L,wd,ang,k,rng):
    bl=(-wd/2,0);br=(wd/2,0);sl=(-wd*.5,-.64*L);sr=(wd*.5,-.64*L);m1=(-wd*.12,-.7*L);m2=(wd*.22,-.7*L);b1=(-wd*.12,0);b2=(wd*.22,0);tip=(wd*.06,-L)
    P=lambda *a:' '.join(f'{u:.1f},{v:.1f}' for u,v in a)
    g=f'<g transform="translate({x} {y}) rotate({ang})">'
    g+=f'<polygon points="{P(bl,sl,m1,b1)}" fill="{fg(C,k,1)}"/><polygon points="{P(b1,m1,m2,b2)}" fill="{fg(C,k,0)}"/><polygon points="{P(b2,m2,sr,br)}" fill="{fg(C,k,2)}"/>'
    g+=f'<polygon points="{P(sl,tip,m1)}" fill="{GR[k][1][1]}"/><polygon points="{P(m1,tip,m2)}" fill="{GR[k][0][1]}"/><polygon points="{P(m2,tip,sr)}" fill="{GR[k][2][0]}"/>'
    g+=f'<path d="M{sl[0]:.1f} {sl[1]:.1f}L{m1[0]:.1f} {m1[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55"/>'
    return g+'</g>'
def hero(C,x,y,R,rot,k,rng):
    """faceted rough gem like the reference: table + side planes, flat colour, no outline"""
    n=rng.choice([5,6,6,7]);ang=[i*2*math.pi/n+rng.uniform(-.2,.2) for i in range(n)]
    V=[(R*rng.uniform(.88,1.08)*math.cos(a),R*rng.uniform(.88,1.08)*math.sin(a)*.92) for a in ang]
    c0=(-R*.08,-R*.1);U=[(c0[0]+(v[0]-c0[0])*.52,c0[1]+(v[1]-c0[1])*.52) for v in V]
    g=f'<g transform="translate({x} {y}) rotate({rot})">'
    for i in range(n):
        j=(i+1)%n;mx=(V[i][0]+V[j][0])/2;my=(V[i][1]+V[j][1])/2;b=math.cos(math.atan2(my,mx)-math.radians(-135))
        tone=0 if b>.35 else (1 if b>-.4 else 2)
        kk=k if rng.random()>.18 else rng.choice(['bl','vi','pk','cy'])
        g+=f'<polygon points="{V[i][0]:.1f},{V[i][1]:.1f} {V[j][0]:.1f},{V[j][1]:.1f} {U[j][0]:.1f},{U[j][1]:.1f} {U[i][0]:.1f},{U[i][1]:.1f}" fill="{fg(C,kk,tone)}"/>'
    # table: split into 2-3 facets
    for i in range(0,n-2):
        a,b2,c=U[0],U[i+1],U[i+2];tone=(i%3)
        g+=f'<polygon points="{a[0]:.1f},{a[1]:.1f} {b2[0]:.1f},{b2[1]:.1f} {c[0]:.1f},{c[1]:.1f}" fill="{fg(C,k,[1,0,1][i%3])}" opacity="{.95 if i%2 else 1}"/>'
    g+=f'<polygon points="{" ".join(f"{u:.1f},{v:.1f}" for u,v in U)}" fill="none" stroke="#fff" stroke-width="1.3" opacity=".45" stroke-linejoin="round"/>'
    return g+'</g>'
def diamond():
    C=Ctx('diamond');rng=random.Random(21)
    kinds=['bl','vi','pk','cy','bl','vi']
    pts,_=branch_pts(9,rng,wob=1.5)
    C.add(ribbon(C,pts,lambda t:34,['#4a2fc8','#6a52e8','#9a86ff','#c8bcff'],ol='#3a24a8',grain=False))
    d=perim_dense(18);T=len(d)
    n=28;order=list(range(n))
    slots=[]
    for i in range(n):
        x,y,nx,ny=d[int((i+.5)*T/n)%T];slots.append((x,y,nx,ny,i))
    # bigger clusters at corners
    corner_pts=[(0,0),(W,0),(0,H),(W,H)]
    for cx,cy in corner_pts:
        x,y,nx,ny=min(d,key=lambda q:(q[0]-cx)**2+(q[1]-cy)**2);slots.append((x,y,nx,ny,99))
    layers=[]
    for x,y,nx,ny,i in slots:
        o=deg(nx,ny);big=i==99;kk=rng.choice(kinds);sc=1.45 if big else rng.uniform(.95,1.25)
        mode=rng.choice(['spray','hero','duo']) if not big else 'hero'
        parts=[]
        n_p=rng.randint(3,5) if mode!='duo' else 3
        for q in range(n_p):
            a=o+(q-(n_p-1)/2)*rng.uniform(24,32)+rng.uniform(-6,6)
            L=rng.uniform(58,86)*sc*(1-.14*abs(q-(n_p-1)/2));wd=L*rng.uniform(.42,.52)
            parts.append(('p',x+rng.uniform(-6,6),y+rng.uniform(-6,6),L,wd,a,rng.choice([kk,kk,rng.choice(kinds)]),L))
        if True:
            parts.append(('h',x+nx*(-2)+(-ny)*rng.uniform(-14,14),y+ny*(-2)+nx*rng.uniform(-14,14),rng.uniform(20,28)*sc,rng.uniform(0,360),kk if rng.random()<.5 else rng.choice(kinds),99))
        layers.append(parts)
    # draw order: prisms first (taller first), heroes after
    allp=[p for parts in layers for p in parts]
    allp.sort(key=lambda p:(p[0]=='h',-(p[7] if p[0]=='p' else 0)))
    for p in allp:
        if p[0]=='p': C.add(prism5(C,p[1],p[2],p[3],p[4],p[5],p[6],rng))
        else: C.add(hero(C,p[1],p[2],p[3],p[4],p[5],rng))
    # ring of small gems tucked along the inner edge to close gaps
    pass
    for x,y in [(-72,150),(W+72,H-140),(150,-96),(W-140,H+96)]: C.add(star(x,y,rng.uniform(8,12),'#fff',.95))
    return C.svg()
