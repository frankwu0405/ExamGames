import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const q = new URLSearchParams(location.search);
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(innerWidth, innerHeight); document.body.append(r.domElement); r.outputColorSpace = THREE.SRGBColorSpace;
const s = new THREE.Scene(); s.background = new THREE.Color(0x8899aa); s.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 1.5); d.position.set(2, 3, 2); s.add(d);
const c = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 100);
const rc = new THREE.Raycaster(); window.__pick = (px, py) => { rc.setFromCamera(new THREE.Vector2(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1), c); const h = rc.intersectObjects(s.children, true)[0]; return h ? { p: h.point.toArray(), n: h.face.normal.toArray(), uv: h.uv.toArray(), f: h.faceIndex } : null; };
window.__set = (pos, tgt) => { c.position.set(...pos); c.lookAt(...tgt); r.render(s, c); };
new GLTFLoader().load(q.get('f'), g => { s.add(g.scene); if (q.get('tex') === '0') g.scene.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0xcccccc }); }); if (q.get('skin')) { const tl = new THREE.TextureLoader(), tx = u => { const t = tl.load(u); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; return t; }; g.scene.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ map: tx(q.get('skin')), emissiveMap: q.get('glow') ? tx(q.get('glow')) : null, emissive: q.get('glow') ? 0xffffff : 0, roughness: 0.5 }); }); } setTimeout(() => { window.__ready = true; }, 1500); window.__set([0, 0.4, 2], [0, 0.25, 0]); });
