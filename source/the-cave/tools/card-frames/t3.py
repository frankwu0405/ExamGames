from v3 import *
def metal(C,d,tr='',ol=None,rim=True):
    p=C.p;ol=ol or p[0];i=uid('m')
    g=C.grad([(0,p[5]),(.28,p[4]),(.55,p[3]),(.8,p[2]),(1,p[1])],0,0,1,1)
    s=f'<g transform="{tr}"><defs><clipPath id="{i}"><path d="{d}"/></clipPath></defs><path d="{d}" fill="{g}" stroke="{ol}" stroke-width="5" stroke-linejoin="round"/>'
    if rim: s+=f'<g clip-path="url(#{i})"><path d="{d}" fill="none" stroke="{p[5]}" stroke-width="3" transform="translate(-1.8 -2.2)" opacity=".9"/><path d="{d}" fill="none" stroke="{p[1]}" stroke-width="3.5" transform="translate(2 2.4)" opacity=".8"/></g>'
    return s+'</g>'
def rod(C,d,w):
    p=C.p
    s=f'<path d="{d}" fill="none" stroke="{p[0]}" stroke-width="{w+5}" stroke-linecap="round" stroke-linejoin="round"/>'
    for f,ci,k in ((1,1,0),(.8,2,.1),(.58,3,.2),(.36,4,.3)):
        s+=f'<path d="{d}" fill="none" stroke="{p[ci]}" stroke-width="{w*f}" stroke-linecap="round" stroke-linejoin="round" transform="translate({-w*k*.5} {-w*k*.6})"/>'
    return s+f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{max(1.4,w*.1)}" stroke-linecap="round" transform="translate({-w*.2} {-w*.26})" opacity=".85"/>'
def studs(C,c,n,r,z,kind='bead'):
    s=''
    for x,y,nx,ny,i in perim(c,n):
        if inz(x,y,z): continue
        s+=(pearl(C,x,y,r) if kind=='pearl' else bead(C,x,y,r))
    return s
def acanthus_fringe(C,c,n,L,z):
    s=''
    for x,y,nx,ny,i in perim(c,n):
        if inz(x,y,z): continue
        a=deg(nx,ny)
        s+=leaf(C,x,y,L*.8,L*.2,a-52)+leaf(C,x,y,L*.8,L*.2,a+52)+leaf(C,x,y,L,L*.25,a)
    return s

def corner_fan(C,center,angs,gemkind,pearls=True,R=30,boss=34):
    p=C.p;c=center;t=''
    for ang,L,wd in angs: t+=leaf(C,c,c,L,wd,ang)
    return t
