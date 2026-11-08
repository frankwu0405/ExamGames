# Young Varn: turn the fish-style (vertical) tail fin into a whale fluke by twisting the end of the tail 90 degrees about its own axis,
# then write a texture-free GLB (positions, normals, uvs) for the game/lab.
import numpy as np, json, struct, sys
P, N, UV, I = np.load('yP.npy').astype(np.float32), np.load('yN.npy').astype(np.float32), np.load('yUV.npy').astype(np.float32), np.load('yI.npy').astype(np.uint32)
out = sys.argv[1]
c1 = np.array([-0.453, 0.44, 0.0]); c2 = np.array([-0.427, 0.515, 0.0])
ax = (c2 - c1) / np.linalg.norm(c2 - c1); piv = c2 + ax * 0.035
sm = lambda v: (lambda u: u * u * (3 - 2 * u))(np.clip(v, 0, 1))
s = (P - piv) @ ax                                          # height along the tail axis, 0 at the fin root
region = (P[:, 0] < -0.15) & (P[:, 1] > 0.42)
w = sm((s + 0.1) / 0.1) * region                        # 0 below the root, 1 for the whole fin
# keep only the piece joined to the fin itself (spine crystals near the tail fall in the same box but are separate pieces)
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
key = np.round(P * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel(); U = inv.max() + 1
sel = w > 0; tri = inv[I[sel[I].all(1)]]
r_, c_ = np.r_[tri[:, 0], tri[:, 1], tri[:, 2]], np.r_[tri[:, 1], tri[:, 2], tri[:, 0]]
nc, lab = connected_components(coo_matrix((np.ones(len(r_)), (r_, c_)), shape=(U, U)), directed=False)
tip = np.argmax(np.where(sel, P[:, 1], -1)); w = w * (lab[inv] == lab[inv[tip]])
wm = np.zeros(inv.max() + 1); np.maximum.at(wm, inv, w); w = wm[inv]
ang = w * np.pi / 2
def rot(v, about, a):                                        # Rodrigues, per row
    k = about[None, :]; c, sn = np.cos(a)[:, None], np.sin(a)[:, None]
    return v * c + np.cross(k, v) * sn + k * (v @ about)[:, None] * (1 - c)
P2 = P.copy(); m = w > 0
P2[m] = rot(P[m] - piv, ax, ang[m]) + piv
N2 = N.copy(); N2[m] = rot(N[m], ax, ang[m])
print('twisted', m.sum(), 'verts')
# --- write GLB
bufs = [P2.tobytes(), N2.tobytes(), UV.tobytes(), I.ravel().tobytes()]
views, off = [], 0; blob = b''
for bb in bufs:
    views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(bb)}); blob += bb; pad = (4 - len(blob) % 4) % 4; blob += b'\0' * pad; off = len(blob)
acc = [{'bufferView': 0, 'componentType': 5126, 'count': len(P2), 'type': 'VEC3', 'min': P2.min(0).tolist(), 'max': P2.max(0).tolist()},
       {'bufferView': 1, 'componentType': 5126, 'count': len(N2), 'type': 'VEC3'},
       {'bufferView': 2, 'componentType': 5126, 'count': len(UV), 'type': 'VEC2'},
       {'bufferView': 3, 'componentType': 5125, 'count': I.size, 'type': 'SCALAR'}]
j = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}], 'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}, 'indices': 3, 'material': 0}]}],
     'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1]}}], 'accessors': acc, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
js = json.dumps(j).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
open(out, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + blob)
print('wrote', out, round((12 + 16 + len(js) + len(blob)) / 1e6, 2), 'MB')
