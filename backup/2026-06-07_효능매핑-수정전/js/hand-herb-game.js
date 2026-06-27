/**
 * hand-herb-game.js
 * 조선시대 의원 타이쿤 — 웹캠 손 추적으로 약재 조합
 * MediaPipe Hands (CDN)
 */
(function () {
  'use strict';

  /* ── DOM ── */
  var overlay, canvas, ctx, video;
  var collectedEl, completeEl, completeTitleEl, patientMsgEl;

  /* ── 상태 ── */
  var animId = null;
  var handLandmarks = null;     // 첫 번째 손 (단일 손 모드용)
  var allHands = [];            // 양손 모드에서 사용
  var floatingHerbs = [];
  var collectedHerbs = [];
  var formulaName = '';
  var diseaseInfo = null;
  var currentType = 'tang';     // tang | hwan | san | go | dan
  var currentHerbObjs = [];
  var currentDoses = [];
  var gameActive = false;
  var gameSession = 0;      // 매 startGame마다 증가 — stale setTimeout 차단용
  var completeFired = false; // 완료 트리거 중복 방지
  var grabState = { active: false, herbIdx: -1 };
  /* 탕 모드 양손 잡기 상태 — 좌/우 손 독립적으로 한 약재씩 잡을 수 있음 */
  var tangGrabs = [
    { active: false, herbIdx: -1 },
    { active: false, herbIdx: -1 }
  ];

  /* 제형별 상태 (모드별로 사용) */
  var hwanState = null;  // { rotation, pillsMade, lastAngle, dough, pills:[] }
  var sanState  = null;  // { idx, hits, hitsRequired, lastHandY, lastHitFrame, mortarShake }
  var goState   = null;  // { rotation, lastAngle, perHerbAngle, herbsDone, bubbles:[], ladleAngle }
  var danState  = null;  // { idx, puffs, puffsRequired, leftPhase, rightPhase, fireIntensity, sparks:[] }

  /* MediaPipe */
  var hands = null;
  var mpCamera = null;

  /* ── 파티클 ── */
  var particles = [];
  var celebParticles = [];
  var glowRings = [];
  var celebActive = false;
  var celebTimer = 0;
  var screenFlash = 0;

  /* ── 탕 모드 자산 ──
     손 PNG는 정렬 문제로 폐기 → 골격(landmarks + bones) 직접 렌더링 사용 */

  /* MediaPipe 손 관절 연결 (21개 랜드마크) */
  var HAND_BONES = [
    [0,1],[1,2],[2,3],[3,4],          /* 엄지 */
    [0,5],[5,6],[6,7],[7,8],          /* 검지 */
    [5,9],[9,10],[10,11],[11,12],     /* 중지 */
    [9,13],[13,14],[14,15],[15,16],   /* 약지 */
    [13,17],[17,18],[18,19],[19,20],  /* 소지 */
    [0,17]                             /* 손바닥 외곽 */
  ];


  /* ── 설정 ── */
  var POT_HEIGHT_RATIO = 0.18;
  var POT_HEIGHT_RATIO_TANG = 0.30;  /* 탕 모드: 약탕기 이미지가 더 크므로 약재 영역을 더 위로 */

  /* 탕 모드 약탕기 영역
     - DROP: 약탕기 입구 (떨어뜨리면 수집되는 작은 타원)
     - AVOID: 약탕기 본체+화로+김 영역 전체 (떠다니는 약재가 회피해야 하는 큰 타원) */
  /* 드롭: 약탕기 입구(상단 림) */
  var TANG_POT_DROP  = { cxR: 0.50, cyR: 0.64, rxR: 0.22, ryR: 0.11 };
  /* 회피: 약탕기 본체만 — 약재가 본체와 직접 겹치지만 않으면 자유롭게 떠다님 */
  var TANG_POT_AVOID = { cxR: 0.50, cyR: 0.78, rxR: 0.18, ryR: 0.20 };
  function getZone(spec, cw, ch) {
    return { cx: cw * spec.cxR, cy: ch * spec.cyR, rx: cw * spec.rxR, ry: ch * spec.ryR };
  }
  function getTangPotZone(cw, ch)   { return getZone(TANG_POT_DROP,  cw, ch); }
  function getTangAvoidZone(cw, ch) { return getZone(TANG_POT_AVOID, cw, ch); }
  function isInZone(x, y, z) {
    var nx = (x - z.cx) / z.rx;
    var ny = (y - z.cy) / z.ry;
    return (nx * nx + ny * ny) < 1;
  }
  function isInTangPotZone(x, y, z) { return isInZone(x, y, z); }
  var HERB_SIZE = 100;
  var GRAB_DIST = 72;
  var PINCH_THRESHOLD = 0.07;
  var LEFT_PANEL_W = 175;   // 환자 패널 (150px) + 좌측 여백 + 안전 마진
  var RIGHT_PANEL_W = 245;  // rx 패널 (220px) + 우측 여백 + 안전 마진

  /* ── 모바일/터치 감지 ──
     - 모바일이면 MediaPipe(웹캠)를 우회하고 터치 폴백을 기본 입력으로 사용
     - 패널 폭도 좁혀서 캔버스 작업 영역 확보 */
  function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var narrow = (window.innerWidth || 0) < 768;
    var coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    return (hasTouch && narrow) || (coarse && narrow);
  }
  function applyPanelWidthsForViewport() {
    if (isMobileDevice()) {
      /* 모바일: 좌/우 패널을 상/하단 슬림 스트립으로 변환 → 캔버스 좌우 여백 거의 없음 */
      LEFT_PANEL_W = 12;
      RIGHT_PANEL_W = 12;
    } else {
      LEFT_PANEL_W = 175;
      RIGHT_PANEL_W = 245;
    }
  }

  /* ── 증상 키워드 → 환자 아픔 위치 (동적 매칭) ── */
  var BODY_KEYWORD_MAP = [
    { kw: ['두통','편두통','어지럼','현훈'], part: 'head', label: '머리', cy: 25 },
    { kw: ['눈','시력','안구'], part: 'head', label: '눈', cy: 25 },
    { kw: ['코막힘','비색'], part: 'head', label: '코', cy: 35 },
    { kw: ['불면','수면','불안','공황','심계','두근','심신','심화','경기','심비'], part: 'head', label: '머리(심)', cy: 30 },
    { kw: ['감기','오한','발열','고열','한열','열감','목'], part: 'head', label: '머리·목', cy: 42 },
    { kw: ['기침','가래','천식','폐','콧물','해소','담음','담','흉통'], part: 'chest', label: '가슴', cy: 85 },
    { kw: ['소화','위장','식욕','비위','구토','구역','적체','서열','더위'], part: 'stomach', label: '위장', cy: 120 },
    { kw: ['변비','장조','설사','이질'], part: 'abdomen', label: '장', cy: 140 },
    { kw: ['소변','빈뇨','생리','월경','안태','유산','산후','신허','신양','신장','불임'], part: 'abdomen', label: '하복부', cy: 155 },
    { kw: ['관절','풍습','근골','타박','골절'], part: 'legs', label: '관절', cy: 190 },
    { kw: ['요통','허리'], part: 'back', label: '허리', cy: 140 },
    { kw: ['냉증','냉기','수족','차가','부종','붓기'], part: 'limbs', label: '손발', cy: 200 },
    { kw: ['피부','가려움','두드러기','습진','종기','화상','상처','건조','염증','독소','화농'], part: 'torso', label: '피부', cy: 130 },
    { kw: ['졸도','기절','혼수','중풍','뇌졸','경련'], part: 'head', label: '머리', cy: 30 }
  ];
  var DEFAULT_BODY = { part: 'torso', label: '전신', cy: 100 };

  function getBodyMap(name) {
    var n = name || '';
    for (var i = 0; i < BODY_KEYWORD_MAP.length; i++) {
      var entry = BODY_KEYWORD_MAP[i];
      for (var k = 0; k < entry.kw.length; k++) {
        if (n.indexOf(entry.kw[k]) >= 0) return { part: entry.part, label: entry.label, cy: entry.cy };
      }
    }
    return DEFAULT_BODY;
  }

  /* ── 유틸 ── */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function stripParen(name) { return (name || '').replace(/\s*\(.*?\)\s*/g, '').trim(); }
  function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ══════════════════════════════════════
     MediaPipe 로드
     ══════════════════════════════════════ */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadMediaPipe() {
    return loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js')
      .then(function () {
        return loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js');
      });
  }

  /* ══════════════════════════════════════
     초기화
     ══════════════════════════════════════ */
  function initElements() {
    overlay = document.getElementById('herb-game-overlay');
    canvas = document.getElementById('herb-game-canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    video = document.getElementById('herb-game-video');
    collectedEl = document.getElementById('herb-game-collected');
    completeEl = document.getElementById('herb-game-complete');
    completeTitleEl = document.getElementById('herb-game-complete-formula');
    patientMsgEl = document.getElementById('herb-game-complete-patient-msg');

    document.getElementById('herb-game-close').addEventListener('click', stopGame);
    document.getElementById('herb-game-complete-close').addEventListener('click', stopGame);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && gameActive) stopGame();
    });

    var coachBtn = document.getElementById('herb-coach-dismiss');
    if (coachBtn) coachBtn.addEventListener('click', dismissCoach);

    var coachCloseBtn = document.getElementById('herb-coach-close');
    if (coachCloseBtn) coachCloseBtn.addEventListener('click', dismissCoach);

    var pickerCloseBtn = document.getElementById('herb-picker-close');
    if (pickerCloseBtn) pickerCloseBtn.addEventListener('click', closePicker);
  }

  function resizeCanvas() {
    if (!canvas || !overlay) return;
    applyPanelWidthsForViewport();
    overlay.classList.toggle('mobile-mode', isMobileDevice());
    var cssW = overlay.clientWidth;
    var cssH = overlay.clientHeight;
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    /* 백킹 스토어는 물리 픽셀, CSS 크기는 100% */
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    /* 그리기 좌표는 CSS 픽셀(논리)로 유지 */
    canvas.cssW = cssW;
    canvas.cssH = cssH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  /* ══════════════════════════════════════
     코치마크
     ══════════════════════════════════════ */
  function showCoach() {
    var el = document.getElementById('herb-game-coach');
    if (el) el.setAttribute('aria-hidden', 'false');
  }
  function dismissCoach() {
    var el = document.getElementById('herb-game-coach');
    if (el) el.setAttribute('aria-hidden', 'true');
  }

  /* ══════════════════════════════════════
     처방 선택 피커
     ══════════════════════════════════════ */
  var activeTypeFilter = null; // 현재 선택된 제형 필터
  var activeBodyFilter = null; // 신체 부위 필터 (picker hotspot 클릭으로 진입 시 설정)
  var pickerHotspotsBound = false; // bindPickerHotspots 중복 호출 방지

  function buildPickerGrid(ids) {
    var prescriptions = window.DONGUIBOGAM_PRESCRIPTIONS || [];
    var list = prescriptions;
    if (ids) {
      list = list.filter(function (p) { return ids.indexOf(p.id) >= 0; });
    }
    if (activeTypeFilter) {
      list = list.filter(function (p) { return p.type === activeTypeFilter; });
    }
    var gridEl = document.getElementById('picker-disease-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    list.forEach(function (p) {
      var herbCount = (p.herb_ids || []).length;
      var formulaShort = (p.formula || '').split(' ')[0];
      var typeLabel = p.type_label || '';
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'picker-disease-card';
      card.setAttribute('data-id', p.id);
      card.setAttribute('data-type', p.type || '');
      card.innerHTML =
        '<span class="picker-card-type">' + escHtml(typeLabel) + '</span>' +
        '<span class="picker-card-name">' + escHtml(p.name || '') + '</span>' +
        '<span class="picker-card-hanja">' + escHtml(p.hanja || '') + '</span>' +
        '<span class="picker-card-formula">' + escHtml(formulaShort) + '</span>' +
        '<span class="picker-card-desc">' + escHtml(p.description || '') + '</span>' +
        '<span class="picker-card-count">' + herbCount + '가지 약재</span>';
      card.addEventListener('click', function () { startFromPicker(p.id); });
      gridEl.appendChild(card);
    });
  }

  function bindPickerHotspots() {
    if (pickerHotspotsBound) return; // 중복 바인딩 방지 — 매 showPicker마다 호출되어도 1회만
    pickerHotspotsBound = true;
    var hotspots = document.querySelectorAll('#herb-game-picker .picker-hotspot');
    hotspots.forEach(function (el) {
      el.addEventListener('click', function () {
        var filterKw = (el.getAttribute('data-filter-keywords') || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
        /* 키워드 기반 처방 필터링 */
        var prescriptions = window.DONGUIBOGAM_PRESCRIPTIONS || [];
        var matched = prescriptions.filter(function (p) {
          var nm = (p.name || '') + ' ' + (p.description || '');
          return filterKw.some(function (kw) { return nm.indexOf(kw) >= 0; });
        });
        var ids = matched.map(function (p) { return p.id; });
        /* 부위 필터 진입 — Patient3D 포커스를 클릭한 부위로 고정 */
        activeBodyFilter = el.getAttribute('data-body-part') || null;
        console.log('[HOTSPOT CLICK] aria-label=', el.getAttribute('aria-label'),
                    ' data-body-part=', el.getAttribute('data-body-part'),
                    ' → activeBodyFilter=', activeBodyFilter);
        /* 활성 표시 */
        hotspots.forEach(function (h) { h.classList.remove('active'); });
        el.classList.add('active');
        /* 필터 라벨 */
        var labelEl = document.getElementById('picker-filter-label');
        var ariaLabel = el.getAttribute('aria-label') || '선택된 부위';
        if (labelEl) labelEl.textContent = ariaLabel.split(' - ')[0];
        var resetBtn = document.getElementById('picker-reset-filter');
        if (resetBtn) resetBtn.setAttribute('aria-hidden', 'false');
        buildPickerGrid(ids.length > 0 ? ids : null);
      });
    });
    var resetBtn = document.getElementById('picker-reset-filter');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        hotspots.forEach(function (h) { h.classList.remove('active'); });
        activeBodyFilter = null;
        var labelEl = document.getElementById('picker-filter-label');
        if (labelEl) labelEl.textContent = activeTypeFilter ? '' : '전체 처방';
        resetBtn.setAttribute('aria-hidden', 'true');
        buildPickerGrid(null);
      });
    }
  }

  /* 제형 간략 설명 */
  var TYPE_DESCRIPTIONS = {
    '':     '다섯 가지 제형의 처방을 모두 표시합니다',
    tang:   '탕(湯) — 약재를 물에 끓여 우려낸 즙. 흡수가 빠르고 급성 질환에 적합',
    hwan:   '환(丸) — 꿀·풀로 반죽해 둥글게 빚은 알약. 효력이 길고 휴대가 편리',
    san:    '산(散) — 약재를 곱게 빻은 가루. 위장에 직접 작용해 빠르게 흡수',
    go:     '고(膏) — 오래 졸여 진하게 만든 약엿. 자양강장·만성 질환에 적합',
    dan:    '단(丹) — 광물·약재를 단련해 빚은 환. 응급·중증에 강력하게 작용'
  };
  function setTypeDescription(type) {
    var el = document.getElementById('picker-type-desc');
    if (el) el.textContent = TYPE_DESCRIPTIONS[type || ''] || TYPE_DESCRIPTIONS[''];
  }

  /* 호버 프리뷰 — 버튼에 마우스를 올리면 이미지 + 캡션 표시 */
  function showTypePreview(btn) {
    var img = btn.getAttribute('data-img');
    var type = btn.getAttribute('data-type') || '';
    var preview = document.getElementById('picker-type-preview');
    var imgEl = document.getElementById('picker-type-preview-img');
    var capEl = document.getElementById('picker-type-preview-cap');
    if (!preview || !imgEl || !capEl || !img) return;
    imgEl.src = img;
    var nameEl = btn.querySelector('.picker-type-name');
    capEl.textContent = (nameEl ? nameEl.textContent : '') + ' · ' + (TYPE_DESCRIPTIONS[type] || '').replace(/^[^—]+—\s*/, '');
    /* 버튼 바로 위에 배치 — 가로 위치를 버튼 중앙으로 */
    var parentRect = preview.parentElement.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    var cx = btnRect.left - parentRect.left + btnRect.width / 2;
    preview.style.left = cx + 'px';
    preview.setAttribute('aria-hidden', 'false');
  }
  function hideTypePreview() {
    var preview = document.getElementById('picker-type-preview');
    if (preview) preview.setAttribute('aria-hidden', 'true');
  }

  function bindTypeFilters() {
    var btns = document.querySelectorAll('#picker-type-filters .picker-type-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-type') || '';
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeTypeFilter = type || null;
        activeBodyFilter = null;
        buildPickerGrid(null);
        /* body hotspot 필터 초기화 */
        var hotspots = document.querySelectorAll('#herb-game-picker .picker-hotspot');
        hotspots.forEach(function (h) { h.classList.remove('active'); });
        var labelEl = document.getElementById('picker-filter-label');
        if (labelEl) {
          var nameSpan = btn.querySelector('.picker-type-name');
          labelEl.textContent = type ? (nameSpan ? nameSpan.textContent : btn.textContent).trim() : '전체 처방';
        }
        var resetBtn = document.getElementById('picker-reset-filter');
        if (resetBtn) resetBtn.setAttribute('aria-hidden', 'true');
        setTypeDescription(type);
      });
      /* 호버 시 이미지 프리뷰 (data-img 가 있는 버튼만) */
      if (btn.getAttribute('data-img')) {
        btn.addEventListener('mouseenter', function () { showTypePreview(btn); });
        btn.addEventListener('mouseleave', hideTypePreview);
        btn.addEventListener('focus', function () { showTypePreview(btn); });
        btn.addEventListener('blur', hideTypePreview);
      }
    });
  }

  function showPicker() {
    if (!overlay) initElements();

    activeTypeFilter = null;
    activeBodyFilter = null;
    buildPickerGrid(null);
    bindPickerHotspots();
    bindTypeFilters();
    /* 기본 '전체' 탭 활성화 */
    var allBtn = document.querySelector('#picker-type-filters .picker-type-btn[data-type=""]');
    if (allBtn) {
      var btns = document.querySelectorAll('#picker-type-filters .picker-type-btn');
      btns.forEach(function (b) { b.classList.remove('active'); });
      allBtn.classList.add('active');
    }
    setTypeDescription('');

    overlay.classList.add('picker-mode');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('herb-game-active');
    var pickerEl = document.getElementById('herb-game-picker');
    if (pickerEl) pickerEl.setAttribute('aria-hidden', 'false');
    if (completeEl) completeEl.setAttribute('aria-hidden', 'true');
    dismissCoach();
  }

  function closePicker() {
    var pickerEl = document.getElementById('herb-game-picker');
    if (pickerEl) pickerEl.setAttribute('aria-hidden', 'true');
    if (overlay) {
      overlay.classList.remove('picker-mode');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('herb-game-active');
  }

  function startFromPicker(diseaseId) {
    var prescriptions = window.DONGUIBOGAM_PRESCRIPTIONS || [];
    var p = prescriptions.find(function (x) { return x.id === diseaseId; });
    if (!p) return;

    var allHerbs = window.DONGUIBOGAM_HERBS || [];
    var herbObjs = (p.herb_ids || []).map(function (hid) {
      return allHerbs.find(function (h) { return h.id === hid; });
    }).filter(Boolean);

    /* 피커 닫고 게임 모드로 전환 */
    var pickerEl = document.getElementById('herb-game-picker');
    if (pickerEl) pickerEl.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('picker-mode');

    startGame(herbObjs, p.formula || '', p.herb_doses || [], {
      id: p.id, name: p.name, hanja: p.hanja || '', description: p.description || '',
      type: p.type || 'tang'
    });
  }

  /* ══════════════════════════════════════
     우측 약 정보 패널
     ══════════════════════════════════════ */
  function updateRxPanel(herbObjs, doses) {
    var nameEl = document.getElementById('rx-formula-name');
    var descEl = document.getElementById('rx-description');
    var slotsEl = document.getElementById('rx-herb-slots');
    if (nameEl) nameEl.textContent = formulaName;
    if (descEl) descEl.textContent = diseaseInfo ? (diseaseInfo.description || '') : '';
    if (!slotsEl) return;
    slotsEl.innerHTML = '';
    herbObjs.forEach(function (h, i) {
      var slot = document.createElement('div');
      slot.className = 'rx-herb-slot';
      slot.setAttribute('data-herb-id', h.id);
      var thumbSrc = typeof window.getThumbnailForHerb === 'function' ? (window.getThumbnailForHerb(h) || '') : '';
      var dose = (doses && doses[i]) ? doses[i] : '';
      slot.innerHTML =
        '<div class="rx-slot-img">' +
          (thumbSrc ? '<img src="' + thumbSrc + '" alt="">' : '<span>' + (h.korean_name || '?')[0] + '</span>') +
        '</div>' +
        '<div class="rx-slot-info">' +
          '<span class="rx-slot-name">' + stripParen(h.korean_name || '') + '</span>' +
        '</div>' +
        '<span class="rx-slot-check">✓</span>';
      slotsEl.appendChild(slot);
    });
  }

  function markRxSlotCollected(herbId) {
    var slot = document.querySelector('.rx-herb-slot[data-herb-id="' + herbId + '"]');
    if (slot) slot.classList.add('collected');
  }

  /* ══════════════════════════════════════
     MediaPipe 설정
     ══════════════════════════════════════ */
  function setupMediaPipe() {
    if (hands) return Promise.resolve();
    return loadMediaPipe().then(function () {
      if (!hands) {
        hands = new window.Hands({
          locateFile: function (f) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + f; }
        });
        hands.setOptions({ maxNumHands: ((currentType === 'dan' || currentType === 'tang') ? 2 : 1), modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.5 });
        hands.onResults(function (r) {
          if (!gameActive) return;
          allHands = r.multiHandLandmarks || [];
          handLandmarks = (allHands.length > 0) ? allHands[0] : null;
          if (!handLandmarks && grabState.active) { grabState.active = false; grabState.herbIdx = -1; }
        });
      }
    });
  }

  function sendFrame() {
    if (!gameActive || !hands) return Promise.resolve();
    return hands.send({ image: video });
  }

  /* ══════════════════════════════════════
     환자 패널 업데이트
     ══════════════════════════════════════ */
  function updatePatientPanel() {
    if (!diseaseInfo) return;
    var nameEl = document.getElementById('patient-disease-name');
    if (nameEl) nameEl.textContent = diseaseInfo.name || '';

    var bodyMap = getBodyMap(diseaseInfo.name);
    /* 부위 필터로 진입했다면 그 부위를 우선. limbs(손발/팔다리)는 필터가 없으면
       팔·다리 어느 쪽으로도 단정할 수 없으므로 전체 신체를 보여줌(null). */
    var part = activeBodyFilter || bodyMap.part;
    if (!activeBodyFilter && bodyMap.part === 'limbs') part = null;
    console.log('[updatePatientPanel] disease=', diseaseInfo.name,
                ' bodyMap.part=', bodyMap.part,
                ' activeBodyFilter=', activeBodyFilter,
                ' → setPainPart(', part, ')');
    if (window.Patient3D && typeof window.Patient3D.setPainPart === 'function') {
      window.Patient3D.setPainPart(part);
    }
  }

  /* ══════════════════════════════════════
     파티클 시스템
     ══════════════════════════════════════ */
  function spawnCollectParticles(x, y, color) {
    for (var i = 0; i < 18; i++) {
      var angle = (Math.PI * 2 / 18) * i + rand(-0.2, 0.2);
      var speed = rand(2, 6);
      particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(1, 3), life: 1, decay: rand(0.015, 0.03), size: rand(3, 7), color: color || 'rgba(255, 200, 80, 1)', type: 'spark' });
    }
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: 1, decay: 0.04, size: 10, color: 'rgba(255, 220, 120, 0.6)', type: 'ring' });
  }


  function spawnCelebration() {
    celebActive = true; celebTimer = 0; screenFlash = 1;
    var cw = canvas.cssW, ch = canvas.cssH, cx = cw / 2, cy = ch / 2;
    for (var r = 0; r < 4; r++) {
      glowRings.push({ x: cx, y: cy, radius: 10, maxRadius: 150 + r * 120, life: 1, decay: 0.006 + r * 0.002, delay: r * 8 });
    }
    for (var i = 0; i < 120; i++) {
      var angle = rand(0, Math.PI * 2), speed = rand(2, 10), hue = rand(25, 55);
      celebParticles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0, 4), life: 1, decay: rand(0.004, 0.012), size: rand(2, 8), hue: hue, type: i % 5 === 0 ? 'star' : 'dot', gravity: 0.04, delay: Math.floor(i / 20) * 6 });
    }
    /* 처방명(한자/한글) 텍스트 파티클은 표시하지 않음 */
  }

  function updateParticles(arr) {
    for (var i = arr.length - 1; i >= 0; i--) {
      var p = arr[i];
      if (p.delay && p.delay > 0) { p.delay--; continue; }
      p.life -= p.decay;
      if (p.life <= 0) { arr.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      if (p.type === 'spark') { p.vx *= 0.97; p.vy *= 0.97; }
    }
  }

  function drawParticles() {
    var i, p;
    for (i = 0; i < particles.length; i++) {
      p = particles[i]; if (p.delay && p.delay > 0) continue;
      ctx.save(); ctx.globalAlpha = p.life;
      if (p.type === 'ring') {
        ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.life) * 60 + p.size, 0, Math.PI * 2);
        ctx.strokeStyle = p.color; ctx.lineWidth = 3 * p.life; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
      }
      ctx.restore();
    }
    for (i = 0; i < celebParticles.length; i++) {
      var cp = celebParticles[i]; if (cp.delay && cp.delay > 0) continue;
      ctx.save(); ctx.globalAlpha = cp.life;
      if (cp.type === 'char') {
        ctx.font = 'bold ' + cp.size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'hsl(' + (cp.hue || 40) + ', 80%, 75%)';
        ctx.shadowColor = 'rgba(255, 200, 80, 0.6)'; ctx.shadowBlur = 12;
        ctx.fillText(cp.char, cp.x, cp.y);
      } else if (cp.type === 'star') {
        drawStar(cp.x, cp.y, cp.size * cp.life, 'hsl(' + cp.hue + ', 90%, 70%)');
      } else {
        ctx.beginPath(); ctx.arc(cp.x, cp.y, cp.size * cp.life, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(' + cp.hue + ', 85%, 65%)';
        ctx.shadowColor = 'hsl(' + cp.hue + ', 90%, 50%)'; ctx.shadowBlur = 8; ctx.fill();
      }
      ctx.restore();
    }
    for (i = glowRings.length - 1; i >= 0; i--) {
      var gr = glowRings[i];
      if (gr.delay && gr.delay > 0) { gr.delay--; continue; }
      gr.life -= gr.decay; gr.radius = lerp(gr.radius, gr.maxRadius, 0.05);
      if (gr.life <= 0) { glowRings.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = gr.life * 0.5;
      ctx.beginPath(); ctx.arc(gr.x, gr.y, gr.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 220, 120, 1)'; ctx.lineWidth = 4 * gr.life;
      ctx.shadowColor = 'rgba(255, 200, 80, 0.8)'; ctx.shadowBlur = 30; ctx.stroke(); ctx.restore();
    }
    if (screenFlash > 0) {
      ctx.save(); ctx.globalAlpha = screenFlash * 0.4;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.cssW, canvas.cssH);
      ctx.restore(); screenFlash = Math.max(0, screenFlash - 0.025);
    }
  }

  function drawStar(x, y, r, color) {
    ctx.save(); ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var a1 = (Math.PI * 2 / 5) * i - Math.PI / 2, a2 = a1 + Math.PI / 5;
      ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
      ctx.lineTo(x + Math.cos(a2) * r * 0.4, y + Math.sin(a2) * r * 0.4);
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fill(); ctx.restore();
  }

  /* 입체 구체(약·환·단·약재 덩어리) 공통 렌더러
     - base: {light, mid, dark} 색상
     - opts.speckle: 표면 점박이(약재 입자 느낌)
     - opts.gloss: 상단 광택 강도(0~1) */
  function drawSphere3D(x, y, r, base, opts) {
    if (r <= 0) return;
    opts = opts || {};
    var lx = x - r * 0.35, ly = y - r * 0.4;

    /* 1. 기본 구체 (오프셋 라디얼 그라디언트) */
    var body = ctx.createRadialGradient(lx, ly, r * 0.1, x, y, r);
    body.addColorStop(0, base.light);
    body.addColorStop(0.55, base.mid);
    body.addColorStop(1, base.dark);
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    /* 2. 림 섀도우 (가장자리 어두움 → 입체감) */
    var rim = ctx.createRadialGradient(x, y, r * 0.65, x, y, r);
    rim.addColorStop(0, 'rgba(0,0,0,0)');
    rim.addColorStop(1, opts.rim || 'rgba(0,0,0,0.4)');
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    /* 3. 표면 점박이 (선택) — 약재 분말의 불균일 질감 */
    if (opts.speckle) {
      var seed = opts.seed != null ? opts.seed : (x * 13 + y * 7);
      var n = opts.speckleCount || 9;
      var sc = opts.speckleColor || 'rgba(40, 22, 8, 0.55)';
      for (var i = 0; i < n; i++) {
        var rnd1 = (Math.sin(seed + i * 12.97) * 0.5 + 0.5);
        var rnd2 = (Math.sin(seed + i * 31.41) * 0.5 + 0.5);
        var ang = rnd1 * Math.PI * 2;
        var dist = Math.sqrt(rnd2) * r * 0.78;
        var sx = x + Math.cos(ang) * dist;
        var sy = y + Math.sin(ang) * dist * 0.92;
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.arc(sx, sy, r * (0.05 + rnd1 * 0.04), 0, Math.PI * 2); ctx.fill();
      }
    }

    /* 4. 스페큘러 (좌상단 광택) */
    var glossA = opts.gloss != null ? opts.gloss : 0.55;
    var hi = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.6);
    hi.addColorStop(0, 'rgba(255,255,255,' + glossA + ')');
    hi.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hi;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  /* ══════════════════════════════════════
     약재 배치 & 렌더링
     ══════════════════════════════════════ */
  function createFloatingHerbs(herbObjs, doses) {
    floatingHerbs = [];
    var cw = canvas.cssW, ch = canvas.cssH;
    var xMin = LEFT_PANEL_W + HERB_SIZE / 2;
    var xMax = cw - RIGHT_PANEL_W - HERB_SIZE / 2;
    var potRatio = (currentType === 'tang') ? POT_HEIGHT_RATIO_TANG : POT_HEIGHT_RATIO;
    /* 탕 모드는 화면 전체를 부유 영역으로 사용 (약탕기 영역은 회피로 처리) */
    var safeTop = (currentType === 'tang') ? 60 : 70;
    var safeBottom = (currentType === 'tang')
      ? (ch - HERB_SIZE - 30)
      : ch * (1 - potRatio) - HERB_SIZE;
    var tangAvoid = (currentType === 'tang') ? getTangAvoidZone(cw, ch) : null;
    var tangAvoidRx = tangAvoid ? tangAvoid.rx * 1.2 : 0;
    var tangAvoidRy = tangAvoid ? tangAvoid.ry * 1.2 : 0;

    herbObjs.forEach(function (h, i) {
      var thumbSrc = '';
      if (typeof window.getThumbnailForHerb === 'function') thumbSrc = window.getThumbnailForHerb(h) || '';
      var img = new Image();
      if (thumbSrc) img.src = thumbSrc;
      var dose = (doses && doses[i]) ? doses[i] : '';
      var cols = Math.min(herbObjs.length, 4);
      var usableW = xMax - xMin;
      var colW = usableW / (cols + 1);
      var row = Math.floor(i / cols), col = i % cols;
      var x = xMin + colW * (col + 0.5 + rand(-0.2, 0.2));
      var y = safeTop + (safeBottom - safeTop) * (0.12 + row * 0.28) + rand(-30, 30);
      /* 탕: 약탕기 회피 — 스폰 위치가 약탕기 안이면 가장자리로 밀어냄 */
      if (tangAvoid) {
        var dxz = (x - tangAvoid.cx) / tangAvoidRx;
        var dyz = (y - tangAvoid.cy) / tangAvoidRy;
        var dz = Math.sqrt(dxz * dxz + dyz * dyz);
        if (dz < 1 && dz > 0.0001) {
          x = tangAvoid.cx + (dxz / dz) * tangAvoidRx;
          y = tangAvoid.cy + (dyz / dz) * tangAvoidRy;
        }
      }

      floatingHerbs.push({
        id: h.id, name: h.korean_name || '', dose: dose, thumbSrc: thumbSrc,
        x: Math.max(xMin, Math.min(xMax, x)),
        y: Math.max(safeTop, Math.min(safeBottom, y)),
        vx: rand(-1, 1), vy: rand(-0.6, 0.6),
        w: HERB_SIZE, h: HERB_SIZE, img: img,
        grabbed: false, collected: false,
        phase: rand(0, Math.PI * 2), bobSpeed: 0.018 + rand(0, 0.012),
        glowPhase: rand(0, Math.PI * 2)
      });
    });
  }

  function drawHerb(herb) {
    var x = herb.x - herb.w / 2, y = herb.y - herb.h / 2;
    var pulse = Math.sin(herb.glowPhase) * 0.15 + 0.85;
    herb.glowPhase += 0.03;

    var cardW = herb.w + 4, cardH = herb.h + 30;
    var cardX = herb.x - cardW / 2, cardY = herb.y - herb.h / 2 - 4;
    var r = 14;

    /* 그림자 */
    ctx.save();
    if (herb.grabbed) { ctx.shadowColor = 'rgba(180, 130, 30, 0.55)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 6; }
    else { ctx.shadowColor = 'rgba(0, 0, 0, 0.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4; }

    /* 카드 배경 */
    ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, r);
    ctx.fillStyle = herb.grabbed
      ? 'rgba(255, 252, 244, 0.98)'
      : 'rgba(255, 251, 242, ' + (0.93 + pulse * 0.04) + ')';
    ctx.fill();
    ctx.restore();

    /* 테두리 */
    ctx.save();
    ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, r);
    ctx.strokeStyle = herb.grabbed ? 'rgba(200, 150, 30, 0.7)' : 'rgba(180, 150, 90, 0.35)';
    ctx.lineWidth = herb.grabbed ? 2 : 1.2;
    ctx.stroke();
    ctx.restore();

    /* 약재 이미지 (사각 클립) */
    ctx.save();
    ctx.beginPath(); ctx.roundRect(cardX + 4, cardY + 4, cardW - 8, herb.h - 6, [r - 4, r - 4, 4, 4]); ctx.clip();
    if (herb.img && herb.img.complete && herb.img.naturalWidth > 0) {
      ctx.drawImage(herb.img, cardX + 4, cardY + 4, cardW - 8, herb.h - 6);
    } else {
      ctx.fillStyle = '#e8e0d0';
      ctx.fillRect(cardX + 4, cardY + 4, cardW - 8, herb.h - 6);
      ctx.fillStyle = '#7a5c30'; ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((herb.name || '?')[0], herb.x, herb.y);
    }
    ctx.restore();

    /* 이름 (카드 하단) */
    var dn = stripParen(herb.name);
    ctx.save(); ctx.font = '600 12px "Pretendard", sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#3a2c14';
    ctx.fillText(dn, herb.x, cardY + cardH - 9);
    ctx.restore();

    /* 용량 뱃지 (우상단) */
    if (herb.dose) {
      ctx.save();
      ctx.font = 'bold 10px "Pretendard", sans-serif';
      var tw = ctx.measureText(herb.dose).width, bw = tw + 10, bh = 17;
      var bx = cardX + cardW - bw - 4, by = cardY + 5;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fillStyle = herb.grabbed ? 'rgba(190, 140, 20, 0.9)' : 'rgba(160, 120, 30, 0.82)';
      ctx.fill();
      ctx.fillStyle = '#fff8e8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(herb.dose, bx + bw / 2, by + bh / 2);
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════
     수집 & 완성
     ══════════════════════════════════════ */
  function collectHerb(idx) {
    var herb = floatingHerbs[idx];
    herb.collected = true;
    collectedHerbs.push(herb.id);
    markRxSlotCollected(herb.id);
    spawnCollectParticles(herb.x, herb.y, 'rgba(255, 210, 80, 0.9)');
    spawnCollectParticles(herb.x, herb.y, 'rgba(180, 140, 60, 0.7)');
    /* 탕 모드 투입 피드백: 강력한 분출 + 글로우 링 + 광채 */
    if (currentType === 'tang') {
      /* 김은 배경 영상에 포함됨 — 캔버스 김 분출 제거 */
      /* 노란 광채 파티클 */
      spawnCollectParticles(herb.x, herb.y, 'rgba(255, 240, 200, 0.95)');
      spawnCollectParticles(herb.x, herb.y, 'rgba(255, 200, 100, 0.9)');
      spawnCollectParticles(herb.x, herb.y, 'rgba(255, 160, 60, 0.8)');
      /* 약탕기 입구 위치에 확장 글로우 링 3개 (시간차) */
      var dz = getTangPotZone(canvas.cssW, canvas.cssH);
      for (var gr = 0; gr < 3; gr++) {
        glowRings.push({
          x: dz.cx, y: dz.cy,
          radius: 20, maxRadius: 180 + gr * 60,
          life: 1, decay: 0.018 + gr * 0.004,
          delay: gr * 5
        });
      }
      /* 화면 가장자리 미세 플래시 */
      screenFlash = Math.max(screenFlash, 0.35);
      /* 추가 스파크 (위로 튀어오르는 입자) */
      for (var sk = 0; sk < 18; sk++) {
        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        var spd = 3 + Math.random() * 5;
        particles.push({
          x: dz.cx + (Math.random() - 0.5) * 40,
          y: dz.cy - 10,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 2 + Math.random() * 3,
          color: 'rgba(255, ' + Math.floor(180 + Math.random() * 60) + ', ' + Math.floor(60 + Math.random() * 60) + ', 0.95)',
          life: 1, decay: 0.018, gravity: 0.12, type: 'spark'
        });
      }
    }

    var tag = document.createElement('div');
    tag.className = 'herb-game-collected-tag';
    var thumbHtml = herb.thumbSrc ? '<img src="' + herb.thumbSrc + '" alt="" class="herb-game-collected-img">' : '';
    var doseHtml = herb.dose ? '<span class="herb-game-collected-dose">' + herb.dose + '</span>' : '';
    tag.innerHTML = thumbHtml + '<span>' + stripParen(herb.name) + '</span>' + doseHtml;
    collectedEl.appendChild(tag);
    /* 2초 후 페이드아웃 → 제거 */
    setTimeout(function () {
      tag.classList.add('fade-out');
      tag.addEventListener('animationend', function () { if (tag.parentNode) tag.parentNode.removeChild(tag); });
    }, 2000);
    if (navigator.vibrate) navigator.vibrate(80);
    updateProgress();

    if (!completeFired && floatingHerbs.every(function (h) { return h.collected; })) {
      completeFired = true;
      var sess = gameSession;
      setTimeout(function () {
        if (gameSession !== sess) return;
        spawnCelebration();
        setTimeout(function () { if (gameSession === sess) showComplete(); }, 1800);
      }, 400);
    }
  }

  function updateProgress() {
    var total = floatingHerbs.length;
    var done = collectedHerbs.length;
    var progEl = document.getElementById('herb-game-progress');
    if (progEl) progEl.textContent = done + ' / ' + total;
    var fillEl = document.getElementById('hud-progress-fill');
    if (fillEl) fillEl.style.width = (total > 0 ? (done / total * 100) : 0) + '%';
  }

  function showComplete() {
    if (completeEl) {
      completeEl.setAttribute('aria-hidden', 'false');
      if (completeTitleEl) completeTitleEl.textContent = formulaName;
      var subEl = document.getElementById('herb-game-complete-sub');
      if (subEl) {
        var subByType = {
          tang: '모든 약재가 약탕기에 담겼습니다',
          hwan: '모든 환이 빚어졌습니다',
          san:  '약재가 곱게 빻아져 한지에 담겼습니다',
          go:   '약재가 진하게 졸여져 고가 되었습니다',
          dan:  '광물·약재가 단련되어 단이 빚어졌습니다'
        };
        subEl.textContent = subByType[currentType] || subByType.tang;
      }
      if (patientMsgEl && diseaseInfo) {
        patientMsgEl.textContent = '"' + (diseaseInfo.name || '') + ' 환자가 쾌유하였습니다!"';
      }
    }
  }

  /* ══════════════════════════════════════
     메인 게임 루프 (공통) → 모드별 디스패치
     ══════════════════════════════════════ */
  /* 5개 손가락이 펴졌는지 감지 [엄지, 검지, 중지, 약지, 소지] */
  function getFingerExtensions(landmarks) {
    if (!landmarks) return [false, false, false, false, false];
    /* 엄지: 끝(4)이 두 번째 관절(3)에서 충분히 벌어졌는지 */
    var thumbExt  = Math.abs(landmarks[4].x - landmarks[3].x) > 0.04;
    /* 나머지: 끝 y < PIP 관절 y (위로 뻗은 상태) — 카메라 좌표계에서 y↓ 증가 */
    var indexExt  = landmarks[8].y  < landmarks[6].y  - 0.02;
    var middleExt = landmarks[12].y < landmarks[10].y - 0.02;
    var ringExt   = landmarks[16].y < landmarks[14].y - 0.02;
    var pinkyExt  = landmarks[20].y < landmarks[18].y - 0.02;
    return [thumbExt, indexExt, middleExt, ringExt, pinkyExt];
  }

  function getHandPosFrom(landmarks, cw, ch) {
    if (!landmarks) return null;
    /* 커서: 검지 끝(8) — 손바닥 중앙보다 훨씬 정밀 */
    var x = (1 - landmarks[8].x) * cw;
    var y = landmarks[8].y * ch;
    /* 잡기: 엄지(4) ↔ 검지(8) 거리 */
    var thumb = landmarks[4], index = landmarks[8];
    var dx = thumb.x - index.x, dy = thumb.y - index.y;
    var pinching = Math.sqrt(dx * dx + dy * dy) < PINCH_THRESHOLD;
    /* 펼침: 엄지(4) ↔ 소지(20) */
    var pinky = landmarks[20];
    var sx = thumb.x - pinky.x, sy = thumb.y - pinky.y;
    var spread = Math.sqrt(sx * sx + sy * sy);
    /* 손가락별 상태 */
    var ext = getFingerExtensions(landmarks);
    var extCount = 0;
    for (var ei = 0; ei < ext.length; ei++) { if (ext[ei]) extCount++; }
    /* 5개 손가락 끝 위치 (캔버스 좌표, 미러 적용) */
    var tipIdxs = [4, 8, 12, 16, 20];
    var fingertips = [];
    for (var ti = 0; ti < tipIdxs.length; ti++) {
      var lm = landmarks[tipIdxs[ti]];
      fingertips.push({ x: (1 - lm.x) * cw, y: lm.y * ch });
    }
    return { x: x, y: y, pinching: pinching, spread: spread,
             extensions: ext, extendedCount: extCount, fingertips: fingertips };
  }

  function gameLoop() {
    if (!gameActive) return;
    animId = requestAnimationFrame(gameLoop);
    var cw = canvas.cssW, ch = canvas.cssH;
    ctx.clearRect(0, 0, cw, ch);

    // 웹캠 배경: 탕·환 모드는 자체 배경(영상/캐시) 사용 → 캔버스에 그리지 않음
    if (currentType !== 'tang' && currentType !== 'hwan' && currentType !== 'san') {
      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, cw, ch);
      ctx.restore();
    }

    // 모드별 업데이트
    switch (currentType) {
      case 'hwan': updateHwanMode(cw, ch); break;
      case 'san':  updateSanMode(cw, ch); break;
      case 'go':   updateGoMode(cw, ch); break;
      case 'dan':  updateDanMode(cw, ch); break;
      case 'tang':
      default:     updateTangMode(cw, ch); break;
    }

    updateParticles(particles);
    updateParticles(celebParticles);
    drawParticles();

    if (celebActive) { celebTimer++; if (celebTimer > 300) celebActive = false; }
  }

  /* ══════════════════════════════════════
     [탕] 떠다니는 약재 → 약탕기에 넣기 (기존)
     ══════════════════════════════════════ */
  function updateTangMode(cw, ch) {
    var potY = ch * (1 - POT_HEIGHT_RATIO_TANG);
    var dropZone  = getTangPotZone(cw, ch);
    var avoidZone = getTangAvoidZone(cw, ch);

    /* 드롭존 글로우·김은 모두 배경 영상(tang_background.mp4)에 포함됨 — 캔버스 덧그림 제거 */

    /* 양손 추출 — allHands가 비어있으면 handLandmarks를 단일 손으로 사용 (터치 폴백) */
    var handsList = [];
    if (allHands && allHands.length > 0) {
      for (var hi = 0; hi < allHands.length && hi < 2; hi++) {
        var lm = allHands[hi];
        var p = getHandPosFrom(lm, cw, ch);
        if (p) handsList.push({ landmarks: lm, pos: p });
      }
    } else if (handLandmarks) {
      var p1 = getHandPosFrom(handLandmarks, cw, ch);
      if (p1) handsList.push({ landmarks: handLandmarks, pos: p1 });
    }

    /* 손 골격 그리기 (각 손) */
    for (var hh = 0; hh < handsList.length; hh++) {
      drawTangHandSkeletonFor(handsList[hh].landmarks, handsList[hh].pos.pinching);
    }

    /* 각 손의 잡기 상태 동기화: 손이 사라지면 해당 grab 해제 */
    for (var gi = 0; gi < tangGrabs.length; gi++) {
      if (gi >= handsList.length && tangGrabs[gi].active) {
        var heldIdx = tangGrabs[gi].herbIdx;
        if (heldIdx >= 0 && floatingHerbs[heldIdx]) floatingHerbs[heldIdx].grabbed = false;
        tangGrabs[gi].active = false; tangGrabs[gi].herbIdx = -1;
      }
    }

    // 약재 업데이트
    for (var i = 0; i < floatingHerbs.length; i++) {
      var herb = floatingHerbs[i];
      if (herb.collected) continue;

      /* 어떤 손이 이 약재를 잡고 있는지 확인 */
      var ownerHandIdx = -1;
      for (var gj = 0; gj < tangGrabs.length; gj++) {
        if (tangGrabs[gj].active && tangGrabs[gj].herbIdx === i) { ownerHandIdx = gj; break; }
      }

      if (ownerHandIdx >= 0 && ownerHandIdx < handsList.length) {
        var ownerHand = handsList[ownerHandIdx];
        var hX = ownerHand.pos.x, hY = ownerHand.pos.y, hPinch = ownerHand.pos.pinching;
        herb.x += (hX - herb.x) * 0.28;
        herb.y += (hY - herb.y) * 0.28;
        if (!hPinch) {
          herb.grabbed = false;
          tangGrabs[ownerHandIdx].active = false;
          tangGrabs[ownerHandIdx].herbIdx = -1;
          if (isInTangPotZone(herb.x, herb.y, dropZone)) { collectHerb(i); continue; }
        }
      } else {
        /* 자유 부유 — 화면 전반을 자유롭게 (약탕기만 회피) */
        var herbXMin = LEFT_PANEL_W + herb.w / 2;
        var herbXMax = cw - RIGHT_PANEL_W - herb.w / 2;
        var herbYMin = 50;
        var herbYMax = ch - herb.h / 2 - 20;  /* 화면 거의 끝까지 — 약탕기 회피는 별도 처리 */
        herb.phase += herb.bobSpeed;
        herb.vx *= 0.994;
        herb.vy *= 0.994;
        herb.x += herb.vx + Math.sin(herb.phase) * 0.55;
        herb.y += herb.vy + Math.cos(herb.phase * 0.7) * 0.45;
        if (herb.x < herbXMin || herb.x > herbXMax) herb.vx *= -1;
        if (herb.y < herbYMin || herb.y > herbYMax) herb.vy *= -1;
        herb.x = Math.max(herbXMin, Math.min(herbXMax, herb.x));
        herb.y = Math.max(herbYMin, Math.min(herbYMax, herb.y));

        /* 약탕기 회피 — 부드러운 반사 + 약한 외향 푸시 (가속 누적 방지용으로 푸시는 작게) */
        var nxR = (herb.x - avoidZone.cx) / avoidZone.rx;
        var nyR = (herb.y - avoidZone.cy) / avoidZone.ry;
        var dSq = nxR * nxR + nyR * nyR;
        if (dSq < 1 && dSq > 0.0001) {
          var dN = Math.sqrt(dSq);
          herb.x = avoidZone.cx + (nxR / dN) * avoidZone.rx;
          herb.y = avoidZone.cy + (nyR / dN) * avoidZone.ry;
          var nxn = nxR / dN, nyn = nyR / dN;
          var dot = herb.vx * nxn + herb.vy * nyn;
          if (dot < 0) {
            herb.vx = herb.vx - 1.6 * dot * nxn;
            herb.vy = herb.vy - 1.6 * dot * nyn;
          }
          /* 약한 외향 푸시 — 끼임 방지용. 캡으로 폭주는 차단됨 */
          herb.vx += nxn * 0.15;
          herb.vy += nyn * 0.15;
        }

        /* 최대 속도 캡 — 어떤 조합이 와도 이 속도를 넘지 못함 */
        var MAX_HERB_SPEED = 1.7;
        var spdMag = Math.sqrt(herb.vx * herb.vx + herb.vy * herb.vy);
        if (spdMag > MAX_HERB_SPEED) {
          var k = MAX_HERB_SPEED / spdMag;
          herb.vx *= k;
          herb.vy *= k;
        }

        /* 어느 손이든 핀치 중이고 가까우면 그 손이 잡음 */
        for (var gk = 0; gk < handsList.length && gk < 2; gk++) {
          if (tangGrabs[gk].active) continue;  /* 이미 다른 약재 잡고 있음 */
          var h = handsList[gk];
          if (!h.pos.pinching) continue;
          var gdx = h.pos.x - herb.x, gdy = h.pos.y - herb.y;
          if (Math.sqrt(gdx * gdx + gdy * gdy) < GRAB_DIST) {
            herb.grabbed = true;
            tangGrabs[gk].active = true;
            tangGrabs[gk].herbIdx = i;
            break;
          }
        }
      }
      drawHerb(herb);
    }
  }

  /* 탕 모드: 손 골격 직접 렌더링
     - 21개 랜드마크를 점으로, HAND_BONES 연결을 선으로
     - 미러 좌표계: x = (1 - lm.x) * cw
     - 핀치 시: 따뜻한 황금색 + 엄지~검지 사이 발광 링 */
  function drawTangHandSkeleton(x, y, pinching, pos) {
    drawTangHandSkeletonFor(handLandmarks, pinching);
  }
  function drawTangHandSkeletonFor(landmarks, pinching) {
    if (!landmarks || landmarks.length < 21) return;
    var cw = canvas.cssW, ch = canvas.cssH;
    /* 픽셀 좌표로 변환 */
    var pts = new Array(21);
    for (var i = 0; i < 21; i++) {
      var lm = landmarks[i];
      pts[i] = { x: (1 - lm.x) * cw, y: lm.y * ch };
    }

    /* 색상 팔레트 — 가늘고 우아하게 */
    var boneColor   = pinching ? 'rgba(255, 210, 110, 0.95)' : 'rgba(255, 255, 255, 0.78)';
    var boneGlow    = pinching ? 'rgba(255, 180, 60, 0.30)'  : 'rgba(200, 230, 255, 0.18)';
    var jointFill   = pinching ? 'rgba(255, 235, 160, 1)'    : 'rgba(255, 255, 255, 0.95)';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* 1) 뼈대 외곽 글로우 (얇게) */
    ctx.strokeStyle = boneGlow;
    ctx.lineWidth = 6;
    for (var b = 0; b < HAND_BONES.length; b++) {
      var a = pts[HAND_BONES[b][0]], c = pts[HAND_BONES[b][1]];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
    }
    /* 2) 뼈대 본선 — 가는 라인 */
    ctx.strokeStyle = boneColor;
    ctx.lineWidth = 1.8;
    for (var b2 = 0; b2 < HAND_BONES.length; b2++) {
      var a2 = pts[HAND_BONES[b2][0]], c2 = pts[HAND_BONES[b2][1]];
      ctx.beginPath(); ctx.moveTo(a2.x, a2.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
    }

    /* 3) 관절 점 — 슬림 */
    var jointSize = {
      0: 5,                                          /* 손목 */
      1: 2.5, 2: 2.5, 3: 2.5, 4: 3.5,                /* 엄지 */
      5: 3.5, 6: 2.5, 7: 2.5, 8: 3.5,                /* 검지 */
      9: 3.5, 10: 2.5, 11: 2.5, 12: 3,               /* 중지 */
      13: 3.5, 14: 2.5, 15: 2.5, 16: 3,              /* 약지 */
      17: 3.5, 18: 2.5, 19: 2.5, 20: 3               /* 소지 */
    };
    for (var j = 0; j < 21; j++) {
      var p = pts[j];
      var r = jointSize[j] || 2.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = jointFill; ctx.fill();
    }

    /* 4) 핀치 인디케이터: 엄지(4) + 검지(8) 중간점에 작은 맥동 링 */
    if (pinching) {
      var thumb = pts[4], idx = pts[8];
      var midX = (thumb.x + idx.x) / 2;
      var midY = (thumb.y + idx.y) / 2;
      var pulse = 1 + Math.sin(Date.now() * 0.012) * 0.18;
      ctx.beginPath(); ctx.arc(midX, midY, 14 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 200, 90, 0.7)'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 245, 200, 1)'; ctx.fill();
    }

    ctx.restore();
  }

  /* 손가락별 색상: [엄지, 검지, 중지, 약지, 소지] */
  var FINGER_COLORS = [
    'rgba(255, 110, 90, 0.88)',   // 엄지 — 빨강
    'rgba(255, 220, 70, 0.95)',   // 검지 — 노랑 (주 커서)
    'rgba(90, 220, 130, 0.88)',   // 중지 — 초록
    'rgba(90, 160, 255, 0.88)',   // 약지 — 파랑
    'rgba(210, 100, 255, 0.88)'   // 소지 — 보라
  ];

  function drawHandCursor(x, y, pinching, pos) {
    /* 탕·환·산 모드: 손 골격(점+선) 직접 렌더링 */
    if ((currentType === 'tang' || currentType === 'hwan' || currentType === 'san') && handLandmarks) {
      drawTangHandSkeleton(x, y, pinching, pos);
      return;
    }
    ctx.save();
    /* 검지 끝 기준 커서 링 */
    ctx.beginPath(); ctx.arc(x, y, pinching ? 18 : 22, 0, Math.PI * 2);
    ctx.strokeStyle = pinching ? 'rgba(255, 180, 50, 0.95)' : 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = pinching ? 4 : 2; ctx.stroke();
    if (pinching) {
      ctx.fillStyle = 'rgba(255, 180, 50, 0.18)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 220, 100, 0.9)'; ctx.fill();
    }
    /* 5개 손가락 끝 점 */
    var tips = pos && pos.fingertips;
    var exts = pos && pos.extensions;
    if (tips) {
      for (var fi = 0; fi < tips.length; fi++) {
        var ft = tips[fi];
        var isExt = exts ? exts[fi] : true;
        ctx.beginPath(); ctx.arc(ft.x, ft.y, fi === 1 ? 9 : 7, 0, Math.PI * 2);
        ctx.fillStyle = FINGER_COLORS[fi];
        ctx.globalAlpha = isExt ? 0.9 : 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else if (handLandmarks) {
      /* fallback: 기존 엄지+검지만 표시 */
      var cw0 = canvas.cssW, ch0 = canvas.cssH;
      [4, 8].forEach(function (idx) {
        var lm = handLandmarks[idx];
        ctx.beginPath(); ctx.arc((1 - lm.x) * cw0, lm.y * ch0, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'; ctx.fill();
      });
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════
     공통: 단일 약재 완료 처리 (산/환/고/단 공용)
     ══════════════════════════════════════ */
  function consumeHerbAt(idx, fxX, fxY, color) {
    if (idx < 0 || idx >= currentHerbObjs.length) return;
    var h = currentHerbObjs[idx];
    if (!h || collectedHerbs.indexOf(h.id) >= 0) return;
    collectedHerbs.push(h.id);
    markRxSlotCollected(h.id);
    spawnCollectParticles(fxX, fxY, color || 'rgba(255, 210, 80, 0.9)');

    var dose = (currentDoses && currentDoses[idx]) ? currentDoses[idx] : '';
    var thumbSrc = '';
    if (typeof window.getThumbnailForHerb === 'function') thumbSrc = window.getThumbnailForHerb(h) || '';
    var tag = document.createElement('div');
    tag.className = 'herb-game-collected-tag';
    var thumbHtml = thumbSrc ? '<img src="' + thumbSrc + '" alt="" class="herb-game-collected-img">' : '';
    var doseHtml = dose ? '<span class="herb-game-collected-dose">' + dose + '</span>' : '';
    tag.innerHTML = thumbHtml + '<span>' + stripParen(h.korean_name || '') + '</span>' + doseHtml;
    if (collectedEl) collectedEl.appendChild(tag);
    setTimeout(function () {
      tag.classList.add('fade-out');
      tag.addEventListener('animationend', function () { if (tag.parentNode) tag.parentNode.removeChild(tag); });
    }, 2000);
    if (navigator.vibrate) navigator.vibrate(80);
    updateProgress();
  }

  function checkAllDone() {
    if (completeFired) return true;
    if (collectedHerbs.length >= currentHerbObjs.length) {
      completeFired = true;
      var sess = gameSession;
      setTimeout(function () {
        if (gameSession !== sess) return;
        spawnCelebration();
        setTimeout(function () { if (gameSession === sess) showComplete(); }, 1800);
      }, 400);
      return true;
    }
    return false;
  }

  /* 한 손 위치만 빠르게 추출 (cw,ch 좌표계) */
  function getMainHand(cw, ch) {
    var pos = getHandPosFrom(handLandmarks, cw, ch);
    if (pos && pos.x >= 0) drawHandCursor(pos.x, pos.y, pos.pinching, pos);
    return pos;
  }

  /* 두 손 (단모드) 좌/우 분리 — x좌표 기준 */
  function getTwoHands(cw, ch) {
    var arr = [];
    for (var i = 0; i < allHands.length; i++) {
      var p = getHandPosFrom(allHands[i], cw, ch);
      if (p) arr.push(p);
    }
    arr.sort(function (a, b) { return a.x - b.x; });
    return { left: arr[0] || null, right: arr[1] || null };
  }

  /* ══════════════════════════════════════
     [환] 빚기 — 1) 핀치+오른쪽 끌기로 떼내기 → 2) 중앙에서 시계방향 굴리기
     배경: whan_background.mp4의 프레임을 미리 캐싱해 진행률에 따라 표시
     ══════════════════════════════════════ */
  var HWAN_MAX_FRAMES = 70;
  /* 프레임 구간: 떼내기 0~0.20, 굴리기 0.20~0.70, 옮기기 0.70~1.0 */
  var HWAN_TEAR_PORTION  = 0.20;
  var HWAN_ROLL_PORTION  = 0.50;
  var HWAN_CARRY_PORTION = 0.30;
  var HWAN_TEAR_DISTANCE  = 180;            // 떼내기 가로 이동(px)
  var HWAN_ROLL_REQUIRED  = Math.PI * 2;    // 굴리기 한 바퀴
  var HWAN_CARRY_DISTANCE = 600;            // 트레이로 옮기는 가로 이동(px)

  function setupHwanMode() {
    hwanState = {
      phase: 'tear',           // 'tear' | 'roll' | 'carry' | 'done'
      tearAccum: 0,
      rollAccum: 0,
      carryAccum: 0,
      lastAng: null,
      lastHandX: null,
      pulse: 0,

      frames: [],
      frameIdx: 0,
      framesReady: false,
      loadingProgress: 0,

      hintTick: 0
    };
    preloadHwanFrames();
  }

  function preloadHwanFrames() {
    var src = document.getElementById('herb-game-hwan-source');
    if (!src) return;
    var st = hwanState;

    function start() {
      var off = document.createElement('canvas');
      off.width = src.videoWidth || 1280;
      off.height = src.videoHeight || 720;
      var offCtx = off.getContext('2d');
      var captured = [];
      var dur = src.duration || 5;
      var useRvfc = typeof src.requestVideoFrameCallback === 'function';
      st.loadingProgress = 0;

      function snapshot(t) {
        offCtx.drawImage(src, 0, 0);
        var snap = document.createElement('canvas');
        snap.width = off.width; snap.height = off.height;
        snap.getContext('2d').drawImage(off, 0, 0);
        captured.push({ time: t, snap: snap });
        st.loadingProgress = captured.length;
      }

      src.muted = true;
      src.playbackRate = 2;
      try { src.currentTime = 0; } catch (e) {}

      function onEnd() {
        try { src.pause(); } catch (e) {}
        captured.sort(function (a, b) { return a.time - b.time; });
        var down = captured;
        if (captured.length > HWAN_MAX_FRAMES) {
          down = [];
          for (var i = 0; i < HWAN_MAX_FRAMES; i++) {
            var s = Math.round((i / (HWAN_MAX_FRAMES - 1)) * (captured.length - 1));
            down.push(captured[s]);
          }
        }
        st.frames = down.map(function (c) { return c.snap; });
        st.framesReady = true;
      }

      src.addEventListener('ended', onEnd, { once: true });

      if (useRvfc) {
        function onFrame(now, meta) {
          snapshot(meta.mediaTime);
          if (!src.ended) src.requestVideoFrameCallback(onFrame);
        }
        src.requestVideoFrameCallback(onFrame);
      } else {
        function loop() {
          if (src.ended || st.framesReady) return;
          snapshot(src.currentTime);
          requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
      }
      var p = src.play();
      if (p && p.catch) p.catch(function () { onEnd(); });
      setTimeout(function () { if (!st.framesReady) onEnd(); }, (dur / src.playbackRate) * 1000 + 1500);
    }

    if (src.readyState >= 2) start();
    else src.addEventListener('loadeddata', start, { once: true });
  }

  function getHwanDoughCenter(cw, ch) {
    /* 영상에서 도마는 좌측 약 22% 지점에 위치 */
    return { x: cw * 0.22, y: ch * 0.50 };
  }
  function getHwanTrayCenter(cw, ch) {
    /* 영상에서 트레이는 우측 약 72% 지점 (책 패널 위에 가려질 수 있음) */
    return { x: cw * 0.72, y: ch * 0.55 };
  }
  function getHwanRollCenter(cw, ch) {
    /* 떼낸 후 굴리는 위치 = 화면 중앙 (책 패널 좌측에 가려지지 않도록 살짝 좌측) */
    return { x: cw * 0.40, y: ch * 0.55 };
  }

  function cycleRatioHwan(st) {
    if (st.phase === 'tear') {
      return Math.min(1, st.tearAccum / HWAN_TEAR_DISTANCE) * HWAN_TEAR_PORTION;
    }
    if (st.phase === 'roll') {
      var roll = Math.min(1, st.rollAccum / HWAN_ROLL_REQUIRED);
      return HWAN_TEAR_PORTION + roll * HWAN_ROLL_PORTION;
    }
    if (st.phase === 'carry') {
      var carry = Math.min(1, st.carryAccum / HWAN_CARRY_DISTANCE);
      return HWAN_TEAR_PORTION + HWAN_ROLL_PORTION + carry * HWAN_CARRY_PORTION;
    }
    return 1;
  }

  function updateHwanMode(cw, ch) {
    if (!hwanState) setupHwanMode();
    var st = hwanState;
    st.hintTick++;

    var doughC = getHwanDoughCenter(cw, ch);
    var rollC  = getHwanRollCenter(cw, ch);
    var trayC  = getHwanTrayCenter(cw, ch);

    /* 1) 배경 프레임 먼저 그림 — 손/힌트가 그 위에 보이도록 */
    drawHwanBgFrame(cw, ch);

    /* 2) 손 추적 (getMainHand 내부에서 손 골격 렌더) */
    var pos = getMainHand(cw, ch);

    /* 3) 상태 업데이트 — 페이즈별 입력 처리 */
    if (st.phase === 'tear' && pos && pos.x >= 0) {
      var inZoneT = Math.hypot(pos.x - doughC.x, pos.y - doughC.y) < 240;
      var pinchT = !!pos.pinching;
      if (inZoneT && pinchT && st.lastHandX !== null) {
        var dxT = pos.x - st.lastHandX;
        if (dxT > 0) st.tearAccum += dxT;
      }
      st.lastHandX = pos.x;
      st.lastAng = null;
      if (st.tearAccum >= HWAN_TEAR_DISTANCE) {
        st.phase = 'roll';
        st.lastHandX = null;
      }
    } else if (st.phase === 'roll' && pos && pos.x >= 0) {
      var dxR = pos.x - rollC.x, dyR = pos.y - rollC.y;
      if (Math.hypot(dxR, dyR) < 240) {
        var ang = Math.atan2(dyR, dxR);
        if (st.lastAng !== null) {
          var d = ang - st.lastAng;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          if (d > 0) st.rollAccum += d;
        }
        st.lastAng = ang;
      } else {
        st.lastAng = null;
      }
      if (st.rollAccum >= HWAN_ROLL_REQUIRED) {
        st.phase = 'carry';
        st.lastHandX = null;
      }
    } else if (st.phase === 'carry' && pos && pos.x >= 0) {
      /* 굴린 환을 핀치해서 트레이 쪽(우측)으로 끌어가기 */
      var inZoneC = pos.x > rollC.x - 200; // 굴리기 위치~트레이 사이의 전 구간 허용
      var pinchC = !!pos.pinching;
      if (inZoneC && pinchC && st.lastHandX !== null) {
        var dxC = pos.x - st.lastHandX;
        if (dxC > 0) st.carryAccum += dxC;
      }
      st.lastHandX = pos.x;
      st.lastAng = null;
      if (st.carryAccum >= HWAN_CARRY_DISTANCE) {
        st.phase = 'done';
        for (var k = 0; k < currentHerbObjs.length; k++) {
          consumeHerbAt(k, trayC.x + (k - currentHerbObjs.length / 2) * 14, trayC.y, 'rgba(220, 140, 70, 0.9)');
        }
      }
    } else if (!pos || pos.x < 0) {
      st.lastAng = null; st.lastHandX = null;
    }

    /* 4) 프레임 인덱스 갱신 */
    if (st.framesReady && st.frames.length > 0) {
      var ratio = st.phase === 'done' ? 1 : cycleRatioHwan(st);
      var idx = Math.min(st.frames.length - 1, Math.floor(ratio * (st.frames.length - 1)));
      st.frameIdx = idx;
    }

    /* 5) 모션 힌트 인포그래픽 — 손 위에 살짝 떠 있도록 */
    if (st.phase === 'tear') drawTearHint(doughC, st);
    else if (st.phase === 'roll') drawRollHint(rollC, st);
    else if (st.phase === 'carry') drawCarryHint(rollC, trayC, st);

    if (st.phase === 'done') checkAllDone();
  }

  function drawHwanBgFrame(cw, ch) {
    var st = hwanState;
    if (st.framesReady && st.frames[st.frameIdx]) {
      var img = st.frames[st.frameIdx];
      var scale = Math.max(cw / img.width, ch / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      var dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#1a0e04';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#d9b97a';
      ctx.font = '14px "Apple SD Gothic Neo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('작업대 준비 중… ' + st.loadingProgress, cw / 2, ch / 2);
    }
  }

  /* 떼내기 인포그래픽 — 엄지+검지 핀치 + 오른쪽 화살표 (둥둥 떠 있음) */
  function drawTearHint(c, st) {
    var t = st.hintTick * 0.06;
    var sway = Math.sin(t) * 6;
    var alpha = 0.45 + Math.sin(t * 0.7) * 0.15;
    var cx = c.x + sway, cy = c.y - 110;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);

    /* 핀치 손가락 (간단한 V 모양) */
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.95)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    /* 검지 */
    ctx.beginPath(); ctx.moveTo(-14, -22); ctx.lineTo(-2, -6); ctx.stroke();
    /* 엄지 */
    ctx.beginPath(); ctx.moveTo(12, -22); ctx.lineTo(2, -6); ctx.stroke();
    /* 핀치 점 */
    ctx.fillStyle = 'rgba(255, 200, 80, 0.95)';
    ctx.beginPath(); ctx.arc(0, -4, 4.5, 0, Math.PI * 2); ctx.fill();

    /* 오른쪽 화살표 */
    ctx.strokeStyle = 'rgba(255, 220, 130, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(12, 18); ctx.lineTo(70 + Math.sin(t * 1.5) * 6, 18);
    ctx.stroke();
    ctx.setLineDash([]);
    /* 화살촉 */
    ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
    var ax = 70 + Math.sin(t * 1.5) * 6;
    ctx.beginPath();
    ctx.moveTo(ax, 18); ctx.lineTo(ax - 10, 12); ctx.lineTo(ax - 10, 24);
    ctx.closePath(); ctx.fill();

    ctx.restore();

    /* 진행 게이지 — 떼내기 */
    drawHwanGauge(c.x, c.y + 130, st.tearAccum / HWAN_TEAR_DISTANCE, '엄지+검지로 집고 오른쪽으로 끌어내세요');
  }

  /* 굴리기 인포그래픽 — 원형 회전 화살표 */
  function drawRollHint(c, st) {
    var t = st.hintTick * 0.04;
    var alpha = 0.55;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(t);
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = 'rgba(255, 220, 130, 0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 70, -Math.PI * 0.9, Math.PI * 0.9);
    ctx.stroke();
    ctx.setLineDash([]);

    /* 화살촉 */
    var ax = Math.cos(Math.PI * 0.9) * 70;
    var ay = Math.sin(Math.PI * 0.9) * 70;
    ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
    ctx.translate(ax, ay);
    ctx.rotate(Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-10, -6); ctx.lineTo(-10, 6);
    ctx.closePath(); ctx.fill();

    ctx.restore();

    drawHwanGauge(c.x, c.y + 120, st.rollAccum / HWAN_ROLL_REQUIRED, '손을 시계 방향으로 굴리세요');
  }

  /* 옮기기 인포그래픽 — 굴리기 위치(from)에서 트레이(to)로 핀치+드래그 */
  function drawCarryHint(from, to, st) {
    var t = st.hintTick * 0.06;
    var sway = Math.sin(t) * 4;
    var alpha = 0.45 + Math.sin(t * 0.7) * 0.15;

    /* 핀치 손가락 (from 위치) */
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(from.x, from.y - 100 + sway);
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.95)';
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, -22); ctx.lineTo(-2, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -22); ctx.lineTo(2, -6); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 200, 80, 0.95)';
    ctx.beginPath(); ctx.arc(0, -4, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* from → to 점선 화살표 (애니메이션 흐름) */
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255, 220, 130, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -t * 12;
    ctx.beginPath();
    ctx.moveTo(from.x + 30, from.y - 90);
    ctx.lineTo(to.x - 40, to.y - 60);
    ctx.stroke();
    ctx.setLineDash([]);
    /* 화살촉 */
    ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
    var ang = Math.atan2((to.y - 60) - (from.y - 90), (to.x - 40) - (from.x + 30));
    ctx.translate(to.x - 40, to.y - 60);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-12, -6); ctx.lineTo(-12, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    /* 진행 게이지는 중앙 아래 */
    var mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2 + 100;
    drawHwanGauge(mx, my, st.carryAccum / HWAN_CARRY_DISTANCE, '엄지+검지로 환을 집어 트레이로 옮기세요');
  }

  function drawHwanGauge(cx, cy, prog, label) {
    prog = Math.max(0, Math.min(1, prog));
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(cx - 90, cy, 180, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(240, 180, 80, 0.95)';
    ctx.beginPath(); ctx.roundRect(cx - 90, cy, 180 * prog, 8, 4); ctx.fill();
    ctx.fillStyle = '#f3e6c5';
    ctx.font = '12px "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText(label, cx, cy + 28);
    ctx.restore();
  }

  /* ══════════════════════════════════════
     [산] 빻고 붓기 — 1) 주먹 위아래로 빻기 → 2) 손을 좌→우로 옮겨 절구 기울여 붓기
     배경: san_background.mp4 프레임 캐시를 진행률로 스크럽
     ══════════════════════════════════════ */
  var SAN_MAX_FRAMES = 70;
  var SAN_POUND_PORTION = 0.52;       // 영상 앞 52% = 빻기 구간
  /* 붓기 — 손 이동 가능 범위를 넓혀 같은 영상 구간을 더 천천히 스크럽 */
  var SAN_POUR_X_START = 0.15;
  var SAN_POUR_X_END   = 0.85;
  /* 빻기 — 한 번의 찧기 = 3번의 빠른 스윙 */
  var SAN_SWINGS_PER_POUND = 3;

  function setupSanMode() {
    var herbsN = Math.max(1, currentHerbObjs.length);
    sanState = {
      phase: 'pound',                // 'pound' | 'pour' | 'done'
      poundRequired: 3,               // 찧기 영상 3번 반복
      poundCount: 0,
      swingCount: 0,                  // 현재 찧기 내 스윙 (0~3 → 한 사이클)
      swingsPerPound: SAN_SWINGS_PER_POUND,
      hitsPerHerb: Math.max(1, Math.ceil(3 / Math.max(1, herbsN))),
      consumedIdx: 0,
      pourProgress: 0,                // 실제 진행도 (스무딩됨)
      pourTarget: 0,                  // 손 위치로 결정된 목표값
      pourStarted: false,

      lastFistY: null,
      fistDir: 0,
      dirChangeY: null,
      lastPoundT: 0,
      fistGrace: 0,                  // 짧은 트래킹 끊김 동안 주먹 상태 유지
      lostFrames: 0,                 // 손 미감지 프레임 수

      frames: [],
      frameIdx: 0,
      framesReady: false,
      loadingProgress: 0,
      hintTick: 0
    };
    preloadSanFrames();
  }

  function preloadSanFrames() {
    var src = document.getElementById('herb-game-san-source');
    if (!src) return;
    var st = sanState;

    function start() {
      var off = document.createElement('canvas');
      off.width = src.videoWidth || 1280;
      off.height = src.videoHeight || 720;
      var offCtx = off.getContext('2d');
      var captured = [];
      var dur = src.duration || 5;
      var useRvfc = typeof src.requestVideoFrameCallback === 'function';
      st.loadingProgress = 0;

      function snapshot(t) {
        offCtx.drawImage(src, 0, 0);
        var snap = document.createElement('canvas');
        snap.width = off.width; snap.height = off.height;
        snap.getContext('2d').drawImage(off, 0, 0);
        captured.push({ time: t, snap: snap });
        st.loadingProgress = captured.length;
      }

      src.muted = true;
      src.playbackRate = 2;
      try { src.currentTime = 0; } catch (e) {}

      function onEnd() {
        try { src.pause(); } catch (e) {}
        captured.sort(function (a, b) { return a.time - b.time; });
        var down = captured;
        if (captured.length > SAN_MAX_FRAMES) {
          down = [];
          for (var i = 0; i < SAN_MAX_FRAMES; i++) {
            var s = Math.round((i / (SAN_MAX_FRAMES - 1)) * (captured.length - 1));
            down.push(captured[s]);
          }
        }
        st.frames = down.map(function (c) { return c.snap; });
        st.framesReady = true;
      }

      src.addEventListener('ended', onEnd, { once: true });

      if (useRvfc) {
        function onFrame(now, meta) {
          snapshot(meta.mediaTime);
          if (!src.ended) src.requestVideoFrameCallback(onFrame);
        }
        src.requestVideoFrameCallback(onFrame);
      } else {
        function loop() {
          if (src.ended || st.framesReady) return;
          snapshot(src.currentTime);
          requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
      }
      var p = src.play();
      if (p && p.catch) p.catch(function () { onEnd(); });
      setTimeout(function () { if (!st.framesReady) onEnd(); }, (dur / src.playbackRate) * 1000 + 1500);
    }

    if (src.readyState >= 2) start();
    else src.addEventListener('loadeddata', start, { once: true });
  }

  function getSanMortarCenter(cw, ch) {
    /* 영상의 절구 위치 = 좌측 약 35% 지점 */
    return { x: cw * 0.35, y: ch * 0.55 };
  }
  function getSanPaperCenter(cw, ch) {
    /* 영상의 한지 위치 = 우측 약 70% 지점 */
    return { x: cw * 0.70, y: ch * 0.58 };
  }

  function cycleRatioSan(st) {
    if (st.phase === 'pound') {
      /* 매 찧기마다 빻기 영상을 0 → POUND_PORTION 으로 재생 반복 */
      var within = Math.min(1, st.swingCount / st.swingsPerPound);
      return within * SAN_POUND_PORTION;
    }
    if (st.phase === 'pour') {
      return SAN_POUND_PORTION + Math.min(1, st.pourProgress) * (1 - SAN_POUND_PORTION);
    }
    return 1;
  }

  /* 주먹 판정 — 손가락 4개의 tip이 PIP보다 손바닥 쪽으로 굽었는지 */
  function isHandFist(lm) {
    if (!lm || lm.length < 21) return false;
    var palm = lm[0];
    var tips = [8, 12, 16, 20];
    var pips = [6, 10, 14, 18];
    var curled = 0;
    for (var i = 0; i < 4; i++) {
      var tip = lm[tips[i]], pip = lm[pips[i]];
      var dTip = Math.hypot(tip.x - palm.x, tip.y - palm.y);
      var dPip = Math.hypot(pip.x - palm.x, pip.y - palm.y);
      if (dTip < dPip) curled++;
    }
    return curled >= 3;
  }

  function updateSanMode(cw, ch) {
    if (!sanState) setupSanMode();
    var st = sanState;
    st.hintTick++;

    var mortarC = getSanMortarCenter(cw, ch);
    var paperC  = getSanPaperCenter(cw, ch);

    /* 1) 배경 프레임 */
    drawSanBgFrame(cw, ch);

    /* 2) 손 추적 (커서·골격 렌더 포함) */
    var pos = getMainHand(cw, ch);
    var fist = handLandmarks ? isHandFist(handLandmarks) : false;

    /* 3) 페이즈별 입력 처리 */
    if (st.phase === 'pound' && pos && pos.x >= 0) {
      var dx = pos.x - mortarC.x;
      var dy = pos.y - mortarC.y;
      /* x는 절구 좌우 ±320px, y는 절구 위쪽 -800 / 아래쪽 +400 — 손을 머리 위까지 들어도 인식 */
      var inZone = Math.abs(dx) < 320 && dy < 400 && dy > -800;
      /* 빠른 스윙 중에는 주먹 인식이 살짝 불안정할 수 있으므로
         이전 프레임이 주먹이었으면 잠깐 주먹으로 간주 (관성) */
      if (fist) st.fistGrace = 5;
      else if (st.fistGrace > 0) st.fistGrace--;
      var fistActive = fist || st.fistGrace > 0;

      if (inZone && fistActive) {
        if (st.lastFistY !== null) {
          var dyMove = pos.y - st.lastFistY;
          var newDir = st.fistDir;
          if (dyMove > 2) newDir = 1;
          else if (dyMove < -2) newDir = -1;

          if (newDir !== 0 && newDir !== st.fistDir) {
            /* 내려갔다가 올라오는 전환 = 1 스윙 */
            if (st.fistDir === 1 && newDir === -1 && st.dirChangeY !== null) {
              var swing = Math.abs(pos.y - st.dirChangeY);
              if (swing > 12 && (performance.now() - st.lastPoundT) > 80) {
                st.swingCount++;
                st.lastPoundT = performance.now();
                spawnCollectParticles(mortarC.x, mortarC.y, 'rgba(220, 200, 160, 0.85)');
                if (navigator.vibrate) navigator.vibrate(20);
                /* 3 스윙 = 1 찧기 사이클 완성 */
                if (st.swingCount >= st.swingsPerPound) {
                  st.poundCount++;
                  st.swingCount = 0;
                  /* hitsPerHerb 마다 약재 1개씩 소진 */
                  var targetIdx = Math.min(currentHerbObjs.length - 1,
                                           Math.floor(st.poundCount / st.hitsPerHerb));
                  while (st.consumedIdx <= targetIdx && st.consumedIdx < currentHerbObjs.length) {
                    consumeHerbAt(st.consumedIdx, mortarC.x, mortarC.y, 'rgba(220, 180, 140, 0.9)');
                    st.consumedIdx++;
                  }
                  if (st.poundCount >= st.poundRequired) {
                    st.phase = 'pour';
                    st.pourStarted = false;
                    /* 빻기 마지막 프레임 유지를 위해 진행도 1로 고정 */
                    st.swingCount = st.swingsPerPound;
                  }
                }
              }
            }
            st.dirChangeY = pos.y;
            st.fistDir = newDir;
          } else if (st.fistDir === 0 && newDir !== 0) {
            st.fistDir = newDir;
            st.dirChangeY = pos.y;
          }
        }
        st.lastFistY = pos.y;
      } else {
        st.lastFistY = null;
        st.fistDir = 0;
      }
    } else if (st.phase === 'pour' && pos && pos.x >= 0) {
      var xRatio = pos.x / cw;
      if (!st.pourStarted) {
        if (xRatio < SAN_POUR_X_START + 0.08) st.pourStarted = true;
      } else {
        var span = SAN_POUR_X_END - SAN_POUR_X_START;
        var prog = Math.max(0, Math.min(1, (xRatio - SAN_POUR_X_START) / span));
        if (prog > st.pourTarget) st.pourTarget = prog;
      }
    } else if (!pos || pos.x < 0) {
      /* 손이 잠깐 안 잡혀도 즉시 리셋하지 않음 — 6프레임(~200ms)까지 유지 */
      st.lostFrames = (st.lostFrames || 0) + 1;
      if (st.lostFrames > 6) {
        st.lastFistY = null; st.fistDir = 0;
      }
    }
    if (pos && pos.x >= 0) st.lostFrames = 0;

    /* 3b) 붓기 진행도 — 시작되면 자동으로 끝까지 진행, 손 입력은 가속 역할 */
    if (st.phase === 'pour') {
      if (st.pourStarted) {
        /* 손 기반 목표 추격 + 자동 진행 (어떤 시점에도 멈추지 않도록) */
        var diff = st.pourTarget - st.pourProgress;
        if (diff > 0) st.pourProgress += diff * 0.06;
        st.pourProgress = Math.min(1, st.pourProgress + 0.008);  // 자동 진행
      }
      if (st.pourProgress >= 0.95 && st.phase !== 'done') {
        st.pourProgress = 1;
        while (st.consumedIdx < currentHerbObjs.length) {
          consumeHerbAt(st.consumedIdx, paperC.x, paperC.y, 'rgba(220, 180, 140, 0.9)');
          st.consumedIdx++;
        }
        st.phase = 'done';
        checkAllDone();
      }
    }

    /* 4) 프레임 인덱스 */
    if (st.framesReady && st.frames.length > 0) {
      var ratio = st.phase === 'done' ? 1 : cycleRatioSan(st);
      var idx = Math.min(st.frames.length - 1, Math.floor(ratio * (st.frames.length - 1)));
      st.frameIdx = idx;
    }

    /* 5) 페이즈 힌트 */
    if (st.phase === 'pound') drawSanPoundHint(mortarC, st);
    else if (st.phase === 'pour') drawSanPourHint(mortarC, paperC, st);
  }

  function drawSanBgFrame(cw, ch) {
    var st = sanState;
    if (st.framesReady && st.frames[st.frameIdx]) {
      var img = st.frames[st.frameIdx];
      var scale = Math.max(cw / img.width, ch / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      var dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#1a0e04';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#d9b97a';
      ctx.font = '14px "Apple SD Gothic Neo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('작업대 준비 중… ' + st.loadingProgress, cw / 2, ch / 2);
    }
  }

  function drawSanPoundHint(c, st) {
    var t = st.hintTick * 0.06;
    var bob = Math.sin(t) * 14;
    var alpha = 0.55 + Math.sin(t * 0.7) * 0.12;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(c.x, c.y - 130);
    /* 위/아래 화살표 (주먹 위아래 동작 안내) */
    ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
    ctx.strokeStyle = 'rgba(255, 220, 140, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.translate(0, bob);
    ctx.beginPath();
    ctx.moveTo(0, -36); ctx.lineTo(14, -16); ctx.lineTo(6, -16);
    ctx.lineTo(6, 16);  ctx.lineTo(-6, 16);  ctx.lineTo(-6, -16);
    ctx.lineTo(-14, -16);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 36); ctx.lineTo(-14, 16); ctx.lineTo(-6, 16);
    ctx.lineTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(6, 16);
    ctx.lineTo(14, 16);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    var gaugeProg = (st.poundCount + st.swingCount / st.swingsPerPound) / st.poundRequired;
    drawSanGauge(c.x, c.y + 140,
                 gaugeProg,
                 '주먹을 쥐고 빠르게 절구를 찧으세요 (' + st.poundCount + ' / ' + st.poundRequired + ')');
  }

  function drawSanPourHint(from, to, st) {
    var t = st.hintTick * 0.06;
    var shift = Math.sin(t) * 20;
    var alpha = 0.55;
    ctx.save();
    ctx.globalAlpha = alpha;
    var mx = (from.x + to.x) / 2 + shift;
    var my = (from.y + to.y) / 2 - 90;
    ctx.strokeStyle = 'rgba(255, 220, 130, 0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x - 30, my); ctx.lineTo(to.x - 30, my);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
    var ax = to.x - 20;
    ctx.beginPath();
    ctx.moveTo(ax, my); ctx.lineTo(ax - 18, my - 12); ctx.lineTo(ax - 18, my + 12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    var mid = (from.x + to.x) / 2;
    drawSanGauge(mid, to.y + 110, st.pourProgress,
                 '손을 왼쪽에서 오른쪽으로 끌어 한지에 부으세요');
  }

  function drawSanGauge(cx, cy, prog, label) {
    prog = Math.max(0, Math.min(1, prog));
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(cx - 100, cy, 200, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(240, 180, 80, 0.95)';
    ctx.beginPath(); ctx.roundRect(cx - 100, cy, 200 * prog, 8, 4); ctx.fill();
    ctx.fillStyle = '#f3e6c5';
    ctx.font = '12px "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText(label, cx, cy + 28);
    ctx.restore();
  }

  /* ══════════════════════════════════════
     [고] 졸이기 — 손으로 큰 가마솥을 휘젓기
     ══════════════════════════════════════ */
  function setupGoMode() {
    goState = {
      cx: 0, cy: 0, potR: 130,
      lastAngle: null,
      accAngle: 0,
      perHerbAngle: Math.PI * 2 * 1.5,  // 약재 1종당 1.5바퀴
      herbsDone: 0,
      ladleAngle: 0,
      bubbles: []
    };
  }

  function updateGoMode(cw, ch) {
    if (!goState) setupGoMode();
    var st = goState;
    var cx = (LEFT_PANEL_W + (cw - RIGHT_PANEL_W)) / 2;
    var cy = ch / 2 + 40;
    st.cx = cx; st.cy = cy;

    var pos = getMainHand(cw, ch);
    if (pos && pos.x >= 0) {
      var ang = Math.atan2(pos.y - cy, pos.x - cx);
      if (st.lastAngle !== null) {
        var d = ang - st.lastAngle;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        var dist = Math.hypot(pos.x - cx, pos.y - cy);
        if (dist < st.potR + 50 && d > 0) {
          st.accAngle += d;
          st.ladleAngle = ang;
          /* 가끔 거품 생성 */
          if (Math.random() < 0.4) {
            st.bubbles.push({
              x: cx + (Math.random() - 0.5) * st.potR,
              y: cy + (Math.random() - 0.3) * st.potR * 0.5,
              r: 3 + Math.random() * 5, life: 1, decay: 0.02 + Math.random() * 0.02
            });
          }
        }
      }
      st.lastAngle = ang;
    } else {
      st.lastAngle = null;
    }

    /* 약재 1종당 일정 각도 누적 시 완료 */
    while (st.herbsDone < currentHerbObjs.length && st.accAngle >= st.perHerbAngle) {
      st.accAngle -= st.perHerbAngle;
      consumeHerbAt(st.herbsDone, cx, cy, 'rgba(180, 100, 40, 0.95)');
      st.herbsDone++;
    }

    drawGoScene(cw, ch);
    if (st.herbsDone >= currentHerbObjs.length) checkAllDone();
  }

  function drawGoScene(cw, ch) {
    var st = goState;
    var cx = st.cx, cy = st.cy, R = st.potR;

    /* 가마솥 받침 (불) */
    ctx.save();
    var fireGrad = ctx.createRadialGradient(cx, cy + R, 10, cx, cy + R, R + 30);
    fireGrad.addColorStop(0, 'rgba(255, 130, 30, 0.7)');
    fireGrad.addColorStop(0.5, 'rgba(220, 80, 20, 0.4)');
    fireGrad.addColorStop(1, 'rgba(40, 0, 0, 0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath(); ctx.arc(cx, cy + R, R + 30, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* 솥 본체 */
    ctx.save();
    var bodyGrad = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    bodyGrad.addColorStop(0, 'rgba(50, 40, 30, 0.95)');
    bodyGrad.addColorStop(1, 'rgba(20, 14, 8, 0.95)');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    /* 솥 안쪽 즙(점도 = 진행도) */
    var totalProg = (st.herbsDone + (st.accAngle / st.perHerbAngle)) / Math.max(1, currentHerbObjs.length);
    totalProg = Math.min(1, totalProg);
    ctx.shadowBlur = 0;
    var liquidGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, R - 18);
    /* 진행될수록 짙은 갈색→흑갈색 */
    var l1 = 'rgba(' + Math.round(180 - totalProg * 80) + ', ' + Math.round(120 - totalProg * 60) + ', ' + Math.round(50 - totalProg * 30) + ', 1)';
    var l2 = 'rgba(' + Math.round(80 - totalProg * 30) + ', ' + Math.round(40 - totalProg * 20) + ', ' + Math.round(15) + ', 1)';
    liquidGrad.addColorStop(0, l1);
    liquidGrad.addColorStop(1, l2);
    ctx.fillStyle = liquidGrad;
    ctx.beginPath(); ctx.arc(cx, cy, R - 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* 거품 업데이트/렌더 (얇은 표면 + 안쪽 광택 + 윗 하이라이트) */
    for (var i = st.bubbles.length - 1; i >= 0; i--) {
      var b = st.bubbles[i];
      b.life -= b.decay;
      b.r += 0.15;
      if (b.life <= 0) { st.bubbles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = b.life * 0.75;
      /* 얇은 막처럼 안쪽 그라디언트 채우기 */
      var bg = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
      bg.addColorStop(0, 'rgba(255, 240, 200, 0.55)');
      bg.addColorStop(0.6, 'rgba(255, 200, 130, 0.18)');
      bg.addColorStop(1, 'rgba(255, 180, 100, 0.05)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      /* 표면 라인 */
      ctx.strokeStyle = 'rgba(255, 230, 170, 0.9)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
      /* 좌상단 작은 광택 호 */
      ctx.strokeStyle = 'rgba(255, 255, 240, 0.85)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.7, Math.PI * 1.05, Math.PI * 1.45);
      ctx.stroke();
      ctx.restore();
    }

    /* 주걱 (현재 회전 각도 위치에 그림) */
    var ladleR = R - 30;
    var lx = cx + Math.cos(st.ladleAngle) * ladleR;
    var ly = cy + Math.sin(st.ladleAngle) * ladleR;
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 100, 50, 0.95)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy - R - 20); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.fillStyle = 'rgba(220, 170, 100, 0.95)';
    ctx.beginPath(); ctx.arc(lx, ly, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* 회전 가이드 (점선 원) */
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.35)';
    ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(cx, cy, ladleR, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* 진행 게이지 + 안내 */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(cx - 110, cy + R + 30, 220, 14, 7); ctx.fill();
    ctx.fillStyle = 'rgba(230, 150, 70, 0.95)';
    ctx.beginPath(); ctx.roundRect(cx - 110, cy + R + 30, 220 * totalProg, 14, 7); ctx.fill();
    ctx.fillStyle = '#f0d9a8'; ctx.font = 'bold 12px "Pretendard", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('농축 ' + Math.floor(totalProg * 100) + '%   (' + st.herbsDone + ' / ' + currentHerbObjs.length + ')', cx, cy + R + 64);
    ctx.font = '11px "Pretendard", sans-serif'; ctx.fillStyle = '#e8d5b5';
    ctx.fillText('손으로 솥 위를 시계 방향으로 휘저으세요', cx, cy + R + 84);
    ctx.restore();
  }

  /* ══════════════════════════════════════
     [단] 풀무질 — 양손을 펼쳤다 모았다
     ══════════════════════════════════════ */
  function setupDanMode() {
    danState = {
      idx: 0,
      puffs: 0,
      puffsRequired: 5,
      leftPhase: 'idle',   // 'open' | 'closed' | 'idle'
      rightPhase: 'idle',
      leftLastSpread: 0,
      rightLastSpread: 0,
      fireIntensity: 0,
      sparks: [],
      pellets: []
    };
  }

  function detectBellows(hand, lastSpread, phase) {
    /* 펼침 거리(spread) 변화로 open/closed 전환 감지, 한 사이클 = 1 puff */
    if (!hand) return { phase: 'idle', last: lastSpread, puff: false };
    var s = hand.spread;
    var puff = false;
    var newPhase = phase;
    var OPEN_T = 0.18, CLOSE_T = 0.10;
    if (s > OPEN_T && phase !== 'open') {
      if (phase === 'closed') puff = true;
      newPhase = 'open';
    } else if (s < CLOSE_T && phase !== 'closed') {
      newPhase = 'closed';
    } else if (phase === 'idle' && s > OPEN_T) {
      newPhase = 'open';
    }
    return { phase: newPhase, last: s, puff: puff };
  }

  function updateDanMode(cw, ch) {
    if (!danState) setupDanMode();
    var st = danState;
    var cx = (LEFT_PANEL_W + (cw - RIGHT_PANEL_W)) / 2;
    var cy = ch * 0.55;

    var two = getTwoHands(cw, ch);

    /* 양손 커서 */
    if (two.left)  drawHandCursor(two.left.x,  two.left.y,  two.left.pinching,  two.left);
    if (two.right) drawHandCursor(two.right.x, two.right.y, two.right.pinching, two.right);

    var L = detectBellows(two.left,  st.leftLastSpread,  st.leftPhase);
    var R = detectBellows(two.right, st.rightLastSpread, st.rightPhase);
    st.leftPhase = L.phase; st.leftLastSpread = L.last;
    st.rightPhase = R.phase; st.rightLastSpread = R.last;

    /* 풀무질 카운트 — 양손 합산 (각 손이 개별로 puff) */
    if (L.puff) registerDanPuff(cx, cy);
    if (R.puff) registerDanPuff(cx, cy);

    /* 화력: 손 펼침 상태 + 펼친 손가락 수(0~10) 비례 보너스 */
    var bothOpen = (st.leftPhase === 'open' && st.rightPhase === 'open');
    var anyOpen  = (st.leftPhase === 'open' || st.rightPhase === 'open');
    var target   = bothOpen ? 1 : (anyOpen ? 0.5 : 0.15);
    var lExt = two.left  ? (two.left.extendedCount  || 0) : 0;
    var rExt = two.right ? (two.right.extendedCount || 0) : 0;
    target = Math.min(1, target + ((lExt + rExt) / 10) * 0.25);
    st.fireIntensity += (target - st.fireIntensity) * 0.1;
    /* 작은 불꽃 입자 */
    if (Math.random() < st.fireIntensity * 0.7) {
      st.sparks.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + 70 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -1 - Math.random() * 2 - st.fireIntensity * 2,
        life: 1, decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 3
      });
    }

    drawDanScene(cw, ch, cx, cy);
    if (st.idx >= currentHerbObjs.length) checkAllDone();
  }

  function registerDanPuff(cx, cy) {
    var st = danState;
    if (st.idx >= currentHerbObjs.length) return;
    st.puffs++;
    if (navigator.vibrate) navigator.vibrate(30);
    spawnCollectParticles(cx, cy + 50, 'rgba(255, 140, 60, 0.85)');
    if (st.puffs >= st.puffsRequired) {
      var idx = st.idx;
      st.idx++; st.puffs = 0;
      /* 단(붉은 알약) 생성 */
      st.pellets.push({
        x: cx, y: cy, targetX: cx + 110 + (idx % 5) * 24,
        targetY: cy - 80 + Math.floor(idx / 5) * 24, settled: false
      });
      consumeHerbAt(idx, cx, cy, 'rgba(220, 60, 40, 0.95)');
    }
  }

  function drawDanScene(cw, ch, cx, cy) {
    var st = danState;

    /* 화로 받침 */
    ctx.save();
    ctx.fillStyle = 'rgba(20, 14, 8, 0.6)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 110, 130, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* 화로 본체 */
    ctx.save();
    var pot = ctx.createLinearGradient(0, cy + 30, 0, cy + 110);
    pot.addColorStop(0, 'rgba(70, 50, 30, 0.95)');
    pot.addColorStop(1, 'rgba(30, 20, 12, 0.95)');
    ctx.fillStyle = pot;
    ctx.beginPath();
    ctx.moveTo(cx - 110, cy + 110);
    ctx.lineTo(cx - 90, cy + 30);
    ctx.lineTo(cx + 90, cy + 30);
    ctx.lineTo(cx + 110, cy + 110);
    ctx.closePath();
    ctx.fill();
    /* 화로 입구 (검은 타원) */
    ctx.fillStyle = 'rgba(10, 6, 2, 1)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 30, 90, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* 불꽃 (강도에 비례) */
    var flameH = 50 + st.fireIntensity * 90;
    ctx.save();
    var flameGrad = ctx.createRadialGradient(cx, cy + 30, 8, cx, cy + 30 - flameH * 0.4, flameH);
    flameGrad.addColorStop(0, 'rgba(255, 240, 160, ' + (0.5 + st.fireIntensity * 0.5) + ')');
    flameGrad.addColorStop(0.4, 'rgba(255, 130, 30, ' + (0.6 + st.fireIntensity * 0.3) + ')');
    flameGrad.addColorStop(1, 'rgba(180, 30, 0, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10 - flameH * 0.2, 50 + st.fireIntensity * 30, flameH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* 불꽃 입자 (밝은 코어 + 노랑→주홍 헤일로) */
    for (var i = st.sparks.length - 1; i >= 0; i--) {
      var s = st.sparks[i];
      s.x += s.vx; s.y += s.vy; s.life -= s.decay; s.vy += 0.02;
      if (s.life <= 0) { st.sparks.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.shadowColor = 'rgba(255, 140, 40, 0.95)'; ctx.shadowBlur = 12;
      var sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 1.6);
      sg.addColorStop(0, 'rgba(255, 250, 220, 1)');
      sg.addColorStop(0.4, 'rgba(255, ' + Math.round(180 + s.life * 60) + ', 70, 0.95)');
      sg.addColorStop(1, 'rgba(220, 60, 0, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    /* 화로 위 약재 (현재) */
    if (st.idx < currentHerbObjs.length) {
      var bob = Math.sin(Date.now() * 0.004) * 6;
      var hx = cx, hy = cy - 60 + bob;
      ctx.save();
      ctx.shadowColor = 'rgba(255, 180, 80, 0.8)'; ctx.shadowBlur = 18;
      drawSphere3D(hx, hy, 22, {
        light: 'rgba(240, 200, 130, 1)',
        mid:   'rgba(180, 130, 60, 1)',
        dark:  'rgba(70, 40, 16, 1)'
      }, { speckle: true, speckleCount: 11, seed: st.idx * 17.7, gloss: 0.45 });
      ctx.restore();
      ctx.save();
      ctx.fillStyle = '#f0d9a8'; ctx.font = 'bold 12px "Pretendard", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(stripParen(currentHerbObjs[st.idx].korean_name || ''), hx, hy - 32);
      ctx.restore();
    }

    /* 양손 가이드 (좌우 영역) */
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.25)';
    ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    ctx.strokeRect(cx - 240, cy - 30, 100, 140);
    ctx.strokeRect(cx + 140, cy - 30, 100, 140);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.font = '10px "Pretendard", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('왼손', cx - 190, cy - 38);
    ctx.fillText('오른손', cx + 190, cy - 38);
    ctx.restore();

    /* 풀무 진행 게이지 */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(cx - 110, cy + 130, 220, 14, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255, 140, 60, 0.95)';
    ctx.beginPath(); ctx.roundRect(cx - 110, cy + 130, 220 * (st.puffs / st.puffsRequired), 14, 7); ctx.fill();
    ctx.fillStyle = '#f0d9a8'; ctx.font = 'bold 12px "Pretendard", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('풀무질 ' + st.puffs + '/' + st.puffsRequired + '   (단 ' + st.idx + '/' + currentHerbObjs.length + ')', cx, cy + 164);
    ctx.font = '11px "Pretendard", sans-serif'; ctx.fillStyle = '#e8d5b5';
    ctx.fillText('양손을 펼쳤다 ✊ 모았다 ✋ 풀무질하세요', cx, cy + 184);
    ctx.restore();

    /* 단(붉은 알약) 트레이 */
    for (var pi = 0; pi < st.pellets.length; pi++) {
      var p = st.pellets[pi];
      if (!p.settled) {
        p.x += (p.targetX - p.x) * 0.2;
        p.y += (p.targetY - p.y) * 0.2;
        if (Math.abs(p.x - p.targetX) < 1 && Math.abs(p.y - p.targetY) < 1) p.settled = true;
      }
      ctx.save();
      ctx.shadowColor = 'rgba(255, 60, 30, 0.55)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
      drawSphere3D(p.x, p.y, 9, {
        light: 'rgba(255, 180, 130, 1)',
        mid:   'rgba(220, 80, 50, 1)',
        dark:  'rgba(110, 18, 10, 1)'
      }, { rim: 'rgba(60, 0, 0, 0.5)', gloss: 0.65 });
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════
     시작 / 정지
     ══════════════════════════════════════ */
  function startGame(herbObjs, formula, doses, disease) {
    if (!overlay) initElements();
    formulaName = formula || '';
    diseaseInfo = disease || null;
    currentHerbObjs = herbObjs || [];
    currentDoses = doses || [];
    currentType = (disease && disease.type) ? disease.type : 'tang';
    gameSession++;
    completeFired = false;
    collectedHerbs = [];
    grabState = { active: false, herbIdx: -1 };
    tangGrabs = [
      { active: false, herbIdx: -1 },
      { active: false, herbIdx: -1 }
    ];
    handLandmarks = null;
    allHands = [];
    hwanState = null; sanState = null; goState = null; danState = null;
    particles = []; celebParticles = []; glowRings = [];
    celebActive = false; celebTimer = 0; screenFlash = 0;

    var formulaEl = document.getElementById('herb-game-formula');
    if (formulaEl) formulaEl.textContent = formulaName;
    if (collectedEl) collectedEl.innerHTML = '';
    if (completeEl) completeEl.setAttribute('aria-hidden', 'true');

    /* 모드별 약탕기 DOM 표시/숨김 (탕에서만 표시) */
    var potDom = document.getElementById('herb-game-pot');
    if (potDom) potDom.style.display = (currentType === 'tang') ? '' : 'none';

    /* 모드별 상태 셋업 */
    switch (currentType) {
      case 'hwan': setupHwanMode(); break;
      case 'san':  setupSanMode(); break;
      case 'go':   setupGoMode(); break;
      case 'dan':  setupDanMode(); break;
    }

    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('herb-game-active');
    applyPanelWidthsForViewport();
    var mobile = isMobileDevice();
    overlay.classList.toggle('mobile-mode', mobile);
    overlay.classList.toggle('dan-mode', currentType === 'dan');
    overlay.classList.toggle('tang-mode', currentType === 'tang');
    overlay.classList.toggle('hwan-mode', currentType === 'hwan');
    overlay.classList.toggle('san-mode', currentType === 'san');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    updatePatientPanel();
    updateRxPanel(currentHerbObjs, currentDoses);
    showCoach();
    setCoachContentForType(currentType);
    setupDanTouchButtons(currentType === 'dan' && mobile);
    /* 탕만 떠다니는 약재 사용; 다른 제형은 절차적으로 그림 */
    if (currentType === 'tang') createFloatingHerbs(herbObjs, doses);
    else floatingHerbs = [];
    updateProgress();
    gameActive = true;

    if (mobile) {
      /* 모바일: 웹캠/MediaPipe 우회 → 터치 폴백을 기본 입력으로 사용 */
      enableFallbackInput();
      gameLoop();
      return;
    }

    setupMediaPipe().then(function () {
      if (!gameActive) return;
      /* 단모드는 양손 추적 */
      if (hands) {
        hands.setOptions({
          maxNumHands: ((currentType === 'dan' || currentType === 'tang') ? 2 : 1),
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });
      }
      mpCamera = new window.Camera(video, {
        onFrame: sendFrame,
        width: 640, height: 480
      });
      mpCamera.start();
      gameLoop();
    }).catch(function (err) {
      console.warn('MediaPipe failed, using mouse/touch fallback', err);
      enableFallbackInput();
      gameLoop();
    });
  }

  /* 모드별 코치마크 텍스트 설정 */
  function setCoachContentForType(type) {
    var coachEl = document.getElementById('herb-game-coach');
    if (!coachEl) return;
    var inner = coachEl.querySelector('.coach-inner');
    if (!inner) return;
    var mobile = isMobileDevice();
    var titleByType = mobile ? {
      tang: { title: '약재를 약탕기에 넣으세요',    body: '약재를 길게 눌러 잡고<br>아래 약탕기로 끌어내리세요' },
      hwan: { title: '환을 빚으세요',              body: '엄지+검지로 반죽을 집어 떼낸 뒤,<br>시계 방향으로 굴려 환을 빚으세요' },
      san:  { title: '절구를 찧고 붓으세요',        body: '절구를 반복 탭해 약재를 빻은 뒤,<br>한지를 탭해 가루를 옮기세요' },
      go:   { title: '가마솥을 휘저으세요',         body: '솥 위에서 손가락으로<br>큰 원을 시계 방향으로 그리세요' },
      dan:  { title: '풀무질로 단을 빚으세요',     body: '하단의 ◀ 왼손 / ▶ 오른손<br>버튼을 번갈아 탭하세요' }
    } : {
      tang: { title: '약재를 손으로 잡으세요',     body: '엄지와 검지를 붙여 약재를 집고,<br>손을 내려 약탕기에 넣으세요' },
      hwan: { title: '환을 빚으세요',              body: '엄지와 검지를 모아 반죽을 떼낸 뒤,<br>중앙에서 시계 방향으로 굴려 환을 빚으세요' },
      san:  { title: '절구를 찧고 붓으세요',        body: '주먹을 쥐고 위아래로 빻은 뒤,<br>손을 왼쪽→오른쪽으로 끌어 한지에 부으세요' },
      go:   { title: '가마솥을 휘저으세요',         body: '손으로 솥 위를<br>큰 원으로 시계 방향 휘젓기' },
      dan:  { title: '풀무질로 단을 빚으세요',     body: '양손을 화로 좌우에 두고<br>손가락을 펼쳤다 모았다 반복' }
    };
    var info = titleByType[type] || titleByType.tang;
    /* 두 번째 step의 가운데 버블만 교체 */
    var centerBubble = inner.querySelector('.coach-bubble-center');
    if (centerBubble) {
      centerBubble.innerHTML =
        '<p class="coach-title">' + info.title + '</p>' +
        '<p class="coach-body">' + info.body + '</p>';
    }
  }

  function stopGame() {
    gameActive = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    if (mpCamera) { mpCamera.stop(); mpCamera = null; }
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(function (t) { t.stop(); });
      video.srcObject = null;
    }
    if (overlay) {
      overlay.classList.remove('picker-mode');
      overlay.setAttribute('aria-hidden', 'true');
    }
    var pickerEl = document.getElementById('herb-game-picker');
    if (pickerEl) pickerEl.setAttribute('aria-hidden', 'true');
    /* 약탕기 DOM 복원 (다음 탕 모드를 위해) */
    var potDom = document.getElementById('herb-game-pot');
    if (potDom) potDom.style.display = '';
    dismissCoach();
    document.body.classList.remove('herb-game-active');
    window.removeEventListener('resize', resizeCanvas);
    removeFallbackInput();
    setupDanTouchButtons(false);
    if (overlay) overlay.classList.remove('mobile-mode', 'dan-mode', 'tang-mode', 'hwan-mode', 'san-mode');
    floatingHerbs = []; collectedHerbs = [];
    particles = []; celebParticles = []; glowRings = [];
    hwanState = null; sanState = null; goState = null; danState = null;
    mouseFallbackPos = null;
  }

  /* ── 마우스/터치 폴백 ──
     탕: 기존 픽업/드롭
     기타 모드: pointermove로 가상 손 위치 갱신, click으로 단모드 puff
  */
  var fallbackBound = false;
  var mouseFallbackPos = null;     // {x,y,isDown,spread}
  var mouseDanLeftRight = 0;       // dan 클릭 토글 (왼/오 puff 교대)

  function enableFallbackInput() {
    if (fallbackBound) return;
    fallbackBound = true;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
  }
  function removeFallbackInput() {
    fallbackBound = false;
    if (canvas) {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    }
  }
  function getCanvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function syntheticLandmarks(x, y, cw, ch, isDown) {
    /* MediaPipe 좌표(0~1, x는 미러된 상태)로 역변환된 가짜 랜드마크 */
    var nx = 1 - (x / cw), ny = y / ch;
    var lm = []; for (var i = 0; i < 21; i++) lm.push({ x: nx, y: ny, z: 0 });
    /* pinch / spread 시뮬: 마우스 down=pinch, 비-down=spread */
    if (isDown) {
      lm[4] = { x: nx, y: ny, z: 0 };
      lm[8] = { x: nx + 0.005, y: ny + 0.005, z: 0 };
      lm[20] = { x: nx + 0.04, y: ny + 0.04, z: 0 };
    } else {
      lm[4] = { x: nx - 0.06, y: ny - 0.04, z: 0 };
      lm[8] = { x: nx + 0.02, y: ny - 0.07, z: 0 };
      lm[20] = { x: nx + 0.10, y: ny + 0.03, z: 0 };
    }
    return lm;
  }
  function pushFallbackToHand() {
    if (!mouseFallbackPos || !canvas) return;
    var lm = syntheticLandmarks(mouseFallbackPos.x, mouseFallbackPos.y, canvas.cssW, canvas.cssH, mouseFallbackPos.isDown);
    handLandmarks = lm;
    allHands = [lm];
  }
  function onPointerDown(e) {
    var p = getCanvasPos(e);
    mouseFallbackPos = { x: p.x, y: p.y, isDown: true };
    /* 모바일에선 약재 그랩 반경을 손가락 크기에 맞춰 확장 */
    var grabDist = isMobileDevice() ? (GRAB_DIST + 28) : GRAB_DIST;
    if (currentType === 'tang') {
      for (var i = 0; i < floatingHerbs.length; i++) {
        var h = floatingHerbs[i]; if (h.collected) continue;
        var dx = p.x - h.x, dy = p.y - h.y;
        if (Math.sqrt(dx * dx + dy * dy) < grabDist) {
          h.grabbed = true; grabState.active = true; grabState.herbIdx = i;
          handLandmarks = null; break;
        }
      }
    } else if (currentType === 'san' && sanState) {
      /* 산 모드 터치 폴백:
         pound 단계 — 절구 영역(좌측 35%) 탭 = 절구질 1회
         pour 단계 — 한지 영역(우측 70%) 탭 = 붓기 30% 진행 */
      var st = sanState;
      var mortarX = canvas.cssW * 0.35, mortarY = canvas.cssH * 0.55;
      var paperX  = canvas.cssW * 0.70, paperY  = canvas.cssH * 0.58;
      if (st.phase === 'pound' &&
          Math.abs(p.x - mortarX) < 200 && Math.abs(p.y - mortarY) < 200) {
        /* 한 번의 탭 = 한 번의 스윙 */
        st.swingCount++;
        spawnCollectParticles(mortarX, mortarY, 'rgba(220, 200, 160, 0.85)');
        if (navigator.vibrate) navigator.vibrate(20);
        if (st.swingCount >= st.swingsPerPound) {
          st.poundCount++;
          st.swingCount = 0;
          var targetIdx = Math.min(currentHerbObjs.length - 1,
                                   Math.floor(st.poundCount / st.hitsPerHerb));
          while (st.consumedIdx <= targetIdx && st.consumedIdx < currentHerbObjs.length) {
            consumeHerbAt(st.consumedIdx, mortarX, mortarY, 'rgba(220, 180, 140, 0.9)');
            st.consumedIdx++;
          }
          if (st.poundCount >= st.poundRequired) {
            st.phase = 'pour';
            st.pourStarted = true;
            st.swingCount = st.swingsPerPound;
          }
        }
      } else if (st.phase === 'pour' &&
                 Math.abs(p.x - paperX) < 200 && Math.abs(p.y - paperY) < 200) {
        st.pourStarted = true;
        /* 탭마다 목표값을 조금씩 올려 자연스럽게 스무딩 */
        st.pourTarget = Math.min(1, st.pourTarget + 0.15);
      }
    }
    /* dan 모드의 빈 캔버스 클릭은 무시 — 좌/우 풀무 버튼으로만 입력받음 */
    pushFallbackToHand();
  }
  function onPointerMove(e) {
    var p = getCanvasPos(e);
    if (mouseFallbackPos) { mouseFallbackPos.x = p.x; mouseFallbackPos.y = p.y; }
    else mouseFallbackPos = { x: p.x, y: p.y, isDown: false };
    if (currentType === 'tang' && grabState.active) {
      var herb = floatingHerbs[grabState.herbIdx];
      if (herb) { herb.x += (p.x - herb.x) * 0.3; herb.y += (p.y - herb.y) * 0.3; }
    }
    pushFallbackToHand();
  }
  function onPointerUp(e) {
    if (currentType === 'tang' && grabState.active) {
      var herb = floatingHerbs[grabState.herbIdx];
      if (herb) {
        herb.grabbed = false;
        if (herb.y > canvas.cssH * (1 - POT_HEIGHT_RATIO) - 30) collectHerb(grabState.herbIdx);
      }
      grabState.active = false; grabState.herbIdx = -1;
    }
    if (mouseFallbackPos) mouseFallbackPos.isDown = false;
    pushFallbackToHand();
    /* 터치 입력의 경우 손을 떼면 잔류 커서/랜드마크 제거 — 회전·절구 hit 모두 motion-based라
       지속 상태가 필요 없고, 시각적 잔상도 사라져야 자연스러움 */
    if (e && e.pointerType === 'touch') {
      mouseFallbackPos = null;
      handLandmarks = null;
      allHands = [];
    }
  }

  /* ══════════════════════════════════════
     [단 모드] 모바일 풀무 버튼 — 좌/우 탭 = 풀무질 1회
     ══════════════════════════════════════ */
  var danBellowsEls = null;

  function setupDanTouchButtons(enable) {
    /* 이전 버튼 정리 */
    if (danBellowsEls) {
      if (danBellowsEls.wrap && danBellowsEls.wrap.parentNode) {
        danBellowsEls.wrap.parentNode.removeChild(danBellowsEls.wrap);
      }
      danBellowsEls = null;
    }
    if (!enable || !overlay) return;

    var wrap = document.createElement('div');
    wrap.className = 'dan-bellows-controls';

    function makeBtn(side, label) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dan-bellows-btn dan-bellows-' + side;
      btn.setAttribute('aria-label', label + ' 풀무질');
      btn.innerHTML =
        '<span class="dan-bellows-icon">' + (side === 'left' ? '◀' : '▶') + '</span>' +
        '<span class="dan-bellows-label">' + label + '<br>풀무질</span>';
      var fire = function (ev) {
        ev.preventDefault();
        if (!gameActive || currentType !== 'dan' || !danState) return;
        if (danState.idx >= currentHerbObjs.length) return;
        var cx = (LEFT_PANEL_W + (canvas.cssW - RIGHT_PANEL_W)) / 2;
        var cy = canvas.cssH * 0.55;
        registerDanPuff(cx, cy);
        btn.classList.add('active');
        setTimeout(function () { btn.classList.remove('active'); }, 120);
      };
      btn.addEventListener('pointerdown', fire);
      return btn;
    }

    var leftBtn = makeBtn('left', '왼손');
    var rightBtn = makeBtn('right', '오른손');
    wrap.appendChild(leftBtn);
    wrap.appendChild(rightBtn);
    overlay.appendChild(wrap);
    danBellowsEls = { wrap: wrap, leftBtn: leftBtn, rightBtn: rightBtn };
  }

  /* ── 전역 API ── */
  /* 외부(처방 그리드 등)에서 진입 시 사용한 부위 필터를 게임 좌표계로 전달.
     null/빈 문자열을 넘기면 필터 해제. */
  function setActiveBodyFilter(key) {
    activeBodyFilter = key || null;
  }
  window.HerbHandGame = {
    start: startGame,
    stop: stopGame,
    showPicker: showPicker,
    startById: startFromPicker,
    setActiveBodyFilter: setActiveBodyFilter
  };
})();
