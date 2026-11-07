from t4 import *
from t3 import metal, rod
import t4

def dsf(C):
    C.defs.append('<filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2.5" dy="3.5" stdDeviation="2.2" flood-color="#1a0c00" flood-opacity=".7"/></filter>')

def twist(C,c,w,step=9):
    """twisted rope moulding"""
    p=C.p;s=rect_ring(c,w+5,p[0])+rect_ring(c,w,p[2])
    for x,y,nx,ny,i in perim(c,int(2*(W+H+4*c)/step)):
        a=deg(nx,ny)
        s+=(f'<g transform="translate({x:.1f} {y:.1f}) rotate({a+38:.1f})"><rect x="{-w*.2:.1f}" y="{-w*.62:.1f}" width="{w*.4:.1f}" height="{w*1.24:.1f}" rx="{w*.2:.1f}" fill="{p[3]}" stroke="{p[0]}" stroke-width="1.3"/>'
            f'<rect x="{-w*.12:.1f}" y="{-w*.5:.1f}" width="{w*.1:.1f}" height="{w*.7:.1f}" rx="{w*.05:.1f}" fill="{p[5]}" opacity=".9"/></g>')
    return s

def flat_band(C,c,w,grooves=0):
    p=C.p;s=rect_ring(c,w+4,p[0])
    s+=rect_ring(c,w,p[2])+rect_ring(c,w*.82,p[3],dx=-.6,dy=-.8)+rect_ring(c+w*.3,w*.12,p[4],extra='opacity=".8"')
    for g in range(grooves):
        off=c-w/2+w*(g+1)/(grooves+1);s+=rect_ring(off,1.6,p[1],extra='opacity=".75"')+rect_ring(off-1.6,1,p[5],extra='opacity=".6"')
    return s

def boss(C,x,y,r):
    p=C.p;g=C.rad([(0,'#fff',1),(.3,p[5],1),(.75,p[3],1),(1,p[1],1)],.35,.3,.85)
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+2.2:.1f}" fill="{p[0]}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{g}"/>'

# ============================================================ BRONZE
def bronze():
    C=Ctx('bronze');p=C.p;dsf(C);gc=[p[1],p[3],p[4],p[5]]
    C.add(tube(C,50,14,p))
    C.add(flat_band(C,30,26))
    # hammered dimples on the flat band
    rng=random.Random(4);dots=''
    for x,y,nx,ny,i in perim(30,150):
        jx,jy=rng.uniform(-6,6),rng.uniform(-6,6)
        dots+=f'<ellipse cx="{x+jx:.1f}" cy="{y+jy:.1f}" rx="{rng.uniform(2.5,4):.1f}" ry="{rng.uniform(1.8,3):.1f}" fill="{p[2]}" opacity=".55"/><ellipse cx="{x+jx-.8:.1f}" cy="{y+jy-.8:.1f}" rx="1.4" ry="1" fill="{p[5]}" opacity=".7"/>'
    C.add(dots)
    for x,y,nx,ny,i in perim(30,40):
        if inz(x,y,zones(90,80,50)): continue
        C.add(boss(C,x,y,4.2))
    C.add(tube(C,10,13,p));C.add(rect_ring(.8,2.4,p[0]))
    def corner():
        c=-32
        sq=f'M{c} {c-46}L{c+46} {c}L{c} {c+46}L{c-46} {c}Z'
        t=metal(C,sq)
        t+=f'<path d="M{c} {c-34}L{c+34} {c}L{c} {c+34}L{c-34} {c}Z" fill="none" stroke="{p[1]}" stroke-width="2.4"/>'
        t+=f'<path d="M{c} {c-34}L{c-34} {c}" stroke="{p[5]}" stroke-width="2.2"/>'
        t+=boss(C,c,c-38,4)+boss(C,c+38,c,4)+boss(C,c,c+38,4)+boss(C,c-38,c,4)
        t+=gem(C,c,c,14,'topaz',glow=False)
        return t
    C.add('<g filter="url(#ds)">'+mirror4(corner)+'</g>')
    def clasp(x,y,rot,sc=1):
        g=f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})">'
        g+=metal(C,'M-42 -18Q-46 -18 -46 -14L-46 14Q-46 18 -42 18L-14 18L0 30L14 18L42 18Q46 18 46 14L46 -14Q46 -18 42 -18L14 -18L0 -30L-14 -18Z')
        g+=f'<path d="M-36 -10L36 -10M-36 10L36 10" stroke="{p[1]}" stroke-width="2"/>'
        g+=boss(C,-32,0,4)+boss(C,32,0,4)+gem(C,0,0,12,'topaz',glow=False)
        return g+'</g>'
    C.add('<g filter="url(#ds)">'+clasp(W/2,-30,0)+clasp(W/2,H+30,0)+clasp(-30,H/2,90,.9)+clasp(W+30,H/2,90,.9)+'</g>')
    return C.svg()

