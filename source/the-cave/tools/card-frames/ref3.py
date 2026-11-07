import math,random
from v3 import W,H
# palette sampled from the reference
LV={ # value level -> hue options
 4:{'pk':'#f6e6fb','bl':'#e4f2fb','li':'#eeeefd'},
 3:{'pk':'#efbcf5','bl':'#cee5f8','li':'#cfcdf5'},
 2:{'pk':'#dea2f0','bl':'#b0dbf6','li':'#afc2f2'},
 1:{'pk':'#b47fe2','bl':'#8f9ff0','li':'#9f97e7'},
 0:{'pk':'#7b34b1','bl':'#6a4fd6','li':'#7a40c4'},
}
DEEP=['#7b34b1','#7b34b1','#8a4cc8','#9267d7','#6a3cc6','#5b3bd0']
LIGHT=(-.45,-.6,.66)
def nz(v):
    l=math.sqrt(sum(c*c for c in v));return tuple(c/l for c in v)
LIGHT=nz(LIGHT)
def col(rng,nrm,theta,dom):
    c,s=math.cos(theta),math.sin(theta)
    x,y,z=nrm;wx,wy=x*c-y*s,x*s+y*c
    b=wx*LIGHT[0]+wy*LIGHT[1]+z*LIGHT[2]
    b+=rng.uniform(-.12,.12)
    lvl=4 if b>.86 else 3 if b>.7 else 2 if b>.48 else 1 if b>.24 else 0
    if lvl==0: return rng.choice(DEEP)
    hue=dom if rng.random()<.55 else rng.choice(['pk','pk','li','li','bl'])
    return LV[lvl][hue]
def crystal(rng,cx,cy,a,b,ang,dom):
    th=math.radians(ang);c,s=math.cos(th),math.sin(th)
    def w(p): return (cx+p[0]*c-p[1]*s,cy+p[0]*s+p[1]*c)
    t1,t2,t3,t4=[rng.uniform(.5,.8)*b for _ in range(4)]
    y0=rng.uniform(-.25,.15)*b;y3=rng.uniform(-.15,.25)*b
    P0=(-a,y0);P1=(-a+t1*1.3,-b);P2=(a-t2*1.3,-b);P3=(a,y3);P4=(a-t3*1.3,b);P5=(-a+t4*1.3,b)
    r1=rng.uniform(-.42,-.18);r2=rng.uniform(.2,.45)
    Q1=(-a+t1*1.7,b*r1);Q2=(a-t2*1.7,b*(r1+rng.uniform(-.08,.08)));Q3=(-a+t4*1.7,b*r2);Q4=(a-t3*1.7,b*(r2+rng.uniform(-.08,.08)))
    F=[]
    def add(pts,n): F.append(([w(p) for p in pts],col(rng,nz(n),th,dom)))
    # top strip, optionally split
    if rng.random()<.6:
        k=rng.uniform(.3,.7);A=(P1[0]+(P2[0]-P1[0])*k,-b);B=(Q1[0]+(Q2[0]-Q1[0])*(k+rng.uniform(-.15,.15)),Q1[1]+(Q2[1]-Q1[1])*k)
        add((P1,A,B,Q1),(-.05,-.8,.6));add((A,P2,Q2,B),(.08,-.78,.62))
    else: add((P1,P2,Q2,Q1),(0,-.8,.6))
    # middle strip split diagonally (reflection)
    if rng.random()<.5: add((Q1,Q2,Q4),(.06,-.12,.99));add((Q1,Q4,Q3),(-.1,.1,.99))
    else: add((Q1,Q2,Q3),(-.08,-.1,.99));add((Q2,Q4,Q3),(.12,.12,.98))
    # bottom strip
    if rng.random()<.5:
        k=rng.uniform(.3,.7);A=(P5[0]+(P4[0]-P5[0])*k,b);B=(Q3[0]+(Q4[0]-Q3[0])*k,Q3[1]+(Q4[1]-Q3[1])*k)
        add((Q3,B,A,P5),(-.06,.8,.58));add((B,Q4,P4,A),(.06,.82,.56))
    else: add((Q3,Q4,P4,P5),(0,.8,.58))
    # terminations
    add((P0,P1,Q1),(-.65,-.55,.5));add((P0,Q1,Q3),(-.78,0,.62));add((P0,Q3,P5),(-.65,.55,.5))
    add((P3,Q2,P2),(.65,-.55,.5));add((P3,Q4,Q2),(.78,0,.62));add((P3,P4,Q4),(.65,.55,.5))
    return F