# ============================ GOLD
def gold():
    C=Ctx('gold');p=C.p;z=zones(110,104,60)
    C.add(acanthus_fringe(C,64,40,40,z))
    C.add(tube(C,57,14,p));C.add(channel(C,37,26,p))
    v,_=vine(C,37,6,70,w=4);C.add(v);C.add(vine_leaves(C,37,6,70,z,20))
    C.add(tube(C,14,22,p));C.add(studs(C,14,52,3.4,zones(70,70,40),'pearl'))
    C.add(rect_ring(1,2.4,p[0]))
    def corner():
        c=-34;t=''
        for ang,L,wd in ((-122,50,13),(32,50,13),(-102,68,17),(12,68,17),(-80,82,21),(-10,82,21),(-45,94,25)):
            t+=leaf(C,c,c,L,wd,ang)
        t+=rod(C,'M-76 6C-94 4 -98 -20 -82 -26C-70 -30 -62 -18 -70 -10',11)
        t+=rod(C,'M6 -76C4 -94 -20 -98 -26 -82C-30 -70 -18 -62 -10 -70',11)
        t+=metal(C,f'M{c} {c-46}C{c+26} {c-46} {c+46} {c-26} {c+46} {c}C{c+46} {c+26} {c+26} {c+46} {c} {c+46}C{c-26} {c+46} {c-46} {c+26} {c-46} {c}C{c-46} {c-26} {c-26} {c-46} {c} {c-46}Z')
        t+=f'<circle cx="{c}" cy="{c}" r="37" fill="none" stroke="{p[1]}" stroke-width="2"/>'
        for k in range(12):
            a=math.radians(k*30);t+=pearl(C,c+41*math.cos(a),c+41*math.sin(a),3.6)
        t+=gem(C,c,c,19,'ruby')
        return t
    C.add(mirror4(corner))
    def crest(x,y,fl):
        g=f'<g transform="translate({x} {y}) scale({.8} {.8*fl})">'
        for sg in (-1,1):
            for a,L,wd,dx in ((50,100,24,34),(72,86,20,40),(94,64,15,46),(30,112,26,26)):
                g+=leaf(C,sg*dx,-8,L,wd,sg*a)
        g+=rod(C,'M-70 -2C-96 -4 -98 -38 -78 -40C-66 -42 -60 -30 -68 -24',11)+rod(C,'M70 -2C96 -4 98 -38 78 -40C66 -42 60 -30 68 -24',11)
        crown='M-66 10L-74 -34L-44 -14L-24 -58L0 -22L24 -58L44 -14L74 -34L66 10Q34 -6 0 -6Q-34 -6 -66 10Z'
        g+=metal(C,crown)
        for px,py in ((-74,-38),(74,-38),(-24,-62),(24,-62)): g+=pearl(C,px,py,5.5)
        g+=gem(C,0,-24,22,'ruby')+gem(C,-44,-4,12,'emer',False)+gem(C,44,-4,12,'emer',False)
        return g+'</g>'
    C.add(crest(W/2,-40,1)+crest(W/2,H+40,-1))
    for sx,x in ((-1,-46),(1,W+46)):
        g=f'<g transform="translate({x} {H/2}) scale({sx} 1)">'
        for a,L,wd,dy in ((-70,66,17,-20),(-110,66,17,20),(-40,56,14,-34),(-140,56,14,34)): g+=leaf(C,0,dy,L,wd,a)
        g+=metal(C,'M0 -52C26 -40 30 -16 30 0C30 16 26 40 0 52C-26 40 -30 16 -30 0C-30 -16 -26 -40 0 -52Z')
        g+=gem(C,0,0,17,'emer')+pearl(C,0,-58,5)+pearl(C,0,58,5)
        C.add(g+'</g>')
    for px,py,r in ((-80,120,9),(W+80,H-120,9),(150,-100,8),(W-150,H+100,8)): C.add(star(px,py,r,'#fff8d0',.9))
    return C.svg()

