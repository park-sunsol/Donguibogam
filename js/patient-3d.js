/**
 * patient-3d.js
 * 약재 조제 게임 좌측 환자 패널의 3D 인체 뷰어.
 * body-viewer-3d.js와 동일한 GLB(body_male.glb)를 재사용하지만,
 *  - 자동 회전 없음
 *  - 거리장 precompute 없이 face-set body_part_id로만 부위를 빨갛게 칠함
 *  - 외부에서 setPainPart(key)를 호출해 아픈 부위 하이라이트만 전환
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// hand-herb-game.js의 BODY_KEYWORD_MAP `part` 값 → body3d part id (0~5)
//  0=skull(머리)  1=head(흉부)  2=arms(팔)  3=chest(복부)  4=abdomen(신장·생식)  5=legs(다리)
const PAIN_PART_MAP = {
  head:    0,
  chest:   1,
  arms:    2,
  stomach: 3,
  abdomen: 4,
  back:    3,
  legs:    5,
  limbs:   5,
  torso:  -2,
};

const VERTEX_SHADER = `
attribute vec3 color;
varying vec3  vN;
varying float vPart;
varying vec3  vWorldPos;
void main(){
  vN = normalize(mat3(modelMatrix) * normal);
  vPart = color.r;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3  vN;
varying float vPart;
varying vec3  vWorldPos;
uniform float uSelected;
uniform float uMode;
uniform float uPulse;
uniform vec3  uPainCenter;
uniform float uPainRadius;
/* 수묵 팔레트 */
const vec3 PAPER     = vec3(0.98, 0.94, 0.84);
const vec3 INK_MID   = vec3(0.55, 0.42, 0.28);
const vec3 INK_DARK  = vec3(0.16, 0.10, 0.05);
const vec3 OUTLINE   = vec3(0.02, 0.01, 0.00);
const vec3 PAIN_INK  = vec3(0.78, 0.10, 0.08);
const vec3 PAIN_DEEP = vec3(0.42, 0.04, 0.04);

