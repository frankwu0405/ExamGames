import cv2,numpy as np,colorsys
a=cv2.cvtColor(cv2.imread('tex_clean.png'),cv2.COLOR_BGR2RGB)
lab=cv2.cvtColor(a,cv2.COLOR_RGB2LAB).reshape(-1,3).astype(np.float32)
K=12
rng=np.random.default_rng(1); sm=lab[rng.choice(len(lab),200000,replace=False)]
_,_,c=cv2.kmeans(sm,K,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,40,0.5),3,cv2.KMEANS_PP_CENTERS)
d=((lab[:,None,:]-c[None])**2).sum(2) if False else None
lbl=np.zeros(len(lab),np.int32)
for i in range(0,len(lab),400000):
    lbl[i:i+400000]=np.argmin(((lab[i:i+400000,None,:]-c[None])**2).sum(2),1)
rgbc=cv2.cvtColor(c.astype(np.uint8).reshape(1,K,3),cv2.COLOR_LAB2RGB).reshape(K,3)
cnt=np.bincount(lbl,minlength=K)
for k in range(K): print(k,rgbc[k],cnt[k]*100//len(lbl),'%')
np.save('lbl.npy',lbl.reshape(a.shape[:2])); np.save('rgbc.npy',rgbc)