# ============================ SILVER
def silver():
    C=Ctx('silver');p=C.p;z=zones(100,96,56)
    s=''
    for x,y,nx,ny,i in perim(50,44):
        if inz(x,y,z): continue
        a=deg(nx,ny); s+=leaf(C,x,y,26,7,a-50)+leaf(C,x,y,26,7,a+50)+leaf(C,x,y,34,9,a)
    C.add(s)
    C.add(tube(C,44,12,p));C.add(channel(C,29,20,p))
    v,_=vine(C,29,4.5,60,w=3.6);C.add(v);C.add(vine_leaves(C,29,4.5,60,z,16))
    C.add(tube(C,11,18,p));C.add(studs(C,11,56,2.8,zones(66,66,40),'pearl'))
    C.add(rect_ring(1,2.4,p[0]))
    def corner():
        c=-28;t=''
        for ang,L,wd in ((-120,42,11),(30,42,11),(-100,60,15),(10,60,15),(-78,74,18),(-12,74,18),(-45,86,22)): t+=leaf(C,c,c,L,wd,ang)
        t+=rod(C,'M-66 6C-82 4 -86 -18 -72 -22C-62 -26 -56 -16 -62 -10',9)+rod(C,'M6 -66C4 -82 -18 -86 -22 -72C-26 -62 -16 -56 -10 -62',9)
        t+=metal(C,f'M{c} {c-38}C{c+22} {c-38} {c+38} {c-22} {c+38} {c}C{c+38} {c+22} {c+22} {c+38} {c} {c+38}C{c-22} {c+38} {c-38} {c+22} {c-38} {c}C{c-38} {c-22} {c-22} {c-38} {c} {c-38}Z')
        for k in range(10):
            a=math.radians(k*36);t+=pearl(C,c+34*math.cos(a),c+34*math.sin(a),3)
        t+=gem(C,c,c,16,'sapph')
        return t
    C.add(mirror4(corner))
    def crest(x,y,fl):
        g=f'<g transform="translate({x} {y}) scale({.78} {.78*fl})">'
        for sg in (-1,1):
            for a,L,wd,dx in ((38,100,22,26),(62,88,19,34),(86,66,15,40),(108,46,12,44)): g+=leaf(C,sg*dx,-6,L,wd,sg*a)
        g+=metal(C,'M-60 6C-64 -20 -44 -32 -22 -36C-12 -50 -6 -62 0 -78C6 -62 12 -50 22 -36C44 -32 64 -20 60 6C34 -8 -34 -8 -60 6Z')
        g+=gem(C,0,-26,22,'sapph')+gem(C,-40,-4,11,'aqua',False)+gem(C,40,-4,11,'aqua',False)+pearl(C,0,-82,5)
        return g+'</g>'
    C.add(crest(W/2,-34,1)+crest(W/2,H+34,-1))
    for sx,x in ((-1,-34),(1,W+34)):
        g=f'<g transform="translate({x} {H/2}) scale({sx} 1)">'
        for a,L,wd,dy in ((-70,50,13,-18),(-110,50,13,18)): g+=leaf(C,0,dy,L,wd,a)
        g+=metal(C,'M0 -46C22 -34 26 -14 26 0C26 14 22 34 0 46C-22 34 -26 14 -26 0C-26 -14 -22 -34 0 -46Z')+gem(C,0,0,15,'sapph')+pearl(C,0,-52,4.4)+pearl(C,0,52,4.4)
        C.add(g+'</g>')
    for px,py,r in ((-70,130,8),(W+70,H-130,8),(150,-90,7),(W-150,H+90,7)): C.add(star(px,py,r,'#fff',.9))
    return C.svg()

# ============================ BRONZE
def bronze():
    C=Ctx('bronze');p=C.p;z=zones(76,70,44)
    C.add(tube(C,27,12,p))
    # gadroon marks on the outer tube
    C.add(rect_ring(27,12,p[0],extra='stroke-dasharray="1.8 6.5" opacity=".55"'))
    C.add(channel(C,15,13,p))
    C.add(studs(C,15,60,3.1,zones(60,60,40)))
    C.add(tube(C,5,10,p));C.add(rect_ring(1,2.2,p[0]))
    def corner():
        c=-18;t=''
        for ang,L,wd in ((-112,40,10),(22,40,10),(-45,60,15)): t+=leaf(C,c,c,L,wd,ang)
        t+=metal(C,'M-52 -18C-52 -44 -44 -52 -18 -52L10 -52C20 -52 24 -46 24 -36L24 -24C24 -16 18 -12 10 -12L-12 -12L-12 10C-12 18 -16 24 -24 24L-36 24C-46 24 -52 20 -52 10Z')
        t+=f'<circle cx="{c-6}" cy="{c-6}" r="17" fill="{p[1]}" stroke="{p[0]}" stroke-width="3"/>'
        for k in range(8):
            a=math.radians(k*45);t+=f'<ellipse cx="{c-6+10*math.cos(a)}" cy="{c-6+10*math.sin(a)}" rx="6" ry="3.4" transform="rotate({k*45} {c-6+10*math.cos(a)} {c-6+10*math.sin(a)})" fill="{p[4]}" stroke="{p[0]}" stroke-width="1.6"/>'
        t+=bead(C,c-6,c-6,5.5,p[4])
        t+=bead(C,6,-38,3.6)+bead(C,-38,6,3.6)
        return t
    C.add(mirror4(corner))
    def crest(x,y,fl):
        g=f'<g transform="translate({x} {y}) scale(1 {fl})">'
        g+=metal(C,'M-46 12C-48 -6 -34 -14 -22 -18C-12 -28 -6 -40 0 -54C6 -40 12 -28 22 -18C34 -14 48 -6 46 12C26 4 -26 4 -46 12Z')+gem(C,0,-12,15,'topaz')
        g+=bead(C,-30,2,3.6)+bead(C,30,2,3.6)
        return g+'</g>'
    C.add(crest(W/2,-26,1)+crest(W/2,H+26,-1))
    for sx,x in ((-1,-20),(1,W+20)):
        g=f'<g transform="translate({x} {H/2}) scale({sx} 1)">'
        g+=metal(C,'M0 -34C14 -26 18 -12 18 0C18 12 14 26 0 34C-14 26 -18 12 -18 0C-18 -12 -14 -26 0 -34Z')+gem(C,0,0,10,'topaz',False,False)
        C.add(g+'</g>')
    return C.svg()

