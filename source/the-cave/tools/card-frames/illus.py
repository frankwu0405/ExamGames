import math,random
from v3 import W,H,Ctx,uid,perim_dense
OL='#4a2590'
LIGHT=(-.56,-.83)
# pastel iridescent ramps (shadow -> highlight)
PK=['#8a3fd0','#b360e6','#de8af0','#f4bdf6','#ffeafc']
LI=['#6a3ad6','#9160ee','#b994f7','#dcc6fc','#f8f2ff']
BL=['#4f62e0','#6f9af2','#96cbf9','#c8e8fd','#f0faff']
def hx(h): return [int(h[i:i+2],16) for i in (1,3,5)]
def mixc(a,b,t):
    A,B=hx(a),hx(b);return '#%02x%02x%02x'%tuple(round(A[i]+(B[i]-A[i])*t) for i in range(3))
def rt(r,b):
    x=max(0,min(3.999,(b+.75)/1.75*4));i=int(x);return mixc(r[i],r[i+1],x-i)
def dot(a,b): return a[0]*b[0]+a[1]*b[1]
def norm(v):
    l=math.hypot(*v) or 1;return (v[0]/l,v[1]/l)
def irid(C,b,r1,r2,ang=0):
    a=math.radians(ang);x2,y2=.5+.5*math.cos(a),.5+.5*math.sin(a)
    return C.grad([(0,rt(r1,b-.05)),(.5,rt(r1,b+.12)),(1,rt(r2,b))],1-x2,1-y2,x2,y2)
def sparkle(x,y,r,op=1):
    return (f'<path transform="translate({x:.1f} {y:.1f})" d="M0 {-r}Q{r*.14} {-r*.14} {r} 0Q{r*.14} {r*.14} 0 {r}Q{-r*.14} {r*.14} {-r} 0Q{-r*.14} {-r*.14} 0 {-r}Z" fill="#fff" opacity="{op}"/>')
def blunt(C,x,y,L,w,ang,r1,r2,rng,dim=0,glint=False):
    """chunky crystal with a truncated (flat) tip"""
    a=math.radians(ang);u=(math.sin(a),-math.cos(a));p=(math.cos(a),math.sin(a))
    sh=L*rng.uniform(.58,.66);tw=w*rng.uniform(.3,.4);tc=w*rng.uniform(-.06,.06)
    bl=(-w/2,0);br=(w/2,0);sl=(-w/2,-sh);sr=(w/2,-sh)
    m1=(-w*.17,-sh-w*.06);m2=(w*.19,-sh-w*.05);b1=(-w*.17,0);b2=(w*.19,0)
    t1=(tc-tw/2,-L);t2=(tc+tw/2,-L+w*.04)
    bL=dot((-p[0],-p[1]),LIGHT)*.8;bR=dot(p,LIGHT)*.8;bC=.25+dot(u,LIGHT)*.2
    tL=dot(norm((-p[0]*.6+u[0]*.7,-p[1]*.6+u[1]*.7)),LIGHT)*.8+.25
    tR=dot(norm((p[0]*.6+u[0]*.7,p[1]*.6+u[1]*.7)),LIGHT)*.8+.1
    tT=dot(u,LIGHT)*.5+.55
    P=lambda *q:' '.join(f'{a_:.1f},{b_:.1f}' for a_,b_ in q)
    def f(pts,b,g=0): return f'<polygon points="{P(*pts)}" fill="{irid(C,b-dim,r1,r2,g)}"/>'
    s=f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})">'
    s+=f'<polygon points="{P(bl,sl,t1,t2,sr,br)}" fill="{OL}" stroke="{OL}" stroke-width="6" stroke-linejoin="round"/>'
    s+=f((bl,sl,m1,b1),bL,90)+f((b1,m1,m2,b2),bC,70)+f((b2,m2,sr,br),bR,110)
    s+=f((sl,t1,m1),tL,45)+f((m1,t1,t2,m2),tT,60)+f((m2,t2,sr),tR,120)
    s+=(f'<path d="M{m1[0]:.1f} {m1[1]:.1f}L{b1[0]:.1f} 0M{m2[0]:.1f} {m2[1]:.1f}L{b2[0]:.1f} 0M{sl[0]:.1f} {sl[1]:.1f}L{m1[0]:.1f} {m1[1]:.1f}L{m2[0]:.1f} {m2[1]:.1f}L{sr[0]:.1f} {sr[1]:.1f}'
        f'M{m1[0]:.1f} {m1[1]:.1f}L{t1[0]:.1f} {t1[1]:.1f}M{m2[0]:.1f} {m2[1]:.1f}L{t2[0]:.1f} {t2[1]:.1f}" fill="none" stroke="{OL}" stroke-width="1.6" opacity=".55" stroke-linejoin="round"/>')
    # inner glow streaks
    hx_=-w*.33 if bL>bR else w*.33
    s+=f'<path d="M{hx_:.1f} {-L*.1:.1f}L{hx_:.1f} {-sh*.8:.1f}" stroke="#fff" stroke-width="{max(2.5,w*.08):.1f}" stroke-linecap="round" opacity=".85"/>'
    s+=f'<path d="M{(m1[0]+m2[0])/2-w*.06:.1f} {-L*.18:.1f}L{(m1[0]+m2[0])/2+w*.02:.1f} {-sh*.55:.1f}" stroke="#fff" stroke-width="{max(1.5,w*.035):.1f}" stroke-linecap="round" opacity=".55"/>'
    if glint: s+=sparkle(t1[0]+w*.05,-L+w*.25,w*.22)
    return s+'</g>'
