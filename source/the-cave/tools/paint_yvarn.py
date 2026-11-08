# Young Varn repaint: Tripo grey texture -> Varn's aqua/teal/violet palette; eyes re-painted centred on the eyeball geometry.
import numpy as np, cv2, sys
from PIL import Image
SRC, P, UV, I = 'yv/img0.jpg', np.load('yP.npy'), np.load('yUV.npy'), np.load('yI.npy')
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
S = 2048
base = cv2.imread(SRC)[..., ::-1].astype(np.float32) / 255
# 1) wipe the off-centre painted eyes (teal iris + its pupil/highlights) from the grey base, before recolouring
teal = (((base[..., 1] + base[..., 2]) / 2 - base[..., 0]) > 0.12).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(teal)
EYES = []
for s in (1, -1):
    c = np.array([0.3971, 0.213, 0.042 * s]); apex = np.array([0.4054, 0.2164, 0.0696 * s]); ax = (apex - c) / np.linalg.norm(apex - c)
    ax = ax + np.array([0.25, 0.0, 0]); ax /= np.linalg.norm(ax)          # look a little forward
    EYES.append((c, 0.0293, ax, s))
wipe = np.zeros(base.shape[:2], np.uint8)
for k in range(1, n):
    cx, cy = cen[k] / 4096
    if st[k, 4] > 2000 and ((abs(cx - 0.636) < 0.04 and abs(cy - 0.335) < 0.04) or (abs(cx - 0.933) < 0.04 and abs(cy - 0.516) < 0.04)):
        m = (lab == k).astype(np.uint8); x, y, w, h = st[k, :4]
        cv2.rectangle(m, (x, y), (x + w, y + h), 0, 0)
        hull = cv2.convexHull(cv2.findNonZero(m)); cv2.fillConvexPoly(wipe, hull, 1)
wipe = cv2.dilate(wipe, np.ones((13, 13), np.uint8))
b8 = (base * 255).astype(np.uint8)
# fill from the surrounding skin only (leave out the dark lid lines so they don't smear into a blob)
Lb = base.mean(2); valid = ((wipe == 0) & (Lb > np.percentile(Lb, 35))).astype(np.float32)
num = cv2.GaussianBlur(base * valid[..., None], (0, 0), 22); den = cv2.GaussianBlur(valid, (0, 0), 22)[..., None]
fill = num / np.maximum(den, 1e-4); soft = cv2.GaussianBlur(wipe.astype(np.float32), (0, 0), 4)[..., None]
b8 = (np.clip(base * (1 - soft) + fill * soft, 0, 1) * 255).astype(np.uint8)
base = cv2.resize(b8, (S, S), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
# 2) recolour with grown Varn's own paint: a colour lookup learned from his original texture -> his painted skin (see varn_lut.npy)
import os
LUT = np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'varn_lut.npy')); B = 32
# first give the young texture the same spread of tones as grown Varn's original (it is much flatter), with a little extra local contrast
from skimage.exposure import match_histograms
ref = cv2.resize(cv2.imread(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'varn_src_small.jpg')), (1024, 1024))[..., ::-1]
lab_b = cv2.cvtColor((base * 255).astype(np.uint8), cv2.COLOR_RGB2LAB); lab_r = cv2.cvtColor(ref, cv2.COLOR_RGB2LAB)
lab_m = match_histograms(lab_b, lab_r, channel_axis=-1).astype(np.float32)
Lm = lab_m[..., 0]; lab_m[..., 0] = np.clip(Lm + (Lm - cv2.GaussianBlur(Lm, (0, 0), 18)) * 0.6, 0, 255)
base = cv2.cvtColor(lab_m.astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32) / 255
q = np.clip((base * 255 / 256 * B).astype(int), 0, B - 1); col = LUT[q[..., 0] * B * B + q[..., 1] * B + q[..., 2]] / 255
h = lambda x: np.array([(x >> 16) & 255, (x >> 8) & 255, x & 255], np.float32) / 255
def mix(a, b, t):
    a = a if a.ndim == 3 else a[None, None, :]; b = b if b.ndim == 3 else b[None, None, :]; return a * (1 - t[..., None]) + b * t[..., None]
L0 = cv2.resize(cv2.imread(SRC)[..., ::-1], (S, S), interpolation=cv2.INTER_AREA).astype(np.float32).mean(2) / 255
core = np.clip((L0 - cv2.GaussianBlur(L0, (0, 0), 14) - 0.05) * 6, 0, 1) * np.clip((L0 - 0.55) * 4, 0, 1)
glow = np.stack([core * 0.55, core * 0.95, core], -1); glow = cv2.GaussianBlur(glow, (0, 0), 1.2)
glow[cv2.resize(wipe, (S, S)) > 0] = 0
# 3) the crystals along the spine glow turquoise at the root, blue in the middle, violet at the tip
XB = np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'yvarn_spine_base.npy'))
bse = np.interp(P[:, 0], XB[:, 0], XB[:, 1]); cry = (np.abs(P[:, 2]) < 0.05) & (P[:, 0] > -0.36) & (P[:, 0] < 0.42) & (P[:, 1] > bse + 0.03) & (P[:, 1] < 0.56)
TQ, BL, VI = h(0x46F0E0), h(0x4A8DFF), h(0xB27BFF)
def raster(tris, fn):
    for t in tris:
        uv = UV[t] * S; x0, y0 = np.floor(uv.min(0)).astype(int); x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
        xs, ys = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5); pts = np.stack([xs.ravel(), ys.ravel()], 1)
        A = np.array([[uv[0, 0] - uv[2, 0], uv[1, 0] - uv[2, 0]], [uv[0, 1] - uv[2, 1], uv[1, 1] - uv[2, 1]]])
        if abs(np.linalg.det(A)) < 1e-12: continue
        l12 = np.linalg.solve(A, (pts - uv[2]).T).T; bc = np.c_[l12, 1 - l12.sum(1)]; inside = (bc > -0.08).all(1)
        if not inside.any(): continue
        fn(np.clip(pts[inside].astype(int), 0, S - 1), bc[inside] @ P[t])
