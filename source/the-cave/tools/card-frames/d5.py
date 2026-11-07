import math,random
from v3 import Ctx,W,H,uid
LIGHT=(-.56,-.83)
FAM={ # shadow, dark, mid, lit, highlight  -- hue shifts with light, like the reference
 'cy':['#2a2290','#3d4fe0','#3f9cff','#7fe0ff','#effdff'],
 'bl':['#30208f','#5a3ee6','#4f78ff','#a9c6ff','#f4f6ff'],
 'vi':['#361c8a','#7a3ee8','#7a6cff','#e2a6ff','#fdf0ff'],
 'pk':['#3d1d88','#8c3fe0','#b36cf5','#ffa6ea','#fff2fb'],
}
ORDER=['cy','bl','vi','pk']
def mix(a,b,t):
    A=[int(a[i:i+2],16) for i in (1,3,5)];B=[int(b[i:i+2],16) for i in (1,3,5)]
    return '#%02x%02x%02x'%tuple(round(A[i]+(B[i]-A[i])*t) for i in range(3))
def tone(fam,b):
    """b in [-1,1] -> interpolated colour along the family ramp"""
    r=FAM[fam];x=max(0,min(3.999,(b+.62)/1.42*4));i=int(x);return mix(r[i],r[i+1],x-i)
def dot(a,b): return a[0]*b[0]+a[1]*b[1]
def norm(v):
    l=math.hypot(*v) or 1;return (v[0]/l,v[1]/l)
def fam_at(x,y,rng,j=.12):
    h=((x+100)/712*.5+(y+110)/1006*.5-.5)*1.5+.5+rng.uniform(-j,j)
    f=max(0,min(2.999,h*3));i=int(f);return ORDER[i],ORDER[i+1],f-i

def prism(C,x,y,L,w,ang,f1,f2,dim=0.0,spec=True):
    a=math.radians(ang);u=(math.sin(a),-math.cos(a));p=(math.cos(a),math.sin(a))
    bL=dot((-p[0],-p[1]),LIGHT)*.85;bR=dot(p,LIGHT)*.85;bC=.2+dot(u,LIGHT)*.15
    tL=dot(norm((-p[0]*.6+u[0]*.7,-p[1]*.6+u[1]*.7)),LIGHT)*.9+.1
    tC=dot(u,LIGHT)*.7+.35
    tR=dot(norm((p[0]*.6+u[0]*.7,p[1]*.6+u[1]*.7)),LIGHT)*.9+.1
    sh=.62*L
    bl=(-w/2,0);br=(w/2,0);sl=(-w/2,-sh);sr=(w/2,-sh);m1=(-w*.14,-sh-w*.12);m2=(w*.2,-sh-w*.12);b1=(-w*.14,0);b2=(w*.2,0);tip=(w*.04,-L)
    P=lambda *q:' '.join(f'{a_:.1f},{b_:.1f}' for a_,b_ in q)
    def face(pts,b):
        b=b-dim
        g=C.grad([(0,mix(tone(f1,b),FAM[f1][0],.38)),(.55,tone(f1,b)),(1,tone(f2,b+.08))],0,1,0,0)
        return f'<polygon points="{P(*pts)}" fill="{g}"/>'
    s=f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})">'
    s+=face((bl,sl,m1,b1),bL)+face((b1,m1,m2,b2),bC)+face((b2,m2,sr,br),bR)
    s+=face((sl,tip,m1),tL)+face((m1,tip,m2),tC)+face((m2,tip,sr),tR)
    # ridges
    hi=FAM[f2][4]
    s+=f'<path d="M{m1[0]:.1f} {m1[1]:.1f}L{b1[0]:.1f} 0M{m2[0]:.1f} {m2[1]:.1f}L{b2[0]:.1f} 0M{sl[0]:.1f} {sl[1]:.1f}L{m1[0]:.1f} {m1[1]:.1f}L{m2[0]:.1f} {m2[1]:.1f}L{sr[0]:.1f} {sr[1]:.1f}M{m1[0]:.1f} {m1[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}M{m2[0]:.1f} {m2[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}" fill="none" stroke="{hi}" stroke-width="1.1" opacity=".45" stroke-linejoin="round"/>'
    s+=f'<polygon points="{P(bl,sl,tip,sr,br)}" fill="none" stroke="{FAM[f1][0]}" stroke-width="2.4" stroke-linejoin="round"/>'
    if spec:
        bx=-w*.34 if bL>bR else w*.36
        s+=f'<path d="M{bx:.1f} {-L*.12:.1f}L{bx:.1f} {-L*.5:.1f}" stroke="#fff" stroke-width="{max(1.8,w*.07):.1f}" stroke-linecap="round" opacity=".8"/>'
    return s+'</g>'