def perim_pts():
    from v3 import perim_dense
    return perim_dense(0)

def frame(seed=11):
    rng=random.Random(seed)
    d=perim_pts();T=len(d)
    corner_idx=[min(range(T),key=lambda k:(d[k][0]-cx)**2+(d[k][1]-cy)**2) for cx,cy in ((0,0),(W,0),(W,H),(0,H))]
    items=[]
    s=rng.randint(0,15)
    doms=['pk','pk','li','li','bl']
    while s<T:
        x,y,nx,ny=d[s];edge=math.degrees(math.atan2(ny,nx))+90
        near=min(min(abs(s-cI),T-abs(s-cI)) for cI in corner_idx)
        if near<40: s+=10;continue
        big=rng.random()<.7
        if big:
            a=rng.uniform(62,76);b=rng.uniform(38,46);ang=edge+rng.choice([-1,1])*rng.uniform(14,34);off=rng.uniform(36,44)
        else:
            a=rng.uniform(40,48);b=rng.uniform(28,34);ang=edge+rng.choice([-1,1])*rng.uniform(30,60);off=rng.uniform(38,46)
        lim=(96 if abs(nx)>.7 else 104)
        reach=off+b*abs(math.cos(math.radians(ang-edge)))+a*abs(math.sin(math.radians(ang-edge)))
        if reach>lim: off-=reach-lim
        items.append((rng.random(),x+nx*off,y+ny*off,a,b,ang+rng.choice([0,180]),rng.choice(doms)))
        s+=int(a*rng.uniform(1.1,1.3))
    # small accent crystals poking out at the seams
    for _ in range(0):
        k=rng.randrange(T);x,y,nx,ny=d[k]
        if min(min(abs(k-cI),T-abs(k-cI)) for cI in corner_idx)<70: continue
        items.append((1+rng.random(),x+nx*rng.uniform(62,74),y+ny*rng.uniform(62,74),rng.uniform(16,22),rng.uniform(13,17),rng.uniform(0,180),rng.choice(doms)))
    for cI in corner_idx:
        x,y,nx,ny=d[cI];diag=math.degrees(math.atan2(ny,nx))+90
        items.append((1.6,x+nx*42,y+ny*42,rng.uniform(62,70),rng.uniform(46,52),diag+rng.uniform(-20,20),rng.choice(doms)))
    items.sort(key=lambda t:t[0])
    faces=[]
    for _,cx,cy,a,b,ang,dom in items: faces+=crystal(rng,cx,cy,a,b,ang,dom)
    inner=f'M26 4L{W-26} 4Q{W-4} 4 {W-4} 26L{W-4} {H-26}Q{W-4} {H-4} {W-26} {H-4}L26 {H-4}Q4 {H-4} 4 {H-26}L4 26Q4 4 26 4Z'
    out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -110 712 1006"><defs>'
    out+='<filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#3a1f80" flood-opacity=".35"/></filter>'
    out+=f'<clipPath id="ring"><path clip-rule="evenodd" d="M-100 -110H612V896H-100Z {inner}"/></clipPath></defs>'
    out+='<g filter="url(#ds)"><g clip-path="url(#ring)" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round">'
    for pts,c in faces:
        out+=f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in pts)}" fill="{c}"/>'
    out+='</g></g></svg>'
    return out
