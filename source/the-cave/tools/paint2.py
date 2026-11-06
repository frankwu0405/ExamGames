import cv2,numpy as np
a=cv2.cvtColor(cv2.imread('tex_clean.png'),cv2.COLOR_BGR2RGB).astype(np.float32)
lbl=np.load('lbl.npy'); 
h=lambda x:np.array([(x>>16)&255,(x>>8)&255,x&255],np.float32)
role={0:0x74C842,2:0x7B8446,9:0x7B8446,3:0x3D5FB5,4:0x8D5A3B,5:0x8D5A3B,10:0x7A4C30,11:0xA66F4C,8:0x3A2010,1:0x2C180C,6:0xF4F1EA,7:0x2A1B24}
L=a.mean(2); Ls=cv2.GaussianBlur(L,(0,0),6)
out=np.zeros_like(a); W=np.zeros(a.shape[:2],np.float32)
for k,c in role.items():
    m=(lbl==k).astype(np.float32); m=cv2.GaussianBlur(m,(0,0),1.0)
    f=np.clip((L/(Ls+8)),0.7,1.3)**0.8 if k in(0,2,9,3,4,5,10,11) else 1.0
    col=h(c)[None,None,:]*(f[...,None] if np.ndim(f)==2 else 1.0)
    out+=m[...,None]*col; W+=m
out=np.clip(out/np.maximum(W,1e-3)[...,None],0,255).astype(np.uint8)
cv2.imwrite('tex_paint.png',cv2.cvtColor(out,cv2.COLOR_RGB2BGR)); cv2.imwrite('paintview.png',cv2.cvtColor(cv2.resize(out,(800,800)),cv2.COLOR_RGB2BGR))
