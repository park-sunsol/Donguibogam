/**
 * 처방 탭 — 3D 인체 뷰어
 * GLB에 구운 body_part_id (face set 기반) attribute를 셰이더에서 직접 비교.
 * Y구간 휴리스틱 없이 Blender face set 경계 그대로 사용.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ── 부위 정의 ───────────────────────────────────────────
   body_part_id: GLB COLOR_0 R채널에 인코딩 (r = id/10)
   인체 위→아래 순서: 0=머리 1=흉부 2=팔 3=복부 4=신장·생식 5=다리
   (인접 부위가 인접 PID를 갖도록 배치해 face set 경계의 보간 round
    아티팩트가 인접 부위 사이에서만 떨어지게 함)                          */
const PART_NAMES = ['skull', 'head', 'arms', 'chest', 'abdomen', 'legs'];

/* ── 셰이더 mode → uniform 파라미터 ───────────────────────
   mode 0 = 전체(선택없음)  1 = 특정부위  3 = 피부(전체하이라이트) */
const PART_ZONE = {
  '':      { mode: 0.0, partId: -1.0 },
  skull:   { mode: 1.0, partId:  0.0 },  // 머리
  head:    { mode: 1.0, partId:  1.0 },  // 흉부
  arms:    { mode: 1.0, partId:  2.0 },  // 팔
  chest:   { mode: 1.0, partId:  3.0 },  // 복부
  abdomen: { mode: 1.0, partId:  4.0 },  // 신장·생식
  legs:    { mode: 1.0, partId:  5.0 },  // 다리
  skin:    { mode: 3.0, partId: -1.0 },
};

/* ── GLSL 버텍스 셰이더 ──────────────────────────────────
   color.r: GLB COLOR_0 R채널에 face set 기반 body_part_id 인코딩
   signedDist: CPU에서 매 선택마다 갱신되는 "선택부위 경계까지의 부호거리"
              (음수=선택부위 안쪽, 양수=바깥쪽, 단위는 mesh local) */
const VERTEX_SHADER = `
attribute vec3 color;
attribute float signedDist;
varying vec3  vWP;
varying vec3  vWN;
varying float vBodyPart;
varying float vSignedDist;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP      = wp.xyz;
  vWN      = normalize(mat3(modelMatrix) * normal);
  vBodyPart = color.r;
  vSignedDist = signedDist;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

/* ── GLSL 프래그먼트 셰이더 ──────────────────────────────
   vSignedDist: 선택 부위 경계까지의 부호 거리(world unit)
                음수 = 선택부위 안쪽, 양수 = 바깥쪽
   이 거리장에 fbm 노이즈를 더해 임계값을 넘기는 영역에 잉크를 칠하면
   경계는 자연히 흐트러지면서 잉크가 한지에 번지듯 보임. */
const FRAGMENT_SHADER = `
precision mediump float;
varying vec3  vWP;
varying vec3  vWN;
varying float vBodyPart;
varying float vSignedDist;

uniform float uMode;          // 0=전체 1=특정부위 3=피부전체
uniform float uSelectedPart;  // body_part_id 값 (0-5)
uniform float uBodyMesh;      // 1=body part 인코딩 있음, 0=일반 메시

const vec3 BASE = vec3(0.97, 0.97, 0.97);
const vec3 HL   = vec3(0.478, 0.416, 0.329);
const vec3 INK  = vec3(0.18,  0.14,  0.10);