def crystal(px, p3):
    b = np.interp(p3[:, 0], XB[:, 0], XB[:, 1]); t = np.clip((p3[:, 1] - b - 0.03) / 0.11, 0, 1)
    c = np.where(t[:, None] < 0.5, TQ * (1 - t[:, None] * 2) + BL * (t[:, None] * 2), BL * (2 - t[:, None] * 2) + VI * (t[:, None] * 2 - 1))
    old = col[px[:, 1], px[:, 0]]; col[px[:, 1], px[:, 0]] = np.clip(old * 0.35 + c * 0.75, 0, 1); glow[px[:, 1], px[:, 0]] = c * (0.55 + 0.35 * t[:, None])
col = np.ascontiguousarray(col); glow = np.ascontiguousarray(glow)
raster(I[cry[I].all(1)], crystal)
# 4) paint each eye straight onto the eyeball dome (texel colour from its 3D angle off the eye's axis)
UPV = np.array([0.0, 1.0, 0.0])
def eye_col(th, q, c, ax, s):
    # q: unit vectors from eye centre; returns rgb, glow
    rgb = np.zeros(th.shape + (3,), np.float32); g = np.zeros_like(rgb)
    ir = 0.8; t = np.clip(th / ir, 0, 1)
    iris = mix(h(0x3FE0D6)[None, :].repeat(len(th), 0)[:, None, :], h(0x0E6F8C)[None, :].repeat(len(th), 0)[:, None, :], t[:, None])[:, 0]
    rgb[:] = h(0xF2FBFA); rgb[th < ir + 0.06] = h(0x10304A); rgb[th < ir] = iris[th < ir]
    pup = th < 0.36; rgb[pup] = h(0x0B1630)
    g[th < ir] = (iris[th < ir] * 0.35); g[pup] = 0
    # highlights: up and slightly toward the back of the head
    up = UPV - ax * (UPV @ ax); up /= np.linalg.norm(up)
    for off, rad in ((0.42, 0.17), (-0.38, 0.09)):
        d1 = ax * np.cos(abs(off)) + (up if off > 0 else -up) * np.sin(abs(off)) + np.array([-0.18, 0, 0]) * np.sign(off)
        d1 /= np.linalg.norm(d1); hit = np.arccos(np.clip(q @ d1, -1, 1)) < rad
        rgb[hit] = 1.0; g[hit] = 0.6
    rgb[th > 1.0] = h(0x173651)
    return rgb, g
col = np.ascontiguousarray(col); glow = np.ascontiguousarray(glow)
for c, r, ax, s in EYES:
    d = np.linalg.norm(P - c, axis=1); on = np.abs(d - r) < 0.0018
    tris = I[on[I].any(1)]
    for t in tris:
        uv = UV[t] * S; x0, y0 = np.floor(uv.min(0)).astype(int); x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
        xs, ys = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5); pts = np.stack([xs.ravel(), ys.ravel()], 1)
        A = np.array([[uv[0, 0] - uv[2, 0], uv[1, 0] - uv[2, 0]], [uv[0, 1] - uv[2, 1], uv[1, 1] - uv[2, 1]]])
        if abs(np.linalg.det(A)) < 1e-9: continue
        l12 = np.linalg.solve(A, (pts - uv[2]).T).T; bc = np.c_[l12, 1 - l12.sum(1)]
        inside = (bc > -0.08).all(1)
        if not inside.any(): continue
        bc = bc[inside]; px = pts[inside].astype(int)
        p3 = bc @ P[t]; v = p3 - c; dd = np.linalg.norm(v, axis=1); q = v / dd[:, None]
        th = np.arccos(np.clip(q @ ax, -1, 1))
        rgb, g = eye_col(th, q, c, ax, s)
        onsph = np.abs(dd - r) < 0.0025
        rgb[~onsph] = h(0x173651); g[~onsph] = 0
        keep = onsph | (np.abs(dd - r) < 0.0045)
        px = np.clip(px, 0, S - 1)
        col[px[keep, 1], px[keep, 0]] = rgb[keep]; glow[px[keep, 1], px[keep, 0]] = g[keep]
Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(OUT + '/yvarn-skin.jpg', quality=90)
Image.fromarray((np.clip(glow, 0, 1) * 255).astype(np.uint8)).save(OUT + '/yvarn-glow.jpg', quality=90)
print('painted', [len(I[(np.abs(np.linalg.norm(P - e[0], axis=1) - e[1]) < 0.0018)[I].any(1)]) for e in EYES])
