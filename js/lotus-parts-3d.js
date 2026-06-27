/**
 * 한 약재, 여러 쓰임 — 연(蓮) 부위별 3D 뷰어
 * asset/glb/lotus-main-parts.glb 의 5개 존(flower/core/leaf/stem/root) 위에
 * 『동의보감』 연(蓮) 부위 8가지를 얹어, 자동 순환·클릭·일러스트 레일로
 * 부위별 쓰임을 보여준다. 존은 높이 절단이 아니라 식물 구조(꽃잎/화탁/
 * 잎블레이드/줄기/뿌리줄기) 기준으로 해부학적으로 분리돼 있다.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ── GLB 3D 존(노드 이름) — 강조·앵커·레이캐스트의 기준 ──
   flower(꽃잎) / core(꽃 중심 화탁=씨방부) / leaf(잎 블레이드) /
   stem(잎·꽃자루 줄기 전체) / root(뿌리줄기).
   leaf·stem 은 PCA 기반(선형=줄기 vs 평면=잎)으로 재분리해, 잎이 더 이상
   줄기 일부를 끌고 오지 않는다. core 는 꽃 중심을 방사형으로 분리한 존. */
const ZONES = ['flower', 'core', 'leaf', 'stem', 'root'];

/* ── 동의보감 연(蓮) 부위별 쓰임 — 10부위 ────────────────────
   사용자 제공 데이터(연 부위별 약재) 기준. desc 는 동의보감 교차확인 문구가
   있으면 그것을, 없으면 일반 본초 효능(eff)을 카드에 쓴다. eff 는 갈래 주석용
   짧은 효능. 씨앗/땅속줄기/잎은 각각 통째(whole)·속/마디/꼭지(inner)로 나뉘어
   상세 모델 안에서 두 갈래로 설명된다. */
const PARTS = [
  'flower', 'stamen', 'receptacle', 'seed', 'plumule',
  'leaf', 'leafbase', 'stem', 'rhizome', 'node',
];

const PART_INFO = {
  flower: {
    zone: 'flower', label: '연화',
    name: '연화 蓮花', sub: '꽃 · Nelumbinis Flos',
    eff:  '마음을 진정시키고 몸을 가볍게 하며 얼굴을 늙지 않게 함',
    desc: '성질은 따뜻하고 독이 없다. 마음을 진정시키고 몸을 가볍게 하며 얼굴을 늙지 않게 한다. 향에 넣으면 매우 오묘하다.',
    img:  'asset/multiple-uses/lotus-flower.png',
  },
  stamen: {
    zone: 'core', label: '연수',
    name: '연수 蓮鬚', sub: '수술 · Nelumbinis Stamen',
    eff:  '몽정·유정을 멎게 하고 토혈·자궁출혈·대하·이질에 씀',
    desc: '꽃술(연화예)은 정을 단단히 지켜 몽정·유정을 멎게 하고, 토혈·자궁출혈·대하·이질에 썼다.',
    img:  'asset/multiple-uses/lotus-stamen.png',
  },
  receptacle: {
    zone: 'core', label: '연방',
    name: '연방 蓮房', sub: '꽃받침(열매집) · Nelumbinis Receptaculum',
    eff:  '자궁출혈·월경과다·대변출혈을 멎게 하고 치질·탈항·악창에 씀',
    desc: '꽃이 진 뒤 씨앗이 박히는 열매집. 자궁출혈·월경과다·대변출혈을 멎게 하고 치질·탈항·악창에 썼다.',
    img:  'asset/multiple-uses/lotus-receptacle.png',
  },
  seed: {
    zone: 'core', label: '연자육',
    name: '연자육 蓮子肉', sub: '씨앗(살) · Nelumbinis Semen',
    eff:  '기력을 기르고 오장을 보하며, 갈증·이질을 멎게 하고 마음을 안정시킴',
    desc: '성질은 평하고 차며 맛은 달고 독이 없다. 기력을 길러 온갖 병을 없애고 오장을 보하며, 갈증과 이질을 멎게 하고 신을 보하여 마음을 안정시킨다.',
    img:  'asset/multiple-uses/Nelumbo-nucifera-seed.png',
  },
  plumule: {
    zone: 'core', label: '연자심',
    name: '연자심 蓮子心', sub: '씨앗 속 배아 · Nelumbinis Plumula',
    eff:  '열을 내리고 번민·불안을 가라앉히며 토혈·유정을 멎게 함',
    desc: '연밥 속의 푸른 심(배아). 열을 내려 번민과 불안을 가라앉히고 토혈·유정을 멎게 한다.',
    img:  'asset/multiple-uses/lotus-plumule.png',
  },
  leaf: {
    zone: 'leaf', label: '하엽',
    name: '하엽 荷葉', sub: '잎 · Nelumbinis Folium',
    eff:  '갈증을 멎게 하고 더위와 습을 다스리며 혈창을 풀고 지혈함',
    desc: '갈증을 멎게 하고 태반이 나오게 하며 버섯 중독을 풀어준다. 어혈로 배가 부르거나 가슴이 답답하고 배가 아픈 혈창에 주로 쓴다.',
    img:  'asset/multiple-uses/lotus-leaf.png',
  },
  leafbase: {
    zone: 'leaf', label: '하엽체',
    name: '하엽체 荷葉蒂', sub: '잎 꼭지 · Nelumbinis Folii Basis',
    eff:  '태를 안정시키고 출혈을 멎게 함',
    desc: '잎이 줄기에 붙는 중심부(하비). 태를 안정시키고 출혈을 멎게 했다.',
    img:  'asset/multiple-uses/lotus-leaf-base.png',
  },
  stem: {
    zone: 'stem', label: '하경',
    name: '하경 荷梗', sub: '잎자루·꽃자루 · Nelumbinis Caulis',
    eff:  '더위와 습을 다스리고 기를 통하게 해 가슴 답답함을 뚫어줌',
    desc: '잎자루·꽃자루(줄기). 더위와 습을 다스리고 기를 통하게 하여 가슴 답답함을 뚫어준다.',
    img:  'asset/multiple-uses/lotus-stem.png',
  },
  rhizome: {
    zone: 'root', label: '연근',
    name: '연근 蓮根 · 藕', sub: '땅속줄기 · Nelumbinis Rhizoma',
    eff:  '술독·음식독을 풀고, 쪄 먹으면 하초를 튼튼히 함',
    desc: '술독과 음식의 독을 풀어준다. 생으로 또는 쪄서 먹으며, 쪄 먹으면 하초를 튼튼히 한다.',
    img:  'asset/multiple-uses/lotus-rhizome.png',
  },
  node: {
    zone: 'root', label: '우절',
    name: '우절 藕節', sub: '땅속줄기 마디 · Nelumbinis Rhizomatis Nodus',
    eff:  '각혈·토혈·코피·대소변·자궁출혈 등 각종 출혈을 멎게 함',
    desc: '땅속줄기의 마디. 각혈·토혈·코피·대소변 출혈·자궁출혈 등 각종 출혈을 멎게 하는 약으로 썼다.',
    img:  'asset/multiple-uses/lotus-root-node.png',
  },
};

