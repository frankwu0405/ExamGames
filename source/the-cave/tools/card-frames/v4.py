from v3 import *
import math,random
def noise(rng,T,amp,n=4):
    ph=[rng.uniform(0,6.28) for _ in range(n)];fr=[rng.choice([3,5,7,11,13])+k for k in range(n)];am=[rng.uniform(.4,1) for _ in range(n)]
    return lambda i: amp*sum(a*math.sin(2*math.pi*f*i/T+p) for a,f,p in zip(am,fr,ph))/sum(am)
def normals(pts):
    ns=[]
    for i in range(len(pts)):
        a=pts[max(0,i-1)];b=pts[min(len(pts)-1,i+1)];dx,dy=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dy) or 1;ns.append((dy/l,-dx/l))
    return ns
def ribbon(C,pts,wf,cols,ol=None,grain=True,closed=False,light=(-.6,-.8)):
    """tapered shaded ribbon along pts. cols = [dark,mid,light,spec]"""
    ns=normals(pts);ol=ol or C.p[0];N=len(pts);out=''
    def poly(f,bias,extra=0):
        L=[];R=[]
        for i,((x,y),(nx,ny)) in enumerate(zip(pts,ns)):
            w=wf(i/(N-1))*f+extra;ld=nx*light[0]+ny*light[1];off=bias*wf(i/(N-1))*ld
            L.append((x+nx*(w/2+off),y+ny*(w/2+off)));R.append((x-nx*(w/2-off),y-ny*(w/2-off)))
        return L,R
    def path(L,R): 
        pts2=L+R[::-1];return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts2[::2])+'Z'
    L,R=poly(1,0,5);out+=f'<path d="{path(L,R)}" fill="{ol}" stroke="{ol}" stroke-width="2" stroke-linejoin="round"/>'
    for f,b,ci in ((1,0,0),(.86,.06,1),(.6,.14,2),(.3,.2,3)):
        L,R=poly(f,b);out+=f'<path d="{path(L,R)}" fill="{cols[ci]}"/>'
    if grain:
        for off in (-.28,.2):
            q=[(x+nx*off*wf(i/(N-1)),y+ny*off*wf(i/(N-1))) for i,((x,y),(nx,ny)) in enumerate(zip(pts,ns))]
            out+=f'<path d="M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in q[::3])+f'" fill="none" stroke="{cols[0]}" stroke-width="1.4" opacity=".4" stroke-linecap="round"/>'
    return out
def oleaf(C,x,y,L,wd,ang,cols,curve=0,vein=True):
    """organic asymmetric enamel leaf. cols=[dark,mid,light,rim]"""
    d,m,l,r=cols
    full=f'M0 0C{-wd} {-L*.3} {-wd*.6+curve} {-L*.8} {curve*.9} {-L}C{wd*.9+curve} {-L*.72} {wd*.85} {-L*.26} 0 0Z'
    half=f'M0 0C{-wd} {-L*.3} {-wd*.6+curve} {-L*.8} {curve*.9} {-L}L{curve*.45} {-L*.5}Z'
    g=C.grad([(0,d),(.55,m),(1,l)],0,1,0,0);i=uid('o')
    s=f'<g transform="translate({x} {y}) rotate({ang})"><defs><clipPath id="{i}"><path d="{full}"/></clipPath></defs>'
    s+=f'<path d="{full}" fill="{C.p[0]}" stroke="{C.p[0]}" stroke-width="5.5" stroke-linejoin="round"/><path d="{full}" fill="{g}"/>'
    s+=f'<g clip-path="url(#{i})"><path d="{half}" fill="#fff" opacity=".2"/><path d="{full}" fill="none" stroke="{r}" stroke-width="3.2" transform="translate(-1.4 -1.6)" opacity=".9"/><path d="{full}" fill="none" stroke="{d}" stroke-width="3" transform="translate(1.8 2)" opacity=".7"/></g>'
    if vein:
        s+=f'<path d="M0 -2Q{curve*.5} {-L*.5} {curve*.9} {-L*.92}" fill="none" stroke="{d}" stroke-width="1.7" opacity=".85"/>'
        for t in (.28,.48,.68):
            s+=f'<path d="M{curve*.45*t*2} {-L*t}q{wd*.35} {-L*.04} {wd*.6} {-L*.14}" fill="none" stroke="{d}" stroke-width="1.2" opacity=".5"/>'
            s+=f'<path d="M{curve*.45*t*2} {-L*t}q{-wd*.35} {-L*.04} {-wd*.55} {-L*.14}" fill="none" stroke="{d}" stroke-width="1.2" opacity=".4"/>'
    return s+'</g>'