float hash31(vec3 p){
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0 - 2.0*f);
  float n000 = hash31(i + vec3(0.0,0.0,0.0));
  float n100 = hash31(i + vec3(1.0,0.0,0.0));
  float n010 = hash31(i + vec3(0.0,1.0,0.0));
  float n110 = hash31(i + vec3(1.0,1.0,0.0));
  float n001 = hash31(i + vec3(0.0,0.0,1.0));
  float n101 = hash31(i + vec3(1.0,0.0,1.0));
  float n011 = hash31(i + vec3(0.0,1.0,1.0));
  float n111 = hash31(i + vec3(1.0,1.0,1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z);
}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++){
    v += a * vnoise(p);
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec3 n = normalize(vWN);

  vec3 key  = normalize(vec3( 1.5,  3.0,  2.0));
  vec3 fill = normalize(vec3(-2.0,  1.0, -1.0));
  vec3 rim  = normalize(vec3( 0.0,  2.0, -3.0));
  vec3 fill2= normalize(vec3( 2.0,  0.5, -2.0));
  vec3 lit  = vec3(0.52)
    + max(0.0, dot(n, key  )) * vec3(1.00, 0.96, 0.88) * 0.70
    + max(0.0, dot(n, fill )) * vec3(0.78, 0.83, 1.00) * 0.25
    + max(0.0, dot(n, fill2)) * vec3(0.90, 0.88, 0.85) * 0.15
    + max(0.0, dot(n, rim  )) * vec3(1.00, 0.85, 0.63) * 0.20;

  vec3 col = BASE * lit;

  if (uBodyMesh > 0.5 && uMode > 0.5) {
    if (uMode > 2.5) {
      // 피부 모드 — 전체 옅게 입힘
      col = mix(BASE, HL, 0.85) * lit;
    } else {
      // ── 잉크 번짐 하이라이트 ──────────────────────
      // 거리장에 더해줄 노이즈(world space). 단위는 거리장과 동일(world unit).
      float coarse = fbm(vWP * 8.0)         - 0.5;   // 큰 번짐
      float fine   = fbm(vWP * 22.0 + 5.7)  - 0.5;   // 잔결
      float wobble = coarse * 0.07 + fine * 0.025;

      // signed distance + 노이즈 흔들림. 음수일수록 잉크 짙음.
      float field = vSignedDist + wobble;

      // 두 단계 falloff. 음수 깊이로 들어갈수록 진해지고,
      //   양쪽 모두 노이즈로 들쭉날쭉한 잉크 끝선이 생김.
      float core = 1.0 - smoothstep(-0.045, 0.005, field);  // 진한 안쪽
      float wash = 1.0 - smoothstep(-0.020, 0.045, field);  // 바깥으로 새는 번짐

      // 한지 흡수 농담
      float wash2 = fbm(vWP * 3.2 - 2.1);
      float inkAmt = mix(wash * 0.55, 1.0, core);
      inkAmt *= mix(0.78, 1.0, wash2);

      vec3 inkCol = mix(HL, INK, core * 0.55);
      col = mix(col, inkCol * lit, clamp(inkAmt, 0.0, 1.0));
    }
  }

  gl_FragColor = vec4(col, 1.0);
}`;

/* ── Three.js 상태 ──────────────────────────────────────── */
let renderer = null, scene = null, camera = null;
let pivot    = null, model = null, meshes = [];
let modelMax = 2;
let sharedUniforms = null;
const bodyPartMeshes = new Set();   // body part 인코딩이 있는 메시만 추적
let rotating  = true, isReady = false;
let gender    = 'male', activePart = '';

/* ── 드래그 / 휠 상태 ───────────────────────────────────── */
let isDragging = false, dragMoved = false;
let lastMouseX = 0;
let pivotRotY = 0;   // 모델 Y축 회전각
let camDist   = 4;   // 카메라 거리 (줌)
let baseCamDist = 4; // 모델 로드시 기준 거리 (줌 범위 계산용)
let camPanY   = 0;   // 카메라 수직 오프셋

/* ── DOM ────────────────────────────────────────────────── */
let canvas, canvasWrap, loadingEl, labelEl;

/* ── 초기화 ──────────────────────────────────────────────── */
function init() {
  canvas    = document.getElementById('body3d-canvas');
  canvasWrap= document.getElementById('body3d-canvas-wrap');
  loadingEl = document.getElementById('body3d-loading');
  labelEl   = document.getElementById('body3d-selected-label');
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  pivot  = new THREE.Group();
  scene.add(pivot);

  const ro = new ResizeObserver(() => resizeRenderer());
  ro.observe(canvasWrap);
  resizeRenderer();

  canvasWrap.addEventListener('mouseleave', () => { rotating = !isDragging; isDragging = false; });

  /* 드래그로 회전 */
  canvasWrap.addEventListener('mousedown', e => {
    isDragging = true; dragMoved = false;
    lastMouseX = e.clientX;
    rotating = false;
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    if (Math.abs(dx) > 2) dragMoved = true;
    pivotRotY -= dx * 0.01;
    pivot.rotation.y = pivotRotY;
    lastMouseX = e.clientX;
  });
  window.addEventListener('mouseup', e => {
    if (isDragging && !dragMoved) onCanvasClick(e);
    isDragging = false;
  });

  /* 휠: 기본=회전 / Ctrl=줌 */
  canvasWrap.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      camDist = Math.max(baseCamDist / 1.2, Math.min(baseCamDist / 0.8, camDist + e.deltaY * 0.005));
      updateCamera();
    } else {
      pivotRotY += e.deltaY * 0.008;
      pivot.rotation.y = pivotRotY;
    }
  }, { passive: false });

  /* 터치 회전 */
  let lastTouchX = 0;
  canvasWrap.addEventListener('touchstart', e => {
    lastTouchX = e.touches[0].clientX;
    rotating = false;
  }, { passive: true });
  canvasWrap.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - lastTouchX;
    pivotRotY -= dx * 0.012;
    pivot.rotation.y = pivotRotY;
    lastTouchX = e.touches[0].clientX;
  }, { passive: true });

  canvasWrap.addEventListener('click', onCanvasClick);

  document.getElementById('body3d-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.body3d-chip');
    if (chip) selectPart(chip.dataset.part || '', 'chip');
  });

  document.querySelector('.body3d-gender-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('.body3d-gender-btn');
    if (!btn || btn.dataset.gender === gender) return;
    gender = btn.dataset.gender;
    document.querySelectorAll('.body3d-gender-btn').forEach(b =>
      b.classList.toggle('body3d-gender-btn--active', b.dataset.gender === gender)
    );
    loadModel(gender);
    document.dispatchEvent(new CustomEvent('body3dGenderChanged', { detail: { gender } }));
  });

  loadModel('male');
  document.dispatchEvent(new CustomEvent('body3dGenderChanged', { detail: { gender } }));
  animate();
}

function resizeRenderer() {
  if (!canvasWrap || !renderer || !camera) return;
  const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function updateCamera() {
  if (!camera) return;
  const targetY = modelMax * 0.5 + camPanY;
  camera.position.set(0, targetY, camDist);
  camera.lookAt(0, targetY, 0);
  camera.updateProjectionMatrix();
}

/* ── 거리장 precompute ────────────────────────────────────
   각 body part 메시에 대해, 모든 vertex의 "다른 PART 그룹별 최소 거리"
   배열을 계산해 geometry.userData.distFields[6]에 저장한다.
   선택이 바뀔 때마다 applySignedDist()로 signedDist 어트리뷰트를 갱신.
   계산 비용: O(N * sum(|partVerts|)) ≈ N². 인체 메시(N≈12k)에서 1~2초.  */
function precomputeDistFields(geometry) {
  const pos = geometry.attributes.position;
  const col = geometry.attributes.color;
  if (!pos || !col) return;
  const N = pos.count;
  const posArr = pos.array;

  const partOfVert = new Uint8Array(N);
  const partVerts  = [[], [], [], [], [], []];
  for (let i = 0; i < N; i++) {
    const pid = Math.round(col.getX(i) * 10);
    if (pid >= 0 && pid < 6) {
      partOfVert[i] = pid;
      partVerts[pid].push(i);
    } else {
      partOfVert[i] = 255;
    }
  }

  const distFields = new Array(6);
  for (let p = 0; p < 6; p++) {
    const arr = new Float32Array(N);
    const targets = partVerts[p];
    if (targets.length === 0) { arr.fill(1e6); distFields[p] = arr; continue; }
    const T = targets.length;
    for (let i = 0; i < N; i++) {
      const xi = posArr[3*i], yi = posArr[3*i+1], zi = posArr[3*i+2];
      let minD2 = Infinity;
      for (let k = 0; k < T; k++) {
        const j3 = 3 * targets[k];
        const dx = posArr[j3]   - xi;
        const dy = posArr[j3+1] - yi;
        const dz = posArr[j3+2] - zi;
        const d2 = dx*dx + dy*dy + dz*dz;
        if (d2 < minD2) minD2 = d2;
      }
      arr[i] = Math.sqrt(minD2);
    }
    distFields[p] = arr;
  }

  geometry.userData.partOfVert = partOfVert;
  geometry.userData.distFields = distFields;

  const sd = new Float32Array(N);
  sd.fill(1e6);
  geometry.setAttribute('signedDist', new THREE.BufferAttribute(sd, 1));
}

/* selectedPid에 맞춰 signedDist를 갱신.
   선택 부위 안쪽: -(다른부위까지 최소거리) (음수)
   선택 부위 바깥쪽: +(선택부위까지 최소거리) (양수)              */
function applySignedDist(geometry, selectedPid) {
  const distFields = geometry.userData.distFields;
  const partOfVert = geometry.userData.partOfVert;
  const attr = geometry.attributes.signedDist;
  if (!distFields || !partOfVert || !attr) return;
  const N = attr.count;
  const arr = attr.array;
  if (selectedPid < 0 || selectedPid > 5) {
    arr.fill(1e6);
  } else {
    const distToSel = distFields[selectedPid];
    for (let i = 0; i < N; i++) {
      if (partOfVert[i] === selectedPid) {
        let minOther = Infinity;
        for (let p = 0; p < 6; p++) {
          if (p === selectedPid) continue;
          const d = distFields[p][i];
          if (d < minOther) minOther = d;
        }
        arr[i] = -(minOther === Infinity ? 0 : minOther);
      } else {
        arr[i] = distToSel[i];
      }
    }
  }
  attr.needsUpdate = true;
}

/* ── body part 인코딩 감지 ──────────────────────────────────
   R = partId / 10 이므로 유효값은 0.0, 0.1, 0.2, 0.3, 0.4, 0.5 (6종).
   버텍스를 샘플링해 모두 이 범위·간격에 맞으면 body part 메시로 판정.  */
function detectBodyPartMesh(geometry) {
  const attr = geometry.attributes.color;
  if (!attr || attr.count === 0) return false;
  const stride = Math.max(1, Math.floor(attr.count / 80));
  for (let i = 0; i < attr.count; i += stride) {
    const r = attr.getX(i);
    if (r > 0.52) return false;                          // 유효 범위(0~0.5) 초과
    if (Math.abs(r * 10 - Math.round(r * 10)) > 0.08) return false;  // 불연속 간격 아님
  }
  return true;
}

/* ── GLB 로드 ────────────────────────────────────────────── */
function loadModel(g) {
  isReady = false;
  if (loadingEl) { loadingEl.textContent = '모델 로딩 중…'; loadingEl.classList.remove('hidden'); }

  if (model) {
    pivot.remove(model);
    model.traverse(o => {
      if (o.isMesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      }
    });
    model = null; meshes = []; sharedUniforms = null; bodyPartMeshes.clear();
  }

  new GLTFLoader().load(
    `asset/prescription/body_${g}.glb`,
    gltf => onModelLoaded(gltf),
    undefined,
    err => { console.error('[body3d] 로드 실패:', err); if (loadingEl) loadingEl.textContent = '모델 로드 실패'; }
  );
}

function onModelLoaded(gltf) {
  model = gltf.scene;

  /* 바운딩박스 → 위치 정렬 (발 y=0) */
  const box  = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const cent = box.getCenter(new THREE.Vector3());
  model.position.sub(cent);
  model.position.y += size.y / 2;
  pivot.add(model);


  modelMax      = size.y;

  /* 공유 uniform */
  sharedUniforms = {
    uMode:         { value: 0.0 },
    uSelectedPart: { value: -1.0 },
  };

  model.traverse(obj => {
    if (!obj.isMesh) return;
    meshes.push(obj);

    const isBodyMesh = detectBodyPartMesh(obj.geometry);
    if (isBodyMesh) {
      bodyPartMeshes.add(obj);
      precomputeDistFields(obj.geometry);
    }

    obj.material = new THREE.ShaderMaterial({
      vertexShader:   VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uMode:         sharedUniforms.uMode,
        uSelectedPart: sharedUniforms.uSelectedPart,
        uBodyMesh:     { value: isBodyMesh ? 1.0 : 0.0 },
      },
      transparent: false,
      depthWrite:  true,
      side:        THREE.FrontSide,
    });
  });

  console.log(`[body3d] body meshes: ${bodyPartMeshes.size} / ${meshes.length}`);

  /* 현재 선택 부위 유지 (성별 전환 시) */
  if (activePart) updateShaderMode(activePart);

  camDist    = size.y * 1.4;
  baseCamDist = camDist;
  camPanY    = 0;
  pivotRotY  = 0;
  pivot.rotation.y = 0;
  updateCamera();

  isReady = true;
  if (loadingEl) loadingEl.classList.add('hidden');
}

/* ── 애니메이션 루프 ────────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);
  const bv = document.getElementById('body-view');
  if (bv && bv.getAttribute('aria-hidden') === 'true') return;
  if (rotating && isReady) { pivotRotY += 0.006; pivot.rotation.y = pivotRotY; }
  if (renderer && scene && camera) renderer.render(scene, camera);
}

/* ── 클릭 → 부위 감지 ───────────────────────────────────── */
function onCanvasClick(e) {
  if (!isReady || !meshes.length) return;
  const rect = canvasWrap.getBoundingClientRect();
  const ndcX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

  const ray  = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const hits = ray.intersectObjects(meshes, true);
  if (!hits.length) return;

  const hit     = hits[0];
  const geom    = hit.object.geometry;
  const colAttr = geom.attributes.color;

  /* COLOR_0 R채널 → body_part_id (face set 기반, 정확한 경계) */
  if (bodyPartMeshes.has(hit.object) && colAttr && hit.faceIndex !== undefined) {
    const vertIdx = geom.index
      ? geom.index.getX(hit.faceIndex * 3)
      : hit.faceIndex * 3;
    const r   = colAttr.getX(vertIdx);
    const pid = Math.round(r * 10);
    if (pid >= 0 && pid < PART_NAMES.length) {
      selectPart(PART_NAMES[pid], 'raycast');
      return;
    }
  }
}

/* ── 셰이더 uniform 업데이트 ─────────────────────────────── */
function updateShaderMode(partId) {
  if (!sharedUniforms) return;
  const z = PART_ZONE[partId] || PART_ZONE[''];
  sharedUniforms.uMode.value         = z.mode;
  sharedUniforms.uSelectedPart.value = z.partId;
  // 거리장 어트리뷰트 갱신 (특정부위 모드일 때만 의미있음)
  const sel = (z.mode > 0.5 && z.mode < 2.5) ? z.partId : -1;
  bodyPartMeshes.forEach(m => applySignedDist(m.geometry, sel));
}

/* ── 부위 선택 ───────────────────────────────────────────── */
const PART_LABELS = {
  '':      '전체 처방',
  head:    '흉부 처방',
  chest:   '복부 처방',
  abdomen: '신장·생식 처방',
  arms:    '팔 처방',
  legs:    '다리 처방',
  skull:   '머리 처방',
  skin:    '피부·기타 처방',
};

let _toastHideTimer = null;
function showPartToast(text) {
  if (!labelEl) return;
  labelEl.textContent = text;
  labelEl.classList.remove('visible');
  // 강제 reflow로 재진입 애니메이션 트리거
  void labelEl.offsetWidth;
  labelEl.classList.add('visible');
  if (_toastHideTimer) clearTimeout(_toastHideTimer);
  _toastHideTimer = setTimeout(() => {
    labelEl.classList.remove('visible');
    _toastHideTimer = null;
  }, 1800);
}

function selectPart(partId, source) {
  activePart = partId;

  document.getElementById('body3d-chips')?.querySelectorAll('.body3d-chip').forEach(c =>
    c.classList.toggle('body3d-chip--active', c.dataset.part === partId)
  );

  if (labelEl) {
    if (partId) {
      showPartToast(PART_LABELS[partId] || partId);
    } else {
      labelEl.classList.remove('visible');
      if (_toastHideTimer) { clearTimeout(_toastHideTimer); _toastHideTimer = null; }
    }
  }

  updateShaderMode(partId);

  document.dispatchEvent(new CustomEvent('body3dPartSelected', {
    detail: { partId, label: PART_LABELS[partId] || '' }
  }));
}

/* ── 처방 탭 활성화 감지 ─────────────────────────────────── */
let _inited = false;
function tryInit() {
  const bv = document.getElementById('body-view');
  if (!bv) return;
  new MutationObserver(() => {
    if (bv.getAttribute('aria-hidden') === 'false' && !_inited) { _inited = true; init(); }
  }).observe(bv, { attributes: true, attributeFilter: ['aria-hidden'] });
  if (bv.getAttribute('aria-hidden') === 'false') { _inited = true; init(); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInit);
else tryInit();