/* 존 클릭 시 보여줄 대표 부위. core→연자육, root→연근(둘 다 상세 모델 보유) */
const ZONE_PRIMARY = { flower: 'flower', core: 'seed', leaf: 'leaf', stem: 'stem', root: 'rhizome' };

/* 부위 → 3D 존 */
const partZone = part => (PART_INFO[part] ? PART_INFO[part].zone : '');

/* ── 부위 상세 GLB (클릭 시 우측 보조 뷰어에 표시) ────────────
   씨앗·땅속줄기·잎은 통째/속의 두 갈래로 나뉜다. 상세 모델 안에서 각 갈래를
   가리키는 점선이 뻗고, 끝에 그 부위의 이름·효능 설명이 붙는다.
   pos 는 모델 정규화(최대변=2, 중심 원점) 좌표. rot 은 정지 시 초기 회전. */
const DETAIL_SETS = {
  seed: {
    path: 'asset/glb/lotus-seed.glb', rot: [0.05, -0.25, 0], offset: [0, 0],
    branches: [
      { part: 'seed',    pos: [ 0.58,  0.45, 0.12] },   // 연자육 = 씨살(바깥 몸통)
      { part: 'plumule', pos: [ 0.00, -0.05, 0.42] },   // 연자심 = 가운데 갈라진 배아
    ],
  },
  root: {
    path: 'asset/glb/lotus-root.glb', rot: [0.0, -0.5, 0.15], offset: [0, 0],
    branches: [
      { part: 'rhizome', pos: [ 0.20,  0.45, 0.18] },   // 연근 = 통통한 마디 몸통
      { part: 'node',    pos: [ 0.00, -0.30, 0.18] },   // 우절 = 잘록한 마디
    ],
  },
  leaf: {
    path: 'asset/glb/lotus-leaf.glb', rot: [0.55, -0.35, 0], offset: [0, 0], spin: 0.005,
    branches: [
      { part: 'leaf',     pos: [ 0.55,  0.45, 0.30] },  // 하엽 = 잎 블레이드
      { part: 'leafbase', pos: [ 0.00, -0.35, 0.00] },  // 하엽체 = 잎 꼭지(중심)
    ],
  },
};
/* 부위 → 상세 세트 키 */
const PART_DETAIL = {
  seed: 'seed', plumule: 'seed',
  rhizome: 'root', node: 'root',
  leaf: 'leaf', leafbase: 'leaf',
};

