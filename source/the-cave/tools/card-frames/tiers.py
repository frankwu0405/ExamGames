from gen import *
import math
def tier_bronze():
    P=dict(ol='#4a2210',shade='#8a4520',base='#d98a45',light='#ffd08a')
    s=band(22,P)
    # knurl marks on band
    s+=f'<rect x="-11" y="-11" width="{W+22}" height="{H+22}" rx="41" fill="none" stroke="{P["ol"]}" stroke-width="14" stroke-dasharray="2.2 12" opacity=".35"/>'
    def corner():
        d='M-30 -6Q-30 -30 -6 -30L44 -30Q56 -30 56 -18Q56 -8 44 -8L8 -8L8 44Q8 56 -4 56Q-14 56 -14 44L-14 -14Z'
        d='M-34 4Q-34 -34 4 -34L50 -34Q62 -34 62 -22L62 -14Q62 -6 54 -6L8 -6L-6 8L-6 54Q-6 62 -14 62L-22 62Q-34 62 -34 50Z'
        t=shape(d,P['base'],P['light'],P['shade'],P['ol'],5)
        t+=rivet(-14,-14,8,P)
        t+=f'<path d="M14 -24L48 -24M-24 14L-24 48" stroke="{P["light"]}" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
        return t
    s+=mirror4(corner)
    # edge studs
    for x in (W*.25,W*.5,W*.75):
        for y,sg in ((-11,1),(H+11,1)): s+=rivet(x,y,5.5 if x!=W*.5 else 9,P)
    for y in (H*.25,H*.5,H*.75):
        for x in (-11,W+11): s+=rivet(x,y,5.5 if y!=H*.5 else 9,P)
    return svg(s)

def tier_silver():
    P=dict(ol='#26334a',shade='#7b8ca6',base='#c5d2e2',light='#f7fbff')
    B=('#4aa3e8','#9fdcff','#2764b8')
    s=band(26,P)
    # panel seams
    s+=f'<rect x="-13" y="-13" width="{W+26}" height="{H+26}" rx="43" fill="none" stroke="{P["ol"]}" stroke-width="2" opacity=".35"/>'
    def corner():
        d='M-58 -26Q-58 -58 -26 -58L-4 -58L10 -44L14 -44L14 -18L8 -10L8 8L-10 8L-18 14L-44 14L-44 10L-58 -4Z'
        t=shape(d,P['base'],P['light'],P['shade'],P['ol'],5)
        t+=f'<path d="M-48 -22Q-48 -48 -22 -48L-6 -48M-48 -14L-48 4" stroke="{P["light"]}" stroke-width="3.5" stroke-linecap="round" fill="none"/>'
        t+=f'<path d="M-30 -30L2 -30L2 2L-30 2Z" fill="{P["shade"]}" opacity=".35" stroke="{P["ol"]}" stroke-width="2" stroke-linejoin="round"/>'
        t+=rivet(-40,-40,8,P)+rivet(-1,-1,5,P)
        return t
    s+=mirror4(lambda:'<g transform="scale(1.18)">'+corner()+'</g>')
    def plate(x,y,rot):
        d='M-26 -17L26 -17L34 0L26 17L-26 17L-34 0Z'
        return f'<g transform="translate({x} {y}) rotate({rot})">'+shape(d,P['base'],P['light'],P['shade'],P['ol'],4.5)+rivet(-19,0,4.5,P)+rivet(19,0,4.5,P)+f'<path d="M-10 -5L10 -5" stroke="{P['light']}" stroke-width="3" stroke-linecap="round"/></g>'
    for x in (W*.27,W*.73):
        s+=plate(x,-13,0)+plate(x,H+13,0)
    for y in (H*.27,H*.73):
        s+=plate(-13,y,90)+plate(W+13,y,90)
    def crest(x,y,flip):
        d='M-46 0Q-30 -6 -24 -22Q-12 -44 0 -52Q12 -44 24 -22Q30 -6 46 0Q30 6 24 22Q12 44 0 52Q-12 44 -24 22Q-30 6 -46 0Z'
        g=f'<g transform="translate({x} {y}) scale(1 {flip})">'+shape(d,P['base'],P['light'],P['shade'],P['ol'],5)
        g+=gem(0,0,19,B,P['ol'])
        g+=rivet(-34,0,5,P)+rivet(34,0,5,P)+'</g>'
        return g
    s+=crest(W/2,-14,1)+crest(W/2,H+14,-1)
    for x,sg in ((-13,-1),(W+13,1)):
        s+=gem(x,H*.5,15,B,P['ol'])
    return svg(s)

