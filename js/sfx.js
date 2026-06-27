/**
 * sfx.js — 처방 조제 게임 효과음 매니저
 *
 * 일회성:  window.Sfx.play('splash')
 * 배경 루프: window.Sfx.startLoop('boil') / window.Sfx.stopLoop('boil')
 * - 프리로드 + 폴리포니(연타 시 겹쳐 재생)
 * - 음소거 토글(localStorage 기억) — 음소거 시 진행 중인 루프도 멈춤/복귀
 * - 브라우저 자동재생 정책 대응: 첫 사용자 제스처에서 unlock()
 * - 음원 파일이 없어도 조용히 무시(에러 없음)
 *
 * 음원 파일: asset/sound/
 *   collect.wav / complete.wav — placeholder는 scripts/gen-placeholder-sfx.py 로 생성
 *   grab.mp3 / water_splash.mp3 / boiling_water.mp3 — 실제 mp3 음원(별도 제공)
 * 실제 녹음으로 교체할 때는 같은 파일명을 유지하면 코드 수정 불필요.
 */
(function () {
  'use strict';

  var BASE = 'asset/sound/';
  var MUTE_KEY = 'donguibogam-sfx-muted';

  /* 이름 → 파일. vol=볼륨 균형, loop=배경 루프 여부 */
  var SOUND_MAP = {
    grab:           { src: 'grab.mp3',           vol: 1.0, gain: 1.35 },  // 집는 소리 — vol 상한(1.0) 위로 WebAudio 게인 증폭
    collect:        { src: 'collect.mp3',        vol: 0.75 },
    collect_soft:   { src: 'collect.mp3',        vol: 0.18 },   // 단 약재 완성음(아주 작게)
    splash:         { src: 'water_splash.mp3',   vol: 0.85 },  // 약탕기 투입 모션(탕)
    crunch:         { src: 'crunch.mp3',          vol: 0.6 },  // 절구 찧기(산)
    sweep:          { src: 'sweep.mp3',           vol: 0.6 },  // 절구 기울여 옮기기(산)
    stir:           { src: 'stirring.mp3',         vol: 1.0, gain: 1.5, loop: true },  // 휘젓는 소리(고, 능동) — gain>1은 WebAudio로 증폭

    stir_bg:        { src: 'stirring_2.mp3',       vol: 0.22, loop: true },  // 고 화면 은은한 배경
    clay_roll:      { src: 'clay_rolling.mp3',     vol: 0.7, loop: true },  // 반죽 굴려 늘리기(환, 능동)
    clay:           { src: 'clay.mp3',             vol: 0.6 },               // 환 한 알씩 분리(환)
    clay_bg:        { src: 'clay.mp3',             vol: 0.18, loop: true }, // 환 화면 은은한 배경
    dan_place:      { src: 'drop.mp3',             vol: 0.8 },               // 단약을 금박 위에 내려놓기(단)
    dan_foil:       { src: 'rustle.mp3',           vol: 0.8, loop: true },  // 금박 싸기 — 문지르는 동안 루프(단)
    complete:       { src: 'complete.mp3',        vol: 0.7 },
    boil:           { src: 'boiling_water.mp3',   vol: 0.6, loop: true }  // 탕 화면 배경
  };

  var pool = {};          // name → 원본 Audio (프리로드 + 루프 재생용)
  var activeLoops = {};   // name → true (현재 켜진 루프)
  var muted = false;
  var unlocked = false;

  /* Web Audio 게인 — HTML audio.volume은 1.0이 최대라, 그 이상 키우려면 게인 노드가 필요.
     file:// 로 직접 열면 MediaElementSource가 음소거(taint)될 수 있어 이때는 사용하지 않고
     기본 audio 출력(volume 1.0)으로 폴백한다. */
  var audioCtx = null;
  var gainRouted = {};    // name → true (게인 노드로 라우팅 완료)
  var webAudioOK = !!(window.AudioContext || window.webkitAudioContext) &&
                   location.protocol !== 'file:';

  function ensureCtx() {
    if (!webAudioOK) return null;
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    } catch (e) { audioCtx = null; webAudioOK = false; }
    return audioCtx;
  }

  /* def.gain > 1 인 루프음을 게인 노드로 증폭 (요소당 1회만 연결) */
  function routeGain(name) {
    var def = SOUND_MAP[name];
    if (!def || !def.gain || def.gain <= 1 || gainRouted[name]) return;
    var ctx = ensureCtx();
    if (!ctx) return;
    try {
      var srcNode = ctx.createMediaElementSource(pool[name]);
      var g = ctx.createGain();
      g.gain.value = def.gain;
      srcNode.connect(g); g.connect(ctx.destination);
      gainRouted[name] = true;
    } catch (e) { /* 실패 시 기본 출력 사용 */ }
  }

  function resumeCtx() {
    if (audioCtx && audioCtx.state === 'suspended') {
      var r = audioCtx.resume();
      if (r && r.catch) r.catch(function () {});
    }
  }

  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  function preload() {
    Object.keys(SOUND_MAP).forEach(function (name) {
      var def = SOUND_MAP[name];
      var a = new Audio(BASE + def.src);
      a.preload = 'auto';
      a.volume = def.vol;
      if (def.loop) a.loop = true;
      pool[name] = a;
    });
  }

  /* 첫 사용자 제스처(게임 시작 클릭 등)에서 호출 — 자동재생 잠금 해제 */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    resumeCtx();
    Object.keys(pool).forEach(function (name) {
      if (SOUND_MAP[name].loop) return;  // 루프는 startLoop에서 직접 재생
      var a = pool[name];
      var saved = a.volume;
      a.volume = 0;
      var p = a.play();
      if (p && p.then) {
        p.then(function () {
          a.pause();
          a.currentTime = 0;
          a.volume = saved;
        }).catch(function () { a.volume = saved; });
      } else {
        a.pause();
        a.currentTime = 0;
        a.volume = saved;
      }
    });
  }

  /* 일회성 효과음 */
  function play(name) {
    if (muted) return;
    var def = SOUND_MAP[name];
    var base = pool[name];
    if (!def || !base || def.loop) return;
    /* 폴리포니: 매번 복제해 재생 → 빠른 연타도 겹쳐 들림 */
    var a = base.cloneNode();
    a.volume = def.vol;
    /* vol 상한(1.0)을 넘겨야 하는 소리는 WebAudio 게인으로 증폭.
       file:// 직접 열기 등 WebAudio 불가 환경에서는 기본 출력(vol 1.0)으로 폴백. */
    if (def.gain && def.gain > 1) {
      var ctx = ensureCtx();
      if (ctx) {
        try {
          resumeCtx();
          var srcNode = ctx.createMediaElementSource(a);
          var g = ctx.createGain();
          g.gain.value = def.gain;
          srcNode.connect(g); g.connect(ctx.destination);
          a.addEventListener('ended', function () {
            try { srcNode.disconnect(); g.disconnect(); } catch (e) {}
          }, { once: true });
        } catch (e) { /* 실패 시 기본 출력 사용 */ }
      }
    }
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* 배경 루프 시작 */
  function startLoop(name) {
    var def = SOUND_MAP[name];
    var a = pool[name];
    if (!def || !a) return;
    activeLoops[name] = true;
    if (muted) return;
    routeGain(name);   /* gain>1 루프음은 WebAudio 게인으로 증폭 */
    resumeCtx();
    a.loop = true;
    a.volume = def.vol;
    try { a.currentTime = 0; } catch (e) {}
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* 배경 루프 정지 */
  function stopLoop(name) {
    delete activeLoops[name];
    var a = pool[name];
    if (!a) return;
    a.pause();
    try { a.currentTime = 0; } catch (e) {}
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    /* 진행 중인 루프 멈춤/복귀 */
    Object.keys(activeLoops).forEach(function (name) {
      var a = pool[name];
      if (!a) return;
      if (muted) {
        a.pause();
      } else {
        a.loop = true;
        a.volume = SOUND_MAP[name].vol;
        var p = a.play();
        if (p && p.catch) p.catch(function () {});
      }
    });
    return muted;
  }

  function toggleMute() { return setMuted(!muted); }
  function isMuted() { return muted; }

  preload();

  window.Sfx = {
    play: play,
    startLoop: startLoop,
    stopLoop: stopLoop,
    unlock: unlock,
    toggleMute: toggleMute,
    setMuted: setMuted,
    isMuted: isMuted
  };
})();
