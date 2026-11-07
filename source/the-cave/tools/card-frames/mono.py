import math,random
from v3 import W,H,perim_dense
LV={4:{'pk':'#f6e4fb','bl':'#e2f1fb','li':'#ecebfd'},3:{'pk':'#efbcf5','bl':'#cee5f8','li':'#cfcdf5'},
    2:{'pk':'#dea2f0','bl':'#b0dbf6','li':'#afc2f2'},1:{'pk':'#b47fe2','bl':'#8f9ff0','li':'#9f97e7'},
    0:{'pk':'#7b34b1','bl':'#5b3bd0','li':'#7a40c4'}}
Lt=(-.42,-.58,.7);_l=math.sqrt(sum(c*c for c in Lt));Lt=tuple(c/_l for c in Lt)
def sub(a,b): return (a[0]-b[0],a[1]-b[1],a[2]-b[2])
def cross(a,b): return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def normal(P):
    n=(0,0,0)
    for i in range(1,len(P)-1):
        c=cross(sub(P[i],P[0]),sub(P[i+1],P[0]));n=(n[0]+c[0],n[1]+c[1],n[2]+c[2])
    l=math.sqrt(sum(c*c for c in n)) or 1;n=tuple(c/l for c in n)
    return n if n[2]>0 else tuple(-c for c in n)
def frame(seed=3):
    rng=random.Random(seed)
    d=perim_dense(0);T=len(d)
    cidx=[min(range(T),key=lambda k:(d[k][0]-cx)**2+(d[k][1]-cy)**2) for cx,cy in ((0,0),(W,0),(W,H),(0,H))]
    # columns along the perimeter
    cols=[];s=rng.randint(0,10)
    while s<T-30:
        cols.append(s);s+=int(rng.uniform(60,96))
    # snap one column onto each corner
    for c in cidx:
        j=min(range(len(cols)),key=lambda q:min(abs(cols[q]-c),T-abs(cols[q]-c)));cols[j]=c
    cols=sorted(set(cols))
    # hue patches along the ring
    hues=['pk','li','pk','bl','li','pk','li','bl']
    rows=[]
    for k,i in enumerate(cols):
        x,y,nx,ny=d[i];corner=min(min(abs(i-c),T-abs(i-c)) for c in cidx)<12
        lim=100 if abs(nx)>.7 else 106
        if corner: lim=128
        peak=k%2==0 or corner
        Ho=lim*(rng.uniform(.9,1) if peak else rng.uniform(.6,.75))
        fr=rng.uniform(.3,.5);fr1=rng.uniform(.68,.84)
        zr=Ho*rng.uniform(.32,.55);z1=zr*rng.uniform(.45,.8)
        tw=rng.uniform(-26,26)     # skew ridge along tangent: angled planes
        tx,ty=-ny,nx
        def P(off,z,sk=0): return (x+nx*off+tx*sk,y+ny*off+ty*sk,z)
        rows.append([P(-6,0),P(-6+(Ho+6)*fr,zr,tw*.6),P(-6+(Ho+6)*fr1,z1,tw),P(Ho,0,tw*(1.5 if peak else .5))])
    faces=[];n=len(rows)
    huemap=[]
    hpos=0
    for k in range(n):
        if k%rng.choice([2,3])==0: hpos+=1
        huemap.append(hues[hpos%len(hues)])
    for k in range(n):
        A=rows[k];B=rows[(k+1)%n];hue=huemap[k]
        for r in range(3):
            q=[A[r],B[r],B[r+1],A[r+1]]
            nq=normal(q)
            # split when the quad is not planar enough / randomly for crystal look
            if rng.random()<.6:
                if rng.random()<.5: tris=[[q[0],q[1],q[2]],[q[0],q[2],q[3]]]
                else: tris=[[q[0],q[1],q[3]],[q[1],q[2],q[3]]]
                for t in tris: faces.append((t,hue))
            else: faces.append((q,hue))
    out=[]
    for P_,hue in faces:
        nn=normal(P_);b=nn[0]*Lt[0]+nn[1]*Lt[1]+nn[2]*Lt[2]+rng.uniform(-.06,.06)
        lvl=4 if b>.9 else 3 if b>.74 else 2 if b>.52 else 1 if b>.3 else 0
        h=hue if rng.random()<.7 else rng.choice(['pk','li','bl'])
        out.append((P_,LV[lvl][h]))
    inner=f'M26 4L{W-26} 4Q{W-4} 4 {W-4} 26L{W-4} {H-26}Q{W-4} {H-4} {W-26} {H-4}L26 {H-4}Q4 {H-4} 4 {H-26}L4 26Q4 4 26 4Z'
    sv='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -110 712 1006"><defs>'
    sv+='<filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#3a1f80" flood-opacity=".35"/></filter>'
    sv+=f'<clipPath id="ring"><path clip-rule="evenodd" d="M-100 -110H612V896H-100Z {inner}"/></clipPath></defs>'
    sv+='<g filter="url(#ds)"><g clip-path="url(#ring)" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round">'
    for P_,c in out: sv+=f'<polygon points="{" ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in P_)}" fill="{c}"/>'
    return sv+'</g></g></svg>'