def cutgem(C,x,y,R,rot,f1,f2,rng,n=7,el=1.15):
    # vertices in world space
    a0=math.radians(rot)
    V=[];
    for i in range(n):
        t=i*2*math.pi/n+rng.uniform(-.12,.12);r=R*rng.uniform(.93,1.05)
        lx,ly=r*math.cos(t)*el,r*math.sin(t)/el
        V.append((x+lx*math.cos(a0)-ly*math.sin(a0),y+lx*math.sin(a0)+ly*math.cos(a0)))
    cx=sum(v[0] for v in V)/n-R*.08;cy=sum(v[1] for v in V)/n-R*.1
    U=[(cx+(v[0]-cx)*.5,cy+(v[1]-cy)*.5) for v in V]
    P=lambda *q:' '.join(f'{a_:.1f},{b_:.1f}' for a_,b_ in q)
    s=''
    for i in range(n):
        j=(i+1)%n
        mx,my=(V[i][0]+V[j][0])/2-x,(V[i][1]+V[j][1])/2-y;m=norm((mx,my));b=dot(m,LIGHT)*.8
        mid=((V[i][0]+V[j][0])/2,(V[i][1]+V[j][1])/2)
        g1=C.grad([(0,tone(f1,b+.1)),(1,tone(f2,b+.1))],0,0,1,1);g2=C.grad([(0,tone(f1,b-.15)),(1,tone(f2,b-.15))],0,0,1,1)
        s+=f'<polygon points="{P(V[i],mid,U[j],U[i])}" fill="{g1}"/><polygon points="{P(mid,V[j],U[j])}" fill="{g2}"/>'
    # table split into lit / unlit halves
    k=n//2
    gT1=C.grad([(0,FAM[f2][4]),(1,tone(f1,.55))],0,0,1,1);gT2=C.grad([(0,tone(f1,.45)),(1,tone(f2,.1))],0,0,1,1)
    s+=f'<polygon points="{P(*U)}" fill="{gT2}"/>'
    # top-left part of table brighter
    idx=sorted(range(n),key=lambda i:dot(norm((U[i][0]-cx,U[i][1]-cy)),LIGHT),reverse=True)[:3]
    idx.sort()
    s+=f'<polygon points="{P((cx,cy),*[U[i] for i in idx])}" fill="{gT1}" opacity=".9"/>'
    s+=f'<polygon points="{P(*U)}" fill="none" stroke="{FAM[f2][4]}" stroke-width="1.3" opacity=".6" stroke-linejoin="round"/>'
    for i in range(n):
        s+=f'<path d="M{U[i][0]:.1f} {U[i][1]:.1f}L{V[i][0]:.1f} {V[i][1]:.1f}" stroke="{FAM[f1][0]}" stroke-width="1" opacity=".35"/>'
    s+=f'<polygon points="{P(*V)}" fill="none" stroke="{FAM[f1][0]}" stroke-width="2.6" stroke-linejoin="round"/>'
    lt=min(U,key=lambda q:dot((q[0]-cx,q[1]-cy),(.56,.83)))
    s+=f'<path d="M{(lt[0]+cx)/2:.1f} {(lt[1]+cy)/2:.1f}L{lt[0]*.7+cx*.3:.1f} {lt[1]*.7+cy*.3:.1f}" stroke="#fff" stroke-width="{R*.09:.1f}" stroke-linecap="round" opacity=".9"/>'
    return s