/* ── 분할쌍 연동 ─────────────────────────────────────────────
   씨앗(연자육·연자심)·잎(하엽·하엽체)·땅속줄기(연근·우절)는 버튼은 각자
   2개(이미지·이름)지만, 둘 중 아무거나 눌러도 같이 켜지고(같은 상세 표시),
   자동 순환에서도 한 묶음으로 다룬다. */
const PAIR_GROUPS = {
  seed:    ['seed', 'plumule'],
  leaf:    ['leaf', 'leafbase'],
  rhizome: ['rhizome', 'node'],
};
const groupMembers = {};   // part → 같은 묶음의 부위들
const groupPrimary = {};   // part → 묶음 대표(자동순환 기준)
PARTS.forEach(p => { groupMembers[p] = [p]; groupPrimary[p] = p; });
Object.entries(PAIR_GROUPS).forEach(([prim, members]) =>
  members.forEach(m => { groupMembers[m] = members; groupPrimary[m] = prim; }));

/* 자동 순환은 묶음 대표만 (분할쌍은 한 번씩) */
const CYCLE_ORDER = ['flower', 'stamen', 'receptacle', 'seed', 'leaf', 'stem', 'rhizome'];
const cycleIndexOf = part => CYCLE_ORDER.indexOf(groupPrimary[part] || part);

/* ── three 상태 ─────────────────────────────────────────── */
let renderer, scene, camera, pivot, model;
let isReady = false;
let activePart = '';

const partGroups = {};   // zone → 존 루트 Object3D
const partMats   = {};   // zone → material
const anchorLocal = {};  // zone → 존 anchor (존 그룹 local 좌표)

let modelMaxDim = 2;

/* ── 인터랙션 상태 ──────────────────────────────────────── */
let rotating = true;
let isDragging = false, dragMoved = false, lastX = 0;
let pivotRotY = 0;
let camDist = 4;

/* ── 자동 순환(부위 설명) 상태 ──────────────────────────── */
const AUTO_INTERVAL = 5000;   // 5초마다 다음 부위로 전환
const RESUME_DELAY  = 8000;   // 클릭 후 이 시간만큼 멈췄다가 다시 순환
let autoTimer   = null;
let resumeTimer = null;
let autoIndex = 0;
let autoPlaying = false;

function startAutoCycle() {
  if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
  if (autoTimer) return;
  autoPlaying = true;
  autoTimer = setInterval(() => {
    autoIndex = (autoIndex + 1) % CYCLE_ORDER.length;
    selectPart(CYCLE_ORDER[autoIndex], 'auto');
  }, AUTO_INTERVAL);
}

/* scheduleResume=true 면 RESUME_DELAY 후 자동 순환을 재개한다 */
function stopAutoCycle(scheduleResume = false) {
  autoPlaying = false;
  if (autoTimer)   { clearInterval(autoTimer); autoTimer = null; }
  if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
  if (scheduleResume) {
    resumeTimer = setTimeout(() => { resumeTimer = null; startAutoCycle(); }, RESUME_DELAY);
  }
}

/* 모델 좌측 배치 오프셋 (월드 X) */
let pivotShiftX = 0;

/* ── DOM ────────────────────────────────────────────────── */
let stage, canvas, canvasWrap, loadingEl, leaderSvg, leaderLine, leaderDot, infoEl, hintEl, cardEl;
let cardName, cardSub, cardDesc, cardImg;
let leaderTargetEl = null;   // 메인 리더선이 가리킬 대상(카드/상세 패널)
let railEl;
const railBtns = {};   // part → 레일 버튼 요소

/* ── 상세 GLB 보조 뷰어 상태 ────────────────────────────── */
let detailEl, detailStage, detailCanvas, detailLoadingEl, detailLeaderSvg, detailCallouts;
let detailRenderer, detailScene, detailCamera, detailPivot;
let detailCurrent = null;       // 현재 마운트된 모델 그룹
let detailReqToken = 0;         // 비동기 로드 경합 방지
let detailRotY = 0;             // 누적 회전(자동 회전)
let detailSpin = 0.008;         // 프레임당 회전 속도(세트별, 기본 0.008 · leaf 는 느리게)
let detailBaseRot = [0, 0, 0];  // 초기 기울기(X·Z 고정, Y는 회전 기준)
const detailCache = {};         // path → THREE.Group
let detailBranches = [];        // [{ pos:Vector3, line, dot, callout }]