def nugget(C,x,y,R,rot,r1,r2,rng):
    """rounded faceted gem (blunt, like a tumbled crystal)"""
    n=7;el=rng.uniform(1.0,1.25);a0=math.radians(rot)
    V=[]
    for i in range(n):
        t=i*2*math.pi/n+rng.uniform(-.1,.1);r=R*rng.uniform(.94,1.04)
        lx,ly=r*math.cos(t)*el,r*math.sin(t)/el;V.append((x+lx*math.cos(a0)-ly*math.sin(a0),y+lx*math.sin(a0)+ly*math.cos(a0)))
    cx=sum(v[0] for v in V)/n-R*.1;cy=sum(v[1] for v in V)/n-R*.12
    U=[(cx+(v[0]-cx)*.52,cy+(v[1]-cy)*.52) for v in V]
    P=lambda *q:' '.join(f'{a_:.1f},{b_:.1f}' for a_,b_ in q)
    s=f'<polygon points="{P(*V)}" fill="{OL}" stroke="{OL}" stroke-width="6" stroke-linejoin="round"/>'
    for i in range(n):
        j=(i+1)%n;m=norm(((V[i][0]+V[j][0])/2-x,(V[i][1]+V[j][1])/2-y));b=dot(m,LIGHT)*.85
        s+=f'<polygon points="{P(V[i],V[j],U[j],U[i])}" fill="{irid(C,b,r1,r2,rng.choice([30,90,150]))}" stroke="{OL}" stroke-width="1.4" stroke-opacity=".5" stroke-linejoin="round"/>'
    s+=f'<polygon points="{P(*U)}" fill="{irid(C,.62,r1,r2,45)}" stroke="{OL}" stroke-width="1.4" stroke-opacity=".5"/>'
    lt=min(U,key=lambda q:dot((q[0]-cx,q[1]-cy),(.56,.83)))
    s+=f'<path d="M{(lt[0]*.5+cx*.5):.1f} {(lt[1]*.5+cy*.5):.1f}L{lt[0]*.85+cx*.15:.1f} {lt[1]*.85+cy*.15:.1f}" stroke="#fff" stroke-width="{R*.12:.1f}" stroke-linecap="round" opacity=".9"/>'
    return s+sparkle(cx-R*.15,cy-R*.2,R*.3,.9)
def band(C):
    o=''
    g=C.grad([(0,'#e9d6fb'),(.5,'#c8a8f4'),(1,'#a98cec')],0,0,1,1)
    rr=lambda c,w,col,ex='':f'<rect x="{-c}" y="{-c}" width="{W+2*c}" height="{H+2*c}" rx="{30+c}" fill="none" stroke="{col}" stroke-width="{w}" {ex}/>'
    o+=rr(12,30,OL)+rr(12,24,g)+rr(19,3,'#fff','opacity=".7"')+rr(1.5,3,OL)
    return o