def twinkle(C,x,y,r):
    g=C.rad([(0,'#ffffff',.8),(1,'#ffffff',0)])
    return (f'<circle cx="{x}" cy="{y}" r="{r*1.6}" fill="{g}"/>'
            f'<path transform="translate({x} {y})" d="M0 {-r}Q{r*.1} {-r*.1} {r} 0Q{r*.1} {r*.1} 0 {r}Q{-r*.1} {r*.1} {-r} 0Q{-r*.1} {-r*.1} 0 {-r}Z" fill="#fff"/>')

def diamond(seed=4):
    C=Ctx('diamond');rng=random.Random(seed)
    C.defs.append('<filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="4" stdDeviation="3.5" flood-color="#160b45" flood-opacity=".45"/></filter>')
    back=[];grow=[];fans=[];heroes=[];twk=[]
    corners={'tl':(0,0),'tr':(W,0),'br':(W,H),'bl':(0,H)}
    sides=[('tl','tr',(0,-1)),('tr','br',(1,0)),('br','bl',(0,1)),('bl','tl',(-1,0))]
    for a,b,n in sides:
        A=corners[a];B=corners[b];Lside=math.hypot(B[0]-A[0],B[1]-A[1]);d=((B[0]-A[0])/Lside,(B[1]-A[1])/Lside)
        long=Lside>600
        for start,dirn in ((A,d),(B,(-d[0],-d[1]))):
            base=math.degrees(math.atan2(n[0],-n[1]));cross=n[0]*dirn[1]-n[1]*dirn[0];sg=1 if cross>0 else -1
            half=Lside/2-36;s=60+rng.uniform(0,8)
            pattern=['lie','spray','lie','gem','spray','lie','spray','gem'] if long else ['lie','spray','gem','lie']
            if rng.random()<.5: pattern=pattern[1:]+pattern[:1]
            k=0
            while s<half-10:
                t=s/half;kind=pattern[k%len(pattern)];k+=1
                bx=start[0]+dirn[0]*s+n[0]*3;by=start[1]+dirn[1]*s+n[1]*3
                f1,f2,_=fam_at(bx,by,rng)
                taper=1-.3*t
                if kind=='lie':
                    L=rng.uniform(80,100)*taper;w=L*.4
                    ang=base+sg*rng.uniform(64,74)
                    grow.append((s,prism(C,bx-dirn[0]*L*.15,by-dirn[1]*L*.15,L,w,ang,f1,f2)))
                    if rng.random()<.6:
                        g1,g2,_=fam_at(bx,by,rng);back.append(prism(C,bx+n[0]*6,by+n[1]*6,L*.62,L*.26,base+sg*rng.uniform(30,44),g1,g2,dim=.2,spec=False))
                    s+=L*.48
                elif kind=='spray':
                    m=rng.randint(3,5);Lm=rng.uniform(78,96)*taper;spread=rng.uniform(46,62)
                    tilt=sg*rng.uniform(4,18)
                    items=[]
                    for q in range(m):
                        off=(q-(m-1)/2)/(max(1,m-1))*spread
                        L=Lm*(1-.28*abs(off)/spread*2)*rng.uniform(.88,1.06)
                        g1,g2,_=fam_at(bx,by,rng,.18)
                        items.append((L,prism(C,bx+dirn[0]*off*.3,by+dirn[1]*off*.3,L,L*rng.uniform(.38,.46),base+tilt+off,g1,g2)))
                    items.sort(key=lambda q:-q[0])
                    grow.append((s,''.join(q[1] for q in items)))
                    s+=Lm*.5
                else:
                    R=rng.uniform(18,24)*(1-.15*t)
                    g1,g2,_=fam_at(bx,by,rng,.2)
                    sm=prism(C,bx+dirn[0]*6+n[0]*4,by+dirn[1]*6+n[1]*4,R*2.4,R*.95,base+sg*rng.uniform(-30,10),g1,g2)
                    grow.append((s-1,sm))
                    acc='pk' if (bx+by)>(W+H)*.45 else 'cy'
                    grow.append((s-2,cutgem(C,bx+n[0]*8,by+n[1]*8,R,rng.uniform(0,90),acc,'vi' if acc=='pk' else 'bl',rng,rng.choice([6,7]),1.2)))
                    s+=R*1.7
        for q in range(int(Lside/34)):
            t=(q+.5)/int(Lside/34);bx=A[0]+(B[0]-A[0])*t+n[0]*2;by=A[1]+(B[1]-A[1])*t+n[1]*2
            if min(t,1-t)*Lside<50: continue
            g1,g2,_=fam_at(bx,by,rng);base=math.degrees(math.atan2(n[0],-n[1]))
            back.insert(0,prism(C,bx,by,rng.uniform(40,54),rng.uniform(18,24),base+rng.choice([-1,1])*rng.uniform(70,82),g1,g2,dim=.1,spec=False))
        # meeting fan at side centre
        mx,my=(A[0]+B[0])/2+n[0]*6,(A[1]+B[1])/2+n[1]*6
        base=math.degrees(math.atan2(n[0],-n[1]));sc=1.0 if long else 1.08
        f1,f2,_=fam_at(mx,my,rng,0)
        for off,Lf,wf in ((-40,44,.42),(40,46,.42),(-20,62,.42),(22,60,.42),(0,74,.44)):
            ff1,ff2,_=fam_at(mx,my,rng)
            fans.append(prism(C,mx+math.cos(math.radians(base))*off*.25,my+math.sin(math.radians(base))*off*.25,Lf*sc,Lf*sc*wf,base+off*rng.uniform(.85,1.1),ff1,ff2))
        heroes.append(cutgem(C,mx+n[0]*6,my+n[1]*6,15,rng.uniform(0,60),'pk' if (mx+my)>(W+H)/2 else 'cy','vi',rng,6,1.25))
        twk.append((mx+n[0]*70+(-n[1])*14,my+n[1]*70+n[0]*14,7))
    # corner druzes
    for key,(cx,cy) in corners.items():
        sx=-1 if cx==0 else 1;sy=-1 if cy==0 else 1
        diag=math.degrees(math.atan2(sx,-sy))
        ox,oy=cx+sx*10,cy+sy*10
        items=[]
        for off,Lc in ((-80,62),(80,62),(-56,74),(56,74),(-32,92),(32,90),(-10,104),(14,100)):
            f1,f2,_=fam_at(ox,oy,rng)
            items.append((Lc,prism(C,ox+rng.uniform(-4,4),oy+rng.uniform(-4,4),Lc*rng.uniform(.92,1.04),Lc*.4,diag+off+rng.uniform(-5,5),f1,f2)))
        items.sort(key=lambda q:-q[0])
        fans+= [q[1] for q in items]
        hf='cy' if key=='tl' else ('pk' if key=='br' else ('bl' if key=='tr' else 'vi'))
        heroes.append(cutgem(C,cx+sx*16,cy+sy*16,40,diag+rng.uniform(-20,20),hf,'pk' if hf!='pk' else 'vi',rng,7,1.18))
        twk.append((cx+sx*62,cy+sy*78,10))
    grow.sort(key=lambda q:-q[0])   # centre-ward first, corner-ward on top
    body=''.join(back)+''.join(g for _,g in grow)+''.join(fans)+''.join(heroes)
    C.add(f'<g filter="url(#ds)">{body}</g>')
    for x,y,r in twk[:8]: C.add(twinkle(C,x,y,r))
    return C.svg()