/* ── 초기화 ─────────────────────────────────────────────── */
function init() {
  stage      = document.getElementById('lotus-stage');
  canvas     = document.getElementById('lotus-canvas');
  canvasWrap = document.getElementById('lotus-canvas-wrap');
  loadingEl  = document.getElementById('lotus-loading');
  leaderSvg  = document.getElementById('lotus-leader');
  infoEl     = document.getElementById('lotus-info');
  if (!canvas || !canvasWrap) return;

  leaderLine = leaderSvg.querySelector('.lotus-leader-line');
  leaderDot  = leaderSvg.querySelector('.lotus-leader-dot');
  hintEl     = document.getElementById('lotus-info-hint');
  cardEl     = document.getElementById('lotus-info-card');
  cardName   = cardEl.querySelector('.lotus-info-name');
  cardSub    = cardEl.querySelector('.lotus-info-sub');
  cardDesc   = cardEl.querySelector('.lotus-info-desc');
  cardImg    = cardEl.querySelector('.lotus-info-img');
  railEl     = document.getElementById('lotus-rail');
  buildRail();
  initDetailViewer();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  pivot  = new THREE.Group();
  scene.add(pivot);

  /* 라이팅 (한지 톤) — 그늘진 면도 어둡지 않게 균일광을 충분히 */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc4ccc2, 1.85));
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.85);
  fill.position.set(-4, 1, -3);
  scene.add(fill);

  const ro = new ResizeObserver(() => resizeRenderer());
  ro.observe(canvasWrap);
  resizeRenderer();

  /* 드래그 회전 / 클릭 선택 */
  canvasWrap.addEventListener('mousedown', e => {
    isDragging = true; dragMoved = false; lastX = e.clientX; rotating = false;
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    if (Math.abs(dx) > 2) dragMoved = true;
    pivotRotY -= dx * 0.01; pivot.rotation.y = pivotRotY; lastX = e.clientX;
  });
  window.addEventListener('mouseup', e => {
    if (isDragging && !dragMoved) onCanvasClick(e);
    isDragging = false;
  });

  /* 휠: 기본=회전 / Ctrl=줌 */
  canvasWrap.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      camDist = Math.max(modelMaxDim * 1.0, Math.min(modelMaxDim * 2.6, camDist + e.deltaY * 0.005));
      updateCamera();
    } else {
      pivotRotY += e.deltaY * 0.008; pivot.rotation.y = pivotRotY;
    }
  }, { passive: false });

  /* 터치 회전 */
  let lastTouchX = 0;
  canvasWrap.addEventListener('touchstart', e => { lastTouchX = e.touches[0].clientX; rotating = false; }, { passive: true });
  canvasWrap.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - lastTouchX;
    pivotRotY -= dx * 0.012; pivot.rotation.y = pivotRotY; lastTouchX = e.touches[0].clientX;
  }, { passive: true });

  loadModel();
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
  camera.position.set(0, 0, camDist);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

/* ── 부위 일러스트 레일 (모든 부위를 한눈에·클릭으로 이동) ── */
function buildRail() {
  if (!railEl) return;
  railEl.innerHTML = '';
  PARTS.forEach(part => {
    const info = PART_INFO[part];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lotus-rail-item';
    btn.dataset.part = part;
    /* 분할쌍은 한 묶음으로 보이도록 그룹 표시 */
    if (groupMembers[part].length > 1) {
      btn.classList.add('lotus-rail-item--pair');
      if (part === groupMembers[part][0]) btn.classList.add('lotus-rail-item--pair-start');
      if (part === groupMembers[part][groupMembers[part].length - 1]) btn.classList.add('lotus-rail-item--pair-end');
    }
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('aria-label', `${info.label} ${info.name}`);

    const fig = document.createElement('span');
    fig.className = 'lotus-rail-fig';
    if (info.img) {
      const im = document.createElement('img');
      im.src = info.img; im.alt = ''; im.loading = 'lazy';
      fig.appendChild(im);
    }
    const cap = document.createElement('span');
    cap.className = 'lotus-rail-cap';
    cap.textContent = info.label;

    btn.append(fig, cap);
    btn.addEventListener('click', () => {
      stopAutoCycle(true);          // 클릭하면 자동 순환 잠시 멈춤 → 재개
      selectPart(part, 'rail');
    });
    railEl.appendChild(btn);
    railBtns[part] = btn;
  });
}

/* 레일 active 상태 동기화 — 분할쌍은 두 버튼이 같이 켜진다 */
function syncRail(part) {
  const members = groupMembers[part] || [part];
  PARTS.forEach(p => {
    const b = railBtns[p];
    if (b) b.setAttribute('aria-selected', members.includes(p) ? 'true' : 'false');
  });
}

/* ── 상세 GLB 보조 뷰어 (씨앗·땅속줄기·잎의 두 갈래 설명) ────
   부위 선택 시, 우측에 상세 3D가 정지 상태로 뜨고 모델 위·아래로 두 갈래
   점선이 뻗어 각 갈래 끝의 설명 박스(이름+효능)로 이어진다. */
