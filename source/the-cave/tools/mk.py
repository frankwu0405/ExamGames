import json,struct,numpy as np,io,sys
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS=None
raw=np.fromfile('vtx.bin','<f4').reshape(-1,8); idx=np.fromfile('idx_s.bin','<u4')
used=np.unique(idx); remap=np.full(len(raw),-1,np.int64); remap[used]=np.arange(len(used)); V=raw[used]; I=remap[idx].astype('<u4')
print('verts',len(V),'tris',len(I)//3)
P=V[:,0:3].astype('<f4'); N=V[:,3:6].astype('<f4'); UV=V[:,6:8].astype('<f4')
# texture: 2048, smoothed so the stray smudges and noisy baked shading disappear, colours pushed a little toward a clean painted look
import os
img=Image.open('tex_paint.png').convert('RGB') if os.path.exists('tex_paint.png') else Image.open('img0.jpg').convert('RGB').resize((2048,2048),Image.LANCZOS)
try:
    import cv2
    a=np.asarray(img)
except Exception as e: print('no cv2',e); img=img.filter(ImageFilter.MedianFilter(5))
buf=io.BytesIO(); img.save(buf,'JPEG',quality=88); jpg=buf.getvalue(); img.save('tex_clean.png')
def pad(b,c=b'\x00'): return b+c*((4-len(b)%4)%4)
bins=[pad(P.tobytes()),pad(N.tobytes()),pad(UV.tobytes()),pad(I.tobytes()),pad(jpg)]
offs=np.cumsum([0]+[len(b) for b in bins])
bv=[{'buffer':0,'byteOffset':int(offs[i]),'byteLength':len(bins[i]),**({'target':34963} if i==3 else {'target':34962} if i<3 else {})} for i in range(5)]
j={'asset':{'version':'2.0','generator':'leo-repaint'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'leo'}],
 'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'TEXCOORD_0':2},'indices':3,'material':0}]}],
 'materials':[{'name':'leo','pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':0,'roughnessFactor':1}}],
 'textures':[{'source':0,'sampler':0}],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}],'images':[{'bufferView':4,'mimeType':'image/jpeg'}],
 'accessors':[{'bufferView':0,'componentType':5126,'count':len(V),'type':'VEC3','min':P.min(0).tolist(),'max':P.max(0).tolist()},{'bufferView':1,'componentType':5126,'count':len(V),'type':'VEC3'},{'bufferView':2,'componentType':5126,'count':len(V),'type':'VEC2'},{'bufferView':3,'componentType':5125,'count':len(I),'type':'SCALAR'}],
 'bufferViews':bv,'buffers':[{'byteLength':int(offs[-1])}]}
jb=pad(json.dumps(j).encode(),b' '); body=b''.join(bins)
out=b'glTF'+struct.pack('<II',2,12+8+len(jb)+8+len(body))+struct.pack('<I',len(jb))+b'JSON'+jb+struct.pack('<I',len(body))+b'BIN\x00'+body
open('leo_game.glb','wb').write(out); print(len(out)/1e6,'MB')