/* 의사 난수 — 인주 번짐 가장자리 흩뿌림용 */
float hash(vec3 p){
  return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

void main(){
  vec3 n = normalize(vN);
  vec3 key = normalize(vec3(0.9, 1.6, 1.2));
  float diff = max(0.0, dot(n, key));
  /* 라이팅을 3단계로 양자화 → 수묵 톤 블록 */
  float q = floor(diff * 3.0 + 0.5) / 3.0;
  vec3 col = mix(INK_MID, PAPER, q);
  col = mix(INK_DARK, col, smoothstep(0.0, 0.28, q));

  /* 통증 알파 계산 (실제 mix는 outline 이후에) */
  float inkAlpha = 0.0;
  float corePool = 0.0;
  bool isPain = false;
  if (uMode > 2.5) {
    /* 피부 전체 모드 — 펄스 적용 (0.22~0.88 동일 진폭) */
    float skinPulse = 0.22 + 0.66 * uPulse;
    inkAlpha = skinPulse * 0.55;
    isPain = true;
  } else if (uSelected >= 0.0 && uPainRadius > 0.0) {
    float pid = floor(vPart * 10.0 + 0.5);
    float partMatch = step(abs(pid - uSelected), 0.5);
    float dist = distance(vWorldPos, uPainCenter);

    /* 잉크 번짐 — 거리에 저주파 노이즈를 더해 폴리곤 끝이 들쭉날쭉(wet ink) */
    float n1 = hash(floor(vWorldPos * 11.0));
    float n2 = hash(floor(vWorldPos * 34.0 + 5.7));
    float bleedNoise = (n1 - 0.5) * 0.72 + (n2 - 0.5) * 0.28;  // -0.5 ~ 0.5
    float distBleed = dist + bleedNoise * uPainRadius * 0.45;

    /* 매칭 파트 인주 — 진하지 않게 (얼룩 정도) */
    float partInk = partMatch * 0.55;

    /* halo — 매칭 표면(jittered)에서 ~0.5 알파, 인접부위로 부드럽게 */
    float halo = 1.0 - smoothstep(uPainRadius * 0.55, uPainRadius * 2.10, distBleed);
    halo = pow(halo, 0.80);

    /* 점적 흩뿌림 — 가장자리 안개 */
    float edge = 1.0 - smoothstep(uPainRadius * 1.30, uPainRadius * 2.40, distBleed);
    float splNoise = hash(floor(vWorldPos * 64.0));
    float splatter = step(0.70, splNoise) * edge * 0.65;

    /* 펄스 0.22 ~ 0.88 */
    float pulse = 0.22 + 0.66 * uPulse;

    float ink = max(partInk, max(halo * 0.55, splatter));
    inkAlpha = ink * pulse;

    /* 코어 풀 — 매칭 파트 중심에 약하게 (실제 거리 사용 — 위치 안정) */
    corePool = partMatch * (1.0 - smoothstep(0.0, uPainRadius * 0.30, dist)) * 0.42 * (0.6 + 0.4 * uPulse);
    isPain = true;
  }

  /* 붓 외곽선 — 프레넬 림 (이중) → 두꺼운 묵선 + 안쪽 그림자 */
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float ndotv = max(0.0, dot(n, viewDir));
  float fres = 1.0 - ndotv;
  float innerShade = smoothstep(0.30, 0.70, fres);
  /* 인주가 강한 곳에서는 inner shade를 약화 — 붉은색이 묻히지 않도록 */
  col = mix(col, INK_DARK, innerShade * 0.45 * (1.0 - inkAlpha * 0.6));
  float outline = smoothstep(0.62, 0.95, pow(fres, 1.6));
  col = mix(col, OUTLINE, outline * (1.0 - inkAlpha * 0.4));

  /* 통증 인주를 outline 위에 얹어 항상 잘 보이게 */
  if (isPain) {
    col = mix(col, PAIN_INK,  clamp(inkAlpha, 0.0, 1.0));
    col = mix(col, PAIN_DEEP, clamp(corePool, 0.0, 1.0));
  }

  gl_FragColor = vec4(col, 1.0);
}`;

let renderer, scene, camera, pivot, model;
let canvas, wrap;
/* 카메라 프레이밍: 부위별로 줌·중심 이동 (lerp 보간) */
let bodyCenterY = 0, bodyMaxDim = 1;
let camCurY = 0, camCurZ = 0;
let camTgtY = 0, camTgtZ = 0;
let uniforms = {
  uSelected: { value: -1 },
  uMode: { value: 0 },
  uPulse: { value: 1 },
  uPainCenter: { value: new THREE.Vector3(0, 0, 0) },
  uPainRadius: { value: 0 }
};
/* 부위별 (centroid, max distance) — 모델 로드 시 계산되어 setPainPart에서 사용 */
let partCentroids = [];   // [{center: Vec3, radius: number}, ...] index = part_id (0..5)
let currentPainKey = null;
let pulsePhase = 0;
let animId = 0;
let currentGlbGender = 'male';

function init() {
  canvas = document.getElementById('patient3d-canvas');
  wrap   = document.getElementById('patient3d-wrap');
  if (!canvas || !wrap) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  pivot  = new THREE.Group();
  scene.add(pivot);

  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();

  new GLTFLoader().load(
    'asset/prescription/body_male.glb',
    onLoaded,
    undefined,
    err => { console.warn('[patient3d] GLB load failed:', err); }
  );
  currentGlbGender = 'male';

  animate();
}

function onLoaded(gltf) {
  model = gltf.scene;
  const sharedMat = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
  });
  /* 부위별 centroid + radius 계산용 누적 (월드 공간 기준) */
  const sums = [];
  for (let i = 0; i < 6; i++) sums.push({ x: 0, y: 0, z: 0, n: 0 });
  model.traverse(o => {
    if (o.isMesh) {
      o.material = sharedMat;
      o.castShadow = false;
      o.receiveShadow = false;
      const pos = o.geometry.attributes.position;
      const col = o.geometry.attributes.color;
      if (pos && col) {
        for (let i = 0; i < pos.count; i++) {
          const pid = Math.round(col.getX(i) * 10);
          if (pid < 0 || pid > 5) continue;
          sums[pid].x += pos.getX(i);
          sums[pid].y += pos.getY(i);
          sums[pid].z += pos.getZ(i);
          sums[pid].n++;
        }
      }
    }
  });

  // 모델을 중앙 정렬 + 카메라 거리 조정
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  model.position.sub(center);
  model.position.y += size.y * 0.5; // 발이 바닥에 오도록
  pivot.add(model);

  /* matrix world 강제 업데이트 — localToWorld가 정확한 변환을 적용하도록 */
  pivot.updateMatrixWorld(true);

  /* centroid를 월드 공간으로 변환 후 저장. 반경은 centroid에서 가장 먼 같은 부위 정점 거리 */
  partCentroids = [];
  for (let pid = 0; pid < 6; pid++) {
    if (sums[pid].n === 0) { partCentroids[pid] = null; continue; }
    const cLocal = new THREE.Vector3(sums[pid].x / sums[pid].n, sums[pid].y / sums[pid].n, sums[pid].z / sums[pid].n);
    const cWorld = cLocal.clone();
    model.localToWorld(cWorld);
    partCentroids[pid] = { center: cWorld, radius: 0 };
  }
  /* 2차 패스: 반경 = 같은 부위 정점들 중 centroid에서 가장 먼 거리 */
  model.traverse(o => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    const col = o.geometry.attributes.color;
    if (!pos || !col) return;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const pid = Math.round(col.getX(i) * 10);
      if (pid < 0 || pid > 5 || !partCentroids[pid]) continue;
      tmp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      model.localToWorld(tmp);
      const d = tmp.distanceTo(partCentroids[pid].center);
      if (d > partCentroids[pid].radius) partCentroids[pid].radius = d;
    }
  });
  /* 디버그: 콘솔에 결과 출력 */
  try {
    for (let pid = 0; pid < 6; pid++) {
      if (partCentroids[pid]) {
        console.log('[patient3d] part', pid, 'center', partCentroids[pid].center.toArray(), 'radius', partCentroids[pid].radius);
      }
    }
  } catch (e) {}
  /* 통증 부위가 이미 지정되어 있었다면 uniform 갱신 */
  if (currentPainKey != null) applyPainUniforms(currentPainKey);

  const maxDim = Math.max(size.x, size.y);
  bodyCenterY = size.y * 0.5;
  bodyMaxDim  = maxDim;
  /* 기본 프레이밍 = 전신, 부위가 이미 지정되어 있으면 그쪽으로 즉시 스냅 */
  const f = computeFraming(currentPainKey);
  camCurY = camTgtY = f.y;
  camCurZ = camTgtZ = f.z;
  camera.position.set(0, camCurY, camCurZ);
  camera.lookAt(0, camCurY, 0);
  camera.updateProjectionMatrix();
}

function computeFraming(key) {
  const pid = PAIN_PART_MAP[key];
  if (pid !== undefined && pid >= 0 && partCentroids[pid]) {
    const c = partCentroids[pid];
    /* 부위별 줌 거리·세로 위치 조정.
       vshift > 0 → 캔버스에서 위쪽으로 (lookAt을 centroid 아래로)
       vshift < 0 → 캔버스에서 아래쪽으로 (lookAt을 centroid 위로) */
    let zMult = 3.7, vshift = 0;
    if (pid === 0)      { zMult = 3.7; vshift =  c.radius * 0.55; } // 머리
    else if (pid === 1) { zMult = 3.7; vshift =  c.radius * 0.35; } // 흉부
    else if (pid === 2) { zMult = 3.4; vshift =  c.radius * 0.20; } // 팔
    else if (pid === 5) { zMult = 2.6; vshift = -c.radius * 0.60; } // 다리
    const z = Math.max(c.radius * zMult, bodyMaxDim * 0.55);
    return { y: c.center.y - vshift, z };
  }
  return { y: bodyCenterY, z: bodyMaxDim * 1.28 };
}

function resize() {
  if (!wrap || !renderer || !camera) return;
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  animId = requestAnimationFrame(animate);
  if (!renderer || !scene || !camera) return;
  // 회전 없음. 통증 부위에 은은한 pulse만 적용 (강도 변조).
  if (currentPainKey != null) {
    pulsePhase += 0.06;
    uniforms.uPulse.value = Math.sin(pulsePhase) * 0.5 + 0.5;
  }
  /* 카메라 부드러운 보간 — 부위 전환 시 머리/가슴/배 등으로 줌 이동 */
  const dy = camTgtY - camCurY;
  const dz = camTgtZ - camCurZ;
  if (Math.abs(dy) > 0.0008 || Math.abs(dz) > 0.0008) {
    camCurY += dy * 0.14;
    camCurZ += dz * 0.14;
    camera.position.set(0, camCurY, camCurZ);
    camera.lookAt(0, camCurY, 0);
  }
  renderer.render(scene, camera);
}

/** 외부 API: 성별에 맞는 GLB 모델로 교체 ('male'|'female') */
export function setGender(g) {
  const next = g === 'female' ? 'female' : 'male';
  if (next === currentGlbGender && model) return;
  currentGlbGender = next;
  if (model) { pivot.remove(model); model = null; }
  const url = `asset/prescription/body_${next}.glb`;
  new GLTFLoader().load(url, onLoaded, undefined,
    err => { console.warn('[patient3d] GLB load failed:', err); });
}

/** 외부 API: 아픈 부위 키 지정 ('head'|'chest'|'stomach'|'abdomen'|'back'|'legs'|'limbs'|'torso'|null) */
function applyPainUniforms(key) {
  const pid = PAIN_PART_MAP[key];
  if (pid === undefined || pid === -1) {
    uniforms.uMode.value = 0;
    uniforms.uSelected.value = -1;
    uniforms.uPainRadius.value = 0;
  } else if (pid === -2) {
    uniforms.uMode.value = 3;
    uniforms.uSelected.value = -1;
    uniforms.uPainRadius.value = 0;
  } else {
    uniforms.uMode.value = 1;
    uniforms.uSelected.value = pid;
    const c = partCentroids[pid];
    if (c) {
      uniforms.uPainCenter.value.copy(c.center);
      uniforms.uPainRadius.value = c.radius;
    } else {
      uniforms.uPainRadius.value = 0;
    }
  }
}
export function setPainPart(key) {
  currentPainKey = key || null;
  if (key == null) {
    uniforms.uMode.value = 0;
    uniforms.uSelected.value = -1;
    uniforms.uPainRadius.value = 0;
  } else {
    applyPainUniforms(key);
  }
  /* 카메라 타겟 갱신 — animate에서 lerp로 자연스럽게 이동 */
  if (camera) {
    const f = computeFraming(currentPainKey);
    camTgtY = f.y;
    camTgtZ = f.z;
  }
}

// 게임 코드(non-module)에서 호출할 수 있도록 전역 노출
window.Patient3D = { setPainPart, setGender };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