const SVGNS = 'http://www.w3.org/2000/svg';
function initDetailViewer() {
  detailEl       = document.getElementById('lotus-detail');
  detailStage    = document.getElementById('lotus-detail-stage');
  detailCanvas   = document.getElementById('lotus-detail-canvas');
  detailLoadingEl= document.getElementById('lotus-detail-loading');
  detailLeaderSvg= document.getElementById('lotus-detail-leader');
  detailCallouts = [
    document.getElementById('lotus-detail-callout-0'),
    document.getElementById('lotus-detail-callout-1'),
  ];
  if (!detailEl || !detailCanvas) return;

  detailRenderer = new THREE.WebGLRenderer({ canvas: detailCanvas, antialias: true, alpha: true });
  detailRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  detailRenderer.outputColorSpace = THREE.SRGBColorSpace;

  detailScene  = new THREE.Scene();
  detailCamera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
  /* 모델(최대변=2로 정규화)을 키워 다른 부위(연화·연수 등)와 무게를 맞춘다.
     z=4.4 에서도 가로폭(±1)이 가시폭(±2.5 이상)에 한참 못 미쳐 안 잘린다.
     앵커는 매 프레임 카메라로 재투영하므로 정합 유지 */
  detailCamera.position.set(0, 0, 4.4);
  detailPivot  = new THREE.Group();
  detailScene.add(detailPivot);
  detailScene.add(new THREE.HemisphereLight(0xffffff, 0xc4ccc2, 1.85));
  detailScene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const k = new THREE.DirectionalLight(0xffffff, 1.25); k.position.set(3, 5, 4); detailScene.add(k);
  const f = new THREE.DirectionalLight(0xffffff, 0.85); f.position.set(-4, 1, -3); detailScene.add(f);

  new ResizeObserver(() => resizeDetail()).observe(detailStage);
}

function resizeDetail() {
  if (!detailRenderer || !detailStage || detailEl.hidden) return;
  const w = detailStage.clientWidth, h = detailStage.clientHeight;
  if (!w || !h) return;
  detailRenderer.setSize(w, h, false);
  detailCamera.aspect = w / h;
  detailCamera.updateProjectionMatrix();
}

function showDetailLoading(on) {
  if (detailLoadingEl) detailLoadingEl.classList.toggle('hidden', !on);
}

/* 부위 선택 시: 상세 세트가 있으면 보조 뷰어 표시, 없으면 숨김.
   반환 true 면 카드의 정지 이미지는 숨긴다(상세 3D가 대신). */
function updateDetail(part) {
  if (!detailEl) return false;
  const key = part && PART_DETAIL[part];
  const set = key && DETAIL_SETS[key];
  if (!set) {
    detailEl.hidden = true;
    if (detailCurrent) { detailPivot.remove(detailCurrent); detailCurrent = null; }
    setDetailBranches(null, null);
    detailReqToken++;          // 진행 중 로드 무효화
    return false;
  }
  detailEl.hidden = false;
  detailSpin = set.spin ?? 0.008;   // leaf 는 느리게(0.005), 그 외 기본
  setDetailBranches(set.branches, set.rot);
  resizeDetail();
  loadDetail(set.path, set.rot, set.offset);
  return true;
}

/* 두 갈래 설명 박스 + 점선 요소 구성 */
function setDetailBranches(branches, rot) {
  detailBranches = [];
  if (!detailLeaderSvg) return;
  while (detailLeaderSvg.firstChild) detailLeaderSvg.removeChild(detailLeaderSvg.firstChild);
  const on = !!(branches && branches.length);
  detailLeaderSvg.classList.toggle('lotus-detail-leader--on', on);
  detailCallouts.forEach(c => { if (c) c.hidden = true; });
  if (!on) return;
  branches.forEach((b, i) => {
    const info = PART_INFO[b.part] || {};
    const callout = detailCallouts[i];
    if (callout) {
      callout.hidden = false;
      callout.innerHTML = '';
      /* 연화 카드처럼: 컬러 이미지 + 이름 + 학문명(sub) + 내용 */
      if (info.img) {
        const im = document.createElement('img');
        im.className = 'lotus-detail-callout-img';
        im.src = info.img; im.alt = info.label || ''; im.loading = 'lazy';
        callout.appendChild(im);
      }
      const txt = document.createElement('div');
      txt.className = 'lotus-detail-callout-text';
      const h  = document.createElement('h4'); h.className  = 'lotus-detail-callout-name'; h.textContent  = info.name || b.part;
      const sb = document.createElement('p');  sb.className = 'lotus-detail-callout-sub';  sb.textContent = info.sub || '';
      const p  = document.createElement('p');  p.className  = 'lotus-detail-callout-eff';  p.textContent  = info.desc || info.eff || '';
      txt.append(h, sb, p);
      callout.appendChild(txt);
    }
    const line = document.createElementNS(SVGNS, 'polyline'); line.setAttribute('class', 'lotus-detail-line');
    const dot  = document.createElementNS(SVGNS, 'circle');   dot.setAttribute('class', 'lotus-detail-dot'); dot.setAttribute('r', '3.2');
    detailLeaderSvg.append(line, dot);
    detailBranches.push({ pos: new THREE.Vector3(b.pos[0], b.pos[1], b.pos[2]), line, dot, callout });
  });
}