# ============================================================ SILVER
def silver():
    C=Ctx('silver');p=C.p;dsf(C);sc=[p[1],p[3],p[4],p[5]]
    C.add(tube(C,62,10,p))
    C.add(twist(C,49,13))
    C.add(flat_band(C,30,24,grooves=2))
    C.add(tube(C,12,12,p))
    for x,y,nx,ny,i in perim(2.6,160): C.add(pearl(C,x,y,2.6))
    C.add(rect_ring(.6,2.2,p[0]))
    def corner():
        c=-34;t=''
        # pair of C-scrolls framing a shield
        t+=sscroll(C,(c+8,c-30),(c+40,c-52),(c+72,c-46),(c+88,c-30),11,sc,(c+92,c-46),14,math.pi*.5,-1,1.45)
        t+=sscroll(C,(c-30,c+8),(c-52,c+40),(c-46,c+72),(c-30,c+88),11,sc,(c-46,c+92),14,0,1,1.45)
        sh=f'M{c} {c-44}Q{c+34} {c-44} {c+40} {c-10}Q{c+36} {c+26} {c} {c+40}Q{c-36} {c+26} {c-40} {c-10}Q{c-34} {c-44} {c} {c-44}Z'
        t+=metal(C,sh,tr=f'rotate(-45 {c} {c})')
        t+=f'<path d="{sh}" transform="rotate(-45 {c} {c}) translate({c*.18:.1f} {c*.18:.1f}) scale(.82)" fill="none" stroke="{p[1]}" stroke-width="2" opacity=".0"/>'
        for k in range(8):
            a=math.radians(k*45);t+=pearl(C,c+30*math.cos(a),c+30*math.sin(a),3.2)
        t+=gem(C,c,c,16,'sapph')
        return t
    C.add('<g filter="url(#ds)">'+mirror4(corner)+'</g>')
    def crest(x,y,rot,s=1):
        g=f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">'
        for sg in (-1,1):
            g+=sscroll(C,(sg*18,6),(sg*40,0),(sg*60,8),(sg*78,-2),10,sc,(sg*84,-18),14,math.pi*.5,-sg,1.45)
        g+=metal(C,'M0 -40Q30 -40 34 -6Q32 22 0 30Q-32 22 -34 -6Q-30 -40 0 -40Z')
        g+=f'<ellipse cx="0" cy="-5" rx="22" ry="26" fill="none" stroke="{p[1]}" stroke-width="2"/>'
        g+=gem(C,0,-5,15,'sapph')+pearl(C,0,-46,4.5)
        return g+'</g>'
    C.add('<g filter="url(#ds)">'+crest(W/2,-42,0)+crest(W/2,H+42,180)+crest(-38,H/2,-90,.82)+crest(W+38,H/2,90,.82)+'</g>')
    for px,py,r in ((-76,140,8),(W+76,H-140,8),(150,-94,7),(W-150,H+94,7)): C.add(star(px,py,r,'#ffffff',.9))
    return C.svg()