# ============================ DIAMOND
KC={'cy':('#d4f8ff','#8fe3f8','#4fb0e6','#2a74c0','#ffffff'),'vi':('#eadcff','#c4a0ff','#8a5ee0','#5030a8','#ffffff'),'pk':('#ffe0f1','#ff9fd2','#dc5aa4','#9a2d74','#ffffff'),'go':('#fff6c0','#ffe070','#f0a820','#b06a08','#ffffff')}
def crystal(C,x,y,L,wd,ang,k):
    c0,c1,c2,c3,wh=KC[k];ol='#1d1b5e'
    bl=(-wd/2,0);br=(wd/2,0);sl=(-wd*.56,-.6*L);sr=(wd*.56,-.6*L);m1=(-wd*.17,-.68*L);m2=(wd*.2,-.68*L);b1=(-wd*.17,0);b2=(wd*.2,0);tip=(wd*.03,-L)
    P=lambda *a:' '.join(f'{u:.1f},{v:.1f}' for u,v in a)
    gl=C.grad([(0,c1),(1,c0)],0,1,0,0);gc=C.grad([(0,c0),(1,wh)],0,1,0,0);gr=C.grad([(0,c3),(1,c2)],0,1,0,0)
    g=f'<g transform="translate({x} {y}) rotate({ang})">'
    g+=f'<polygon points="{P(bl,sl,tip,sr,br)}" fill="{ol}" stroke="{ol}" stroke-width="6" stroke-linejoin="round"/>'
    g+=f'<polygon points="{P(bl,sl,m1,b1)}" fill="{gl}"/><polygon points="{P(b1,m1,m2,b2)}" fill="{gc}"/><polygon points="{P(b2,m2,sr,br)}" fill="{gr}"/>'
    g+=f'<polygon points="{P(sl,tip,m1)}" fill="{c0}"/><polygon points="{P(m1,tip,m2)}" fill="{wh}"/><polygon points="{P(m2,tip,sr)}" fill="{c2}"/>'
    g+=f'<path d="M{sl[0]:.1f} {sl[1]:.1f}L{m1[0]:.1f} {m1[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}M{m1[0]:.1f} {m1[1]:.1f}L{b1[0]:.1f} 0M{m2[0]:.1f} {m2[1]:.1f}L{b2[0]:.1f} 0M{m2[0]:.1f} {m2[1]:.1f}L{sr[0]:.1f} {sr[1]:.1f}" fill="none" stroke="{c3}" stroke-width="1.3" opacity=".7"/>'
    g+=f'<path d="M{-wd*.38:.1f} {-L*.1:.1f}L{-wd*.38:.1f} {-L*.46:.1f}" stroke="#fff" stroke-width="{max(2,wd*.1):.1f}" stroke-linecap="round" opacity=".95"/>'
    return g+'</g>'