function loadDetail(path, rot, offset) {
  const token = ++detailReqToken;
  if (detailCache[path]) { mountDetail(detailCache[path], token, rot, offset); return; }
  showDetailLoading(true);
  new GLTFLoader().load(path, gltf => {
    const m = gltf.scene;
    const box  = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    /* 바운딩박스 중심이 아니라 정점 무게중심(시각적 덩어리)으로 정렬 —
       비대칭 모델(잎+잎자루, 마디 줄기)이 한쪽으로 치우치지 않게 */
    m.updateWorldMatrix(true, true);
    const cent = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    let count = 0;
    m.traverse(o => {
      const pos = o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position;
      if (!pos) return;
      const step = pos.count > 60000 ? Math.ceil(pos.count / 60000) : 1;   // 큰 메시는 샘플링
      for (let i = 0; i < pos.count; i += step) {
        tmp.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        cent.add(tmp); count++;
      }
    });
    if (count) cent.divideScalar(count); else box.getCenter(cent);
    m.position.sub(cent);
    m.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const mat = o.material;
      if (mat.map) mat.map = null;
      mat.color?.setHex(0xe2e4df);
      if (mat.roughness !== undefined) mat.roughness = 0.85;
      if (mat.metalness !== undefined) mat.metalness = 0.0;
      mat.needsUpdate = true;
    });
    const wrap = new THREE.Group();
    wrap.add(m);
    wrap.userData.maxDim = Math.max(size.x, size.y, size.z) || 1;
    detailCache[path] = wrap;
    mountDetail(wrap, token, rot, offset);
  }, undefined, err => {
    console.error('[lotus3d] 상세 모델 로드 실패:', path, err);
    showDetailLoading(false);
  });
}

function mountDetail(wrap, token, rot, offset) {
  if (token !== detailReqToken) return;   // 그 사이 다른 부위로 바뀜
  showDetailLoading(false);
  if (detailCurrent && detailCurrent !== wrap) detailPivot.remove(detailCurrent);
  /* 크기 정규화: 최대 변을 2로 맞춰 카메라 프레이밍 일정하게 */
  const s = 2 / (wrap.userData.maxDim || 1);
  wrap.scale.setScalar(s);
  if (detailCurrent !== wrap) detailPivot.add(wrap);
  /* 화면 중앙 정렬용 오프셋 */
  detailPivot.position.set(offset ? offset[0] : 0, offset ? offset[1] : 0, 0);
  /* 초기 기울기 + Y축 자동 회전 시작 */
  detailBaseRot = rot ? [rot[0], rot[1], rot[2]] : [0, 0, 0];
  detailRotY = 0;
  detailPivot.rotation.set(detailBaseRot[0], detailBaseRot[1], detailBaseRot[2]);
  detailCurrent = wrap;
}

/* 두 갈래 점선을 모델 앵커 → 설명 박스로 잇기 (매 프레임) */
const _dv = new THREE.Vector3();
function updateDetailLeader() {
  if (!detailBranches.length || !detailEl || detailEl.hidden) return;
  /* 절대배치(스테이지=뒤, 설명=앞) 라 offset 대신 화면 사각형으로 패널 좌표 계산 */
  const panel = detailEl.getBoundingClientRect();
  const stage = detailStage.getBoundingClientRect();
  if (!panel.width || !stage.width) return;
  detailLeaderSvg.setAttribute('viewBox', `0 0 ${panel.width} ${panel.height}`);
  detailLeaderSvg.setAttribute('width', panel.width);
  detailLeaderSvg.setAttribute('height', panel.height);
  detailBranches.forEach((b) => {
    _dv.copy(b.pos);
    detailPivot.localToWorld(_dv);
    _dv.project(detailCamera);
    const px = (stage.left - panel.left) + ( _dv.x * 0.5 + 0.5) * stage.width;
    const py = (stage.top  - panel.top ) + (-_dv.y * 0.5 + 0.5) * stage.height;
    b.dot.setAttribute('cx', px); b.dot.setAttribute('cy', py);
    /* 오른쪽 설명 박스의 왼쪽 가장자리·세로 중앙으로 연결 */
    let cx = panel.width - 8, cy = py;
    if (b.callout && !b.callout.hidden) {
      const c = b.callout.getBoundingClientRect();
      cx = (c.left - panel.left) - 4;
      cy = (c.top - panel.top) + c.height / 2;
    }
    b.line.setAttribute('points', `${px},${py} ${cx},${cy}`);
  });
}