# ===================== ICE BLOCK VERSION =====================
FAM['ice']=['#2a3aa8','#2e6ce0','#45a8ff','#aee9ff','#f4fdff']
FAM['icev']=['#2f2296','#4f48e0','#6f8cff','#c8d4ff','#f6f6ff']
def block(C,x,y,L,w,ang,fam,rng,dim=0.0,frost=True,cracks=True):
    a=math.radians(ang);u=(math.sin(a),-math.cos(a));p=(math.cos(a),math.sin(a))
    bL=dot((-p[0],-p[1]),LIGHT)*.85;bR=dot(p,LIGHT)*.85;bC=.25+dot(u,LIGHT)*.2
    tL=dot(norm((-p[0]*.6+u[0]*.7,-p[1]*.6+u[1]*.7)),LIGHT)*.9+.15
    tC=dot(u,LIGHT)*.7+.45
    tR=dot(norm((p[0]*.6+u[0]*.7,p[1]*.6+u[1]*.7)),LIGHT)*.9+.1
    shl=L*rng.uniform(.5,.66);shr=L*rng.uniform(.5,.66);tx=w*rng.uniform(-.18,.22)
    bl=(-w/2,0);br=(w/2,0);sl=(-w/2,-shl);sr=(w/2,-shr)
    c1=-w*rng.uniform(.1,.2);c2=w*rng.uniform(.14,.26)
    m1=(c1,-(shl+shr)/2-w*.14);m2=(c2,-(shl+shr)/2-w*.12);b1=(c1,0);b2=(c2,0);tip=(tx,-L)
    P=lambda *q:' '.join(f'{a_:.1f},{b_:.1f}' for a_,b_ in q)
    def face(pts,b):
        b=b-dim;c=tone(fam,b)
        base=mix(c,'#ffffff',.32) if frost else mix(c,FAM[fam][0],.3)
        g=C.grad([(0,base),(.35,c),(1,mix(c,'#ffffff',.18))],0,1,0,0)
        return f'<polygon points="{P(*pts)}" fill="{g}"/>'
    s=f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})">'
    s+=face((bl,sl,m1,b1),bL)+face((b1,m1,m2,b2),bC)+face((b2,m2,sr,br),bR)
    s+=face((sl,tip,m1),tL)+face((m1,tip,m2),tC)+face((m2,tip,sr),tR)
    hi=FAM[fam][4]
    s+=f'<path d="M{m1[0]:.1f} {m1[1]:.1f}L{b1[0]:.1f} 0M{m2[0]:.1f} {m2[1]:.1f}L{b2[0]:.1f} 0M{sl[0]:.1f} {sl[1]:.1f}L{m1[0]:.1f} {m1[1]:.1f}L{m2[0]:.1f} {m2[1]:.1f}L{sr[0]:.1f} {sr[1]:.1f}M{m1[0]:.1f} {m1[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}M{m2[0]:.1f} {m2[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}" fill="none" stroke="{hi}" stroke-width="1.4" opacity=".6" stroke-linejoin="round"/>'
    if cracks:
        # internal refraction / fracture lines
        for _ in range(rng.randint(1,2)):
            y0=-L*rng.uniform(.15,.45);x0=rng.uniform(c1,c2)
            s+=f'<path d="M{x0:.1f} {y0:.1f}l{w*rng.uniform(.12,.25):.1f} {-L*rng.uniform(.08,.16):.1f}l{-w*rng.uniform(.04,.1):.1f} {-L*rng.uniform(.06,.12):.1f}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55" stroke-linecap="round"/>'
        s+=f'<path d="M{c1+w*.06:.1f} {-L*.08:.1f}L{(c1+c2)/2:.1f} {-L*.52:.1f}" stroke="#ffffff" stroke-width="{w*.06:.1f}" opacity=".22" stroke-linecap="round"/>'
    s+=f'<polygon points="{P(bl,sl,tip,sr,br)}" fill="none" stroke="{FAM[fam][0]}" stroke-width="2.6" stroke-linejoin="round"/>'
    bx=-w*.36 if bL>bR else w*.36
    s+=f'<path d="M{bx:.1f} {-L*.14:.1f}L{bx:.1f} {-min(shl,shr)*.85:.1f}" stroke="#fff" stroke-width="{max(2.2,w*.06):.1f}" stroke-linecap="round" opacity=".9"/>'
    return s+'</g>'

