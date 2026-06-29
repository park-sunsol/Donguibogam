/**
 * hand-herb-game.js
 * 조선시대 의원 타이쿤 — 웹캠 손 추적으로 약재 조합
 * MediaPipe Hands (CDN)
 */
(function () {
  'use strict';

  /* ── 효과음 (js/sfx.js) ── */
  function sfx(name) { if (window.Sfx) window.Sfx.play(name); }

  /* 음소거 버튼 — 흰색 라인 스피커 아이콘 (SVG) */
  var ICON_SOUND_ON =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7"/><path d="M18.5 6a7 7 0 0 1 0 12"/></svg>';
  var ICON_SOUND_OFF =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 9v6h4l5 4V5L8 9H4z"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>';

  function syncMuteBtn() {
    var btn = document.getElementById('herb-game-mute');
    if (!btn || !window.Sfx) return;
    var m = window.Sfx.isMuted();
    btn.innerHTML = m ? ICON_SOUND_OFF : ICON_SOUND_ON;
    btn.classList.toggle('is-muted', m);
    btn.setAttribute('aria-pressed', m ? 'true' : 'false');
  }

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
  var coachActive = false;  // 코치마크 표시 중 — true면 손동작 인식을 막는다
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
  var goState   = null;  // { cx, cy, potR, lastAngle, accAngle, perHerbAngle, herbsDone, frames, frameIdx, ... }
  var danState  = null;  // { phase, lift, herbsDone, coverage, liftFrames, wrapFrames, frames, frameIdx, ... }

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
    /* 좁은 화면(<768px)은 터치 여부와 무관하게 모바일 뷰로 처리 —
       데스크톱 창 축소·반응형 모드에서도 모바일 레이아웃이 그대로 적용되도록. */
    return narrow || (hasTouch && coarse);
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

    var muteBtn = document.getElementById('herb-game-mute');
    if (muteBtn && window.Sfx) {
      muteBtn.addEventListener('click', function () {
        window.Sfx.toggleMute();
        syncMuteBtn();
      });
      syncMuteBtn();
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && gameActive) stopGame();
    });

    var coachBtn = document.getElementById('herb-coach-dismiss');
    if (coachBtn) coachBtn.addEventListener('click', dismissCoach);

    var coachCloseBtn = document.getElementById('herb-coach-close');
    if (coachCloseBtn) coachCloseBtn.addEventListener('click', dismissCoach);

    var camPermBtn = document.getElementById('coach-cam-permission-btn');
    if (camPermBtn) camPermBtn.addEventListener('click', requestCameraPermission);

    var pickerCloseBtn = document.getElementById('herb-picker-close');
    if (pickerCloseBtn) pickerCloseBtn.addEventListener('click', closePicker);

    /* 모바일 — 처방 책(증상·처방) 플로팅 토글 */
    var bookFab = document.getElementById('herb-game-book-fab');
    if (bookFab) {
      bookFab.addEventListener('click', function () {
        if (!overlay) return;
        var open = overlay.classList.toggle('book-expanded');
        bookFab.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
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
    coachActive = true; // 코치마크 표시 중에는 손동작 인식 차단
    var el = document.getElementById('herb-game-coach');
    if (el) el.setAttribute('aria-hidden', 'false');
  }
  function dismissCoach() {
    coachActive = false; // 처방하기 등으로 코치마크가 사라지면 인식 시작
    var el = document.getElementById('herb-game-coach');
    if (el) el.setAttribute('aria-hidden', 'true');
  }

  /* 카메라 권한 요청 — 브라우저 권한 프롬프트를 띄우고, 차단 상태면 안내한다.
     (보안상 웹에서 브라우저 설정 페이지로 직접 이동할 수는 없다.) */
  function setCamStatus(msg, kind) {
    var el = document.getElementById('coach-cam-status');
    if (!el) return;
    el.innerHTML = msg || ''; // <br> 등 줄바꿈 허용 (정적 문자열만 사용)
    el.className = 'coach-cam-status' + (kind ? ' coach-cam-status--' + kind : '');
  }
  /* 차단 등 오류 안내가 남아 있으면 제거 (카메라가 정상 동작하기 시작했을 때) */
  function clearCamStatusIfError() {
    var el = document.getElementById('coach-cam-status');
    if (el && el.className.indexOf('coach-cam-status--error') >= 0) setCamStatus('', null);
  }
  /* 좌측 상단 '카메라 권한 미설정' 빨간 띠 배너 토글 */
  function setCamBanner(show) {
    var b = document.getElementById('herb-game-cam-banner');
    if (b) b.setAttribute('aria-hidden', show ? 'false' : 'true');
  }
  /* 권한 상태에 따라 배너 노출 갱신 — 모바일은 카메라 미사용이라 항상 숨김 */
  function refreshCameraPermissionUI() {
    if (isMobileDevice()) { setCamBanner(false); return; }
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' }).then(function (st) {
        setCamBanner(st.state !== 'granted');
        st.onchange = function () {
          var granted = st.state === 'granted';
          setCamBanner(!granted);
          /* 차단→허용으로 바뀌면 안내 문구 제거 + 새로고침 없이 카메라 재시작 */
          if (granted) {
            setCamStatus('', null);
            if (gameActive) startCameraTracking();
          }
        };
      }).catch(function () {
        /* permissions API 미지원: 일단 배너 노출 → 카메라가 실제로 동작하면(onResults) 숨김 */
        setCamBanner(true);
      });
    } else {
      setCamBanner(true);
    }
  }
  function requestCameraPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamStatus('이 브라우저는 카메라 접근을 지원하지 않아요.', 'error');
      return;
    }
    setCamStatus('카메라 권한을 확인하는 중…', null);
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); }); // 확인용이므로 즉시 정지
      setCamStatus('카메라 권한이 허용되어있어요. 처방하기를 눌러 시작하세요.', 'ok');
      setCamBanner(false);
      startCameraTracking(); // 새로고침 없이 즉시 웹캠 추적 시작
    }).catch(function (err) {
      var name = err && err.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCamStatus('카메라가 차단돼 있어요. 주소창 왼쪽 자물쇠(또는 카메라)<br>아이콘을 눌러 "카메라 허용"으로 바꾼 뒤 새로고침해주세요.', 'error');
        setCamBanner(true);
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCamStatus('연결된 카메라를 찾을 수 없어요.', 'error');
        setCamBanner(true);
      } else {
        setCamStatus('카메라 권한 확인에 실패했어요. 다시 시도해주세요.', 'error');
        setCamBanner(true);
      }
    });
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
  var _rxSpread = 0;        // 0 = 처방 개요(1페이지), 1 = 약재 상세(2페이지)
  var _rxFlipping = false;  // 책장 넘김 애니메이션 중 잠금

  /* 약재 슬롯 묶음 DOM 생성 */
  function buildHerbSlots(group) {
    var slots = document.createElement('div');
    slots.className = 'rx-herb-slots';
    slots.style.setProperty('--slot-count', group.length || 1);
    group.forEach(function (h) {
      var slot = document.createElement('div');
      slot.className = 'rx-herb-slot';
      slot.setAttribute('data-herb-id', h.id);
      var thumbSrc = typeof window.getThumbnailForHerb === 'function' ? (window.getThumbnailForHerb(h) || '') : '';
      slot.innerHTML =
        '<div class="rx-slot-img">' +
          (thumbSrc ? '<img src="' + thumbSrc + '" alt="">' : '<span>' + (h.korean_name || '?')[0] + '</span>') +
        '</div>' +
        '<div class="rx-slot-info">' +
          '<span class="rx-slot-name">' + stripParen(h.korean_name || '') + '</span>' +
        '</div>' +
        '<span class="rx-slot-check">✓</span>';
      slots.appendChild(slot);
    });
    return slots;
  }

  function updateRxPanel(herbObjs, doses) {
    var leaf = document.getElementById('rx-leaf');
    var front = document.getElementById('rx-front');
    var back = document.getElementById('rx-back');
    var page2Right = document.getElementById('rx-page2-right');
    var rightPage = document.querySelector('.book-page--right');
    if (!front || !back || !page2Right || !leaf) return;

    _rxSpread = 0;
    _rxFlipping = false;
    leaf.classList.remove('flip-away');

    /* ── 1페이지 우측(처방 개요): 처방명 + 진행바 + 다음장(›) 화살표. 약재는 미노출 ── */
    front.innerHTML =
      '<div class="book-page-header"><span class="book-page-title">처방</span></div>' +
      '<p class="rx-formula-name">' + (formulaName || '') + '</p>' +
      '<div class="rx-progress-wrap">' +
        '<div class="rx-progress-header">' +
          '<span class="rx-herbs-label">필요 약재</span>' +
          '<span class="hud-progress-count">0 / 0</span>' +
        '</div>' +
        '<div class="hud-progress-bar"><div class="hud-progress-fill"></div></div>' +
      '</div>' +
      '<div class="rx-leaf-foot">' +
        '<button type="button" class="rx-flip-arrow rx-flip-next rx-flip-cta" aria-label="약재 자세히보기">약재 자세히보기<span class="rx-cta-arrow">›</span></button>' +
      '</div>';

    /* ── 2페이지: 약재를 두 페이지에 나눠 담기 (고서 우→좌: 우측 먼저) ── */
    var half = Math.ceil(herbObjs.length / 2);
    var rightGroup = herbObjs.slice(0, half);  // 2페이지 우측(아래장)
    var leftGroup = herbObjs.slice(half);      // 2페이지 좌측(넘어간 장 뒷면)

    page2Right.innerHTML = '<div class="book-page-header"><span class="book-page-title">필요 약재</span></div>';
    page2Right.appendChild(buildHerbSlots(rightGroup));
    var foot = document.createElement('div');
    foot.className = 'rx-leaf-foot';
    foot.innerHTML = '<button type="button" class="rx-flip-arrow rx-flip-prev rx-flip-cta" aria-label="증상·처방 보기"><span class="rx-cta-arrow">‹</span>증상·처방 보기</button>';
    page2Right.appendChild(foot);

    back.innerHTML = '<div class="book-page-header"><span class="book-page-title">필요 약재</span></div>';
    back.appendChild(buildHerbSlots(leftGroup));

    /* 화살표 클릭 → 책 넘김 (우측 페이지 영역 전체에 위임) */
    if (rightPage && !rightPage._rxBound) {
      rightPage._rxBound = true;
      rightPage.addEventListener('click', function (e) {
        var btn = e.target.closest('.rx-flip-arrow');
        if (!btn || btn.disabled) return;
        flipRxSpread(btn.classList.contains('rx-flip-prev') ? 0 : 1);
      });
    }

    updateProgress();
  }

  function flipRxSpread(to) {
    if (_rxFlipping || to === _rxSpread) return;
    var leaf = document.getElementById('rx-leaf');
    if (!leaf) return;
    _rxFlipping = true;
    if (to === 1) leaf.classList.add('flip-away');
    else leaf.classList.remove('flip-away');
    setTimeout(function () {
      _rxSpread = to;
      _rxFlipping = false;
    }, 620);
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
        /* 모든 웹캠 모드 양손 추적 — 어느 손으로 작업하든 잡히도록(환·산 포함).
           검출 신뢰도 0.7→0.5 로 낮춰 조명/배경이 나빠도 손을 더 잘 인식. */
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.45 });
        hands.onResults(function (r) {
          if (!gameActive) return;
          setCamBanner(false); // 프레임이 들어온다 = 카메라 권한 정상 → 배너 숨김
          clearCamStatusIfError(); // 이전 '차단' 안내가 남아 있으면 제거
          /* 코치마크가 떠 있는 동안에는 손을 인식하지 않는다 — 잡기 상태도 초기화 */
          if (coachActive) {
            allHands = [];
            handLandmarks = null;
            if (grabState.active) { grabState.active = false; grabState.herbIdx = -1; }
            return;
          }
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

  /* 웹캠 추적 (재)시작 — 권한이 늦게 허용된 경우 새로고침 없이 카메라를 다시 켠다 */
  function startCameraTracking() {
    if (isMobileDevice() || !gameActive) return;
    if (!window.Camera || !video) return;
    return setupMediaPipe().then(function () {
      if (!gameActive) return;
      if (mpCamera) { try { mpCamera.stop(); } catch (e) {} mpCamera = null; }
      mpCamera = new window.Camera(video, { onFrame: sendFrame, width: 640, height: 480 });
      mpCamera.start();
    }).catch(function (err) {
      console.warn('camera (re)start failed', err);
    });
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
  function spawnCollectParticles(x, y, color, noRing) {
    /* 차분한 연출: 입자 수·속도를 줄이고 천천히 떠오르며 부드럽게 사라짐 */
    for (var i = 0; i < 11; i++) {
      var angle = (Math.PI * 2 / 11) * i + rand(-0.25, 0.25);
      var speed = rand(1, 3);
      particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0.4, 1.4), life: 1, decay: rand(0.01, 0.017), size: rand(2, 4.5), color: color || 'rgba(255, 212, 140, 1)', type: 'spark' });
    }
    /* noRing: 퍼지는 원(링) 생략 */
    if (!noRing) particles.push({ x: x, y: y, vx: 0, vy: 0, life: 1, decay: 0.028, size: 8, color: 'rgba(255, 228, 170, 0.4)', type: 'ring' });
  }


  function spawnCelebration() {
    celebActive = true; celebTimer = 0; screenFlash = 0.45;
    var cw = canvas.cssW, ch = canvas.cssH, cx = cw / 2, cy = ch / 2;
    /* 차분한 마무리: 글로우 링은 천천히 은은하게 퍼짐 */
    for (var r = 0; r < 3; r++) {
      glowRings.push({ x: cx, y: cy, radius: 10, maxRadius: 140 + r * 100, life: 1, decay: 0.007 + r * 0.0015, delay: r * 10 });
    }
    /* 별(촌스러운 요소) 제거 — 좁은 금빛 범위의 동그란 입자만, 수·속도 축소 */
    for (var i = 0; i < 64; i++) {
      var angle = rand(0, Math.PI * 2), speed = rand(1.5, 6), hue = rand(36, 50);
      celebParticles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0, 2.5), life: 1, decay: rand(0.004, 0.009), size: rand(2, 6), hue: hue, type: 'dot', gravity: 0.03, delay: Math.floor(i / 16) * 6 });
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
      if (p.type === 'spark') { p.vx *= 0.94; p.vy *= 0.94; }
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
        if (p.type === 'spark') { ctx.shadowColor = p.color; ctx.shadowBlur = 6; }
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
        ctx.fillStyle = 'hsl(' + cp.hue + ', 68%, 74%)';
        ctx.shadowColor = 'hsl(' + cp.hue + ', 72%, 62%)'; ctx.shadowBlur = 10; ctx.fill();
      }
      ctx.restore();
    }
    for (i = glowRings.length - 1; i >= 0; i--) {
      var gr = glowRings[i];
      if (gr.delay && gr.delay > 0) { gr.delay--; continue; }
      gr.life -= gr.decay; gr.radius = lerp(gr.radius, gr.maxRadius, 0.05);
      if (gr.life <= 0) { glowRings.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = gr.life * 0.32;
      ctx.beginPath(); ctx.arc(gr.x, gr.y, gr.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 228, 160, 1)'; ctx.lineWidth = 2.5 * gr.life;
      ctx.shadowColor = 'rgba(255, 210, 120, 0.7)'; ctx.shadowBlur = 22; ctx.stroke(); ctx.restore();
    }
    if (screenFlash > 0) {
      ctx.save(); ctx.globalAlpha = screenFlash * 0.22;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.cssW, canvas.cssH);
      ctx.restore(); screenFlash = Math.max(0, screenFlash - 0.02);
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
    var uiRects = (currentType === 'tang') ? getUiAvoidRects() : [];

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
      /* 책·상단 HUD 영역에 스폰되지 않도록 — 사각형 안이면 왼쪽으로 밀어냄 */
      for (var ui = 0; ui < uiRects.length; ui++) {
        var rr = uiRects[ui], rad = HERB_SIZE / 2;
        if (x > rr.x0 - rad && x < rr.x1 + rad && y > rr.y0 - rad && y < rr.y1 + rad) {
          x = rr.x0 - rad - 4; /* 책 왼쪽 바깥으로 */
        }
      }

      floatingHerbs.push({
        id: h.id, name: h.korean_name || '', dose: dose, thumbSrc: thumbSrc,
        x: Math.max(xMin, Math.min(xMax, x)),
        y: Math.max(safeTop, Math.min(safeBottom, y)),
        vx: rand(-1.2, 1.2), vy: rand(-1, 1),
        w: HERB_SIZE, h: HERB_SIZE, img: img,
        grabbed: false, collected: false,
        phase: rand(0, Math.PI * 2), bobSpeed: 0.018 + rand(0, 0.012),
        glowPhase: rand(0, Math.PI * 2),
        /* 자유 방랑(wander) — 천천히 방향이 바뀌는 조향력으로 자유롭게 떠다님 */
        wanderAngle: rand(0, Math.PI * 2), wanderTurn: rand(0.02, 0.05)
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
    sfx('splash');  /* 약탕기 투입 모션 — water_splash */
    markRxSlotCollected(herb.id);
    /* 탕 모드 투입 피드백: 흰색 계열 파티클 (퍼지는 원 제거) */
    if (currentType === 'tang') {
      /* 김은 배경 영상에 포함됨 — 캔버스 김 분출 제거 */
      /* 흰색 광채 파티클 (링 없음) */
      spawnCollectParticles(herb.x, herb.y, 'rgba(255, 255, 255, 0.95)', true);
      spawnCollectParticles(herb.x, herb.y, 'rgba(240, 245, 252, 0.9)', true);
      spawnCollectParticles(herb.x, herb.y, 'rgba(224, 232, 244, 0.8)', true);
      /* 약탕기 입구 위치의 확장 글로우 링(퍼지는 원) 제거 */
      var dz = getTangPotZone(canvas.cssW, canvas.cssH);
      /* 화면 가장자리 미세 플래시 */
      screenFlash = Math.max(screenFlash, 0.2);
      /* 추가 스파크 (위로 부드럽게 떠오르는 흰색 입자) */
      for (var sk = 0; sk < 11; sk++) {
        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
        var spd = 2 + Math.random() * 3;
        var w = Math.floor(232 + Math.random() * 23);
        particles.push({
          x: dz.cx + (Math.random() - 0.5) * 36,
          y: dz.cy - 10,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 1.5 + Math.random() * 2.5,
          color: 'rgba(255, 255, ' + w + ', 0.9)',
          life: 1, decay: 0.014, gravity: 0.08, type: 'spark'
        });
      }
    } else {
      spawnCollectParticles(herb.x, herb.y, 'rgba(255, 210, 80, 0.9)');
      spawnCollectParticles(herb.x, herb.y, 'rgba(180, 140, 60, 0.7)');
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
    var pct = (total > 0 ? (done / total * 100) : 0) + '%';
    /* 각 책장마다 진행바/카운트가 있으므로 전부 갱신 */
    document.querySelectorAll('.hud-progress-count').forEach(function (el) {
      el.textContent = done + ' / ' + total;
    });
    document.querySelectorAll('.hud-progress-fill').forEach(function (el) {
      el.style.width = pct;
    });
  }

  var _completeBgAnims = null;
  function playCompleteBg() {
    if (typeof window.lottie === 'undefined') return;
    var els = document.querySelectorAll('.herb-game-complete-bg .hgc-bg-char[data-lottie]');
    if (!els.length) return;
    if (!_completeBgAnims) {
      _completeBgAnims = [];
      els.forEach(function (el) {
        _completeBgAnims.push(window.lottie.loadAnimation({
          container: el,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          path: el.getAttribute('data-lottie')
        }));
      });
    }
    _completeBgAnims.forEach(function (anim, i) {
      var draw = function () {
        anim.goToAndStop(0, true);
        setTimeout(function () { anim.goToAndPlay(0, true); }, 500 + i * 280);
      };
      if (anim.isLoaded) draw();
      else anim.addEventListener('DOMLoaded', draw);
    });
  }

  function showComplete() {
    sfx('complete');
    if (completeEl) {
      completeEl.setAttribute('aria-hidden', 'false');
      playCompleteBg();
      /* 제형별 완료 이미지 매핑 */
      var sealImg = completeEl.querySelector('.seal-icon');
      if (sealImg) {
        var FINISH_IMG = { tang: 'finish_tang', san: 'finish_san', hwan: 'finish_whan', go: 'finish_go', dan: 'finish_dan' };
        var imgKey = FINISH_IMG[currentType] || 'finish_tang';
        sealImg.src = 'asset/prescription/' + imgKey + '.png';
      }
      if (completeTitleEl) {
        var titleName = formulaName.split(' ')[0];
        var lastChar = titleName.charCodeAt(titleName.length - 1);
        var hasJongseong = lastChar >= 0xAC00 && lastChar <= 0xD7A3 && (lastChar - 0xAC00) % 28 !== 0;
        var josa = hasJongseong ? '이' : '가';
        completeTitleEl.textContent = "'" + titleName + "'" + josa + " 완료되었습니다";
      }
      if (patientMsgEl && diseaseInfo) {
        patientMsgEl.textContent = (diseaseInfo.name || '') + ' 환자가 쾌유하였습니다';
      }
    }
  }

  /* ══════════════════════════════════════
     메인 게임 루프 (공통) → 모드별 디스패치
     ══════════════════════════════════════ */
  /* 5개 손가락이 펴졌는지 감지 [엄지, 검지, 중지, 약지, 소지] */
  function getFingerExtensions(landmarks) {
    if (!landmarks) return [false, false, false, false, false];
    /* 엄지: 끝(4)이 두 번째 관절(3)에서 충분히 벌어졌는지 (임계 완화 0.04→0.025) */
    var thumbExt  = Math.abs(landmarks[4].x - landmarks[3].x) > 0.025;
    /* 나머지: 끝 y < PIP 관절 y (위로 뻗은 상태) — 카메라 좌표계에서 y↓ 증가.
       손을 살짝 기울이거나 빠르게 움직여도 펴짐으로 잡히도록 마진 0.02→0.005 */
    var indexExt  = landmarks[8].y  < landmarks[6].y  - 0.005;
    var middleExt = landmarks[12].y < landmarks[10].y - 0.005;
    var ringExt   = landmarks[16].y < landmarks[14].y - 0.005;
    var pinkyExt  = landmarks[20].y < landmarks[18].y - 0.005;
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

    // 웹캠 배경: 탕·환·산·고·단 모드는 자체 배경(영상/캐시) 사용 → 캔버스에 그리지 않음
    if (currentType !== 'tang' && currentType !== 'hwan' && currentType !== 'san' && currentType !== 'go' && currentType !== 'dan') {
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

  /* UI 회피 사각형(캔버스 좌표) — 펼친 책(우상단) + 상단 HUD 바.
     실제 DOM 위치를 기준으로 계산하므로 책 크기가 바뀌어도 정확히 회피한다. */
  function getUiAvoidRects() {
    var rects = [];
    if (!overlay) return rects;
    var oRect = overlay.getBoundingClientRect();
    var book = document.getElementById('herb-game-rx-panel');
    if (book && book.offsetParent !== null) {
      var b = book.getBoundingClientRect();
      var m = 14; /* 여백 — 책 그림자/모서리까지 가리지 않도록 */
      rects.push({
        x0: b.left - oRect.left - m, y0: b.top - oRect.top - m,
        x1: b.right - oRect.left + m, y1: b.bottom - oRect.top + m
      });
    }
    var hud = document.querySelector('.herb-game-hud');
    if (hud) {
      var h = hud.getBoundingClientRect();
      rects.push({ x0: 0, y0: 0, x1: canvas.cssW, y1: h.bottom - oRect.top + 8 });
    }
    return rects;
  }

  /* 약재를 사각형 밖으로 부드럽게 밀어내고 속도를 반사("퉁") */
  function bounceHerbOutOfRect(herb, r) {
    var rad = herb.w / 2;
    var x0 = r.x0 - rad, y0 = r.y0 - rad, x1 = r.x1 + rad, y1 = r.y1 + rad;
    if (herb.x <= x0 || herb.x >= x1 || herb.y <= y0 || herb.y >= y1) return;
    /* 가장 얕은 침투 방향으로 탈출 */
    var penL = herb.x - x0, penR = x1 - herb.x, penT = herb.y - y0, penB = y1 - herb.y;
    var m = Math.min(penL, penR, penT, penB);
    if (m === penL)      { herb.x = x0; herb.vx = -Math.abs(herb.vx); }
    else if (m === penR) { herb.x = x1; herb.vx =  Math.abs(herb.vx); }
    else if (m === penT) { herb.y = y0; herb.vy = -Math.abs(herb.vy); }
    else                 { herb.y = y1; herb.vy =  Math.abs(herb.vy); }
  }

  /* ══════════════════════════════════════
     [탕] 떠다니는 약재 → 약탕기에 넣기 (기존)
     ══════════════════════════════════════ */
  function updateTangMode(cw, ch) {
    var potY = ch * (1 - POT_HEIGHT_RATIO_TANG);
    var dropZone  = getTangPotZone(cw, ch);
    var avoidZone = getTangAvoidZone(cw, ch);
    var uiAvoidRects = getUiAvoidRects();

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

    /* 약재끼리 약한 상호 회피 — 한곳에 뭉치지 않도록 부드럽게 밀어냄 */
    var minDist = HERB_SIZE * 0.95;
    for (var sa = 0; sa < floatingHerbs.length; sa++) {
      var hsa = floatingHerbs[sa];
      if (hsa.collected || hsa.grabbed) continue;
      for (var sb = sa + 1; sb < floatingHerbs.length; sb++) {
        var hsb = floatingHerbs[sb];
        if (hsb.collected || hsb.grabbed) continue;
        var sdx = hsb.x - hsa.x, sdy = hsb.y - hsa.y;
        var sd = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sd < minDist) {
          /* 완전히 겹쳐 거리 0이면 임의 방향으로 분리 */
          var snx, sny;
          if (sd > 0.001) { snx = sdx / sd; sny = sdy / sd; }
          else { var ang = rand(0, Math.PI * 2); snx = Math.cos(ang); sny = Math.sin(ang); sd = 0.001; }
          var push = (minDist - sd) / minDist * 0.45;   /* 부드러운 분리력 */
          hsa.vx -= snx * push; hsa.vy -= sny * push;
          hsb.vx += snx * push; hsb.vy += sny * push;
          /* 약한 즉시 위치 보정 — 겹침 빠르게 해소 */
          var corr = (minDist - sd) * 0.12;
          hsa.x -= snx * corr; hsa.y -= sny * corr;
          hsb.x += snx * corr; hsb.y += sny * corr;
        }
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
        /* 자유 부유 — 화면 거의 전체를 사용 (책·상단바·약탕기는 별도 회피) */
        var edge = 16;
        var herbXMin = edge + herb.w / 2;
        var herbXMax = cw - edge - herb.w / 2;
        var herbYMin = edge + herb.h / 2;
        var herbYMax = ch - herb.h / 2 - edge;
        herb.phase += herb.bobSpeed;
        /* 방랑 조향 — 진행 방향을 천천히 무작위로 틀어 자유로운 표류감 부여 */
        herb.wanderAngle += rand(-herb.wanderTurn, herb.wanderTurn);
        herb.vx += Math.cos(herb.wanderAngle) * 0.05;
        herb.vy += Math.sin(herb.wanderAngle) * 0.05;
        /* 감쇠 — 속도가 천천히 유지되어 멀리까지 부드럽게 떠다님 */
        herb.vx *= 0.99;
        herb.vy *= 0.99;
        /* 가장자리 부드러운 안쪽 힘 — 벽에 닿기 전에 미리 방향을 안쪽으로 틀어
           준다. 방랑(persistent) 운동은 반사벽에 쌓이는 성질이 있어, 띠 모양
           완충 구역에서 침투 깊이에 비례한 복원력을 줘 화면 전체로 퍼지게 함 */
        var softBand = Math.min(cw, ch) * 0.16;
        var SOFT_FORCE = 0.06;
        if (herb.x < herbXMin + softBand) herb.vx += SOFT_FORCE * (1 - (herb.x - herbXMin) / softBand);
        else if (herb.x > herbXMax - softBand) herb.vx -= SOFT_FORCE * (1 - (herbXMax - herb.x) / softBand);
        if (herb.y < herbYMin + softBand) herb.vy += SOFT_FORCE * (1 - (herb.y - herbYMin) / softBand);
        else if (herb.y > herbYMax - softBand) herb.vy -= SOFT_FORCE * (1 - (herbYMax - herb.y) / softBand);

        herb.x += herb.vx + Math.sin(herb.phase) * 0.6;
        herb.y += herb.vy + Math.cos(herb.phase * 0.7) * 0.5;
        /* 화면 가장자리 — 퉁 하고 튕김 (최소 반발 속도로 가장자리에 들러붙지 않게) */
        var EDGE_KICK = 0.7;
        if (herb.x < herbXMin) { herb.x = herbXMin; herb.vx = Math.max(Math.abs(herb.vx), EDGE_KICK); }
        else if (herb.x > herbXMax) { herb.x = herbXMax; herb.vx = -Math.max(Math.abs(herb.vx), EDGE_KICK); }
        if (herb.y < herbYMin) { herb.y = herbYMin; herb.vy = Math.max(Math.abs(herb.vy), EDGE_KICK); }
        else if (herb.y > herbYMax) { herb.y = herbYMax; herb.vy = -Math.max(Math.abs(herb.vy), EDGE_KICK); }

        /* 책·상단 HUD 영역 회피 — 약재가 뒤에 숨지 않도록 밀어내고 튕김 */
        for (var ur = 0; ur < uiAvoidRects.length; ur++) {
          bounceHerbOutOfRect(herb, uiAvoidRects[ur]);
        }

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
        var MAX_HERB_SPEED = 2.1;
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
            sfx('grab');
            tangGrabs[gk].herbIdx = i;
            break;
          }
        }
      }
      drawHerb(herb);
    }

    /* 가이드 화살표 — 약탕기 입구로 약재를 넣으라는 안내 */
    drawTangHint(dropZone, ch);
  }

  /* 탕 가이드 — 약탕기 입구를 가리키는 아래 방향 화살표 + 진행 게이지/안내 문구
     (게이지는 환·고와 동일한 컴포넌트·동일한 하단 위치 ch*0.58+180에 표시) */
  function drawTangHint(zone, ch) {
    var t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.004;
    var bob = Math.sin(t) * 12;

    ctx.save();
    ctx.globalAlpha = 1;  /* 산 화살표와 동일하게 불투명 */
    /* 화살촉 끝(+36)이 입구 상단 림 바로 위를 가리키도록 배치 */
    ctx.translate(zone.cx, zone.cy - zone.ry - 42 + bob);
    /* 아래 방향 단방향 화살표 — 산과 동일 굵기/크기 */
    ctx.fillStyle = ARROW_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, 36); ctx.lineTo(-14, 16); ctx.lineTo(-6, 16);
    ctx.lineTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(6, 16);
    ctx.lineTo(14, 16);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    /* 안내 문구 — 환·산·고 게이지 라벨과 동일 스타일/위치 (탕은 진행 바 제외, 문구만)
       밝은 영상 배경 위에서도 잘 보이도록 문구 뒤에 반투명 검정 블록을 깐다 */
    var hintText = '약재를 손으로 잡아 약탕기에 넣으세요';
    var hintX = zone.cx, hintY = ch * 0.58 + 180 + 4;
    ctx.save();
    ctx.font = '12px "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var tw = ctx.measureText(hintText).width;
    var bw = tw + 28, bh = 26;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath(); ctx.roundRect(hintX - bw / 2, hintY - bh / 2, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = '#f3e6c5';
    ctx.fillText(hintText, hintX, hintY);
    ctx.restore();
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
    /* 탕·환·산·고·단 모드: 손 골격(점+선) 직접 렌더링 */
    if ((currentType === 'tang' || currentType === 'hwan' || currentType === 'san' || currentType === 'go' || currentType === 'dan') && handLandmarks) {
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
    if (currentType === 'dan') sfx('collect_soft');  /* 단은 금박 두르기 흐름이라 완성음을 작게 */
    else if (currentType !== 'san' && currentType !== 'go') sfx('collect');  /* 산·고는 자체 효과음으로 별도 처리 */
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

  /* 화면에 잡힌 모든 손(최대 2) 추출 + 커서 렌더 — 환 모드 양손 인식용 */
  function collectHands(cw, ch) {
    var arr = [];
    if (allHands && allHands.length > 0) {
      for (var i = 0; i < allHands.length && i < 2; i++) {
        var p = getHandPosFrom(allHands[i], cw, ch);
        if (p && p.x >= 0) arr.push(p);
      }
    } else if (handLandmarks) {
      var p1 = getHandPosFrom(handLandmarks, cw, ch);
      if (p1 && p1.x >= 0) arr.push(p1);
    }
    for (var k = 0; k < arr.length; k++) {
      drawHandCursor(arr[k].x, arr[k].y, arr[k].pinching, arr[k]);
    }
    return arr;
  }

  /* 페이즈에 맞는 손동작을 하는 손을 고른다.
     needOpen=true → 손바닥을 편 손만 후보(마우스 폴백은 포즈 무시).
     중앙에 가깝고 직전 활성 손과 가까운 손을 우선. */
  function pickActiveHand(hands, center, st, needOpen) {
    var best = null, bestScore = -Infinity;
    for (var i = 0; i < hands.length; i++) {
      var h = hands[i];
      /* 손가락 1개만 펴져도(또는 핀치 아님) 펼친 손으로 인정 — 손가락 인식이
         불안정해 동작이 통째로 무시되던 문제 완화. 꽉 쥔 주먹만 배제. */
      var open = (h.extendedCount || 0) >= 1 || !h.pinching;
      if (needOpen && !fallbackBound && !open) continue;
      var score = -Math.hypot(h.x - center.x, h.y - center.y);
      if (st.lastHandX !== null && st.lastHandY !== null) {
        score -= Math.hypot(h.x - st.lastHandX, h.y - st.lastHandY) * 0.6;
      }
      if (score > bestScore) { bestScore = score; best = h; }
    }
    return best;
  }

  /* 직전 활성 손과 이어지는 움직임인지 (손이 바뀌어 튀는 값 배제) */
  function handContinuous(st, h) {
    if (st.lastHandX === null || st.lastHandY === null) return false;
    return Math.hypot(h.x - st.lastHandX, h.y - st.lastHandY) < 120;
  }

  /* ══════════════════════════════════════
     [환] 빚기 — 배경(whan_background.mp4)에 맞춘 전통 제환 3단계
       1) 밀기   : 반죽 덩이를 좌우로 굴려 긴 막대로 민다       (영상 0 → 0.50)
       2) 썰기   : 막대를 위아래로 썰어 작은 조각으로 나눈다     (영상 0.50 → 0.80)
       3) 굴리기 : 조각을 동그랗게 굴려 환으로 빚는다           (영상 0.80 → 1.0)
     배경: whan_background.mp4의 프레임을 미리 캐싱해 진행률에 따라 표시
     ══════════════════════════════════════ */
  var HWAN_MAX_FRAMES = 70;
  /* 프레임 구간: 밀기 0~0.50, 썰기 0.50~0.80, 굴리기 0.80~1.0 */
  var HWAN_ROLLOUT_PORTION = 0.50;
  var HWAN_CUT_PORTION     = 0.30;
  var HWAN_ROUND_PORTION   = 0.20;
  var HWAN_ROLLOUT_DISTANCE = 420;               // 밀기 누적 가로 이동(px) — 난이도↓ (1100→650→420)
  var HWAN_CUT_REQUIRED     = 4;                  // 썰기 횟수 — 난이도↓ (6→4)
  var HWAN_ROUND_REQUIRED   = Math.PI * 2 * 1.25; // 굴리기 — 난이도↓ (2바퀴→1.25바퀴)

  function setupHwanMode() {
    hwanState = {
      phase: 'rollout',        // 'rollout' | 'cut' | 'round' | 'done'
      rolloutAccum: 0,
      cutCount: 0,
      roundAccum: 0,
      lastAng: null,
      lastHandX: null,
      lastHandY: null,
      chopDir: 0,              // 현재 수직 이동 방향 (1=아래, -1=위)
      chopTravel: 0,          // 방향 전환 후 누적 수직 이동
      chopMaxSpeed: 0,        // 현재 내려치기의 최고 속도 (느린 드리프트 배제)
      chopArmed: false,       // 이번 내려치기를 이미 1회로 셌는지(중복 방지). 위로 올리면 해제
      chopMiss: 0,            // 손 인식이 끊긴 프레임 수 (짧은 끊김은 무시)
      rollDir: 0,             // 밀기 가로 이동 방향
      rollReverseTick: 999,   // 마지막 방향 전환 후 경과 프레임 (왕복 판정)
      roundDir: 0,            // 굴리기 회전 방향
      roundStreak: 0,         // 같은 방향 연속 회전 스텝 (원운동 판정)
      rollSoundOn: false,     // clay_rolling 루프 재생 중 여부
      rollIdle: 0,            // 굴리기 멈춘 프레임 수
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
        if (captured.length === 1) st.firstFrame = snap;  // mp4 첫 프레임 — 로딩 배경용
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

  function getHwanCenter(cw, ch) {
    /* 새 배경: 반죽·막대·환이 모두 한지 중앙에서 작업됨 */
    /* gaugeY: 진행 게이지+안내문구 위치 — '고(膏)' 모드 게이지와 동일 높이(ch*0.58+180)로 맞춤 */
    return { x: cw * 0.50, y: ch * 0.50, gaugeY: ch * 0.58 + 180 };
  }

  function cycleRatioHwan(st) {
    if (st.phase === 'rollout') {
      return Math.min(1, st.rolloutAccum / HWAN_ROLLOUT_DISTANCE) * HWAN_ROLLOUT_PORTION;
    }
    if (st.phase === 'cut') {
      var cut = Math.min(1, st.cutCount / HWAN_CUT_REQUIRED);
      return HWAN_ROLLOUT_PORTION + cut * HWAN_CUT_PORTION;
    }
    if (st.phase === 'round') {
      var round = Math.min(1, st.roundAccum / HWAN_ROUND_REQUIRED);
      return HWAN_ROLLOUT_PORTION + HWAN_CUT_PORTION + round * HWAN_ROUND_PORTION;
    }
    return 1;
  }

  function updateHwanMode(cw, ch) {
    if (!hwanState) setupHwanMode();
    var st = hwanState;
    st.hintTick++;

    var center = getHwanCenter(cw, ch);

    /* 1) 배경 프레임 먼저 그림 — 손/힌트가 그 위에 보이도록 */
    drawHwanBgFrame(cw, ch);

    /* 작업대(영상)가 준비되기 전(로딩 화면)에는 손 인식·진행을 막는다 */
    if (!st.framesReady) return;

    /* 2) 손 추적 — 양손 모두 인식(커서 렌더), 페이즈 동작에 맞는 손을 선택 */
    var hands = collectHands(cw, ch);

    /* 3) 상태 업데이트 — 페이즈별로 "올바른 손동작"일 때만 진행 */
    if (st.phase === 'rollout') {
      /* 밀기: 손바닥을 펴고 좌우로 '왕복' 굴려야 인정 (한 방향 스와이프·무작위 이동 배제) */
      var rh = pickActiveHand(hands, center, st, true);
      var rolledThisFrame = false;
      if (rh && Math.hypot(rh.x - center.x, rh.y - center.y) < 460) {
        if (handContinuous(st, rh)) {
          var dxR = rh.x - st.lastHandX, dyR = rh.y - st.lastHandY;
          var horiz = Math.abs(dxR) > Math.abs(dyR) * 0.55;     // 주로 가로 이동(완화)
          var newDir = dxR > 1.5 ? 1 : (dxR < -1.5 ? -1 : 0);
          if (newDir !== 0 && horiz) {
            /* 좌우 어느 방향으로 굴려도 인정 — 왕복 강제 제거(반응성 우선) */
            st.rollDir = newDir;
            st.rolloutAccum += Math.min(Math.abs(dxR), 40);      // 한 프레임 폭주 방지
            rolledThisFrame = true;
          }
        }
        st.lastHandX = rh.x; st.lastHandY = rh.y;
      } else {
        st.lastHandX = null; st.lastHandY = null; st.rollDir = 0;
      }
      st.lastAng = null;
      /* clay_rolling 루프 — 실제로 굴리는 동안만 */
      if (rolledThisFrame) {
        st.rollIdle = 0;
        if (!st.rollSoundOn && window.Sfx) { window.Sfx.startLoop('clay_roll'); st.rollSoundOn = true; }
      } else {
        st.rollIdle++;
      }
      if (st.rollSoundOn && st.rollIdle > 8 && window.Sfx) { window.Sfx.stopLoop('clay_roll'); st.rollSoundOn = false; }
      if (st.rolloutAccum >= HWAN_ROLLOUT_DISTANCE) {
        st.phase = 'cut';
        st.lastHandX = null; st.lastHandY = null; st.chopDir = 0; st.chopTravel = 0; st.chopMaxSpeed = 0;
        if (st.rollSoundOn && window.Sfx) { window.Sfx.stopLoop('clay_roll'); st.rollSoundOn = false; }
      }
    } else if (st.phase === 'cut') {
      /* 썰기: 손을 아래로 '내려치면' 그 즉시 1회 인정(위→아래 전환을 기다리지 않음).
         위로 되돌리면 다음 썰기 준비. 손 인식이 한두 프레임 끊겨도 누적이
         초기화되지 않도록 유예(chopMiss)를 둔다 — 빠른 손이 깜빡여도 잘 잡히게. */
      var ch2 = pickActiveHand(hands, center, st, true);
      if (ch2 && Math.hypot(ch2.x - center.x, ch2.y - center.y) < 520) {
        st.chopMiss = 0;
        /* 끊김 직후 첫 프레임은 비교 기준이 없으므로 건너뜀. 점프(>260px)도 배제 */
        if (st.lastHandY !== null && Math.hypot(ch2.x - st.lastHandX, ch2.y - st.lastHandY) < 260) {
          var dyC = ch2.y - st.lastHandY, dxC = ch2.x - st.lastHandX;
          if (Math.abs(dyC) > Math.abs(dxC) * 0.6) {       // 주로 세로 이동
            if (dyC > 1) {                                 // 아래로 내려치는 중
              st.chopTravel += dyC;
              st.chopMaxSpeed = Math.max(st.chopMaxSpeed, dyC);
              if (!st.chopArmed && st.chopTravel > 34 && st.chopMaxSpeed > 5) {
                st.cutCount++;
                st.pulse = 1;
                sfx('clay');          /* 한 알씩 분리되는 소리 */
                st.chopArmed = true;  /* 한 번의 내려치기는 1회만 */
              }
            } else if (dyC < -3) {                         // 위로 되돌림 → 다음 썰기 준비
              st.chopArmed = false; st.chopTravel = 0; st.chopMaxSpeed = 0;
            }
          }
        }
        st.lastHandX = ch2.x; st.lastHandY = ch2.y;
      } else {
        /* 손이 잠깐 사라져도 6프레임까지는 누적 유지 */
        st.chopMiss++;
        if (st.chopMiss > 6) {
          st.lastHandX = null; st.lastHandY = null;
          st.chopArmed = false; st.chopTravel = 0; st.chopMaxSpeed = 0;
        }
      }
      st.lastAng = null;
      if (st.cutCount >= HWAN_CUT_REQUIRED) {
        st.phase = 'round';
        st.lastAng = null; st.lastHandX = null; st.lastHandY = null;
        st.roundDir = 0; st.roundStreak = 0;
      }
    } else if (st.phase === 'round') {
      /* 굴리기: 중심 둘레를 '한 방향으로 연속해서 동그랗게' 돌려야 인정
         (직선 왕복·미세 떨림·중심 통과 직선은 반지름/연속성 조건으로 배제) */
      var oh = pickActiveHand(hands, center, st, false);
      if (oh) {
        var ddx = oh.x - center.x, ddy = oh.y - center.y;
        var radius = Math.hypot(ddx, ddy);
        if (radius > 28 && radius < 470) {
          var ang = Math.atan2(ddy, ddx);
          if (st.lastAng !== null && handContinuous(st, oh)) {
            var d = ang - st.lastAng;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            if (Math.abs(d) > 0.015 && Math.abs(d) < 0.6) {       // 떨림/점프 제거
              var rdir = d > 0 ? 1 : -1;
              if (st.roundDir === 0 || rdir === st.roundDir) {
                st.roundStreak++;
                st.roundDir = rdir;
                if (st.roundStreak > 2 && d > 0) st.roundAccum += d; // 지속 시계방향 원운동만
              } else {
                st.roundDir = rdir; st.roundStreak = 0;             // 역방향 전환 → 원 아님
              }
            }
          }
          st.lastAng = ang;
          st.lastHandX = oh.x; st.lastHandY = oh.y;
        } else {
          st.lastAng = null; st.lastHandX = null; st.lastHandY = null; st.roundStreak = 0;
        }
      } else {
        st.lastAng = null; st.lastHandX = null; st.lastHandY = null; st.roundStreak = 0;
      }
      if (st.roundAccum >= HWAN_ROUND_REQUIRED) {
        st.phase = 'done';
        for (var k = 0; k < currentHerbObjs.length; k++) {
          consumeHerbAt(k, center.x + (k - currentHerbObjs.length / 2) * 16, center.y, 'rgba(220, 140, 70, 0.9)');
        }
      }
    }
    if (hands.length === 0 && st.rollSoundOn && window.Sfx) { window.Sfx.stopLoop('clay_roll'); st.rollSoundOn = false; }

    if (st.pulse > 0) st.pulse = Math.max(0, st.pulse - 0.06);

    /* 4) 프레임 인덱스 갱신 */
    if (st.framesReady && st.frames.length > 0) {
      var ratio = st.phase === 'done' ? 1 : cycleRatioHwan(st);
      var idx = Math.min(st.frames.length - 1, Math.floor(ratio * (st.frames.length - 1)));
      st.frameIdx = idx;
    }

    /* 5) 모션 힌트 인포그래픽 — 손 위에 살짝 떠 있도록 */
    if (st.phase === 'rollout') drawRollOutHint(center, st);
    else if (st.phase === 'cut') drawCutHint(center, st);
    else if (st.phase === 'round') drawRoundHint(center, st);

    if (st.phase === 'done') checkAllDone();
  }

  /* 로딩 화면 — mp4 첫 프레임을 깔고 그 위에 #000(80%) 오버레이 + 안내 문구 */
  function drawLoadingScreen(cw, ch, st, label) {
    if (st.firstFrame) {
      var img = st.firstFrame;
      var scale = Math.max(cw / img.width, ch / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = '#1a0e04';
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
    ctx.fillStyle = '#d9b97a';
    ctx.font = '14px "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label + '… ' + st.loadingProgress, cw / 2, ch / 2);
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
      drawLoadingScreen(cw, ch, st, '작업대 준비 중');
    }
  }

  /* ── 산(散) 화살표 표준 스타일 — 환·고에 동일 적용 ──
     불투명(alpha 1) · rgba(255,220,140,1) · 자루 두께 12(±6) · 화살촉 폭 28(±14)·길이 20 */
  var ARROW_COLOR  = 'rgba(255, 220, 140, 1)';
  var ARROW_SHAFT  = 6;   // 자루 반폭 (전체 12)
  var ARROW_HEAD_W = 14;  // 화살촉 반폭 (전체 28)
  var ARROW_HEAD_L = 20;  // 화살촉 길이

  /* 호(arc) 끝에 산과 동일한 크기의 화살촉을 접선 방향으로 그린다.
     (cx,cy)=중심, gr=반경, endA=호 끝 각도(증가 방향으로 진행) */
  function drawArcArrowHead(cx, cy, gr, endA) {
    var ex = cx + Math.cos(endA) * gr, ey = cy + Math.sin(endA) * gr; // 호 끝점
    var tx = -Math.sin(endA), ty = Math.cos(endA);                    // 접선(진행 방향)
    var nx =  Math.cos(endA), ny = Math.sin(endA);                    // 법선(반경 방향)
    ctx.fillStyle = ARROW_COLOR;
    ctx.beginPath();
    ctx.moveTo(ex + tx * ARROW_HEAD_L * 0.6, ey + ty * ARROW_HEAD_L * 0.6);  // 팁
    ctx.lineTo(ex - tx * ARROW_HEAD_L * 0.4 + nx * ARROW_HEAD_W,
               ey - ty * ARROW_HEAD_L * 0.4 + ny * ARROW_HEAD_W);            // 바깥 날개
    ctx.lineTo(ex - tx * ARROW_HEAD_L * 0.4 - nx * ARROW_HEAD_W,
               ey - ty * ARROW_HEAD_L * 0.4 - ny * ARROW_HEAD_W);            // 안쪽 날개
    ctx.closePath();
    ctx.fill();
  }

  /* 밀기 인포그래픽 — 펼친 손 + 좌우 양방향 화살표 (반죽을 굴려 막대로) */
  function drawRollOutHint(c, st) {
    var t = st.hintTick * 0.06;
    var bob = Math.sin(t) * 14;  /* 산과 동일한 흔들림 (좌우) */

    ctx.save();
    ctx.globalAlpha = 1;  /* 산 화살표와 동일하게 불투명 */
    ctx.translate(c.x + bob, c.y - 145);

    /* 좌우 양방향 화살표 (↔) — 산 화살표와 동일한 굵기/크기 (수평 버전) */
    ctx.fillStyle = ARROW_COLOR;
    /* 왼 화살촉 + 자루 */
    ctx.beginPath();
    ctx.moveTo(-36, 0); ctx.lineTo(-16, 14); ctx.lineTo(-16, 6);
    ctx.lineTo(16, 6);  ctx.lineTo(16, -6);  ctx.lineTo(-16, -6);
    ctx.lineTo(-16, -14);
    ctx.closePath(); ctx.fill();
    /* 오른 화살촉 */
    ctx.beginPath();
    ctx.moveTo(36, 0); ctx.lineTo(16, -14); ctx.lineTo(16, -6);
    ctx.lineTo(-8, -6); ctx.lineTo(-8, 6); ctx.lineTo(16, 6);
    ctx.lineTo(16, 14);
    ctx.closePath(); ctx.fill();

    ctx.restore();

    /* 진행 게이지 — 밀기 */
    drawHwanGauge(c.x, c.gaugeY, st.rolloutAccum / HWAN_ROLLOUT_DISTANCE, '손바닥을 펴고 좌우로 왕복하며 반죽을 미세요');
  }

  /* 썰기 인포그래픽 — 위아래 화살표 + 썬 횟수 (막대를 조각으로) */
  function drawCutHint(c, st) {
    var t = st.hintTick * 0.08;
    var drop = (Math.sin(t) * 0.5 + 0.5) * 26;       // 위→아래로 내리꽂는 모션

    ctx.save();
    ctx.globalAlpha = 1;  /* 산 화살표와 동일하게 불투명 */
    ctx.translate(c.x, c.y - 155 + drop);

    /* 아래 화살표 (썰기) — 산 화살표와 동일한 굵기/크기 (아래쪽 단방향) */
    ctx.fillStyle = ARROW_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, 36); ctx.lineTo(-14, 16); ctx.lineTo(-6, 16);
    ctx.lineTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(6, 16);
    ctx.lineTo(14, 16);
    ctx.closePath(); ctx.fill();

    ctx.restore();

    /* 진행 게이지 — 썰기 횟수 */
    drawHwanGauge(c.x, c.gaugeY, st.cutCount / HWAN_CUT_REQUIRED,
      '손을 펴고 빠르게 내리쳐 썰어 나누세요 (' + st.cutCount + '/' + HWAN_CUT_REQUIRED + ')');
  }

  /* 굴리기 인포그래픽 — 원형 회전 화살표 (조각을 환으로 빚기) */
  function drawRoundHint(c, st) {
    var t = st.hintTick * 0.04;
    var gr = 46;  // 가이드 반경
    var endA = Math.PI * 0.9;
    ctx.save();
    ctx.translate(c.x, c.y - 145);  /* 원형 회전 화살표를 더 높이 올림 */
    ctx.rotate(t);
    ctx.scale(0.8, 0.8);  /* 원형이라 커 보여 0.8배 시각 보정 */
    ctx.globalAlpha = 1;  /* 산 화살표와 동일하게 불투명 */

    /* 원형 호 — 산 자루와 동일한 두께(12) */
    ctx.strokeStyle = ARROW_COLOR;
    ctx.lineWidth = ARROW_SHAFT * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, gr, -endA, endA);
    ctx.stroke();

    /* 화살촉 — 산과 동일 크기, 접선 방향 정렬 */
    drawArcArrowHead(0, 0, gr, endA);

    ctx.restore();

    drawHwanGauge(c.x, c.gaugeY, st.roundAccum / HWAN_ROUND_REQUIRED, '중심 둘레로 시계방향 원을 그려 굴리세요');
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
  /* 끝점을 한지 위치(약 0.70)에 맞춤 — 자동 진행이 없으므로 손이 한지까지 가로로 와야 완료됨 */
  var SAN_POUR_X_END   = 0.72;
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
      pourTarget: 0,                  // 손의 오른쪽 이동량으로 결정된 목표값
      pourStarted: false,
      pourStartX: 0,                  // 붓기 시작 시점의 손 x비율 (가로 이동량 기준점)

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
        if (captured.length === 1) st.firstFrame = snap;  // mp4 첫 프레임 — 로딩 배경용
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

    /* 작업대(영상)가 준비되기 전(로딩 화면)에는 손 인식·진행을 막는다 */
    if (!st.framesReady) return;

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
                sfx('crunch');  /* 절구 찧기 */
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
        /* 손이 절구(왼쪽)에 있을 때만 붓기 시작 — 시작 지점을 기준점으로 기록 */
        if (xRatio < SAN_POUR_X_START + 0.08) {
          st.pourStarted = true;
          st.pourStartX = xRatio;
          sfx('sweep');  /* 절구 기울여 옮기기 */
        }
      } else {
        /* 시작 지점에서 한지(오른쪽)까지 가로로 이동한 양만큼만 진행 */
        var span = Math.max(0.2, SAN_POUR_X_END - st.pourStartX);
        var prog = Math.max(0, Math.min(1, (xRatio - st.pourStartX) / span));
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

    /* 3b) 붓기 진행도 — 오직 손의 가로 이동(왼→오른쪽)으로만 진행. 자동 진행 없음:
       실제로 가로로 쓸어 옮기지 않으면 약재가 종이로 넘어가지 않는다. */
    if (st.phase === 'pour') {
      if (st.pourStarted) {
        /* 손의 가로 위치로 정해진 목표(pourTarget)를 부드럽게 추격만 한다 */
        var diff = st.pourTarget - st.pourProgress;
        if (diff > 0) st.pourProgress += diff * 0.18;
      }
      if (st.pourProgress >= 0.9 && st.phase !== 'done') {
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
      drawLoadingScreen(cw, ch, st, '작업대 준비 중');
    }
  }

  function drawSanPoundHint(c, st) {
    var t = st.hintTick * 0.06;
    var bob = Math.sin(t) * 14;
    ctx.save();
    ctx.globalAlpha = 1;  /* 불투명 — 위/아래 화살표가 가운데서 겹쳐도 균일하게 */
    ctx.translate(c.x, c.y - 130);
    /* 위/아래 화살표 (주먹 위아래 동작 안내) */
    ctx.fillStyle = 'rgba(255, 220, 140, 1)';
    ctx.strokeStyle = 'rgba(255, 220, 140, 1)';
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
    /* 트랙(배경) */
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(cx - 100, cy, 200, 8, 4); ctx.fill();
    /* 흰색 외곽선 — 어두운 영상 위에서도 바가 항상 보이게 */
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(cx - 100, cy, 200, 8, 4); ctx.stroke();
    /* 채움(진행도) */
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
      cx: 0, cy: 0, potR: 150,
      lastAngles: [null, null],  // 왼손/오른손 각각의 직전 각도
      accAngle: 0,
      totalAngle: 0,       // 누적 회전량(영상 스크럽용, 리셋 안 함)
      perHerbAngle: Math.PI * 2 * 1.5,  // 약재 1종당 1.5바퀴
      herbsDone: 0,
      stirIdle: 0,         // 휘젓기 멈춤 프레임 수
      stirSoundOn: false,  // stirring.mp3 루프 on/off
      hintTick: 0,
      frames: [],
      frameIdx: 0,
      framesReady: false,
      loadingProgress: 0
    };
    preloadGoFrames();
  }

  function preloadGoFrames() {
    var src = document.getElementById('herb-game-go-source');
    if (!src) return;
    var st = goState;

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
        if (captured.length === 1) st.firstFrame = snap;  // mp4 첫 프레임 — 로딩 배경용
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

  function getGoPotCenter(cw, ch) {
    /* 영상의 가마솥 중심 = 가로 중앙, 세로 약 58% */
    return { x: cw / 2, y: ch * 0.58 };
  }

  function updateGoMode(cw, ch) {
    if (!goState) setupGoMode();
    var st = goState;
    st.hintTick++;

    /* 1) 배경 = 졸이기 영상 (농축 진행도로 스크럽) */
    drawGoBgFrame(cw, ch);

    /* 가마솥(영상)이 준비되기 전(로딩 화면)에는 손 인식·진행을 막는다 */
    if (!st.framesReady) return;

    var c = getGoPotCenter(cw, ch);
    var cx = c.x, cy = c.y;
    st.cx = cx; st.cy = cy;

    /* 2) 손 추적 — 왼손·오른손 모두 휘젓기 가능 */
    var handsList = [];
    if (allHands && allHands.length > 0) {
      for (var hi = 0; hi < allHands.length && hi < 2; hi++) {
        var lmH = allHands[hi];
        var pH = getHandPosFrom(lmH, cw, ch);
        if (pH) handsList.push({ landmarks: lmH, pos: pH });
      }
    } else if (handLandmarks) {
      var p1 = getHandPosFrom(handLandmarks, cw, ch);
      if (p1) handsList.push({ landmarks: handLandmarks, pos: p1 });
    }
    /* 좌→우 정렬 → 슬롯(0=왼손, 1=오른손) 고정으로 각도 연속성 유지 */
    handsList.sort(function (a, b) { return a.pos.x - b.pos.x; });

    if (!st.lastAngles) st.lastAngles = [null, null];
    var stirring = false;
    var seen = [false, false];
    for (var hh = 0; hh < handsList.length && hh < 2; hh++) {
      var hpos = handsList[hh].pos;
      drawTangHandSkeletonFor(handsList[hh].landmarks, hpos.pinching);  /* 손 골격 렌더 */
      seen[hh] = true;
      var ang = Math.atan2(hpos.y - cy, hpos.x - cx);
      var last = st.lastAngles[hh];
      if (last !== null) {
        var d = ang - last;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        var dist = Math.hypot(hpos.x - cx, hpos.y - cy);
        /* 방향 무관 — 시계/반시계 어느 쪽으로 저어도 진행으로 인정 */
        if (dist < st.potR + 80 && Math.abs(d) > 0.02) {
          st.accAngle += Math.abs(d);
          st.totalAngle += Math.abs(d);
          stirring = true;
        }
      }
      st.lastAngles[hh] = ang;
    }
    /* 사라진 손 슬롯은 각도 리셋 (재진입 시 튐 방지) */
    for (var si = 0; si < 2; si++) { if (!seen[si]) st.lastAngles[si] = null; }

    /* 3) 휘젓는 소리 — 능동적으로 젓는 동안에만 루프 */
    if (window.Sfx) {
      if (stirring) {
        st.stirIdle = 0;
        if (!st.stirSoundOn) { window.Sfx.startLoop('stir'); st.stirSoundOn = true; }
      } else if (st.stirSoundOn) {
        st.stirIdle++;
        if (st.stirIdle > 6) { window.Sfx.stopLoop('stir'); st.stirSoundOn = false; }
      }
    }

    /* 4) 약재 1종당 일정 각도 누적 시 완료 */
    while (st.herbsDone < currentHerbObjs.length && st.accAngle >= st.perHerbAngle) {
      st.accAngle -= st.perHerbAngle;
      consumeHerbAt(st.herbsDone, cx, cy, 'rgba(255, 255, 255, 0.92)');
      st.herbsDone++;
    }

    /* 5) 프레임 인덱스 — 손 한 바퀴(2π)당 영상 1회 재생, 계속 루프 */
    var totalProg = Math.min(1, (st.herbsDone + st.accAngle / st.perHerbAngle) / Math.max(1, currentHerbObjs.length));
    if (st.framesReady && st.frames.length > 0) {
      var loopRatio = (st.totalAngle / (Math.PI * 2)) % 1;  // 0~1 반복
      st.frameIdx = Math.min(st.frames.length - 1, Math.floor(loopRatio * (st.frames.length - 1)));
    }

    /* 6) 휘젓기 힌트 + 게이지 */
    drawGoHint(cx, cy, st, totalProg);

    if (st.herbsDone >= currentHerbObjs.length) checkAllDone();
  }

  function drawGoBgFrame(cw, ch) {
    var st = goState;
    if (st.framesReady && st.frames[st.frameIdx]) {
      var img = st.frames[st.frameIdx];
      var scale = Math.max(cw / img.width, ch / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      var dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      drawLoadingScreen(cw, ch, st, '가마솥 준비 중');
    }
  }

  /* 휘젓기 힌트 — 작게 빙글빙글 도는 원형 화살표 + 진행 게이지 */
  function drawGoHint(cx, cy, st, prog) {
    var R = st.potR;
    var t = st.hintTick * 0.05;
    var gr = 40;  // 가이드 반경 — 산 화살촉(폭 28)과 비례하도록

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(0.8, 0.8);  /* 원형이라 커 보여 0.8배 시각 보정 */
    ctx.globalAlpha = 1;  /* 산 화살표와 동일하게 불투명 */
    /* 원형 호 — 산 자루와 동일한 두께(12) */
    ctx.strokeStyle = ARROW_COLOR;
    ctx.lineWidth = ARROW_SHAFT * 2; ctx.lineCap = 'round';
    var a0 = t, a1 = t + Math.PI * 1.45;
    ctx.beginPath(); ctx.arc(0, 0, gr, a0, a1); ctx.stroke();
    /* 진행 방향(시계) 화살촉 — 산과 동일 크기, 호 끝에 접선 정렬 */
    drawArcArrowHead(0, 0, gr, a1);
    ctx.restore();

    drawSanGauge(cx, cy + R + 30, prog, '손으로 솥 위를 빙글빙글 휘저으세요');
  }

  /* ══════════════════════════════════════
     [단] dan_background.mp4 기반 2단계 인터렉션
       1단계 「단을 든다」  : 단약을 집은(pinch) 채 손을 위로 올려 든다
                             → 영상 1~3초 구간 프레임을 들어올린 정도로 스크럽
       2단계 「금박을 두른다」: 손을 문질러(이동) 금박을 두른다
                             → 영상 5초 이후 구간 프레임을 도포 진행도로 스크럽
                               (약재 1종씩 금박 도포 완료 → 다음 단약)
       · 영상 4초 구간(3~5초)은 사용하지 않는다.
       · 고증: 동의보감 단(丹) 처방 '금박진심단(金箔鎭心丹)' — 금박을 약에 입힘
     ══════════════════════════════════════ */
  var DAN_LIFT_END   = 3.0;   // 1단계(단 들기) 영상 구간 끝(초)
  var DAN_WRAP_START = 5.0;   // 2단계(금박 두르기) 영상 구간 시작(초)
  var DAN_PHASE_FRAMES = 45;  // 단계별 최대 프레임 수

  function setupDanMode() {
    danState = {
      phase: 1,             // 1 = 단 들기, 2 = 금박 두르기
      lift: 0,              // 1단계 들어올린 정도 0~1
      herbsDone: 0,         // 금박을 두른 단약 수
      coverage: 0,          // 현재 단약 금박 도포 진행도 0~1
      grabbed: false,       // 단약을 집었는지(집는 소리 1회용)
      foilOn: false,        // 금박 싸는 소리(루프) 켜짐 여부
      foilIdle: 0,          // 문지름 멈춘 프레임 수
      lastHandX: null, lastHandY: null,
      liftFrames: [],       // 영상 1~3초 프레임
      wrapFrames: [],       // 영상 5초 이후 프레임
      frames: [], frameIdx: 0,  // 현재 표시 중인 프레임 풀
      framesReady: false,
      loadingProgress: 0,
      firstFrame: null,
      sparkles: [],
      hintTick: 0
    };
    preloadDanFrames();
  }

  function preloadDanFrames() {
    var src = document.getElementById('herb-game-dan-source');
    if (!src) return;
    var st = danState;

    function start() {
      var off = document.createElement('canvas');
      off.width = src.videoWidth || 1280;
      off.height = src.videoHeight || 720;
      var offCtx = off.getContext('2d');
      var captured = [];
      var dur = src.duration || 6;
      var useRvfc = typeof src.requestVideoFrameCallback === 'function';
      st.loadingProgress = 0;

      function snapshot(t) {
        offCtx.drawImage(src, 0, 0);
        var snap = document.createElement('canvas');
        snap.width = off.width; snap.height = off.height;
        snap.getContext('2d').drawImage(off, 0, 0);
        captured.push({ time: t, snap: snap });
        if (captured.length === 1) st.firstFrame = snap;  // 첫 프레임 — 로딩 배경용
        st.loadingProgress = captured.length;
      }

      /* 시간 구간으로 모은 프레임을 최대 max개로 균등 다운샘플 */
      function pick(caps, max) {
        if (caps.length <= max) return caps.map(function (c) { return c.snap; });
        var out = [];
        for (var i = 0; i < max; i++) {
          var s = Math.round((i / (max - 1)) * (caps.length - 1));
          out.push(caps[s].snap);
        }
        return out;
      }

      src.muted = true;
      src.playbackRate = 2;
      try { src.currentTime = 0; } catch (e) {}

      function onEnd() {
        try { src.pause(); } catch (e) {}
        captured.sort(function (a, b) { return a.time - b.time; });
        /* 1~3초 = 들기, 5초 이후 = 금박 두르기, (3~5초)는 버림 */
        var liftCaps = captured.filter(function (c) { return c.time <= DAN_LIFT_END; });
        var wrapCaps = captured.filter(function (c) { return c.time >= DAN_WRAP_START; });
        /* 영상이 예상보다 짧을 때를 위한 안전 분할(앞 절반/뒤 절반) */
        if (liftCaps.length === 0) liftCaps = captured.slice(0, Math.ceil(captured.length / 2));
        if (wrapCaps.length === 0) wrapCaps = captured.slice(Math.floor(captured.length / 2));
        st.liftFrames = pick(liftCaps, DAN_PHASE_FRAMES);
        st.wrapFrames = pick(wrapCaps, DAN_PHASE_FRAMES);
        st.frames = st.liftFrames.length ? st.liftFrames : st.wrapFrames;
        st.frameIdx = 0;
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

  /* 현재 단계 프레임 풀을 진행도(0~1)로 스크럽 */
  function scrubDanFrames(st, pool, ratio) {
    if (!pool || pool.length === 0) return;
    st.frames = pool;
    ratio = Math.max(0, Math.min(1, ratio));
    st.frameIdx = Math.min(pool.length - 1, Math.floor(ratio * (pool.length - 1)));
  }

  /* 단 — 왼쪽 아래 단약 트레이를 가리키는 아래쪽 화살표 (산 화살표와 동일 굵기/컬러) */
  function drawDanLiftArrow(cw, ch, tick) {
    var bob = Math.sin(tick * 0.06) * 10;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.translate(cw * 0.16, ch * 0.55 + bob);
    ctx.fillStyle = 'rgba(255, 220, 140, 1)';
    ctx.strokeStyle = 'rgba(255, 220, 140, 1)';
    ctx.lineWidth = 1.5;
    /* 아래 방향 단방향 화살표 */
    ctx.beginPath();
    ctx.moveTo(0, 36); ctx.lineTo(-14, 16); ctx.lineTo(-6, 16);
    ctx.lineTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(6, 16);
    ctx.lineTo(14, 16);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function updateDanMode(cw, ch) {
    if (!danState) setupDanMode();
    var st = danState;
    st.hintTick++;

    /* 1) 배경 = 단 영상 프레임 */
    drawDanBgFrame(cw, ch);
    if (!st.framesReady) return;   // 로딩 중에는 진행 막기

    var cx = (LEFT_PANEL_W + (cw - RIGHT_PANEL_W)) / 2;
    var gaugeY = ch * 0.82;

    var hand = getMainHand(cw, ch);   // 한 손 위치 + 커서/골격 렌더

    if (st.phase === 1) {
      /* ── 1단계: 단을 든다 (집은 채 손을 위로) ── */
      if (hand) {
        if (hand.pinching) {
          /* 단약을 처음 집는 순간 — 집는 소리 1회 */
          if (!st.grabbed) { st.grabbed = true; sfx('grab'); }
          if (st.lastHandY !== null) {
            var up = st.lastHandY - hand.y;       // 위로 올린 양(+)
            if (up > 0.4) {
              st.lift = Math.min(1, st.lift + up * 0.0045);
              spawnGoldSparkle(st, hand.x, hand.y + 6);
            }
          }
        } else {
          st.grabbed = false;   // 놓으면 다시 집을 때 소리 재생
        }
        st.lastHandX = hand.x; st.lastHandY = hand.y;
      } else { st.lastHandX = null; st.lastHandY = null; st.grabbed = false; }

      scrubDanFrames(st, st.liftFrames, st.lift);
      drawDanSparkles(st);
      var danPinching = hand && hand.pinching;
      if (!danPinching) drawDanLiftArrow(cw, ch, st.hintTick);
      drawSanGauge(cx, gaugeY, st.lift,
        danPinching
          ? '단약을 집은 채 손을 위로 올려 드세요'
          : '엄지와 검지로 단약을 집으세요');

      if (st.lift >= 1) {
        st.phase = 2;
        st.lastHandX = null; st.lastHandY = null;
        sfx('dan_place');       // 금박 위에 내려놓는 소리
        if (navigator.vibrate) navigator.vibrate(40);
      }

    } else {
      /* ── 2단계: 금박을 두른다 (손을 문질러 도포) ── */
      var done = (st.herbsDone >= currentHerbObjs.length);
      var rubbing = false;
      if (!done && hand) {
        if (st.lastHandX !== null) {
          var mv = Math.hypot(hand.x - st.lastHandX, hand.y - st.lastHandY);
          if (mv > 1.2) {
            st.coverage = Math.min(1, st.coverage + mv * 0.0018);
            spawnGoldSparkle(st, hand.x, hand.y);
            rubbing = true;
          }
          if (st.coverage >= 1) {
            consumeHerbAt(st.herbsDone, hand.x, hand.y, 'rgba(255, 210, 90, 0.95)');
            st.herbsDone++; st.coverage = 0;
            if (navigator.vibrate) navigator.vibrate(60);
          }
        }
        st.lastHandX = hand.x; st.lastHandY = hand.y;
      } else { st.lastHandX = null; st.lastHandY = null; }

      /* 금박 싸는 소리 — 능동적으로 문지르는 동안에만 루프 (고 휘젓기와 동일 패턴) */
      if (window.Sfx && !done) {
        if (rubbing) {
          st.foilIdle = 0;
          if (!st.foilOn) { window.Sfx.startLoop('dan_foil'); st.foilOn = true; }
        } else if (st.foilOn) {
          st.foilIdle++;
          if (st.foilIdle > 6) { window.Sfx.stopLoop('dan_foil'); st.foilOn = false; }
        }
      }

      var wrapProg = Math.min(1, (st.herbsDone + st.coverage) / Math.max(1, currentHerbObjs.length));
      scrubDanFrames(st, st.wrapFrames, wrapProg);
      drawDanSparkles(st);
      drawSanGauge(cx, gaugeY, wrapProg,
        '금박 위에서 손을 문질러 금박을 두르세요  (단 ' + st.herbsDone + '/' + currentHerbObjs.length + ')');

      if (done) {
        if (st.foilOn && window.Sfx) { window.Sfx.stopLoop('dan_foil'); st.foilOn = false; }
        checkAllDone();
      }
    }
  }

  function drawDanBgFrame(cw, ch) {
    var st = danState;
    if (st.framesReady && st.frames[st.frameIdx]) {
      var img = st.frames[st.frameIdx];
      var scale = Math.max(cw / img.width, ch / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    } else {
      drawLoadingScreen(cw, ch, st, '단약 준비 중');
    }
  }

  function spawnGoldSparkle(st, x, y) {
    if (st.sparkles.length > 90) return;
    var a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 16;
    st.sparkles.push({
      x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
      vx: (Math.random() - 0.5) * 0.8, vy: -0.4 - Math.random() * 1.1,
      life: 1, decay: 0.02 + Math.random() * 0.03, size: 1.5 + Math.random() * 2.5
    });
  }

  function drawDanSparkles(st) {
    for (var i = st.sparkles.length - 1; i >= 0; i--) {
      var s = st.sparkles[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.015; s.life -= s.decay;
      if (s.life <= 0) { st.sparkles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.shadowColor = 'rgba(255, 220, 120, 0.95)'; ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(255, 242, 185, 1)';
      ctx.translate(s.x, s.y); ctx.rotate(s.life * 6);
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════
     시작 / 정지
     ══════════════════════════════════════ */
  function startGame(herbObjs, formula, doses, disease) {
    if (!overlay) initElements();
    if (window.Sfx) window.Sfx.unlock();  /* 사용자 제스처 시점 — 오디오 자동재생 잠금 해제 */
    formulaName = formula || '';
    diseaseInfo = disease || null;
    currentHerbObjs = herbObjs || [];
    currentDoses = doses || [];
    currentType = (disease && disease.type) ? disease.type : 'tang';
    /* 제형별 배경음 루프 — 탕(보글보글) / 고(은은한 젓기) */
    if (window.Sfx) {
      if (currentType === 'tang') window.Sfx.startLoop('boil');
      else window.Sfx.stopLoop('boil');
      if (currentType === 'go') window.Sfx.startLoop('stir_bg');
      else window.Sfx.stopLoop('stir_bg');
      if (currentType === 'hwan') window.Sfx.startLoop('clay_bg');
      else window.Sfx.stopLoop('clay_bg');
      window.Sfx.stopLoop('stir');       /* 능동 휘젓기 소리는 항상 초기화 */
      window.Sfx.stopLoop('clay_roll');  /* 능동 굴리기 소리는 항상 초기화 */
    }
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

    /* 매 진입마다 소리는 무조건 켠 상태로 시작 (이전 음소거 기억 안 함) */
    if (window.Sfx) window.Sfx.setMuted(false);
    syncMuteBtn();

    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('herb-game-active');
    applyPanelWidthsForViewport();
    var mobile = isMobileDevice();
    overlay.classList.toggle('mobile-mode', mobile);
    overlay.classList.remove('book-expanded');  /* 책은 접힌 상태로 시작 */
    var bookFabEl = document.getElementById('herb-game-book-fab');
    if (bookFabEl) bookFabEl.setAttribute('aria-expanded', 'false');
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
    setupDanTouchButtons(false);  /* 단 금박 입히기는 캔버스 드래그 입력 */
    /* 탕만 떠다니는 약재 사용; 다른 제형은 절차적으로 그림 */
    if (currentType === 'tang') createFloatingHerbs(herbObjs, doses);
    else floatingHerbs = [];
    updateProgress();
    gameActive = true;

    if (mobile) {
      /* 모바일: 웹캠/MediaPipe 우회 → 터치 폴백을 기본 입력으로 사용 */
      setCamBanner(false);
      enableFallbackInput();
      gameLoop();
      return;
    }

    /* 데스크톱: 권한 미설정이면 좌측 상단 빨간 배너 노출(카메라 동작 시 자동 숨김) */
    refreshCameraPermissionUI();

    setupMediaPipe().then(function () {
      if (!gameActive) return;
      /* 단모드는 양손 추적 */
      if (hands) {
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.45
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
      tang: { title: '탕 달이기',    body: '약재를 길게 눌러 잡고<br>아래 약탕기로 끌어내리세요' },
      hwan: { title: '환 빚기',              body: '반죽을 좌우로 굴려 길게 민 뒤,<br>위아래로 썰고 동그랗게 굴려 환을 빚으세요' },
      san:  { title: '산 만들기',        body: '절구를 반복 탭해 약재를 빻은 뒤,<br>한지를 탭해 가루를 옮기세요' },
      go:   { title: '고 졸이기',         body: '솥 위에서 손가락으로<br>큰 원을 시계 방향으로 그리세요' },
      dan:  { title: '단 금박 두르기',  body: '단약을 눌러 집은 채 위로 올려 든 뒤,<br>손을 문질러 금박을 두르세요' }
    } : {
      tang: { title: '탕 달이기',     body: '엄지와 검지를 붙여 약재를 집은 뒤,<br>손을 아래로 내려 약탕기에 넣어 탕약을 완성하세요' },
      hwan: { title: '환 빚기',              body: '손바닥으로 반죽을 좌우로 굴려 길게 민 뒤,<br>손날로 위아래로 썰어 나누고 동그랗게 굴려 환을 빚으세요' },
      san:  { title: '산 만들기',        body: '주먹을 쥐고 절굿공이를 위아래로 움직여 약재를 찧은 뒤,<br>손을 왼쪽에서 오른쪽으로 끌어 가루를 한지 위에 부으세요' },
      go:   { title: '고 졸이기',         body: '손으로 솥 안을 크게 원을 그리며<br>시계 방향으로 휘저어 약을 완성하세요' },
      dan:  { title: '단 금박 두르기',  body: '엄지와 검지로 단약을 집은 채 손을 위로 올려 든 뒤,<br>손을 문질러 금박을 두르세요' }
    };
    var info = titleByType[type] || titleByType.tang;
    /* 두 번째 step의 가운데 버블만 교체 */
    var centerBubble = inner.querySelector('.coach-bubble-center');
    if (centerBubble) {
      centerBubble.innerHTML =
        '<p class="coach-title">' + info.title + '</p>' +
        '<p class="coach-body">' + info.body + '</p>';
    }
    setCoachHandForType(type);
  }

  /* 손동작 힌트 SVG — 모드별 손 모양/움직임 교체
     산: 주먹 위아래 빻기 / 고: 주먹 원형 휘젓기 / 그 외: 핀치(펼친 손) */
  function setCoachHandForType(type) {
    var hint = document.querySelector('#herb-game-coach .coach-hand-hint');
    if (!hint) return;
    var oldSvg = hint.querySelector('.coach-hand-svg');
    if (!oldSvg) return;
    /* 탕·환·산·고·단 모두 환(기본) 모션으로 통일 */
    oldSvg.outerHTML = pinchHandSvg();
  }

  /* 손 힌트 — 외부 이미지(흰색)로 통일. motionClass로 움직임 지정 */
  function pinchHandSvg() {
    return '<img src="asset/prescription/hand.svg" alt="" class="coach-hand-svg" />';
  }

  function fistHandSvg(motionClass) {
    return '<img src="asset/prescription/hand.svg" alt="" ' +
      'class="coach-hand-svg coach-hand-fist ' + motionClass + '" />';
  }

  function stopGame() {
    gameActive = false;
    setCamBanner(false); // 게임 종료 시 배너 숨김
    if (window.Sfx) { window.Sfx.stopLoop('boil'); window.Sfx.stopLoop('stir_bg'); window.Sfx.stopLoop('stir'); window.Sfx.stopLoop('clay_bg'); window.Sfx.stopLoop('clay_roll'); window.Sfx.stopLoop('dan_foil'); }  /* 배경음·휘젓기·굴리기·금박 정지 */
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
    if (overlay) overlay.classList.remove('mobile-mode', 'dan-mode', 'tang-mode', 'hwan-mode', 'san-mode', 'book-expanded');
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
          h.grabbed = true; grabState.active = true; grabState.herbIdx = i; sfx('grab');
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
     [단 모드] 모바일 — 금박 입히기는 캔버스 드래그(집어서 문지르기)로 입력받으므로
     별도 버튼이 없다. 과거 풀무 버튼 잔재만 정리한다.
     ══════════════════════════════════════ */
  var danBellowsEls = null;

  function setupDanTouchButtons(enable) {
    /* 이전(풀무) 버튼이 남아 있으면 제거 — 금박 입히기는 캔버스 드래그로 입력받음 */
    if (danBellowsEls) {
      if (danBellowsEls.wrap && danBellowsEls.wrap.parentNode) {
        danBellowsEls.wrap.parentNode.removeChild(danBellowsEls.wrap);
      }
      danBellowsEls = null;
    }
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