/* ── 모델 로드 ──────────────────────────────────────────── */
function loadModel() {
  if (loadingEl) { loadingEl.textContent = '모델 로딩 중…'; loadingEl.classList.remove('hidden'); }
  new GLTFLoader().load(
    'asset/glb/lotus-main-parts.glb',
    onModelLoaded,
    undefined,
    err => { console.error('[lotus3d] 로드 실패:', err); if (loadingEl) loadingEl.textContent = '모델 로드 실패'; }
  );
}

function onModelLoaded(gltf) {
  model = gltf.scene;

  /* 원점 정렬 (중심을 0,0,0 으로) */
  const box  = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const cent = box.getCenter(new THREE.Vector3());
  model.position.sub(cent);
  pivot.add(model);
  pivot.updateMatrixWorld(true);   // anchor(worldToLocal) 계산 전 월드행렬 갱신
  modelMaxDim = Math.max(size.x, size.y, size.z);

  /* 존 그룹 / 머티리얼 / anchor 수집 */
  model.traverse(obj => {
    if (ZONES.includes(obj.name) && !partGroups[obj.name]) {
      partGroups[obj.name] = obj;
    }
  });

  ZONES.forEach(name => {
    const grp = partGroups[name];
    if (!grp) return;
    grp.traverse(o => {
      if (o.isMesh && !partMats[name]) {
        partMats[name] = o.material;
        o.material.transparent = false;
        /* 연한 그레이 톤으로 통일 */
        if (o.material.map) o.material.map = null;
        o.material.color?.setHex(0xe2e4df);
        if (o.material.metalness !== undefined) o.material.metalness = 0.0;
        if (o.material.roughness !== undefined) o.material.roughness = 0.85;
        o.material.needsUpdate = true;
      }
    });
    /* anchor = 부위 바운딩박스 중심을 그룹 local 좌표로 보관 */
    const pbox = new THREE.Box3().setFromObject(grp);
    const pc   = pbox.getCenter(new THREE.Vector3());
    anchorLocal[name] = grp.worldToLocal(pc.clone());
  });

  /* 모델을 좌측으로 이동 (설명 영역 공간 확보) */
  pivotShiftX = -modelMaxDim * 0.10;
  pivot.position.x = pivotShiftX;

  camDist = modelMaxDim * 1.55;
  pivotRotY = 0; pivot.rotation.y = 0;
  updateCamera();

  isReady = true;
  if (loadingEl) loadingEl.classList.add('hidden');

  /* 첫 부위 표시 후 자동 순환 시작 */
  autoIndex = 0;
  selectPart(CYCLE_ORDER[autoIndex], 'auto');
  startAutoCycle();
}

/* ── 애니메이션 루프 ────────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);
  const dv = document.getElementById('data-view');
  if (dv && dv.getAttribute('aria-hidden') === 'true') return;
  if (rotating && isReady) { pivotRotY += 0.004; pivot.rotation.y = pivotRotY; }
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (activePart) updateLeader();

  /* 상세 보조 뷰어 (보일 때만 자동 회전 + 렌더 + 갈래 점선 갱신) */
  if (detailRenderer && detailCurrent && detailEl && !detailEl.hidden) {
    detailRotY += detailSpin;
    detailPivot.rotation.set(detailBaseRot[0], detailBaseRot[1] + detailRotY, detailBaseRot[2]);
    detailRenderer.render(detailScene, detailCamera);
    updateDetailLeader();
  }
}

/* ── 클릭 → 부위 감지 ───────────────────────────────────── */
function onCanvasClick(e) {
  if (!isReady) return;
  const rect = canvasWrap.getBoundingClientRect();
  const ndcX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const hits = ray.intersectObject(model, true);
  if (!hits.length) return;   // 배경 클릭은 무시 — 현재 선택을 유지한다
  /* 부모를 거슬러 올라가며 존 이름 탐색 → 존의 대표 부위 선택 */
  let o = hits[0].object;
  while (o && !ZONES.includes(o.name)) o = o.parent;
  const part = o ? (ZONE_PRIMARY[o.name] || '') : '';
  if (!part) return;          // 빈 영역이면 선택 유지
  stopAutoCycle(true);        // 부위를 실제로 눌렀을 때만 자동 순환 정지→재개
  selectPart(part, 'raycast');
}