def ice(seed=8):
    C=Ctx('diamond');rng=random.Random(seed)
    C.defs.append('<filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="4" stdDeviation="3.5" flood-color="#0b1a4a" flood-opacity=".45"/></filter>')
    def famfor(x,y):
        h=(x+y)/(W+H)+rng.uniform(-.25,.25)
        return 'icev' if h>.72 else 'ice'
    back=[];front=[];top=[]
    corners=[(0,0),(W,0),(W,H),(0,H)]
    sides=[((0,0),(W,0),(0,-1)),((W,0),(W,H),(1,0)),((W,H),(0,H),(0,1)),((0,H),(0,0),(-1,0))]
    for A,B,n in sides:
        Ls=math.hypot(B[0]-A[0],B[1]-A[1]);d=((B[0]-A[0])/Ls,(B[1]-A[1])/Ls)
        base=math.degrees(math.atan2(n[0],-n[1]));ph=rng.uniform(0,6.28)
        s=44;k=0
        while s<Ls-44:
            t=s/Ls
            bump=1+.12*math.sin(t*math.pi*4+ph)
            r=rng.random()
            if k%3==1: L=rng.uniform(92,104);w=L*rng.uniform(.66,.76)      # hero block
            elif r<.5: L=rng.uniform(50,62);w=L*rng.uniform(.64,.78)       # small
            else: L=rng.uniform(66,80);w=L*rng.uniform(.6,.72)
            L*=bump
            bx=A[0]+d[0]*s-n[0]*2;by=A[1]+d[1]*s-n[1]*2
            ang=base+(1 if rng.random()<.5 else -1)*(rng.uniform(0,14) if k%3==1 else rng.uniform(16,42))
            front.append((L,block(C,bx,by,L,w,ang,famfor(bx,by),rng)))
            if k%3!=1 and rng.random()<.6:
                L2=L*rng.uniform(1.05,1.25);a2=base+rng.uniform(-34,34)
                back.append(block(C,bx+d[0]*w*.35+n[0]*4,by+d[1]*w*.35+n[1]*4,L2,L2*.58,a2,famfor(bx,by),rng,dim=.18,cracks=False))
            s+=w*rng.uniform(.55,.68);k+=1
    for cx,cy in corners:
        sx=-1 if cx==0 else 1;sy=-1 if cy==0 else 1
        diag=math.degrees(math.atan2(sx,-sy));ox,oy=cx+sx*6,cy+sy*6
        items=[]
        for off,Lc,wr in ((-72,78,.7),(72,78,.7),(-44,96,.66),(46,94,.66),(-14,112,.62),(16,108,.62)):
            items.append((Lc,block(C,ox+rng.uniform(-4,4),oy+rng.uniform(-4,4),Lc*rng.uniform(.94,1.04),Lc*wr,diag+off+rng.uniform(-6,6),famfor(cx,cy),rng)))
        items.sort(key=lambda q:-q[0]);top+= [q[1] for q in items]
        top.append(cutgem(C,cx+sx*14,cy+sy*14,36,diag+rng.uniform(-20,20),'ice','icev',rng,7,1.15))
    front.sort(key=lambda q:-q[0])
    C.add('<g filter="url(#ds)">'+''.join(back)+''.join(q[1] for q in front)+''.join(top)+'</g>')
    for cx,cy in corners:
        sx=-1 if cx==0 else 1;sy=-1 if cy==0 else 1
        C.add(twinkle(C,cx+sx*54,cy+sy*84,9))
    return C.svg()