def frame(seed=2):
    C=Ctx('diamond');rng=random.Random(seed)
    C.defs.append('<filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#6a3cc0" flood-opacity=".35"/></filter>')
    RAMPS=[(PK,LI),(LI,BL),(PK,BL),(LI,PK),(BL,LI)]
    back=[];mid=[];front=[];top=[]
    sides=[((0,0),(W,0),(0,-1)),((W,0),(W,H),(1,0)),((W,H),(0,H),(0,1)),((0,H),(0,0),(-1,0))]
    for si,(A,B,n) in enumerate(sides):
        Ls=math.hypot(B[0]-A[0],B[1]-A[1]);d=((B[0]-A[0])/Ls,(B[1]-A[1])/Ls);base=math.degrees(math.atan2(n[0],-n[1]))
        horiz=si%2==0;lim=100 if not horiz else 104
        s=70;k=0
        while s<Ls-70:
            t=s/Ls;centre=abs(t-.5)<.09 and horiz
            bx=A[0]+d[0]*s+n[0]*10;by=A[1]+d[1]*s+n[1]*10
            r1,r2=rng.choice(RAMPS)
            if centre: s+=24;continue
            if k%4==3:
                mid.append(nugget(C,bx+n[0]*16,by+n[1]*16,rng.uniform(27,32),rng.uniform(0,90),r1,r2,rng));s+=36
            else:
                sg=1 if (s<Ls/2) else -1
                lean=sg*rng.uniform(14,40)*(-1 if si in(1,2) else 1)
                L=rng.uniform(88,106);L=min(L,(lim-6)/max(.45,abs(math.cos(math.radians(lean)))))
                (front if k%2==0 else back).append(blunt(C,bx-n[0]*4,by-n[1]*4,L,L*rng.uniform(.56,.64),base+lean,r1,r2,rng,dim=0 if k%2==0 else .12,glint=rng.random()<.25))
                s+=L*.34
            k+=1
        if horiz:
            mx,my=(A[0]+B[0])/2+n[0]*8,(A[1]+B[1])/2+n[1]*8
            for off,Lc,wr in ((-48,78,.58),(48,78,.58),(-22,94,.56),(22,94,.56)):
                top.append(blunt(C,mx+math.cos(math.radians(base))*off*.4,my+math.sin(math.radians(base))*off*.4,Lc,Lc*wr,base+off,*rng.choice(RAMPS),rng))
            top.append(blunt(C,mx,my,104,60,base,PK,BL,rng,glint=True))
    for cx,cy in ((0,0),(W,0),(W,H),(0,H)):
        sx=-1 if cx==0 else 1;sy=-1 if cy==0 else 1;diag=math.degrees(math.atan2(sx,-sy));ox,oy=cx+sx*10,cy+sy*10
        items=[]
        for off,Lc,wr in ((-62,92,.6),(62,92,.6),(-34,112,.58),(34,108,.58),(-6,128,.56)):
            items.append(blunt(C,ox,oy,Lc,Lc*wr,diag+off+rng.uniform(-5,5),*rng.choice(RAMPS),rng,glint=abs(off)<12))
        top+=items
        top.append(nugget(C,cx+sx*26,cy+sy*26,34,rng.uniform(0,90),PK,BL,rng))
    body=band(C)+''.join(back)+''.join(front)+''.join(mid)+''.join(top)
    C.add(f'<g filter="url(#gl)">{body}</g>')
    # floating sparkles & tiny shards
    for _ in range(14):
        side=rng.randrange(4)
        if side==0: x,y=rng.uniform(-80,W+80),rng.uniform(-104,-80)
        elif side==1: x,y=rng.uniform(W+76,W+96),rng.uniform(-60,H+60)
        elif side==2: x,y=rng.uniform(-80,W+80),rng.uniform(H+80,H+104)
        else: x,y=rng.uniform(-96,-76),rng.uniform(-60,H+60)
        C.add(sparkle(x,y,rng.uniform(4,8),.95) if rng.random()<.6 else f'<g filter="url(#gl)">'+blunt(C,x,y,16,9,rng.uniform(0,360),*rng.choice(RAMPS),rng)+'</g>')
    return C.svg()