/* ── 부위 선택 ──────────────────────────────────────────── */
function selectPart(part, source) {
  activePart = PART_INFO[part] ? part : '';

  /* 자동 순환 인덱스 동기화 (묶음 대표 기준) */
  if (activePart) { const ci = cycleIndexOf(activePart); if (ci >= 0) autoIndex = ci; }

  applyHighlight(partZone(activePart));
  syncRail(activePart);

  if (activePart) {
    const info = PART_INFO[activePart];
    /* 상세 세트(씨앗·땅속줄기·잎)면 3D+두 갈래 설명이 카드를 대신한다 */
    const hasDetail = updateDetail(activePart);
    if (hintEl) hintEl.hidden = true;
    if (hasDetail) {
      cardEl.hidden = true;
      leaderTargetEl = detailEl;
    } else {
      cardName.textContent = info.name;
      cardSub.textContent  = info.sub;
      cardDesc.textContent = info.desc;
      if (cardImg) {
        if (info.img) { cardImg.src = info.img; cardImg.alt = info.label; cardImg.hidden = false; }
        else { cardImg.removeAttribute('src'); cardImg.hidden = true; }
      }
      cardEl.hidden = false;
      cardEl.classList.remove('lotus-info-card--in');
      void cardEl.offsetWidth;            // reflow → 재진입 애니메이션
      cardEl.classList.add('lotus-info-card--in');
      leaderTargetEl = cardEl;
    }
    leaderSvg.classList.add('lotus-leader--on');
    updateLeader();
  } else {
    if (hintEl) hintEl.hidden = false;
    cardEl.hidden = true;
    leaderSvg.classList.remove('lotus-leader--on');
    updateDetail('');
  }
}

/* ── 존 강조 (선택 부위의 존만 또렷하게) ───────────────── */
function applyHighlight(sel) {
  ZONES.forEach(p => {
    const m = partMats[p];
    if (!m) return;
    if (!sel) {
      m.transparent = false; m.opacity = 1; m.emissive?.setHex(0x000000);
    } else if (p === sel) {
      m.transparent = false; m.opacity = 1;
      if (m.emissive) { m.emissive.copy(m.color).multiplyScalar(0.22); }
    } else {
      m.transparent = true; m.opacity = 0.18; m.emissive?.setHex(0x000000);
    }
    m.needsUpdate = true;
  });
}

/* ── 리더 라인 갱신 (부위 → 설명 카드 또는 상세 패널) ────── */
const _v = new THREE.Vector3();
function updateLeader() {
  if (!activePart || !leaderTargetEl || leaderTargetEl.hidden) return;
  const zone = partZone(activePart);
  const grp = partGroups[zone];
  if (!grp) return;

  /* 존 anchor 의 현재 world 좌표 → 화면 투영 */
  grp.localToWorld(_v.copy(anchorLocal[zone]));
  _v.project(camera);

  const wrapRect  = canvasWrap.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const ox = wrapRect.left - stageRect.left;
  const oy = wrapRect.top  - stageRect.top;
  const px = ox + ( _v.x * 0.5 + 0.5) * wrapRect.width;
  const py = oy + (-_v.y * 0.5 + 0.5) * wrapRect.height;

  /* 타깃(카드 또는 상세 패널) anchor — 왼쪽 가운데, stage 기준.
     상세 패널이 타깃일 때는 패널 왼쪽 끝(캔버스 위까지 확장된 빈 영역)이 아니라
     실제 3D 모델 영역(detailStage)을 기준으로 잡고, 모델 가로폭에 점선 끝이
     가려 잘려 보이지 않도록 모델 안쪽으로 조금 더 뻗는다. */
  const targetIsDetail = leaderTargetEl === detailEl && detailStage;
  const cardRect = (targetIsDetail ? detailStage : leaderTargetEl).getBoundingClientRect();
  /* 모델 영역 왼쪽 끝에서 멈추지 않고 모델 안쪽(가로폭 ~42% 지점, 중심 직전)까지
     점선을 더 뻗어 잘려 보이지 않게 한다 */
  const detailReach = targetIsDetail ? cardRect.width * 0.42 : 0;
  const cx = cardRect.left - stageRect.left + detailReach;
  const cy = cardRect.top  - stageRect.top + cardRect.height / 2;

  leaderSvg.setAttribute('width',  stageRect.width);
  leaderSvg.setAttribute('height', stageRect.height);
  leaderSvg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);

  /* 꺾인 리더선: 부위 → 중간 수평 → 카드 */
  const midX = (px + cx) / 2;
  leaderLine.setAttribute('points', `${px},${py} ${midX},${py} ${midX},${cy} ${cx},${cy}`);
  leaderDot.setAttribute('cx', px);
  leaderDot.setAttribute('cy', py);
}

/* ── data 탭 활성화 감지 후 init ────────────────────────── */
let _inited = false;
function tryInit() {
  const dv = document.getElementById('data-view');
  if (!dv || !document.getElementById('lotus-canvas')) return;
  const run = () => { if (!_inited) { _inited = true; init(); } };
  if (dv.getAttribute('aria-hidden') === 'false') run();
  new MutationObserver(() => {
    if (dv.getAttribute('aria-hidden') === 'false') run();
  }).observe(dv, { attributes: true, attributeFilter: ['aria-hidden'] });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInit);
else tryInit();