def diamond():
    C=Ctx('diamond');p=C.p;rnd=random.Random(7);z=zones(104,96,56)
    C.defs.append('<filter id="bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>')
    C.add(f'<rect x="-46" y="-46" width="{W+92}" height="{H+92}" rx="76" fill="none" stroke="#9fe8ff" stroke-width="60" opacity=".45" filter="url(#bl)"/>')
    kinds=['cy','vi','cy','pk','cy','vi']
    # back row, tall
    for x,y,nx,ny,i in perim(50,64,.5):
        if inz(x,y,z): continue
        C.add(crystal(C,x,y,44+rnd.random()*22,22+rnd.random()*5,deg(nx,ny)+rnd.uniform(-16,16),kinds[i%6]))
    C.add(tube(C,50,14,p));C.add(channel(C,33,24,p))
    # facets in channel
    C.add(rect_ring(33,20,'#ffffff',extra='stroke-dasharray="12 12" opacity=".5"'));C.add(rect_ring(33,20,p[3],extra='stroke-dasharray="12 12" stroke-dashoffset="12" opacity=".6"'))
    C.add(tube(C,14,22,p));C.add(studs(C,14,52,3.2,zones(70,70,40),'pearl'))
    C.add(rect_ring(1,2.4,p[0]))
    # front row, short
    for x,y,nx,ny,i in perim(58,84):
        if inz(x,y,z): continue
        C.add(crystal(C,x,y,32+rnd.random()*14,18,deg(nx,ny)+rnd.uniform(-22,22),kinds[(i+3)%6]))
    def corner():
        c=-26;t=f'<circle cx="{c}" cy="{c}" r="62" fill="{C.rad([(0,"#bff3ff",.7),(1,"#bff3ff",0)])}"/>'
        for ang,L,wd,k in ((-128,40,17,'pk'),(38,40,17,'pk'),(-108,56,21,'vi'),(18,56,21,'vi'),(-84,68,25,'cy'),(-6,68,25,'cy'),(-45,84,33,'cy')):
            t+=crystal(C,c,c,L,wd,ang,k)
        t+=gem(C,c,c,15,'topaz')
        return t
    C.add(mirror4(corner))
    def mid(x,y,fl):
        g=f'<g transform="translate({x} {y}) scale(1 {fl})"><circle r="70" cy="-30" fill="{C.rad([(0,"#bff3ff",.7),(1,"#bff3ff",0)])}"/>'
        for dx,a,L,wd,k in ((-44,-62,40,19,'pk'),(44,62,40,19,'pk'),(-26,-38,54,22,'vi'),(26,38,54,22,'vi'),(-12,-16,66,26,'cy'),(12,16,66,26,'cy'),(0,0,78,32,'cy')):
            g+=crystal(C,dx*.5,0,L,wd,a,k)
        g+=gem(C,0,-6,15,'topaz')
        return g+'</g>'
    C.add(mid(W/2,-26,1)+mid(W/2,H+26,-1))
    for sx,x in ((-1,-30),(1,W+30)):
        g=f'<g transform="translate({x} {H/2}) scale({sx} 1)">'
        for dy,a,L,wd,k in ((-30,-125,38,17,'pk'),(30,-55,38,17,'pk'),(-14,-108,52,21,'vi'),(14,-72,52,21,'vi'),(0,-90,64,27,'cy')): g+=crystal(C,0,dy,L,wd,a,k)
        C.add(g+gem(C,-4,0,12,'topaz',False)+'</g>')
    for px,py,r in ((-72,170,10),(W+72,H-170,10),(130,-96,9),(W-130,H+96,9),(-54,H-150,8),(W+54,150,8),(-82,80,6),(W+82,H-80,6)): C.add(star(px,py,r,'#fff',1))
    return C.svg()