def tier_gold():
    P=dict(ol='#5a3104',shade='#c27a10',base='#f6bd33',light='#fff3a6')
    R=('#e8344f','#ff9aa8','#9b1330')
    G=('#38c46a','#a6f5bd','#12803c')
    w=34; r=17
    sc=''
    n=15; m=23
    for i in range(n):
        x=-8+i*(W+16)/(n-1)
        for y in (-w-2,H+w+2): sc+=f'<circle cx="{x}" cy="{y}" r="{r}"/>'
    for i in range(m):
        y=-8+i*(H+16)/(m-1)
        for x in (-w-2,W+w+2): sc+=f'<circle cx="{x}" cy="{y}" r="{r}"/>'
    s=f'<g fill="{P["ol"]}" stroke="{P["ol"]}" stroke-width="9">{sc}</g><g fill="{P["base"]}">{sc}</g>'
    # little highlight on each bump
    s+=band(w,P)
    def corner():
        t=''
        c=-17
        for ang,L,wd in ((-105,52,13),(15,52,13),(-75,74,17),(-15,74,17),(-45,96,22)):
            t+=leaf(c,c,L,wd,ang,P)
        t+=f'<circle cx="{c}" cy="{c}" r="31" fill="{P["ol"]}"/><circle cx="{c}" cy="{c}" r="26" fill="{P["shade"]}"/><circle cx="{c-2}" cy="{c-2}" r="23" fill="{P["base"]}"/><circle cx="{c}" cy="{c}" r="19" fill="none" stroke="{P["light"]}" stroke-width="2.5" opacity=".8"/>'
        t+=gem(c,c-1,16,R,P['ol'])
        return t
    s+=mirror4(corner)
    def crest(x,y,fl):
        g=f'<g transform="translate({x} {y}) scale(1 {fl})">'
        for ang,L,wd,dx in ((-65,60,15,-14),(65,60,15,14),(-88,46,12,-30),(88,46,12,30)):
            g+=leaf(dx,-8,L,wd,ang,P)
        d='M-44 6Q-42 -26 0 -34Q42 -26 44 6Q22 -10 0 -10Q-22 -10 -44 6Z'
        g+=shape(d,P['base'],P['light'],P['shade'],P['ol'],5)
        g+=gem(0,-18,22,R,P['ol'])
        return g+'</g>'
    s+=crest(W/2,-w-6,1)+crest(W/2,H+w+6,-1)
    for x,sg in ((-w-12,-1),(W+w+12,1)):
        for y in (H*.5,):
            s+=gem(x,y,17,G,P['ol'],0)
    return svg(s)

def tier_diamond():
    P=dict(ol='#262668',shade='#7c8de0',base='#c7e8fb',light='#ffffff')
    C1=('#8fe3f8','#e6ffff','#4aa6d8')   # cyan
    C2=('#c9a4ff','#f4e8ff','#8a5bd6')   # violet
    C3=('#ff9bd0','#ffe0f1','#d4559a')   # pink
    s=band(26,P)
    s+=f'<rect x="-13" y="-13" width="{W+26}" height="{H+26}" rx="43" fill="none" stroke="#fff" stroke-width="3" opacity=".55" stroke-dasharray="1 16" stroke-linecap="round"/>'
    def corner():
        t=''
        t+=crystal(-12,-6,70,28,-62,C2,P['ol'])
        t+=crystal(-6,-12,70,28,-28,C1,P['ol'])
        t+=crystal(-8,-8,112,44,-45,C1,P['ol'])
        t+=crystal(0,-8,56,24,0+10,C3,P['ol']) if False else ''
        t+=crystal(-12,0,56,24,-100,C3,P['ol'])
        t+=crystal(0,-12,56,24,10,C2,P['ol'])
        t+=star(-52,-52,0)
        return t
    # draw back crystals first for depth
    def corner2():
        t=''
        c=-14
        t+=crystal(c,c,112,44,-45,C1,P['ol'])
        t+=crystal(c-2,c,80,32,-72,C2,P['ol'])+crystal(c,c-2,80,32,-18,C2,P['ol'])
        t+=crystal(c-4,c,54,24,-100,C3,P['ol'])+crystal(c,c-4,54,24,10,C3,P['ol'])
        t+=star(-70,-22,0)
        return t
    s+=mirror4(corner2)
    def mid(x,y,fl):
        g=f'<g transform="translate({x} {y}) scale(1 {fl})">'
        g+=crystal(-22,0,48,22,-30,C2,P['ol'])+crystal(22,0,48,22,30,C2,P['ol'])+crystal(0,0,78,32,0,C1,P['ol'])
        return g+'</g>'
    s+=mid(W/2,-10,1)+mid(W/2,H+10,-1)
    for y,sc in ((H*.28,.8),(H*.5,1.2),(H*.72,.8)):
        for x,sg in ((-14,-1),(W+14,1)):
            g=f'<g transform="translate({x} {y}) scale({sg} 1)">'
            g+=crystal(0,0,52*sc,22*sc,-90,C1,P['ol'])+crystal(0,-14*sc,38*sc,17*sc,-125,C2,P['ol'])+crystal(0,14*sc,38*sc,17*sc,-55,C3,P['ol'])
            s+=g+'</g>'
    s+=star(-62,150,11)+star(W+62,H-150,11)+star(150,-70,10)+star(W-150,H+70,10)
    return svg(s)