def petal(C,cx,cy,R,ang,cols):
    d,m,l,r=cols
    full=f'M0 0C{-R*.55} {-R*.2} {-R*.6} {-R*.95} 0 {-R}C{R*.6} {-R*.95} {R*.55} {-R*.2} 0 0Z'
    g=C.grad([(0,d),(.6,m),(1,l)],0,1,0,0)
    return (f'<g transform="translate({cx} {cy}) rotate({ang})"><path d="{full}" fill="{C.p[0]}" stroke="{C.p[0]}" stroke-width="5" stroke-linejoin="round"/><path d="{full}" fill="{g}"/>'
            f'<path d="M0 -4Q{R*.04} {-R*.5} 0 {-R*.85}" stroke="{d}" stroke-width="1.4" fill="none" opacity=".7"/><path d="M{-R*.18} {-R*.3}Q{-R*.34} {-R*.6} {-R*.12} {-R*.84}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></g>')
def blossom(C,x,y,R,rot,cols,centre='sapph',n=5):
    s=''
    for k in range(n): s+=petal(C,x,y,R,rot+k*360/n,cols)
    s+=f'<circle cx="{x}" cy="{y}" r="{R*.3}" fill="{C.p[0]}"/>'
    s+=gem(C,x,y,R*.22,centre,glow=False,setting=False)
    return s
def berry(C,x,y,r,col=('#ff7a4a','#ffd0a0','#c02a10')):
    g=C.rad([(0,'#fff',1),(.25,col[1],1),(.65,col[0],1),(1,col[2],1)],.35,.3,.8)
    return f'<circle cx="{x}" cy="{y}" r="{r+1.8}" fill="{C.p[0]}"/><circle cx="{x}" cy="{y}" r="{r}" fill="{g}"/>'
def tendril(C,x,y,ang,L,turns=1.6,col=None,w=3):
    pts=[];a=0
    for i in range(41):
        t=i/40;r=L*(1-t)*.28+1;th=t*turns*2*math.pi;pts.append((t*L*.7+ r*math.sin(th)*.0 + r*(math.cos(th)-1)*.0 , 0))
    # simple curl: spiral path
    d='M0 0';
    pts=[(L*t*.8*(1-t*.2)+ (L*.22*(1-t))*math.sin(t*turns*6.28), -(L*.22*(1-t))*(1-math.cos(t*turns*6.28))) for t in [i/50 for i in range(51)]]
    d='M'+' L'.join(f'{u:.1f} {v:.1f}' for u,v in pts)
    c=col or C.p[3]
    return f'<g transform="translate({x} {y}) rotate({ang})"><path d="{d}" fill="none" stroke="{C.p[0]}" stroke-width="{w+3}" stroke-linecap="round"/><path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#fff" stroke-width="1" opacity=".6" transform="translate(-.6 -.8)"/></g>'
def branch_pts(c,rng,wob=3.5,skip=1):
    d=perim_dense(c);T=len(d);nz=noise(rng,T,wob);pts=[]
    for i in range(0,T,skip):
        x,y,nx,ny=d[i];a=nz(i);pts.append((x+nx*a,y+ny*a))
    pts.append(pts[0]);return pts,d
def at(c,frac_or_xy):
    """point on perimeter offset c near a card-space (x,y)"""
    d=perim_dense(c);b=min(d,key=lambda q:(q[0]-frac_or_xy[0])**2+(q[1]-frac_or_xy[1])**2);return b
def cluster_at(x,y,nx,ny):
    return x,y,deg(nx,ny)