# ============================================================ GOLD (bulkier)
def gold():
    C=Ctx('gold');p=C.p;dsf(C);gc=[p[1],p[3],p[4],p[5]]
    C.add(tube(C,74,11,p))
    for w_,col,dx,dy in ((36,p[1],0,0),(33,p[2],.6,.8),(26,p[2],-.3,-.4),(15,p[3],-1.4,-1.8),(6,p[4],-2.2,-2.8)):
        C.add(rect_ring(52,w_,col,dx=dx,dy=dy))
    C.add(tube(C,32,10,p))
    d=perim_dense(21);T=len(d)
    C.add(rect_ring(21,13,p[1]));C.add(rect_ring(21,11,p[2]))
    for i in range(0,T,11):
        x,y,nx,ny=d[i];a=deg(nx,ny)
        C.add(f'<g transform="translate({x:.1f} {y:.1f}) rotate({a:.1f})"><ellipse rx="3.4" ry="4.6" fill="{p[4]}" stroke="{p[0]}" stroke-width="1.4"/><path d="M-1.4 -2.4L-1.4 1" stroke="#fff" stroke-width="1.2" opacity=".8"/></g>')
    C.add(tube(C,10,14,p))
    for x,y,nx,ny,i in perim(2.4,160): C.add(bead(C,x,y,2.7,p[4]))
    C.add(rect_ring(.6,2.4,p[0]))
    d=perim_dense(52);T=len(d)
    for k in range(10,T-10,130):
        x,y,nx,ny=d[k]
        if min(math.hypot(x-a,y-b) for a,b in ((0,0),(W,0),(0,H),(W,H),(W/2,0),(W/2,H),(0,H/2),(W,H/2)))<140: continue
        a0=deg(nx,ny)+90
        for sg in (-1,1): C.add(oleaf(C,x,y,40,13,a0+(0 if sg>0 else 180)+sg*-16,[p[1],p[3],p[5],p[5]],curve=sg*4))
        C.add(bead(C,x,y,4.4,p[4]))
    def corner():
        t='';c=-32
        for a,L,w in ((-214,58,24),(-56,58,24),(-186,70,29),(-84,70,29),(-160,80,33),(-110,80,33),(-135,86,38)):
            t+=oleaf(C,c,c,L,w,a,[p[1],p[3],p[4],p[5]],curve=(8 if a<-135 else -8))
        t+=sscroll(C,(-14,-46),(22,-70),(54,-66),(80,-52),14,gc,(86,-68),18,math.pi*.5,-1,1.5)
        t+=sscroll(C,(-46,-14),(-70,22),(-66,54),(-52,80),14,gc,(-68,86),18,0,1,1.5)
        t+=f'<circle cx="{c}" cy="{c}" r="32" fill="{p[0]}"/>'
        for k in range(12):
            t+=f'<g transform="translate({c} {c}) rotate({k*30})"><path d="M0 0C-11 -7 -10 -24 0 -31C10 -24 11 -7 0 0Z" fill="{p[3]}" stroke="{p[0]}" stroke-width="2"/><path d="M0 -5L0 -24" stroke="{p[5]}" stroke-width="2"/></g>'
        t+=gem(C,c,c,16,'ruby')
        return t
    C.add('<g filter="url(#ds)">'+mirror4(corner)+'</g>')
    def centre(x,y,rot,sc=1):
        g=f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})">'
        for sg in (-1,1):
            g+=sscroll(C,(sg*16,0),(sg*38,-6),(sg*62,-4),(sg*84,-16),13,gc,(sg*90,-34),18,math.pi*.5,-sg,1.5)
        for a,L,w,cv in ((-78,52,23,5),(78,52,23,-5),(-55,62,27,4),(55,62,27,-4),(-30,70,31,3),(30,70,31,-3),(0,76,36,0)):
            g+=oleaf(C,0,-6,L,w,a,[p[1],p[3],p[4],p[5]],curve=cv)
        g+=f'<ellipse cx="0" cy="-2" rx="19" ry="24" fill="{p[0]}"/>'+gem(C,0,-4,14,'ruby')
        g+=pearl(C,0,26,5.5)+pearl(C,0,39,4.5)
        return g+'</g>'
    C.add('<g filter="url(#ds)">'+centre(W/2,-46,0)+centre(W/2,H+46,180)+centre(-46,H/2,-90,.92)+centre(W+46,H/2,90,.92)+'</g>')
    for px,py,r in ((-96,140,9),(W+96,H-140,9),(150,-112,8),(W-150,H+112,8)): C.add(star(px,py,r,'#fff8d0',.9))
    return C.svg().replace('viewBox="-100 -110 712 1006"','viewBox="-140 -150 792 1086"')
