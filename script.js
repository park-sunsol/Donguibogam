(function () {
  'use strict';

  window.DONGUIBOGAM_TEXTS = window.DONGUIBOGAM_TEXTS || {};

  var CATEGORY_LABELS = { plant: '식물', animal: '동물', mineral: '광물', other: '기타', unclassified: '미분류' };
  /** effect category → main category (식물/동물/광물/기타/미분류) */
  /** 수부(獸)=짐승→동물, 수부(水)=물→기타, 금부(禽)=조류→동물, 금부(金)=금속→광물 */
  var EFFECT_TO_MAIN = {
    곡부: 'plant', 과부: 'plant', 목부: 'plant', 채부: 'plant', 초부: 'plant',
    석부: 'mineral', 옥부: 'mineral', '금부(金)': 'mineral',
    어부: 'animal', '금부(禽)': 'animal', '수부(獸)': 'animal', 인부: 'animal', 충부: 'animal',
    '수부(水)': 'other', 토부: 'other'
  };
  /** main category → sub categories (effect.json category 키) */
  var SUB_CATEGORIES = {
    plant: ['과부', '곡부', '목부', '채부', '초부'],
    mineral: ['석부', '옥부', '금부(金)'],
    animal: ['어부', '금부(禽)', '수부(獸)', '인부', '충부'],
    other: ['수부(水)', '토부'],
    unclassified: []
  };
  /** 카테고리 → 필터 버튼 표시명 (수부(獸)·수부(水)→수부, 금부(禽)·금부(金)→금부) */
  var SUB_CATEGORY_LABELS = { '금부(金)': '금부', '금부(禽)': '금부', '수부(獸)': '수부', '수부(水)': '수부' };
  var CATEGORY_COLORS = { plant: '#6b8e6b', animal: '#b8860b', mineral: '#8b7355', other: '#6b7b8e', water: '#4682b4' };
  /** 상세분류(effect category)용 색상 */

  /** 한자 음을 현대 한글로 치환 (표시용, 긴 키 우선) */
  var MODERN_KOREAN = {
    '등겁질': '등껍질', '겁질': '껍질', '불휫': '뿌리', '불휘': '뿌리', '나모여름': '나무열매',
    '나모': '나무', '나못': '나무', '동뎡귤': '동정귤', '야긔겁질': '야계껍질', '남셩의등겁질': '남성의 등껍질',
    '조팝나못불휘': '조팝나무뿌리', '회초밋불휘': '회초밑뿌리', '쟈리공불휘': '자리공뿌리', '솔옷불휘': '솔옷뿌리',
    '모싯불휘': '모싯뿌리', '반쵸불휘': '반초뿌리', '어어리나모여름': '어어리나무열매', '어저귀여름': '어저귀열매',
    '회화나모여름': '회화나무열매', '느릅나모겁질': '느릅나무껍질', '황벽나못겁질': '황벽나무껍질', '닥나모여름': '닥나무열매',
    '수유나모여름': '수유나무열매', '무프렛겁질': '무프렛껍질', '쵸피나모여름': '초피나무열매', '자괴나모겁질': '자괴나무껍질',
    '븕나모여름': '붉은나무열매', '주엽나모여름': '주엽나무열매', '가듁나모불휫겁질': '가죽나무뿌리껍질',
    '상근백피': '상근백피', '겨으사리': '겨우사리', '버슷': '버섯', '불버슷': '불버섯', '인잇기': '이끼',
    '쟈리공': '자리공', '반쵸': '반초', '우웡': '우엉', '복숑화': '복숭아', '곡도숑': '꼭두송', '암눈비얏': '암눈비얇',
    '원츄리': '원추리', '므은드레': '무은드레', '헝울': '허물', '얌댱': '뱀장', '독샤': '독사', '거믜': '거미',
    '구으리': '구리', '모긔': '모기', '게셔': '게서', '벌에': '벌레', '브억': '부엌', '녀름': '여름', '니어': '잉어',
    '댱': '장', '뭉긘': '뭉친', '긔': '기', '야긔': '야계', '남긔': '남기', '남셩': '남성', '바기': '바위'
  };
  function toModernKorean(s) {
    if (s == null || typeof s !== 'string') return '';
    var out = s;
    Object.keys(MODERN_KOREAN).sort(function (a, b) { return b.length - a.length; }).forEach(function (key) {
      out = out.split(key).join(MODERN_KOREAN[key]);
    });
    return out;
  }

  /** herb_korean 형태 '감초 (감초)' → '감초' (괄호 및 그 안 내용 제거, 표시용) */
  function stripParentheticalFromName(s) {
    if (s == null || typeof s !== 'string') return '';
    var trimmed = s.trim();
    var stripped = trimmed.replace(/\s*\(.*$/, '').trim();
    return stripped || trimmed;
  }

  var defaultHerbs = [
    { id: 'PLANT_001', category: 'plant', category_detail: '식물-뿌리/뿌리줄기', korean_name: '인삼', hanja_name: '人蔘', latin_name: 'Panax ginseng', english_name: 'Korean ginseng', tags: ['기력보강', '소화력강화', '면역강화'] },
    { id: 'PLANT_002', category: 'plant', category_detail: '식물-열매', korean_name: '오미자', hanja_name: '五味子', latin_name: 'Schisandra chinensis', english_name: 'Chinese magnolia vine', tags: ['열내림', '염증완화', '심신안정'] },
    { id: 'PLANT_003', category: 'plant', category_detail: '식물-뿌리/뿌리줄기', korean_name: '황기', hanja_name: '黃芪', latin_name: 'Astragalus membranaceus', english_name: 'Milk vetch', tags: ['기력보강', '면역강화', '열내림'] },
    { id: 'PLANT_004', category: 'plant', category_detail: '식물-뿌리/뿌리줄기', korean_name: '당귀', hanja_name: '當歸', latin_name: 'Angelica sinensis', english_name: 'Female ginseng', tags: ['혈액순환', '면역강화', '기력보강'] },
    { id: 'PLANT_005', category: 'plant', category_detail: '식물-뿌리/뿌리줄기', korean_name: '백출', hanja_name: '白朮', latin_name: 'Atractylodes macrocephala', english_name: 'White atractylodes', tags: ['소화력강화', '기력보강', '부종완화'] },
    { id: 'ANIMAL_001', category: 'animal', category_detail: '동물-포유류', korean_name: '녹용', hanja_name: '鹿茸', latin_name: 'Cornu Cervi Parvum', english_name: 'Deer antler', tags: ['기력보강', '혈액순환', '면역강화'] },
    { id: 'MINERAL_001', category: 'mineral', category_detail: '광물-보석/장식석', korean_name: '진주', hanja_name: '珍珠', latin_name: 'Margarita', english_name: 'Pearl', tags: ['심신안정', '열내림', '염증완화'] },
    { id: 'WATER_001', category: 'water', category_detail: '수부-비/강우', korean_name: '우수', hanja_name: '雨水', latin_name: '—', english_name: 'Rainwater', tags: ['열내림', '부종완화', '피부해독'] }
  ];
  var herbs = (typeof window !== 'undefined' && window.DONGUIBOGAM_HERBS && window.DONGUIBOGAM_HERBS.length > 0)
    ? window.DONGUIBOGAM_HERBS
    : defaultHerbs;

  var state = {
    viewMode: 'list',
    q: '',
    mainCategory: '',
    subCategory: '',
    selectedTags: [],
    graphSimulation: null,
    efficacyGroupBy: 'main',
    bodyViewDiseaseIds: null,
    efficacyCenterTag: ''
  };
  var ingredientGlbViewer = null;
  var ingredientModalHerbList = [];
  var ingredientModalHerbIndex = -1;
  var ingredientModalSimilarTag = '';
  var effectData = [];

  function getFilteredList() {
    // 썸네일(전용 이미지)이 매핑된 약재만 목록에 노출 — 이미지 없는 약재는 화면에서 제외
    var list = herbs.slice().filter(function (h) {
      return (typeof window.getThumbnailForHerb === 'function')
        ? !!window.getThumbnailForHerb(h)
        : true;
    });
    var q = state.q.trim().toLowerCase();
    var tags = state.selectedTags;

    if (q) {
      var englishSup = (typeof window !== 'undefined' && window.HERB_ENGLISH_SUPPLEMENT) ? window.HERB_ENGLISH_SUPPLEMENT : {};
      list = list.filter(function (h) {
        var name = (h.korean_name || '').toLowerCase();
        var hanja = (h.hanja_name || '').toLowerCase();
        var latin = (h.latin_name || '').toLowerCase();
        var tagStr = (h.tags || []).join(' ').toLowerCase();
        var englishName = (h.english_name || '').toLowerCase();
        var englishSupName = (englishSup[h.id] || '').toLowerCase();
        return name.indexOf(q) >= 0 || hanja.indexOf(q) >= 0 || latin.indexOf(q) >= 0 || tagStr.indexOf(q) >= 0
          || englishName.indexOf(q) >= 0 || englishSupName.indexOf(q) >= 0;
      });
    }
    var mainCat = state.mainCategory;
    var subCat = state.subCategory;
    if (mainCat) {
      list = list.filter(function (h) {
        var effectCat = getEffectCategory(h);
        var herbMain = EFFECT_TO_MAIN[effectCat] || 'unclassified';
        if (herbMain !== mainCat) return false;
        if (subCat) return effectCat === subCat;
        return true;
      });
    }
    if (tags.length > 0) {
      list = list.filter(function (h) {
        var t = h.tags || [];
        return tags.every(function (tag) { return t.indexOf(tag) >= 0; });
      });
    }
    return list;
  }

  /** effect.json efficacy_korean_* 문장에서 효능 태그 추출 (effect-efficacy-map 사용) */
  function extractTagsFromEfficacy(effectRecord) {
    var map = (typeof window !== 'undefined' && window.DONGUIBOGAM_EFFICACY_KOREAN_MAP) ? window.DONGUIBOGAM_EFFICACY_KOREAN_MAP : {};
    var text = '';
    for (var i = 1; i <= 10; i++) {
      var v = effectRecord['efficacy_korean_' + i];
      if (v && typeof v === 'string') text += v + ' ';
    }
    var tags = [];
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var j = 0; j < keys.length; j++) {
      if (text.indexOf(keys[j]) >= 0) {
        var tag = map[keys[j]];
        if (tag && tags.indexOf(tag) < 0) tags.push(tag);
      }
    }
    return tags;
  }

  function getDisplayEnglish(herb) {
    var sup = (typeof window !== 'undefined' && window.HERB_ENGLISH_SUPPLEMENT) ? window.HERB_ENGLISH_SUPPLEMENT : {};
    if (sup[herb.id]) return sup[herb.id];
    if (herb.english_name && herb.english_name.trim()) return herb.english_name.trim();
    return '';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
  function escapeAttr(s) {
    if (s == null) return '';
    return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function isInsamCard(h) {
    if (!h) return false;
    var id = h.id != null ? String(h.id).trim() : '';
    var name = (h.korean_name || '').trim();
    var latin = (h.latin_name || '').trim().toLowerCase();
    if (id === 'PLANT_001' || name === '인삼') return true;
    if (latin === 'panax ginseng' || (latin.indexOf('panax ginseng') === 0 && latin.indexOf('red') < 0)) return true;
    return false;
  }
  function getThumbnailPathFallback() {
    return '';
  }
  function getGlbPathFallback(h) {
    if (!h) return '';
    if (isInsamCard(h)) return 'asset/insam.glb';
    return '';
  }

  var _chungbuHelpBound = false;
  function updateChungbuHelp() {
    var wrap = document.getElementById('chungbu-help');
    if (!wrap) return;
    var show = (state.subCategory === '충부');
    wrap.hidden = !show;
    if (!show) {
      var b = document.getElementById('chungbu-help-bubble');
      if (b) b.hidden = true;
      ['chungbu-help-label', 'chungbu-help-icon'].forEach(function (id) {
        var t = document.getElementById(id);
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }

    if (!_chungbuHelpBound) {
      _chungbuHelpBound = true;
      var bubble = document.getElementById('chungbu-help-bubble');
      var label = document.getElementById('chungbu-help-label');
      var icon = document.getElementById('chungbu-help-icon');
      var triggers = [label, icon].filter(Boolean);
      if (!bubble || triggers.length === 0) return;
      function setExpanded(v) {
        triggers.forEach(function (t) { t.setAttribute('aria-expanded', v ? 'true' : 'false'); });
      }
      function close() {
        bubble.hidden = true;
        setExpanded(false);
      }
      triggers.forEach(function (t) {
        t.addEventListener('click', function (e) {
          e.stopPropagation();
          var willOpen = bubble.hidden;
          bubble.hidden = !willOpen;
          setExpanded(willOpen);
        });
      });
      bubble.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function () { if (!bubble.hidden) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !bubble.hidden) close(); });
    }
  }

  function renderListView(filtered) {
    var grid = document.getElementById('list-view-grid');
    var countEl = document.getElementById('list-count');
    if (!grid) return;

    var sorted = filtered.slice().sort(function (a, b) {
      return (a.korean_name || '').localeCompare(b.korean_name || '', 'ko-KR');
    });

    if (countEl) countEl.textContent = sorted.length;
    var prefixEl = document.getElementById('list-caption-prefix');
    if (prefixEl) prefixEl.textContent = state.q.trim() ? '"' + state.q.trim() + '"' : '가나다순';

    grid.innerHTML = sorted.map(function (h) {
      var effectRecord = getEffectRecord(h);
      var hasEffect = !!effectRecord;
      var displayKorean = hasEffect && effectRecord.herb_korean ? toModernKorean(effectRecord.herb_korean.trim()) : toModernKorean(h.korean_name || '');
      var displayHanja = hasEffect && effectRecord.herb_hanja ? effectRecord.herb_hanja.trim() : (h.hanja_name || '');
      var tags = hasEffect && effectRecord ? extractTagsFromEfficacy(effectRecord) : (h.tags || []);
      if (h.tags && h.tags.length > tags.length) tags = h.tags;
      // 태그는 전부 렌더 후 fitFunctionTags()가 한 줄에 맞게 잘라 +n 뱃지를 단다
      var tagsHtml = tags.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('');
      var moreBtn = tags.length > 0 ? '<button type="button" class="functions-more" hidden>+0</button>' : '';
      var thumbSrc = (typeof window.getThumbnailForHerb === 'function' && window.getThumbnailForHerb(h)) || getThumbnailPathFallback(h);
      var glbPath = (typeof window.getGlbPathForHerb === 'function' && window.getGlbPathForHerb(h)) || getGlbPathFallback(h);
      var imageBlock;
      if (thumbSrc) {
        imageBlock = '<div class="herb-thumbnail" data-role="herb-image"><img src="' + escapeAttr(thumbSrc) + '" alt="' + escapeAttr(displayKorean || '') + '" loading="lazy"></div>';
      } else if (glbPath) {
        imageBlock = '<div class="herb-glb-viewer" data-glb="' + escapeAttr(glbPath) + '" data-role="herb-image"></div>';
      } else {
        imageBlock = '<div class="herb-image-placeholder" data-role="herb-image">이미지</div>';
      }
      var displayEnglish = getDisplayEnglish(h);
      var displayLatin = (displayEnglish || h.latin_name || '').trim();
      var filterInfo = getFilterDisplayText(h);
      var cardClass = 'herb-card cursor-pointer' + (hasEffect ? '' : ' herb-card--no-effect');
      var subLine = [];
      if (displayHanja) subLine.push(escapeHtml(displayHanja));
      if (displayLatin && displayLatin !== (displayHanja || '').trim()) subLine.push(escapeHtml(displayLatin));
      var subLineHtml = subLine.length > 0 ? '<p class="herb-subline">' + subLine.join(' · ') + '</p>' : '';
      var functionsBlock = tags.length > 0
        ? '<div class="functions-wrap"><ul class="functions">' + tagsHtml + '</ul>' + moreBtn + '</div>'
        : '';
      return '<article class="' + cardClass + '" data-id="' + escapeAttr(h.id) + '" data-category="' + escapeAttr(h.category) + '" data-category-detail="' + escapeAttr(h.category_detail || '') + '" data-functions="' + escapeAttr(tags.join(',')) + '">' +
        imageBlock +
        '<div class="herb-meta">' +
          '<h3 class="herb-name herb-name-title">' + escapeHtml(displayKorean) + '</h3>' +
          subLineHtml +
          '<p class="herb-filter-info">' + escapeHtml(filterInfo) + '</p>' +
          functionsBlock +
        '</div>' +
      '</article>';
    }).join('');

    bindHerbCardClicks();
    bindFunctionsMoreClicks();
    fitFunctionTags(grid);
    if (typeof window.initGlbViewers === 'function') {
      window.initGlbViewers();
      requestAnimationFrame(function () { window.initGlbViewers(); });
    }
  }

  /* 효능 태그를 한 줄에 맞게 자르고, 넘치는 개수를 +n 뱃지로 표시 */
  function fitFunctionTags(scope) {
    (scope || document).querySelectorAll('.herb-card .functions-wrap').forEach(function (wrap) {
      var ul = wrap.querySelector('.functions');
      var btn = wrap.querySelector('.functions-more');
      if (!ul || ul.classList.contains('functions--expanded')) return;
      var lis = Array.prototype.slice.call(ul.children);
      if (!lis.length) return;
      lis.forEach(function (li) { li.hidden = false; });
      if (btn) btn.hidden = true;
      if (ul.scrollWidth <= ul.clientWidth + 1) return; // 전부 한 줄에 들어감
      if (btn) btn.hidden = false; // 뱃지 공간을 확보한 상태에서 측정
      var hiddenCount = 0;
      for (var i = lis.length - 1; i > 0; i--) {
        lis[i].hidden = true;
        hiddenCount++;
        if (btn) btn.textContent = '+' + hiddenCount;
        if (ul.scrollWidth <= ul.clientWidth + 1) break;
      }
    });
  }

  var _fitTagsTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(_fitTagsTimer);
    _fitTagsTimer = setTimeout(function () { fitFunctionTags(); }, 150);
  });

  function bindFunctionsMoreClicks() {
    document.querySelectorAll('.herb-card .functions-more').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wrap = btn.closest('.functions-wrap');
        var ul = wrap && wrap.querySelector('ul.functions');
        if (!ul) return;
        ul.classList.add('functions--expanded');
        Array.prototype.forEach.call(ul.children, function (li) { li.hidden = false; });
        btn.remove();
      });
    });
  }

  function bindHerbCardClicks() {
    document.querySelectorAll('.herb-card').forEach(function (card) {
      var id = card.getAttribute('data-id');
      if (!id) return;
      card.addEventListener('click', function (e) {
        if (e.target.closest('.functions-more')) return;
        var herb = herbs.find(function (h) { return h.id === id; });
        if (herb && typeof window.openHerbDetail === 'function') window.openHerbDetail(herb);
      });
    });
  }


  /* 출처 영역 하단 서명: 동·의·보·감 lottie 드로온 — 화면에 들어올 때 한 번 글써짐 */
  var _signLottie = null;
  function initSignLottie() {
    if (_signLottie || typeof window.lottie === 'undefined') return _signLottie;
    var els = document.querySelectorAll('.dgbg-sign-char[data-lottie]');
    if (!els.length) return null;
    _signLottie = [];
    els.forEach(function (el) {
      var anim = window.lottie.loadAnimation({
        container: el,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: el.getAttribute('data-lottie')
      });
      anim.setSpeed(1.4);
      _signLottie.push(anim);
    });
    return _signLottie;
  }
  function playSignLottie() {
    var anims = initSignLottie();
    if (!anims) return;
    anims.forEach(function (anim, i) {
      var draw = function () {
        anim.goToAndStop(0, true);
        setTimeout(function () { anim.goToAndPlay(0, true); }, i * 360);
      };
      if (anim.isLoaded) draw();
      else anim.addEventListener('DOMLoaded', draw);
    });
  }
  var _signObserved = false;
  function initSignLottieObserver() {
    if (_signObserved) return;
    var sign = document.querySelector('.data-view-sign');
    if (!sign) return;
    _signObserved = true;
    if (!('IntersectionObserver' in window)) { playSignLottie(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          playSignLottie();
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(sign);
  }

  function setViewMode(mode) {
    if (state.viewMode === 'efficacy' && mode !== 'efficacy' && window._efficacyUniverse3D) {
      window._efficacyUniverse3D.dispose();
    }
    /* efficacy-top-view-mode가 남아 있으면 필터바가 숨겨지므로 명시적으로 제거 */
    if (mode !== 'efficacy' && document.body.classList.contains('efficacy-top-view-mode')) {
      document.body.classList.remove('efficacy-top-view-mode');
    }
    var prevMode = state.viewMode;
    state.viewMode = mode;
    var listPanel = document.getElementById('list-view');
    var bodyPanel = document.getElementById('body-view');
    var efficacyPanel = document.getElementById('efficacy-view');
    var dataPanel = document.getElementById('data-view');
    var listTab = document.getElementById('view-list');
    var bodyTab = document.getElementById('view-body');
    var efficacyTab = document.getElementById('view-efficacy');
    var dataTab = document.getElementById('view-data');
    if (listPanel) listPanel.setAttribute('aria-hidden', mode !== 'list');
    if (bodyPanel) bodyPanel.setAttribute('aria-hidden', mode !== 'body');
    if (efficacyPanel) efficacyPanel.setAttribute('aria-hidden', mode !== 'efficacy');
    if (dataPanel) dataPanel.setAttribute('aria-hidden', mode !== 'data');
    var dataCaption = document.getElementById('data-view-caption');
    if (mode === 'data') {
      if (dataCaption) {
        dataCaption.classList.remove('data-view-caption--in');
        void dataCaption.offsetWidth;
        requestAnimationFrame(function () {
          dataCaption.classList.add('data-view-caption--in');
        });
      }
      // caption 유무와 무관하게 서명 Lottie 초기화
      requestAnimationFrame(function () { initSignLottieObserver(); });
    } else if (dataCaption) {
      dataCaption.classList.remove('data-view-caption--in');
    }
    if (listTab) listTab.setAttribute('aria-selected', mode === 'list');
    if (bodyTab) bodyTab.setAttribute('aria-selected', mode === 'body');
    if (efficacyTab) efficacyTab.setAttribute('aria-selected', mode === 'efficacy');
    if (dataTab) dataTab.setAttribute('aria-selected', mode === 'data');
    var emptyMsg = document.getElementById('empty-message');
    if (emptyMsg) emptyMsg.setAttribute('aria-hidden', mode === 'body' || mode === 'efficacy' || mode === 'data');
    var listFilters = document.getElementById('list-filters');
    if (listFilters) listFilters.setAttribute('aria-hidden', mode !== 'list');
    document.body.classList.toggle('view-mode-data', mode === 'data');
    var efficacyHelpBtn = document.getElementById('efficacy-help-btn');
    if (efficacyHelpBtn) efficacyHelpBtn.setAttribute('aria-hidden', mode !== 'efficacy');
    if (mode === 'body') {
      renderPrescView();
    }
    if (mode === 'efficacy') renderEfficacyTree();
    if (mode === 'data') {
      renderDashboard();
      // 탭 전환 시 캐러셀 rAF 재시작 (display:none → 표시 전환으로 observer가 늦게 반응하는 경우 대비)
      requestAnimationFrame(function () {
        if (typeof window._rhcWakeup === 'function') window._rhcWakeup();
      });
    }
    /* 탭마다 스크롤을 유지하지 않고, 다른 탭으로 옮길 때마다 페이지 맨 위로 (sticky/검색 접힘 상태도 일관되게) */
    if (prevMode !== mode) {
      /* 가치 탭은 html에 scroll-behavior:smooth가 걸려 있어 behavior:'auto'여도 맨 위로
         부드럽게 스르륵 내려간다. 그 사이 scrollY가 커서 검색창이 접혔다가 도착 후 다시
         펼쳐지는 깜빡임이 생기므로, 탭 전환 점프 동안만 인라인으로 즉시 스크롤을 강제한다. */
      var de = document.documentElement;
      var prevScrollBehavior = de.style.scrollBehavior;
      de.style.scrollBehavior = 'auto';
      /* :has() 무효화가 지연돼 scrollTo가 아직 smooth로 읽는 것을 막기 위해 강제 재계산 */
      void getComputedStyle(de).scrollBehavior;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      requestAnimationFrame(function () { de.style.scrollBehavior = prevScrollBehavior; });
      maybeShowViewCoachmarks(mode);
    }
    /* 탭 전환 직후 헤더·검색 표시가 바뀌는데 sticky 필터 top이 한 박자 늦으면 1~2px 틈이 보임 */
    if (typeof window._syncStickyListChrome === 'function') {
      window._syncStickyListChrome();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (typeof window._syncStickyListChrome === 'function') window._syncStickyListChrome();
        });
      });
    }
  }

  function getDashboardStats() {
    var data = effectData && effectData.length > 0 ? effectData : herbs.map(function (h) {
      var rec = getEffectRecord(h);
      return rec ? { category: rec.category, herb_korean: rec.herb_korean, herb_hanja: rec.herb_hanja } : null;
    }).filter(Boolean);
    var mainCounts = {};
    var subCounts = {};
    data.forEach(function (entry) {
      var cat = entry.category || '미분류';
      var main = EFFECT_TO_MAIN[cat] || 'unclassified';
      mainCounts[main] = (mainCounts[main] || 0) + 1;
      subCounts[cat] = (subCounts[cat] || 0) + 1;
    });
    return { total: data.length, mainCounts: mainCounts, subCounts: subCounts };
  }

  function renderDashboard() {
    var container = document.getElementById('dashboard-container');
    if (!container) return;
    // Bug 2 fix: 탭을 다시 열 때 불필요한 전체 재렌더링 방지
    if (container.dataset.rendered === '1') return;
    container.dataset.rendered = '1';
    var stats = getDashboardStats();
    var total = stats.total;
    var html = '';
    html += '<div class="dashboard-charts">';
    html += '<div class="dashboard-chart-block dashboard-sunburst-block overview-card">';
    html += '<div class="dashboard-block-header overview-card-header">';
    html += '<div>';
    html += '<h2 class="dashboard-block-title overview-card-title">우리의 약재들, 향약과 자주의학</h2>';
    html += '<p class="dashboard-block-subtitle overview-card-subtitle">이 땅에서 나는 것으로 이 땅의 사람을 살폈다</p>';
    html += '</div>';
    // 보기 전환 토글: 분류 체계별(선버스트) ↔ 향약 분류별(출신 트리맵)
    html += '<div class="dashboard-viewmode-toggle" role="tablist" aria-label="도표 보기 전환">';
    html += '<button type="button" class="dashboard-viewmode-btn is-active" id="dashboard-viewmode-origin" role="tab" aria-selected="true">자생지별 보기</button>';
    html += '<button type="button" class="dashboard-viewmode-btn" id="dashboard-viewmode-category" role="tab" aria-selected="false">유형별 보기</button>';
    html += '</div>';
    html += '</div>';
    // ── 분류 체계별 보기 (기존 선버스트) ───────────────────────────────
    html += '<div class="dashboard-view dashboard-view--category" id="dashboard-view-category" hidden>';
    html += '<div class="dashboard-sunburst-wrap" id="dashboard-sunburst-wrap">';
    html += '<button type="button" class="dashboard-sunburst-back-btn" id="dashboard-sunburst-back-btn" aria-label="상위로 돌아가기" aria-hidden="true">&lsaquo;</button>';
    html += '<div class="dashboard-explore-hint" id="dashboard-sunburst-explore-hint" aria-hidden="false"><span class="dashboard-explore-hint-text">그래프를 클릭해서<br>더 깊게 탐색하세요</span><span class="dashboard-explore-hint-arrow" aria-hidden="true">&rarr;</span></div>';
    html += '<div class="dashboard-sunburst-stage">';
    html += '<div id="dashboard-sunburst" class="dashboard-sunburst dashboard-sunburst-svg-host" aria-label="분류·상세분류 줌 가능 선버스트 차트"></div>';
    html += '<div id="dashboard-sunburst-treemap" class="dashboard-sunburst-treemap" aria-hidden="true"></div>';
    html += '</div>';
    html += '</div>';
    html += '<p class="dashboard-sunburst-hint">대분류·중분류 클릭: 확대 · 상세 분류(초부 등)에서는 사각형 타일로 펼쳐짐 · «뒤로» 또는 배경: 한 단계 위로</p>';
    html += '</div>';
    // ── 향약 분류별 보기 (출신 색 선버스트 + 드릴다운) ─────────────────
    html += '<div class="dashboard-view dashboard-view--origin" id="dashboard-view-origin">';
    html += '<div class="dashboard-origin-legend" id="dashboard-origin-legend"></div>';
    html += '<div class="dashboard-sunburst-wrap dashboard-origin-wrap" id="dashboard-origin-wrap">';
    html += '<button type="button" class="dashboard-sunburst-back-btn" id="dashboard-origin-back-btn" aria-label="상위로 돌아가기" aria-hidden="true">&lsaquo;</button>';
    html += '<div class="dashboard-explore-hint" id="dashboard-origin-explore-hint" aria-hidden="false"><span class="dashboard-explore-hint-text">그래프를 클릭해서<br>더 깊게 탐색하세요</span><span class="dashboard-explore-hint-arrow" aria-hidden="true">&rarr;</span></div>';
    html += '<div class="dashboard-sunburst-stage">';
    html += '<div id="dashboard-origin-chart" class="dashboard-origin-chart dashboard-sunburst dashboard-sunburst-svg-host" aria-label="출신 분류 줌 가능 선버스트 차트"></div>';
    html += '<div id="dashboard-origin-treemap" class="dashboard-sunburst-treemap" aria-hidden="true"></div>';
    html += '</div>';
    html += '</div>'; // dashboard-origin-wrap
    html += '</div>'; // dashboard-view--origin
    html += '</div>'; // dashboard-sunburst-block
    html += '</div>'; // dashboard-charts
    container.innerHTML = html;
    function runCountAnimation(el) {
      if (!el) return;
      var targetVal = parseInt(el.getAttribute('data-count-to'), 10);
      var fromVal = parseInt(el.getAttribute('data-count-from'), 10);
      if (isNaN(targetVal)) return;
      if (isNaN(fromVal)) fromVal = 0;
      var duration = 1200;
      var start = performance.now();
      var isRange = fromVal !== targetVal && fromVal > 0;
      function animateCount(now) {
        var elapsed = now - start;
        var t = Math.min(elapsed / duration, 1);
        var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var curr = Math.floor(fromVal + eased * (targetVal - fromVal));
        el.textContent = curr;
        if (t < 1) requestAnimationFrame(animateCount);
        else el.textContent = isRange ? (fromVal + '\u2013' + targetVal) : targetVal;
      }
      requestAnimationFrame(animateCount);
    }
    container.querySelectorAll('[data-count-to]').forEach(runCountAnimation);

    // ── 보기 전환(분류 체계별 ↔ 향약 분류별) 배선 ──────────────────────
    setupDashboardViewToggle(container);

    if (typeof d3 !== 'undefined') {
      var sunburstEl = document.getElementById('dashboard-sunburst');
      if (sunburstEl && total > 0) {
        requestAnimationFrame(function () {
          // ── 데이터 준비 ──────────────────────────────────────────────
          var mainLabels = { plant: '식물', animal: '동물', mineral: '광물', other: '기타', unclassified: '미분류' };
          var mainOrder  = ['plant', 'animal', 'mineral', 'other', 'unclassified'];
          var rawData = effectData && effectData.length > 0
            ? effectData
            : herbs.map(function (h) {
                var rec = getEffectRecord(h);
                return rec ? { category: rec.category, herb_korean: rec.herb_korean, herb_hanja: rec.herb_hanja } : null;
              }).filter(Boolean);

          // 계층: root → 대분류(depth1) → 중분류(depth2, value = 약재 수)
          var mainNodes = [];
          mainOrder.forEach(function (mainKey) {
            var subs = SUB_CATEGORIES[mainKey] || [];
            var subNodes = [];
            subs.forEach(function (subKey) {
              var herbsInSub = rawData.filter(function (e) { return e.category === subKey; });
              if (herbsInSub.length === 0) return;
              var subLabel = SUB_CATEGORY_LABELS[subKey] || subKey;
              // 약재 목록은 treemap 전용으로 별도 보관
              subNodes.push({
                name: subLabel,
                subKey: subKey,
                value: herbsInSub.length,
                herbs: herbsInSub.map(function (entry) {
                  var name = entry.herb_korean
                    ? stripParentheticalFromName(toModernKorean(entry.herb_korean.trim()))
                    : (entry.herb_hanja || '');
                  return { name: name || '?', value: 1, entry: entry };
                })
              });
            });
            if (subNodes.length > 0) {
              mainNodes.push({ name: mainLabels[mainKey], mainKey: mainKey, children: subNodes });
            }
          });
          if (mainNodes.length === 0) return;
          var hierData = { name: 'root', children: mainNodes };

          // ── 크기 계산 ────────────────────────────────────────────────
          var containerW = (sunburstEl.closest && sunburstEl.closest('.dashboard-container')
            ? sunburstEl.closest('.dashboard-container').clientWidth : 0)
            || (sunburstEl.parentElement && sunburstEl.parentElement.clientWidth) || 800;
          var isMobile = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches;
          var size = isMobile ? Math.min(500, containerW - 16) : Math.min(820, containerW - 32);
          size = Math.max(300, size);

          var innerR  = size * 0.20;   // 가운데 빈 원
          var outerR1 = size * 0.40;   // 대분류 바깥 반지름
          var outerR2 = size * 0.60 + 2;   // 중분류 바깥 반지름 (중분류 링 두께 = 대분류 링 두께)
          var vb = outerR2 + 26;       // 여백 최소화 → 드릴다운 도넛과 동일 크기로 렌더 (callout은 overflow:visible로 표시)

          // ── D3 파티션 레이아웃 (depth1=대, depth2=중) ───────────────
          var root = d3.hierarchy(hierData)
            .sum(function (d) { return d.value || 0; });
          // depth1 정렬: mainOrder 순서대로
          root.sort(function (a, b) {
            if (a.depth === 1 && b.depth === 1) {
              return mainOrder.indexOf(a.data.mainKey) - mainOrder.indexOf(b.data.mainKey);
            }
            return (b.value || 0) - (a.value || 0);
          });
          d3.partition().size([2 * Math.PI, 2])(root); // y: 0~2 (root=0~1, depth1=1~2)

          // ── 색상 ─────────────────────────────────────────────────────
          var colorMain = {};
          mainNodes.forEach(function (m) { colorMain[m.name] = CATEGORY_COLORS[m.mainKey] || '#999'; });
          function getMainColor(d) {
            var n = d; while (n.depth > 1) n = n.parent;
            return colorMain[n.data.name] || '#999';
          }
          function lighten(hex, amount) {
            // hex → RGB → lighten by blending to white
            var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
            r = Math.round(r + (255 - r) * amount);
            g = Math.round(g + (255 - g) * amount);
            b = Math.round(b + (255 - b) * amount);
            return 'rgb(' + r + ',' + g + ',' + b + ')';
          }

          // ── arc 생성기 ───────────────────────────────────────────────
          function makeArc(ir, or) {
            return d3.arc()
              .startAngle(function (d) { return d.x0; })
              .endAngle(function (d)   { return d.x1; })
              .padAngle(0.012)
              .padRadius((ir + or) / 2)
              .innerRadius(ir)
              .outerRadius(or);
          }
          var arcMain = makeArc(innerR, outerR1);
          var arcSub  = makeArc(outerR1 + 2, outerR2);

          // ── SVG 생성 ─────────────────────────────────────────────────
          sunburstEl.innerHTML = '';
          var svg = d3.select(sunburstEl).append('svg')
            .attr('viewBox', [-vb, -vb, 2 * vb, 2 * vb])
            .attr('width', '100%')
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('overflow', 'visible');

          // ── 대분류 링 (depth1) ───────────────────────────────────────
          var depth1 = root.children || [];
          svg.append('g').attr('class', 'arc-main')
            .selectAll('path')
            .data(depth1)
            .join('path')
            .attr('d', arcMain)
            .attr('fill', function (d) { return getMainColor(d); })
            .attr('fill-opacity', 0.85)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseenter', function () {
              d3.select(this).transition().duration(100).attr('fill-opacity', 1);
            })
            .on('mouseleave', function () {
              d3.select(this).transition().duration(160).attr('fill-opacity', 0.85);
            })
            .on('click', function (ev, d) {
              ev.stopPropagation();
              showDrillDown(d);
            })
            .append('title')
            .text(function (d) { return d.data.name + ' · ' + d.value + '종'; });

          // 대분류 라벨
          svg.append('g').attr('class', 'label-main')
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .selectAll('text')
            .data(depth1)
            .join('text')
            .attr('transform', function (d) {
              var mid = (d.x0 + d.x1) / 2;
              var r   = (innerR + outerR1) / 2;
              return 'rotate(' + (mid * 180 / Math.PI - 90) + ') translate(' + r + ',0) rotate(' + (mid > Math.PI ? 180 : 0) + ')';
            })
            .attr('class', 'dgb-label-main')
            .attr('dy', '0.35em')
            .text(function (d) { return d.data.name; });

          // ── 중분류 링 (depth2) ───────────────────────────────────────
          var depth2 = root.descendants().filter(function (d) { return d.depth === 2; });
          svg.append('g').attr('class', 'arc-sub')
            .selectAll('path')
            .data(depth2)
            .join('path')
            .attr('d', arcSub)
            .attr('fill', function (d) { return lighten(getMainColor(d), 0.35); })
            .attr('fill-opacity', 0.9)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseenter', function () {
              d3.select(this).transition().duration(100)
                .attr('fill', function (d) { return lighten(getMainColor(d), 0.15); })
                .attr('fill-opacity', 1);
            })
            .on('mouseleave', function () {
              d3.select(this).transition().duration(160)
                .attr('fill', function (d) { return lighten(getMainColor(d), 0.35); })
                .attr('fill-opacity', 0.9);
            })
            .on('click', function (ev, d) {
              ev.stopPropagation();
              showTreemap(d, true);
            })
            .append('title')
            .text(function (d) { return d.data.name + ' · ' + d.value + '종'; });

          // ── 중분류 라벨 ─────────────────────────────────────────────
          var arcMidR        = (outerR1 + 2 + outerR2) / 2;
          var lineGap        = isMobile ? 14 : 18;
          // 호 길이 계산 (각도 × 중간 반지름)
          function arcLen(d) { return (d.x1 - d.x0) * arcMidR; }

          // 이름 글자수 × 글자폭(px) 기준으로 인라인 표시 가능 여부 판단
          // subKey 기준으로 강제 callout 처리 (name이 줄임말로 바뀌므로 subKey로 판별)
          var FORCE_CALLOUT_KEYS = ['금부(金)', '옥부'];
          var charPx = isMobile ? 9 : 11; // 한 글자 폭 대략
          function canInline(d) {
            if (FORCE_CALLOUT_KEYS.indexOf(d.data.subKey) !== -1) return false;
            var nameLen = (d.data.name || '').length * charPx + 4;
            return arcLen(d) >= nameLen;
          }

          var labelSubG = svg.append('g').attr('class', 'label-sub')
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle');

          // 인라인 가능한 슬라이스: 이름 + 종수 두 줄
          var subLabelGroups = labelSubG.selectAll('g.inline')
            .data(depth2.filter(canInline))
            .join('g').attr('class', 'inline')
            .attr('transform', function (d) {
              var mid = (d.x0 + d.x1) / 2;
              return 'rotate(' + (mid * 180 / Math.PI - 90) + ') translate(' + arcMidR + ',0) rotate(' + (mid > Math.PI ? 180 : 0) + ')';
            });

          subLabelGroups.append('text')
            .attr('class', 'dgb-label-sub-name')
            .attr('dy', '-0.15em')
            .text(function (d) { return d.data.name; });

          subLabelGroups.append('text')
            .attr('class', 'dgb-label-sub-count')
            .attr('dy', lineGap + 'px')
            .text(function (d) { return d.value + '종'; });

          // ── callout: 이름이 arc 안에 못 들어가는 슬라이스 ────────────
          var calloutR    = outerR2 + 8;   // 선 시작점 반지름
          var calloutElbR = outerR2 + 56;  // 꺾임 지점 기본 반지름 (선을 길게)

          // 이름을 인라인으로 못 그리는 슬라이스 모두 callout 처리
          var tinySlices = depth2.filter(function (d) { return !canInline(d); });

          // 겹침 방지: 각 슬라이스의 꺾임 y 위치를 추적해 충돌 시 elbR 조정
          var usedYMain = [];
          var calloutLinesG = svg.append('g').attr('class', 'callout-lines').attr('pointer-events', 'none');
          var calloutLabelsG = svg.append('g').attr('class', 'callout-labels').attr('pointer-events', 'none');

          tinySlices.forEach(function (d) {
            var mid = (d.x0 + d.x1) / 2;
            var cos = Math.cos(mid - Math.PI / 2);
            var sin = Math.sin(mid - Math.PI / 2);
            var dir = (cos >= 0) ? 1 : -1;

            // 겹침 방지: 비슷한 y가 이미 있으면 elbR을 늘려 y를 분리
            var baseElbR = calloutElbR;
            var rawY = sin * baseElbR;
            var bump = 0;
            // 2줄 라벨(이름+종수) 한 블록 높이(약 44~48px)보다 커야 인접 콜아웃(금부·옥부 등)이 안 겹친다
            var minGap = isMobile ? 40 : 48;
            for (var ui = 0; ui < usedYMain.length; ui++) {
              if (Math.abs(usedYMain[ui] - (rawY + bump)) < minGap) {
                bump += (rawY + bump <= usedYMain[ui]) ? -minGap : minGap;
              }
            }
            usedYMain.push(rawY + bump);

            var x1 = cos * calloutR,    y1 = sin * calloutR;
            var x2 = cos * baseElbR,    y2 = sin * baseElbR + bump;
            var x3 = x2 + dir * 26,    y3 = y2;

            calloutLinesG.append('polyline')
              .attr('points', x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3)
              .attr('fill', 'none')
              .attr('stroke', '#999')
              .attr('stroke-width', 1)
              .attr('stroke-linecap', 'round');

            var anchor = (cos >= 0) ? 'start' : 'end';
            var tg = calloutLabelsG.append('g')
              .attr('transform', 'translate(' + (x3 + dir * 2) + ',' + y3 + ')');
            tg.append('text')
              .attr('class', 'dgb-callout-name')
              .attr('dy', '-0.15em')
              .attr('text-anchor', anchor)
              .text(d.data.name);
            tg.append('text')
              .attr('class', 'dgb-callout-count')
              .attr('dy', isMobile ? '17px' : '23px')
              .attr('text-anchor', anchor)
              .text(d.value + '종');
          });

          // ── 중앙 텍스트 ──────────────────────────────────────────────
          var centerG = svg.append('g').attr('class', 'center-label').attr('text-anchor', 'middle');
          centerG.append('text').attr('class', 'dgb-center-title').attr('dy', '-0.2em')
            .text('탕액편');
          centerG.append('text').attr('class', 'dgb-center-sub').attr('dy', isMobile ? '28px' : '40px')
            .text(rawData.length + '종');

          // ── 드릴다운 / 트리맵 공통 UI 요소 ─────────────────────────
          var treemapEl  = document.getElementById('dashboard-sunburst-treemap');
          var sunburstWrap = document.getElementById('dashboard-sunburst-wrap');
          var hintEl = sunburstEl.closest && sunburstEl.closest('.dashboard-sunburst-block')
            ? sunburstEl.closest('.dashboard-sunburst-block').querySelector('.dashboard-sunburst-hint')
            : null;
          var backBtn = document.getElementById('dashboard-sunburst-back-btn');
          var exploreHint = document.getElementById('dashboard-sunburst-explore-hint');
          var activeNode = null;

          // 드릴다운 오버레이 div (대분류 클릭 시 새 도넛 차트)
          var drillEl = document.createElement('div');
          drillEl.className = 'sunburst-drill-overlay';
          drillEl.setAttribute('aria-hidden', 'true');
          drillEl.style.cssText = [
            'position:absolute', 'inset:0', 'background:transparent',
            'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
            // 1depth(베이스 선버스트)와 2depth(드릴 도넛)의 세로 영역·위치를 동일하게 맞춘다.
            // (이전엔 padding-top:64px로 도넛을 아래로 밀어 1depth·자생지별 도넛보다 낮게/길게 보였음 → 제거)
            'padding-top:0',
            'opacity:0', 'pointer-events:none', 'z-index:10'
          ].join(';');
          if (sunburstWrap) sunburstWrap.style.position = 'relative';
          if (sunburstWrap) sunburstWrap.appendChild(drillEl);

          // ── 대분류 클릭: 새 도넛 차트 오버레이 ──────────────────────
          function showDrillDown(mainD) {
            if (!drillEl) return;
            drillNode  = mainD;
            activeNode = mainD;
            viewState  = 'drill';
            if (backBtn) backBtn.setAttribute('aria-hidden', 'false');
            if (hintEl) hintEl.textContent = '';
            // 도넛차트 2depth(중분류)에서도 "클릭해서 더 깊게 탐색하세요" 노출 (중분류→약재 트리맵 유도)
            if (exploreHint) exploreHint.setAttribute('aria-hidden', 'false');

            drillEl.innerHTML = '';
            drillEl.setAttribute('aria-hidden', 'false');
            drillEl.style.pointerEvents = 'all';
            // 베이스 선버스트를 숨겨 오버레이 뒤로 비쳐 보이지 않게 (레이아웃 높이는 유지)
            if (sunburstEl) sunburstEl.style.visibility = 'hidden';

            // ── 크기: 대분류 원과 동일한 size/반지름 사용
            var dInnerR   = innerR;         // 대분류 innerR 그대로
            var dOuterR   = outerR2;        // 대분류 outerR2 그대로 (전체 원 바깥 반지름)
            var dCalloutR = dOuterR + 10;
            var dElbR     = dOuterR + 40;   // 자생지별 드릴 도넛과 동일
            var dVb       = dOuterR + 26;   // 여백 최소화 → viewBox가 화면에 꽉 차며 도넛·라벨이 더 크게 렌더 (콜아웃은 overflow:visible로 표시)
            var wrapH     = sunburstWrap ? (sunburstWrap.clientHeight || 500) : 500;

            var subs    = mainD.children || [];
            var total   = mainD.value || 1;
            var mainCol = getMainColor(mainD);

            // 약재 도트 링 반지름 (중분류 arc 바깥)
            var dotRingInner = dOuterR + 6;
            var dotRingOuter = dOuterR + 18;

            // d3.pie로 각도 계산
            var pie  = d3.pie().value(function (s) { return s.data.value || 0; }).padAngle(0.018).sort(null);
            var arcs = pie(subs);

            // SVG — 베이스 선버스트와 동일한 표시 높이를 사용해 드릴 도넛이 작아 보이지 않게 함
            var baseSvgEl = sunburstEl ? sunburstEl.querySelector('svg') : null;
            var baseH = baseSvgEl ? baseSvgEl.getBoundingClientRect().height : 0;
            // 2depth 높이는 1depth(베이스) 높이에 맞춘다. 측정 실패 시에도 자생지별 드릴과 동일한 상한(820) 사용.
            var svgH = baseH > 120 ? baseH : Math.min(2 * dVb, wrapH - 20, 820);
            var dSvg = d3.select(drillEl).append('svg')
              .attr('viewBox', [-dVb, -dVb, 2 * dVb, 2 * dVb])
              .attr('width',  '100%')
              .attr('height', svgH)
              .attr('preserveAspectRatio', 'xMidYMid meet')
              .style('max-width', 'min(100%, min(1180px, 92vw))')
              .style('overflow', 'visible');

            // 오버레이 즉시 표시 (opacity CSS transition 없이 바로 1)
            drillEl.style.opacity = '1';

            // SVG 자체를 d3로 fade in (오버레이 div transition 제거로 인한 대체)
            dSvg.style('opacity', 0);

            // ── 슬라이스: 안쪽에서 바깥으로 펼쳐지는 arcTween
            var animDuration = 520;
            // padAngle은 arc 생성기가 아닌 pie()가 각 슬라이스에 설정 — arc 생성기에는 padRadius만 지정
            // padRadius를 outerR 고정으로 설정하면 outerR 보간 중에도 pad 계산이 안정적
            function makeDrillArc(ir, or) {
              return d3.arc()
                .innerRadius(ir).outerRadius(or)
                .padRadius(dOuterR)   // 항상 최종 outerR 기준으로 pad 계산 → 잘림 없음
                .cornerRadius(2);
            }
            var dPath = dSvg.append('g').attr('class', 'drill-arcs')
              .selectAll('path')
              .data(arcs)
              .join('path')
              .attr('fill', function (_a, i) { return lighten(mainCol, 0.08 + i * 0.07); })
              .attr('fill-opacity', 0.9)
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)
              .style('cursor', 'pointer')
              // 시작: outerRadius = innerRadius (납작하게)
              .attr('d', function (a) { return makeDrillArc(dInnerR, dInnerR)(a); })
              // hover 효과는 별도 이름의 트랜지션으로 — 펼침('grow') 트랜지션을 끊지 않도록
              .on('mouseenter', function () {
                d3.select(this).transition('hover').duration(100).attr('fill-opacity', 1).attr('stroke-width', 3);
              })
              .on('mouseleave', function () {
                d3.select(this).transition('hover').duration(160).attr('fill-opacity', 0.9).attr('stroke-width', 2);
              })
              .on('click', function (ev, a) {
                ev.stopPropagation();
                hideDrill();
                showTreemap(a.data, true);
              });

            // SVG 페이드인 + 슬라이스 펼침을 한 rAF 뒤에 시작
            requestAnimationFrame(function () {
              dSvg.transition().duration(200).style('opacity', 1);
              dPath.each(function (a, i) {
                // 'grow' 이름 트랜지션 → 클릭 직후 커서가 도넛 위에 있어 mouseenter가
                // 발생해도 펼침 애니메이션이 취소되지 않는다 (슬라이스 잘림 방지)
                d3.select(this)
                  .transition('grow')
                  .duration(animDuration)
                  .ease(d3.easeCubicOut)
                  .delay(i * 45)
                  .attrTween('d', function () {
                    var itpR = d3.interpolate(dInnerR, dOuterR);
                    return function (t) { return makeDrillArc(dInnerR, itpR(t))(a); };
                  });
              });
            });

            // ── 약재 링 (중분류 arc 바깥 — 약재마다 긴 호 조각)
            var herbArc = d3.arc()
              .innerRadius(dotRingInner).outerRadius(dotRingOuter)
              .cornerRadius(1);
            var dotG = dSvg.append('g').attr('class', 'drill-dot-ring').attr('opacity', 0);
            arcs.forEach(function (a) {
              var herbCount = (a.data.data.herbs || []).length || a.data.data.value || 0;
              if (herbCount === 0) return;
              var span = a.endAngle - a.startAngle - a.padAngle;
              if (span <= 0) return;
              var step = span / herbCount;
              // 간격: 약재 수가 많을수록 gap 줄임
              var gapAngle = Math.min(step * 0.15, 0.008);
              for (var hi = 0; hi < herbCount; hi++) {
                var center = a.startAngle + a.padAngle / 2 + step * (hi + 0.5);
                var halfSpan = step / 2 - gapAngle;
                if (halfSpan <= 0) halfSpan = step / 2;
                var herbA = { startAngle: center - halfSpan, endAngle: center + halfSpan, padAngle: 0 };
                dotG.append('path')
                  .attr('d', herbArc(herbA))
                  .attr('fill', lighten(mainCol, 0.45))
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 0.4);
              }
            });

            // ── 라벨: 곡부만 callout, 나머지는 인라인
            var labelDelay = animDuration + arcs.length * 45;

            // 드릴다운 arc 중간 반지름 (인라인 텍스트 배치용)
            var dMidR = (dInnerR + dOuterR) / 2;

            // 인라인: arc 안에 이름+종수 표시
            var dLabelG = dSvg.append('g').attr('pointer-events', 'none').attr('opacity', 0);
            arcs.forEach(function (a) {
              if (a.data.data.subKey === '곡부') return; // 곡부는 callout으로
              var mid = (a.startAngle + a.endAngle) / 2;
              var lx = Math.cos(mid - Math.PI / 2) * dMidR;
              var ly = Math.sin(mid - Math.PI / 2) * dMidR;
              var tg = dLabelG.append('g').attr('transform', 'translate(' + lx + ',' + ly + ')').attr('text-anchor', 'middle');
              tg.append('text').attr('class', 'dgb-drill-name').attr('dy', '-0.15em')
                .text(a.data.data.name);
              tg.append('text').attr('class', 'dgb-drill-count').attr('dy', '24px')
                .text(a.data.data.value + '종');
            });

            // 곡부만 callout
            var calloutLineG = dSvg.append('g').attr('pointer-events', 'none').attr('opacity', 0);
            var usedY = [];
            var minGap = isMobile ? 30 : 36;

            arcs.forEach(function (a) {
              if (a.data.data.subKey !== '곡부') return;
              var mid = (a.startAngle + a.endAngle) / 2;
              var cos = Math.cos(mid - Math.PI / 2), sin = Math.sin(mid - Math.PI / 2);
              var dir = cos >= 0 ? 1 : -1;
              var baseElbR = dElbR;
              var rawY = sin * baseElbR;
              var bump = 0;
              for (var ui = 0; ui < usedY.length; ui++) {
                if (Math.abs(usedY[ui] - (rawY + bump)) < minGap) {
                  bump += (rawY + bump <= usedY[ui]) ? -minGap : minGap;
                }
              }
              usedY.push(rawY + bump);
              var elbX = cos * baseElbR, elbY = sin * baseElbR + bump;
              calloutLineG.append('polyline')
                .attr('points', [
                  cos * dCalloutR + ',' + sin * dCalloutR,
                  elbX + ',' + elbY,
                  (elbX + dir * 30) + ',' + elbY
                ].join(' '))
                .attr('fill', 'none').attr('stroke', '#aaa').attr('stroke-width', 1).attr('stroke-linecap', 'round');
              var anchor = cos >= 0 ? 'start' : 'end';
              var tg = calloutLineG.append('g')
                .attr('transform', 'translate(' + (elbX + dir * 33) + ',' + elbY + ')');
              tg.append('text').attr('class', 'dgb-drill-callout-name').attr('dy', '-0.15em')
                .attr('text-anchor', anchor).text(a.data.data.name);
              tg.append('text').attr('class', 'dgb-drill-callout-count').attr('dy', '26px')
                .attr('text-anchor', anchor).text(a.data.data.value + '종');
            });

            // 인라인 + callout + 도트링 페이드인
            dLabelG.transition().duration(250).delay(labelDelay).attr('opacity', 1);
            calloutLineG.transition().duration(250).delay(labelDelay).attr('opacity', 1);
            dotG.transition().duration(350).delay(labelDelay).attr('opacity', 1);

            // 중앙 텍스트 (즉시 표시)
            var dCenter = dSvg.append('g').attr('text-anchor', 'middle').attr('pointer-events', 'none');
            dCenter.append('text').attr('class', 'dgb-center-title').attr('dy', '-0.2em')
              .text(mainD.data.name);
            dCenter.append('text').attr('class', 'dgb-center-sub').attr('dy', isMobile ? '28px' : '40px')
              .text(total + '종');

          }

          // ── 트리맵 (중분류 클릭 시 표시) ─────────────────────────────
          function showTreemap(d, isSub) {
            if (!treemapEl || !sunburstWrap) return;
            activeNode = d;
            viewState  = 'treemap';
            if (backBtn) backBtn.setAttribute('aria-hidden', 'false');
            if (hintEl) hintEl.textContent = '';
            if (exploreHint) exploreHint.setAttribute('aria-hidden', 'true');
            treemapEl.innerHTML = '';
            treemapEl.setAttribute('aria-hidden', 'false');
            // 1depth 도넛(선버스트) 렌더 높이를 측정 — 2depth 트리맵 높이를 여기에 맞춘다.
            // (--treemap 클래스를 붙이면 선버스트 호스트가 display:none 되므로 그 전에 측정)
            var baseSvgEl = sunburstEl ? sunburstEl.querySelector('svg') : null;
            var baseDonutH = baseSvgEl ? Math.round(baseSvgEl.getBoundingClientRect().height) : 0;
            sunburstWrap.classList.add('dashboard-sunburst-wrap--treemap');

            // 트리맵에 넣을 leaf 목록 수집
            var leaves = [];
            if (isSub) {
              leaves = d.data.herbs || [];
            } else {
              // 대분류: 소속 중분류의 모든 약재
              (d.children || []).forEach(function (sub) {
                (sub.data.herbs || []).forEach(function (h) { leaves.push(h); });
              });
            }
            if (leaves.length === 0) return;

            var title = document.createElement('div');
            title.className = 'dashboard-treemap-head';
            title.textContent = d.data.name + ' (' + leaves.length + '종)';
            treemapEl.appendChild(title);

            var tw = Math.max(260, (sunburstWrap.clientWidth || containerW) - 8);
            // 1depth와 2depth 높이 통일: 트리맵 전체 높이(제목+SVG)를 1depth 도넛 높이에 맞춘다.
            var th;
            if (baseDonutH > 200) {
              var headH = title.getBoundingClientRect().height || 40;
              th = Math.max(300, baseDonutH - headH - 14);
            } else {
              // 도넛 높이를 못 잰 경우(폴백): 기존 규칙 — 뷰포트의 약 55%
              var vhCap = (typeof window !== 'undefined' && window.innerHeight) ? Math.round(window.innerHeight * 0.55) : 520;
              th = Math.max(300, Math.min(520, vhCap, Math.round(tw * 0.5)));
            }

            // 트리맵 레이아웃
            var tmRoot = d3.hierarchy({ children: leaves }).sum(function (n) { return n.value || 1; });
            d3.treemap().tile(d3.treemapSquarify).size([tw, th]).paddingOuter(3).paddingInner(2).round(true)(tmRoot);

            var svgT = d3.select(treemapEl).append('svg')
              .attr('viewBox', [0, 0, tw, th])
              .attr('width', '100%').attr('height', th);

            var baseColor = isSub ? lighten(getMainColor(d), 0.25) : (CATEGORY_COLORS[d.data.mainKey] || '#999');

            // 배경색 밝기 계산 → 폰트색 결정 (#fff / #000)
            // 셀 색상: 인덱스별 명도 변화
            function cellColor(i) {
              var amt = 0.55 + (i % 5) * 0.07;
              // baseColor를 amt 명도로 혼합
              return lighten(baseColor, 1 - amt);
            }

            var tmLeaves = tmRoot.leaves();

            // 히트맵 표시 순서대로 herb 목록 구성 (팝업 좌우 탐색용)
            var tmHerbList = [];
            tmLeaves.forEach(function (n) {
              var entry = n.data.entry;
              if (!entry) return;
              var h = herbs.find(function (hh) {
                var r = getEffectRecord(hh);
                return r && (r.herb_korean === entry.herb_korean || (r.herb_hanja && r.herb_hanja === entry.herb_hanja));
              });
              if (h) tmHerbList.push(h);
            });

            var cell = svgT.selectAll('g').data(tmLeaves).join('g')
              .attr('transform', function (n) { return 'translate(' + n.x0 + ',' + n.y0 + ')'; });

            // 클립패스: 셀마다 개별 clipPath (이미지가 rect 안에만 보이도록)
            var defs = svgT.append('defs');
            tmLeaves.forEach(function (n, i) {
              defs.append('clipPath').attr('id', 'tmclip-' + i)
                .append('rect')
                .attr('width',  Math.max(0, n.x1 - n.x0))
                .attr('height', Math.max(0, n.y1 - n.y0))
                .attr('rx', 3).attr('ry', 3);
            });

            // 배경 rect
            cell.append('rect')
              .attr('width',  function (n) { return Math.max(0, n.x1 - n.x0); })
              .attr('height', function (n) { return Math.max(0, n.y1 - n.y0); })
              .attr('rx', 3).attr('ry', 3)
              .attr('fill', function (_n, i) { return cellColor(i); })
              .attr('stroke', '#fff').attr('stroke-width', 1.5)
              .style('cursor', function (n) { return n.data.entry ? 'pointer' : 'default'; })
              .on('mouseenter', function () {
                d3.select(this.parentNode).select('image').attr('opacity', 0.7);
              })
              .on('mouseleave', function () {
                d3.select(this.parentNode).select('image').attr('opacity', 1);
              })
              .on('click', function (ev, n) {
                ev.stopPropagation();
                if (!n.data.entry) return;
                var entry = n.data.entry;
                var herb = herbs.find(function (h) {
                  var r = getEffectRecord(h);
                  return r && (r.herb_korean === entry.herb_korean || (r.herb_hanja && r.herb_hanja === entry.herb_hanja));
                });
                if (herb && typeof window.openHerbIngredientModal === 'function') {
                  // keepOrder=true: 히트맵 셀 순서대로 좌우 이동
                  window.openHerbIngredientModal(herb, tmHerbList, true);
                }
              });

            cell.append('title').text(function (n) { return n.data.name || ''; });

            // 약재 이미지 (전체 셀 크기, opacity 100%)
            cell.each(function (n, i) {
              var entry = n.data.entry;
              if (!entry) return;
              var herb = herbs.find(function (h) {
                var r = getEffectRecord(h);
                return r && (r.herb_korean === entry.herb_korean || (r.herb_hanja && r.herb_hanja === entry.herb_hanja));
              });
              var thumbSrc = herb
                ? ((typeof window.getThumbnailForHerb === 'function' && window.getThumbnailForHerb(herb)) || getThumbnailPathFallback(herb))
                : '';
              if (!thumbSrc) return;
              var w = Math.max(0, n.x1 - n.x0);
              var h = Math.max(0, n.y1 - n.y0);
              d3.select(this).append('image')
                .attr('href', thumbSrc)
                .attr('x', 0).attr('y', 0)
                .attr('width', w).attr('height', h)
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .attr('clip-path', 'url(#tmclip-' + i + ')')
                .attr('opacity', 1)
                .style('pointer-events', 'none');
            });

            // 텍스트 (이미지 위에 — 배경색 기반 폰트컬러, stroke으로 가독성 확보)
            var textCells = cell.filter(function (n) { return (n.x1 - n.x0) > 28 && (n.y1 - n.y0) > 16; });

            // stroke 레이어 (검정 외곽선으로 이미지 위 가독성)
            textCells.append('text')
              .attr('class', 'dgb-treemap-label dgb-treemap-label--stroke')
              .attr('x', function (n) { return (n.x1 - n.x0) / 2; })
              .attr('y', function (n) { return (n.y1 - n.y0) / 2; })
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .attr('font-size', function (n) {
                var w = n.x1 - n.x0, h = n.y1 - n.y0;
                // 두 토글 통일: 기존 유형별 크기 -1px (자생지별과 동일 식)
                return Math.min(16, Math.max(11, Math.min(w / 4, h / 2.5) + 2)) + 'px';
              })
              .attr('pointer-events', 'none')
              .text(function (n) {
                var name = n.data.name || '';
                var w = n.x1 - n.x0;
                if (name.length > 8 && w < 70) return name.slice(0, 6) + '…';
                return name;
              });

            // 실제 텍스트 레이어 (흰 글자)
            textCells.append('text')
              .attr('class', 'dgb-treemap-label dgb-treemap-label--fill')
              .attr('x', function (n) { return (n.x1 - n.x0) / 2; })
              .attr('y', function (n) { return (n.y1 - n.y0) / 2; })
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .attr('font-size', function (n) {
                var w = n.x1 - n.x0, h = n.y1 - n.y0;
                // 두 토글 통일: 기존 유형별 크기 -1px (자생지별과 동일 식)
                return Math.min(16, Math.max(11, Math.min(w / 4, h / 2.5) + 2)) + 'px';
              })
              .attr('pointer-events', 'none')
              .text(function (n) {
                var name = n.data.name || '';
                var w = n.x1 - n.x0;
                if (name.length > 8 && w < 70) return name.slice(0, 6) + '…';
                return name;
              });
          }

          // 현재 표시 상태: null | 'drill' | 'treemap'
          var viewState = null;
          var drillNode = null; // 드릴다운에서 선택된 대분류

          function hideTreemap() {
            if (!treemapEl || !sunburstWrap) return;
            treemapEl.innerHTML = '';
            treemapEl.setAttribute('aria-hidden', 'true');
            sunburstWrap.classList.remove('dashboard-sunburst-wrap--treemap');
          }

          function hideDrill() {
            drillEl.style.opacity = '0';
            drillEl.style.pointerEvents = 'none';
            drillEl.setAttribute('aria-hidden', 'true');
            drillEl.innerHTML = '';
            if (sunburstEl) sunburstEl.style.visibility = '';
          }

          function hideAll() {
            hideTreemap();
            hideDrill();
            activeNode = null;
            drillNode  = null;
            viewState  = null;
            if (backBtn) backBtn.setAttribute('aria-hidden', 'true');
            if (hintEl) hintEl.textContent = '';
            if (exploreHint) exploreHint.setAttribute('aria-hidden', 'false');
          }

          if (backBtn) {
            backBtn.setAttribute('aria-hidden', 'true');
            backBtn.addEventListener('click', function () {
              if (viewState === 'treemap' && drillNode) {
                // 트리맵 → 드릴다운으로 복귀
                hideTreemap();
                showDrillDown(drillNode);
              } else {
                hideAll();
              }
            });
          }
          if (hintEl) hintEl.textContent = '';

          // 배경(원 차트) 클릭 → 전체 초기화
          svg.on('click', function () { if (viewState) hideAll(); });

          // 리사이즈
          var _resizeTimer;
          var _resizeHandler = function () {
            clearTimeout(_resizeTimer);
            _resizeTimer = setTimeout(function () {
              if (viewState === 'drill' && drillNode) showDrillDown(drillNode);
              else if (viewState === 'treemap' && activeNode) showTreemap(activeNode, activeNode.depth === 2);
            }, 150);
          };
          if (container._dashboardResizeHandler) {
            window.removeEventListener('resize', container._dashboardResizeHandler);
          }
          container._dashboardResizeHandler = _resizeHandler;
          window.addEventListener('resize', _resizeHandler);

          // ── 뎁스 공유: 현재 보기 상태 읽기/적용 API 등록 ─────────────
          function navMainNode(mainKey) {
            return (root.children || []).find(function (n) { return n.data.mainKey === mainKey; }) || null;
          }
          dashboardNavRegistry.category = {
            getNav: function () {
              if (viewState === 'treemap' && activeNode) {
                var main = activeNode.parent;
                return { depth: 2, mainKey: main && main.data ? main.data.mainKey : null, subKey: activeNode.data.subKey };
              }
              if (viewState === 'drill' && drillNode) {
                return { depth: 1, mainKey: drillNode.data.mainKey };
              }
              return { depth: 0 };
            },
            applyNav: function (state) {
              hideAll();
              if (!state || !state.depth) return;
              var mainNode = navMainNode(state.mainKey);
              if (!mainNode) return;
              if (state.depth === 1) { showDrillDown(mainNode); return; }
              var subNode = (mainNode.children || []).find(function (n) { return n.data.subKey === state.subKey; });
              if (!subNode) { showDrillDown(mainNode); return; }
              drillNode = mainNode; // 트리맵 → 드릴 → 베이스 순서로 뒤로가기 동작하도록
              showTreemap(subNode, true);
            }
          };
        });
      }
    }
    renderRareHerbsSection();
    renderEndangeredHerbsSection();
  }

  // ──────────────────────────────────────────────────────────────────────
  //  약재 출신 분류(향약 / 토착화 / 당약·외래약 / 일반) — 향약 분류별 보기
  // ──────────────────────────────────────────────────────────────────────
  // 두 보기(분류 체계별 ↔ 향약 분류별)가 같은 뎁스를 공유하기 위한 네비게이션 레지스트리.
  // 각 보기가 { getNav, applyNav } 를 등록하면, 토글 시 소스 보기의 뎁스를 읽어 타깃에 적용한다.
  var dashboardNavRegistry = { category: null, origin: null };

  var ORIGIN_META = {
    native:      { label: '향약', sub: '조선 자생·재배',      color: '#5b8c5a', desc: '이 땅에서 나거나 자생·재배하던 약재' },
    naturalized: { label: '토착화', sub: '해외→조선 이식 노력', color: '#c8922e', desc: '중국 등에서 들여와 조선에 기르려 한 약재' },
    imported:    { label: '당약/외래약', sub: '중국·서양 수입', color: '#9c6b4b', desc: '중국·서양에서 수입해 들여온 약재' },
    general:     { label: '일반', sub: '광물·물·인체 유래',     color: '#b3ada2', desc: '물·흙·돌처럼 자생 구분이 적용되지 않는 약재' }
  };
  var ORIGIN_ORDER = ['native', 'naturalized', 'imported', 'general'];

  /** effectData 한 레코드의 출신 등급을 반환 ('native'|'naturalized'|'imported'|'general') */
  function getHerbOrigin(entry) {
    if (!entry) return 'general';
    var map = (typeof window !== 'undefined' && window.HERB_ORIGIN) ? window.HERB_ORIGIN : null;
    if (map && entry.herb_id && map[entry.herb_id]) return map[entry.herb_id].origin || 'general';
    return 'general';
  }


  /** 분류 체계별 ↔ 향약 분류별 보기 전환 배선 */
  function setupDashboardViewToggle(container) {
    var btnCat = document.getElementById('dashboard-viewmode-category');
    var btnOri = document.getElementById('dashboard-viewmode-origin');
    var viewCat = document.getElementById('dashboard-view-category');
    var viewOri = document.getElementById('dashboard-view-origin');
    if (!btnCat || !btnOri || !viewCat || !viewOri) return;
    var originRendered = false;

    function activate(mode) {
      var isOrigin = mode === 'origin';
      // 전환 직전, 현재 보이는(소스) 보기의 뎁스를 읽어둔다
      var fromReg = isOrigin ? dashboardNavRegistry.category : dashboardNavRegistry.origin;
      var navState = (fromReg && fromReg.getNav) ? fromReg.getNav() : null;

      btnCat.classList.toggle('is-active', !isOrigin);
      btnOri.classList.toggle('is-active', isOrigin);
      btnCat.setAttribute('aria-selected', String(!isOrigin));
      btnOri.setAttribute('aria-selected', String(isOrigin));
      viewCat.hidden = isOrigin;
      viewOri.hidden = !isOrigin;
      if (isOrigin && !originRendered) {
        originRendered = true;
        renderOriginView();
      }
      // 타깃 보기에 동일한 뎁스를 적용 (뎁스 공유). 보기가 보이게 된 뒤 호출해야
      // 차트 요소의 크기 계산이 정상 동작한다.
      var toReg = isOrigin ? dashboardNavRegistry.origin : dashboardNavRegistry.category;
      if (toReg && toReg.applyNav && navState) toReg.applyNav(navState);
    }
    btnCat.addEventListener('click', function () { activate('category'); });
    btnOri.addEventListener('click', function () { activate('origin'); });

    // 자생지별 보기가 기본 활성 — 로드 시점에 즉시 렌더한다.
    if (!originRendered) {
      originRendered = true;
      requestAnimationFrame(renderOriginView);
    }
  }

  /** 향약 분류별 보기: 출신 색 선버스트 + 드릴다운 (분류 체계별과 동일한 상호작용) */
  function renderOriginView() {
    var wrapEl    = document.getElementById('dashboard-origin-wrap');
    var legendEl  = document.getElementById('dashboard-origin-legend');
    var chartEl   = document.getElementById('dashboard-origin-chart');
    var treemapEl = document.getElementById('dashboard-origin-treemap');
    var backBtn   = document.getElementById('dashboard-origin-back-btn');
    var exploreHint = document.getElementById('dashboard-origin-explore-hint');
    if (!legendEl || !chartEl || !wrapEl) return;

    var rawData = (effectData && effectData.length > 0) ? effectData : [];
    if (rawData.length === 0) {
      chartEl.innerHTML = '<p class="dashboard-origin-empty">약재 데이터를 불러오는 중입니다.</p>';
      return;
    }

    // 출신별 집계
    var counts = { native: 0, naturalized: 0, imported: 0, general: 0 };
    rawData.forEach(function (e) { counts[getHerbOrigin(e)]++; });
    var total = rawData.length;

    function findHerb(entry) {
      return herbs.find(function (h) {
        var r = getEffectRecord(h);
        return r && (r.herb_korean === entry.herb_korean || (r.herb_hanja && r.herb_hanja === entry.herb_hanja));
      });
    }
    function lighten(hex, amount) {
      var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      r = Math.round(r + (255 - r) * amount); g = Math.round(g + (255 - g) * amount); b = Math.round(b + (255 - b) * amount);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    var DIM_OP    = 0.16;        // 필터 비활성 출신/약재 오퍼시티
    var activeFilter = 'all';
    // 활성 필터에 해당하지 않는 출신은 오퍼시티를 낮춰 흐리게 표시
    function originOpacity(origin) { return (activeFilter === 'all' || origin === activeFilter) ? 1 : DIM_OP; }
    function matchesFilter(origin) { return activeFilter === 'all' || origin === activeFilter; }

    // ── 범례(겸 필터) ──────────────────────────────────────────────────
    legendEl.innerHTML = '';
    ORIGIN_ORDER.forEach(function (key) {
      var meta = ORIGIN_META[key];
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'dashboard-origin-legend-item';
      item.setAttribute('data-origin', key);
      // 범례에는 이름만 노출하고, 설명은 hover 툴팁(커스텀)으로 보여준다
      // 툴팁은 "향약 426종"(제목) 줄바꿈 후 설명 줄로 구분해 표시한다
      item.setAttribute('data-tip', meta.label + ' ' + counts[key] + '종\n' + meta.desc);
      item.setAttribute('aria-label', meta.label + ' ' + counts[key] + '종 — ' + meta.desc);
      item.innerHTML =
        '<span class="dol-swatch" style="background:' + meta.color + '"></span>' +
        '<span class="dol-label">' + meta.label + '</span>';
      item.addEventListener('click', function () {
        // 드릴(2depth)은 한 출신만 보여주므로, 다른 출신을 누르면 그 출신엔 0건이라
        // 아무것도 안 보인다 → 해당 출신의 2depth(드릴)로 이동시킨다.
        // 트리맵(3depth)은 중분류 전체(모든 출신)를 보여주므로 여기서 빠지지 않고,
        // setFilter로 비해당 약재만 오퍼시티를 낮춰 강조한다.
        if (viewState === 'drill') {
          var curOrigin = (drillNode && drillNode.data) ? drillNode.data.mainKey : null;
          if (key !== curOrigin) {
            var target = navMainNode(key);
            if (target) {
              activeFilter = 'all';
              updateLegendActive();
              hideAll();
              showDrill(target, { demo: true });
              return;
            }
          }
        }
        setFilter((activeFilter === key) ? 'all' : key);
      });
      legendEl.appendChild(item);
    });

    /** 범례 칩의 선택 표시(is-active)를 현재 activeFilter에 맞춘다 */
    function updateLegendActive() {
      Array.prototype.forEach.call(legendEl.children, function (c) {
        // 멸종위기 급수 범례와 동일하게 — 선택된 칩만 채움(active), 나머지는 기본 톤 유지
        c.classList.toggle('is-active', activeFilter !== 'all' && c.getAttribute('data-origin') === activeFilter);
      });
    }

    /**
     * 범례 hover 툴팁/aria의 "n종" 숫자를 현재 문맥에 맞춘다.
     * countsMap이 주어지면(예: 트리맵의 중분류별 출신 분포) 그 값을, 없으면 전체(counts)를 쓴다.
     */
    function setLegendCounts(countsMap) {
      Array.prototype.forEach.call(legendEl.children, function (c) {
        var key = c.getAttribute('data-origin');
        var meta = ORIGIN_META[key];
        if (!meta) return;
        var n = (countsMap && typeof countsMap[key] === 'number') ? countsMap[key] : counts[key];
        c.setAttribute('data-tip', meta.label + ' ' + n + '종\n' + meta.desc);
        c.setAttribute('aria-label', meta.label + ' ' + n + '종 — ' + meta.desc);
      });
    }

    /**
     * 현재 그려진 보기(선버스트/드릴/트리맵)의 출신 요소 오퍼시티를 activeFilter에
     * 맞춰 전환한다. 전체를 다시 그리지 않고 강조 상태만 부드럽게 바꾼다.
     * 출신 색 요소에는 .oh-seg(중·대분류 호) / .oh-dot(약재 호) / .oh-cell(트리맵 타일)
     * 클래스와 data-origin 속성을 달아 두었다.
     */
    function applyFilterHighlight(animate) {
      var dur = animate ? 550 : 0;
      var root = d3.select(wrapEl);
      root.selectAll('.oh-seg').transition('ohf').duration(dur)
        .attr('fill-opacity', function () { return originOpacity(this.getAttribute('data-origin')) * 0.95; });
      root.selectAll('.oh-dot').transition('ohf').duration(dur)
        .attr('fill-opacity', function () { return originOpacity(this.getAttribute('data-origin')); });
      root.selectAll('.oh-cell').transition('ohf').duration(dur)
        .attr('opacity', function () { return matchesFilter(this.getAttribute('data-origin')) ? 1 : DIM_OP; });
      // 선버스트 중앙 텍스트는 선택 필터에 따라 라벨/종수가 바뀐다
      var ct = wrapEl.querySelector('.oh-center-title');
      var cs = wrapEl.querySelector('.oh-center-sub');
      if (ct) ct.textContent = (activeFilter === 'all') ? '탕액편' : ORIGIN_META[activeFilter].label;
      if (cs) cs.textContent = (activeFilter === 'all') ? (total + '종') : (counts[activeFilter] + '종');
    }

    function setFilter(next) {
      cancelFilterDemo();          // 수동 선택 시 자동 시연 중단
      activeFilter = next;
      updateLegendActive();
      applyFilterHighlight(true);
    }

    // ── 필터 자동 시연: 보기 진입 시 각 출신 필터를 2초씩 한 바퀴 보여준 뒤 전체로 복귀 ──
    var demoTimers = [];
    var demoActive = false;
    function cancelFilterDemo() {
      demoTimers.forEach(function (t) { clearTimeout(t); });
      demoTimers = [];
      demoActive = false;
    }
    /** ORIGIN_ORDER 순서대로, breakdown(또는 herbs)에 실제로 존재하는 출신만 추린다 */
    function presentOrigins(breakdown) {
      return ORIGIN_ORDER.filter(function (k) { return (breakdown[k] || []).length > 0; });
    }
    /** 한 대분류(드릴) 안에 존재하는 출신 목록 — 하위 중분류 breakdown을 합쳐 계산 */
    function presentOriginsForMain(mainD) {
      var has = {};
      (mainD.children || []).forEach(function (c) {
        ORIGIN_ORDER.forEach(function (ok) { if ((c.data.breakdown[ok] || []).length) has[ok] = 1; });
      });
      return ORIGIN_ORDER.filter(function (k) { return has[k]; });
    }

    // origins: 이 보기에서 실제 약재가 있는 출신만 (0건 필터는 시연에서 건너뜀)
    function startFilterDemo(initialDelay, origins) {
      cancelFilterDemo();
      var seq = (origins || ORIGIN_ORDER).filter(function (k) { return counts[k] > 0; });
      if (seq.length === 0) return;
      demoActive = true;
      var base = (typeof initialDelay === 'number') ? initialDelay : 450;
      var DWELL = 2000;
      seq.forEach(function (key, i) {
        demoTimers.push(setTimeout(function () {
          if (!demoActive) return;
          activeFilter = key;
          updateLegendActive();
          applyFilterHighlight(true);
        }, base + i * DWELL));
      });
      // 마지막 필터까지 보여준 뒤 전체(all) 상태로 되돌린다
      demoTimers.push(setTimeout(function () {
        if (!demoActive) return;
        activeFilter = 'all';
        updateLegendActive();
        applyFilterHighlight(true);
        demoActive = false;
      }, base + seq.length * DWELL));
    }

    if (typeof d3 === 'undefined') {
      chartEl.innerHTML = '<p class="dashboard-origin-empty">차트 라이브러리를 불러오지 못했습니다.</p>';
      return;
    }

    // ════════════════════════════════════════════════════════════════════
    // [기존 그래프 백업 — 1depth(대분류)=식물/동물/광물/기타]
    // 자생지별 보기의 1depth를 "출신"으로 바꾸기 위해 아래 원본을 주석 보존한다.
    // 되돌리려면(rewind) 이 주석 블록을 살리고 그 아래 "새 트리"를 주석 처리할 것.
    // ────────────────────────────────────────────────────────────────────
    // var mainLabels = { plant: '식물', animal: '동물', mineral: '광물', other: '기타', unclassified: '미분류' };
    // var mainOrder  = ['plant', 'animal', 'mineral', 'other', 'unclassified'];
    //
    // // ── 계층: root → 대분류(depth1) → 중분류(depth2). 중분류는 출신 분해 + 약재 목록 보관.
    // var mainNodes = [];
    // mainOrder.forEach(function (mainKey) {
    //   var subNodes = [];
    //   (SUB_CATEGORIES[mainKey] || []).forEach(function (subKey) {
    //     var inSub = rawData.filter(function (e) { return e.category === subKey; });
    //     if (inSub.length === 0) return;
    //     var breakdown = { native: [], naturalized: [], imported: [], general: [] };
    //     var herbList = inSub.map(function (entry) {
    //       var origin = getHerbOrigin(entry);
    //       breakdown[origin].push(entry);
    //       var name = entry.herb_korean
    //         ? stripParentheticalFromName(toModernKorean(entry.herb_korean.trim()))
    //         : (entry.herb_hanja || '');
    //       return { name: name || '?', value: 1, entry: entry, origin: origin };
    //     });
    //     subNodes.push({
    //       name: SUB_CATEGORY_LABELS[subKey] || subKey,
    //       subKey: subKey, value: inSub.length,
    //       breakdown: breakdown, entries: inSub, herbs: herbList
    //     });
    //   });
    //   if (subNodes.length > 0) mainNodes.push({ name: mainLabels[mainKey], mainKey: mainKey, children: subNodes });
    // });
    // if (mainNodes.length === 0) return;
    // ════════════════════════════════════════════════════════════════════

    // ── 새 트리: 1depth = 출신(향약/토착화/당약·외래약/일반), 2depth = 중분류 ──
    // 식물/동물/광물/기타(대분류)를 1depth에서 제거하고 출신을 1depth로 올린다.
    // 각 출신 아래에는 그 출신에 해당하는 약재만 모인 중분류 노드를 둔다.
    // (하위 렌더링·드릴·트리맵은 breakdown/origin 키 기반이라 그대로 동작한다.)
    var mainLabels = {
      native: ORIGIN_META.native.label, naturalized: ORIGIN_META.naturalized.label,
      imported: ORIGIN_META.imported.label, general: ORIGIN_META.general.label
    };
    var mainOrder = ORIGIN_ORDER.slice();   // ['native','naturalized','imported','general']

    // 중분류(subKey)를 기존 대분류 순서대로 평탄화해 둔다(2depth 정렬 안정성용).
    var ALL_SUBKEYS = [];
    ['plant', 'animal', 'mineral', 'other', 'unclassified'].forEach(function (mk) {
      (SUB_CATEGORIES[mk] || []).forEach(function (sk) {
        if (ALL_SUBKEYS.indexOf(sk) === -1) ALL_SUBKEYS.push(sk);
      });
    });

    var mainNodes = [];
    mainOrder.forEach(function (originKey) {
      var subNodes = [];
      ALL_SUBKEYS.forEach(function (subKey) {
        var inSub = rawData.filter(function (e) {
          return e.category === subKey && getHerbOrigin(e) === originKey;
        });
        if (inSub.length === 0) return;
        var breakdown = { native: [], naturalized: [], imported: [], general: [] };
        var herbList = inSub.map(function (entry) {
          breakdown[originKey].push(entry);   // 이 출신 노드의 약재는 모두 동일 출신
          var name = entry.herb_korean
            ? stripParentheticalFromName(toModernKorean(entry.herb_korean.trim()))
            : (entry.herb_hanja || '');
          return { name: name || '?', value: 1, entry: entry, origin: originKey };
        });
        subNodes.push({
          name: SUB_CATEGORY_LABELS[subKey] || subKey,
          subKey: subKey, value: inSub.length,
          breakdown: breakdown, entries: inSub, herbs: herbList
        });
      });
      if (subNodes.length > 0) mainNodes.push({ name: mainLabels[originKey], mainKey: originKey, children: subNodes });
    });

    // 3depth(트리맵)는 한 출신이 아니라 그 "중분류 전체"(모든 출신)를 보여준다.
    // 각 약재 타일은 자기 출신 색을 유지하고, 우측 출신 필터는 비해당 약재의
    // 오퍼시티만 낮춰 강조한다(개수를 줄이지 않는다).
    var mixedHerbsBySub = {};      // subKey → [{name,value,entry,origin}] (모든 출신)
    var mixedBreakdownBySub = {};  // subKey → {native:[],...} (시연 시 순환할 출신 판단용)
    ALL_SUBKEYS.forEach(function (subKey) {
      var inSub = rawData.filter(function (e) { return e.category === subKey; });
      if (inSub.length === 0) return;
      var breakdown = { native: [], naturalized: [], imported: [], general: [] };
      var herbList = inSub.map(function (entry) {
        var ok = getHerbOrigin(entry);
        breakdown[ok].push(entry);
        var name = entry.herb_korean
          ? stripParentheticalFromName(toModernKorean(entry.herb_korean.trim()))
          : (entry.herb_hanja || '');
        return { name: name || '?', value: 1, entry: entry, origin: ok };
      });
      mixedHerbsBySub[subKey] = herbList;
      mixedBreakdownBySub[subKey] = breakdown;
    });
    if (mainNodes.length === 0) return;

    var isMobile = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches;
    // 분류 체계별 선버스트와 동일한 기준으로 크기 계산 (토글 시 크기·위치 일치)
    var containerW = (chartEl.closest && chartEl.closest('.dashboard-container')
      ? chartEl.closest('.dashboard-container').clientWidth : 0)
      || (chartEl.parentElement && chartEl.parentElement.clientWidth) || 800;
    var size = isMobile ? Math.min(500, containerW - 16) : Math.min(820, containerW - 32);
    size = Math.max(300, size);
    var innerR  = size * 0.20;
    var outerR1 = size * 0.40;   // 대분류 링
    var outerR2 = size * 0.60 + 2;   // 중분류 링 (중분류 링 두께 = 대분류 링 두께)
    var vb = outerR2 + 26;   // 여백 최소화 → 드릴다운 도넛과 동일 크기로 렌더 (callout·그림자는 overflow:visible로 표시)

    var root = d3.hierarchy({ name: 'root', children: mainNodes }).sum(function (d) { return d.value || 0; });
    root.sort(function (a, b) {
      if (a.depth === 1 && b.depth === 1) {
        return mainOrder.indexOf(a.data.mainKey) - mainOrder.indexOf(b.data.mainKey);
      }
      return (b.value || 0) - (a.value || 0);
    });
    d3.partition().size([2 * Math.PI, 2])(root);

    var arcMain = d3.arc()
      .startAngle(function (d) { return d.x0; }).endAngle(function (d) { return d.x1; })
      .padAngle(0.012).padRadius((innerR + outerR1) / 2)
      .innerRadius(innerR).outerRadius(outerR1);
    var arcSeg = d3.arc()
      .startAngle(function (s) { return s.x0; }).endAngle(function (s) { return s.x1; })
      .innerRadius(outerR1 + 2).outerRadius(outerR2);
    var arcMidR = (outerR1 + 2 + outerR2) / 2;

    /** [x0,x1] 각도 범위를 출신 비율대로 분할한 세그먼트 배열 반환 */
    function originSegsFor(x0, x1, breakdown, totalCount, padScale) {
      var span = x1 - x0;
      var pad = Math.min((padScale || 0.012) / 2, span * 0.15);
      var cx0 = x0 + pad, cx1 = x1 - pad, cspan = cx1 - cx0;
      var n = totalCount || 1, acc = cx0, out = [];
      ORIGIN_ORDER.forEach(function (ok) {
        var c = (breakdown[ok] || []).length;
        if (c === 0) return;
        var a1 = acc + cspan * (c / n);
        out.push({ origin: ok, x0: acc, x1: a1, count: c });
        acc = a1;
      });
      return out;
    }

    // ── 상호작용 상태 ───────────────────────────────────────────────
    var viewState = null;   // null | 'drill' | 'treemap'
    var drillNode = null;   // 드릴다운에서 선택된 대분류
    var activeNode = null;  // 트리맵에서 선택된 중분류
    var drillEl = null;
    var svg = null;

    // ── 베이스 선버스트 (대분류 회색 링 + 중분류 출신색 분할) ──────────
    function renderBase(opts) {
      setLegendCounts(null);   // 전체 보기 — 범례 툴팁은 전체 종수
      chartEl.innerHTML = '';
      chartEl.style.visibility = '';
      svg = d3.select(chartEl).append('svg')
        .attr('viewBox', [-vb, -vb, 2 * vb, 2 * vb])
        .attr('width', '100%')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('overflow', 'visible');

      var depth1 = root.children || [];
      var depth2 = root.descendants().filter(function (d) { return d.depth === 2; });

      // ── 4개 대분류(식물/동물/광물/기타) 사이를 얇은 검정 라인으로만 구분 ──
      // 흰 stroke·플레이트·그림자 없이, 그룹 경계 방사선만 사용한다. (라벨 호환용 gx=x)
      depth1.forEach(function (d) {
        d.gx0 = d.x0; d.gx1 = d.x1;
        (d.children || []).forEach(function (c) { c.gx0 = c.x0; c.gx1 = c.x1; });
      });

      // 대분류 링: 출신 비율로 색 분할, 클릭 → 드릴다운
      var mainSegs1 = [];
      depth1.forEach(function (d) {
        var totalBreakdown = { native: [], naturalized: [], imported: [], general: [] };
        (d.children || []).forEach(function (child) {
          ORIGIN_ORDER.forEach(function (ok) {
            totalBreakdown[ok] = totalBreakdown[ok].concat(child.data.breakdown[ok] || []);
          });
        });
        originSegsFor(d.gx0, d.gx1, totalBreakdown, d.value, 0.016).forEach(function (s) {
          s.mainNode = d; mainSegs1.push(s);
        });
      });
      var arcMainSeg = d3.arc()
        .startAngle(function (s) { return s.x0; }).endAngle(function (s) { return s.x1; })
        .innerRadius(innerR).outerRadius(outerR1);
      svg.append('g').selectAll('path').data(mainSegs1).join('path')
        .attr('class', 'oh-seg').attr('data-origin', function (s) { return s.origin; })
        .attr('d', arcMainSeg)
        .attr('fill', function (s) { return ORIGIN_META[s.origin].color; })
        .attr('fill-opacity', function (s) { return originOpacity(s.origin) * 0.95; })
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this).transition('hover').duration(100)
            .attr('fill-opacity', function (s) { return originOpacity(s.origin); });
        })
        .on('mouseleave', function () {
          d3.select(this).transition('hover').duration(160)
            .attr('fill-opacity', function (s) { return originOpacity(s.origin) * 0.95; });
        })
        .on('click', function (ev, s) { ev.stopPropagation(); showDrill(s.mainNode, { demo: true }); })
        .append('title').text(function (s) {
          return s.mainNode.data.name + ' · ' + ORIGIN_META[s.origin].label + ' ' + s.count + '종 / 전체 ' + s.mainNode.value + '종';
        });

      // 대분류(출신) 라벨 — 큰 호는 링 안쪽 인라인, 작은 호(예: 토착화)는 콜아웃 선 라벨
      var D1_INLINE_MIN = 0.12;   // 이 각도(라디안) 미만이면 인라인 대신 콜아웃
      svg.append('g').attr('pointer-events', 'none').attr('text-anchor', 'middle')
        .selectAll('text').data(depth1.filter(function (d) { return (d.gx1 - d.gx0) > D1_INLINE_MIN; })).join('text')
        .attr('transform', function (d) {
          var mid = (d.gx0 + d.gx1) / 2, r = (innerR + outerR1) / 2;
          return 'rotate(' + (mid * 180 / Math.PI - 90) + ') translate(' + r + ',0) rotate(' + (mid > Math.PI ? 180 : 0) + ')';
        })
        .attr('class', 'dgb-label-main')
        .attr('dy', '0.35em')
        .text(function (d) { return d.data.name; });

      // 작은 출신(예: 토착화)은 콜아웃 선 라벨로 표시 + 라벨 클릭 시 2depth(드릴)로 이동
      var d1Small = depth1.filter(function (d) { return (d.gx1 - d.gx0) <= D1_INLINE_MIN && d.value > 0; });
      if (d1Small.length) {
        var d1CalloutR = outerR2 + 4;       // 선 시작(바깥 링 가장자리)
        var d1ElbR     = outerR2 + 34;      // 꺾임 지점
        var d1LinesG   = svg.append('g').attr('class', 'oh-d1-callout-lines').attr('pointer-events', 'none');
        var d1LabelsG  = svg.append('g').attr('class', 'oh-d1-callout-labels');
        var d1UsedY = [];
        var d1MinGap = isMobile ? 26 : 32;
        d1Small.forEach(function (d) {
          var mid = (d.gx0 + d.gx1) / 2;
          var cos = Math.cos(mid - Math.PI / 2), sin = Math.sin(mid - Math.PI / 2);
          var dir = (cos >= 0) ? 1 : -1;
          var rawY = sin * d1ElbR, bump = 0;
          for (var ui = 0; ui < d1UsedY.length; ui++) {
            if (Math.abs(d1UsedY[ui] - (rawY + bump)) < d1MinGap) {
              bump += (rawY + bump <= d1UsedY[ui]) ? -d1MinGap : d1MinGap;
            }
          }
          d1UsedY.push(rawY + bump);
          var x1 = cos * d1CalloutR, y1 = sin * d1CalloutR;
          var x2 = cos * d1ElbR,     y2 = sin * d1ElbR + bump;
          var x3 = x2 + dir * 26,    y3 = y2;
          d1LinesG.append('polyline')
            .attr('points', x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3)
            .attr('fill', 'none').attr('stroke', ORIGIN_META[d.data.mainKey].color)
            .attr('stroke-width', 1).attr('stroke-linecap', 'round');
          var anchor = (cos >= 0) ? 'start' : 'end';
          var tg = d1LabelsG.append('g')
            .attr('transform', 'translate(' + (x3 + dir * 2) + ',' + y3 + ')')
            .style('cursor', 'pointer')
            .on('click', function (ev) { ev.stopPropagation(); showDrill(d, { demo: true }); });
          tg.append('title').text(d.data.name + ' ' + d.value + '종 — 클릭하여 자세히 보기');
          tg.append('text').attr('class', 'dgb-callout-name').attr('dy', '-0.15em')
            .attr('text-anchor', anchor).attr('data-origin', d.data.mainKey).text(d.data.name);
          tg.append('text').attr('class', 'dgb-callout-count').attr('dy', isMobile ? '17px' : '23px')
            .attr('text-anchor', anchor).text(d.value + '종');
        });
      }

      // 중분류 링: 출신 비율만큼 색 분할 (비활성 필터는 오퍼시티↓)
      var segs = [];
      depth2.forEach(function (d) {
        originSegsFor(d.gx0, d.gx1, d.data.breakdown, d.value).forEach(function (s) { s.node = d; segs.push(s); });
      });
      svg.append('g').selectAll('path').data(segs).join('path')
        .attr('class', 'oh-seg').attr('data-origin', function (s) { return s.origin; })
        .attr('d', arcSeg)
        .attr('fill', function (s) { return lighten(ORIGIN_META[s.origin].color, 0.38); })
        .attr('fill-opacity', function (s) { return originOpacity(s.origin) * 0.95; })
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this).transition('hover').duration(100)
            .attr('fill-opacity', function (s) { return originOpacity(s.origin); });
        })
        .on('mouseleave', function () {
          d3.select(this).transition('hover').duration(160)
            .attr('fill-opacity', function (s) { return originOpacity(s.origin) * 0.95; });
        })
        .on('click', function (ev, s) { ev.stopPropagation(); showTreemap(s.node, { demo: true }); })
        .append('title')
        .text(function (s) {
          return s.node.data.name + ' · ' + ORIGIN_META[s.origin].label + ' ' + s.count + '종 / 전체 ' + s.node.value + '종';
        });

      // ── 그룹 경계선: 4개 대분류 사이를 얇은 검정 방사선으로 구분 ──
      var GROUP_LINE_W = isMobile ? 1 : 1.2;
      svg.append('g').attr('class', 'origin-group-lines').attr('pointer-events', 'none')
        .selectAll('line').data(depth1).join('line')
        .attr('x1', function (d) { return Math.sin(d.x0) * innerR; })
        .attr('y1', function (d) { return -Math.cos(d.x0) * innerR; })
        .attr('x2', function (d) { return Math.sin(d.x0) * outerR2; })
        .attr('y2', function (d) { return -Math.cos(d.x0) * outerR2; })
        .attr('stroke', '#1a1a1a').attr('stroke-width', GROUP_LINE_W);

      // 중분류 라벨 (인라인)
      function arcLen(d) { return (d.gx1 - d.gx0) * arcMidR; }
      var inlineMain = depth2.filter(function (d) {
        return arcLen(d) >= (d.data.name.length * (isMobile ? 9 : 11) + 6) && (d.gx1 - d.gx0) > 0.10;
      });
      var labelG = svg.append('g').attr('pointer-events', 'none').attr('text-anchor', 'middle');
      labelG.selectAll('g').data(inlineMain).join('g')
        .attr('transform', function (d) {
          var mid = (d.gx0 + d.gx1) / 2;
          return 'rotate(' + (mid * 180 / Math.PI - 90) + ') translate(' + arcMidR + ',0) rotate(' + (mid > Math.PI ? 180 : 0) + ')';
        })
        .each(function (d) {
          var g = d3.select(this);
          g.append('text').attr('class', 'dgb-label-sub-name').attr('dy', '-0.15em')
            .text(d.data.name);
          g.append('text').attr('class', 'dgb-label-sub-count').attr('dy', isMobile ? '14px' : '18px')
            .text(d.value + '종');
        });

      // 중앙 텍스트
      var centerG = svg.append('g').attr('text-anchor', 'middle').attr('pointer-events', 'none');
      var centerTitle = (activeFilter === 'all') ? '탕액편' : ORIGIN_META[activeFilter].label;
      var centerSub = (activeFilter === 'all')
        ? (total + '종')
        : (counts[activeFilter] + '종');
      centerG.append('text').attr('class', 'oh-center-title dgb-center-title').attr('dy', '-0.2em')
        .text(centerTitle);
      centerG.append('text').attr('class', 'oh-center-sub dgb-center-sub').attr('dy', isMobile ? '28px' : '40px')
        .text(centerSub);

      // 선버스트 진입 시 필터 자동 시연 (보기 진입 1회)
      if (opts && opts.demo) startFilterDemo(450, ORIGIN_ORDER.filter(function (k) { return counts[k] > 0; }));
    }

    // ── 대분류 클릭: 출신색 드릴다운 도넛 ────────────────────────────
    function showDrill(mainD, opts) {
      cancelFilterDemo();
      setLegendCounts(null);   // 드릴(2depth) — 범례 툴팁은 전체 종수
      drillNode = mainD; activeNode = mainD; viewState = 'drill';
      if (backBtn) backBtn.setAttribute('aria-hidden', 'false');
      // 도넛차트 2depth(중분류)에서도 "클릭해서 더 깊게 탐색하세요" 노출 (중분류→약재 트리맵 유도)
      if (exploreHint) exploreHint.setAttribute('aria-hidden', 'false');
      if (!drillEl) {
        drillEl = document.createElement('div');
        drillEl.className = 'sunburst-drill-overlay';
        drillEl.style.cssText = [
          'position:absolute', 'inset:0', 'background:transparent',
          'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
          // 1depth(베이스 선버스트)와 2depth(드릴 도넛)의 세로 영역·위치를 동일하게 맞춘다.
          // (이전엔 padding-top:64px로 도넛을 아래로 밀어 1depth보다 낮게/길게 보였음 → 제거)
          'padding-top:0',
          'opacity:0', 'pointer-events:none', 'z-index:10'
        ].join(';');
        wrapEl.style.position = 'relative';
        wrapEl.appendChild(drillEl);
        // 드릴 배경(슬라이스 외) 클릭 → 한 단계 위로
        drillEl.addEventListener('click', function () {
          hideAll();
          // 선버스트로 복귀 → 진입 시연 1회
          startFilterDemo(450, ORIGIN_ORDER.filter(function (k) { return counts[k] > 0; }));
        });
      }
      drillEl.innerHTML = '';
      drillEl.setAttribute('aria-hidden', 'false');
      drillEl.style.pointerEvents = 'all';
      chartEl.style.visibility = 'hidden';

      // 드릴 도넛은 1depth(베이스 선버스트)와 동일 크기로 그린다. (innerR..outerR2, vb=outerR2+26)
      var dInnerR = innerR, dOuterR = outerR2;
      var dElbR = dOuterR + 40, dCalloutR = dOuterR + 10, dVb = dOuterR + 26;
      var subs = mainD.children || [];
      var totalC = mainD.value || 1;

      var pie = d3.pie().value(function (s) { return s.data.value || 0; }).padAngle(0.018).sort(null);
      var arcs = pie(subs);

      var baseSvgEl = chartEl.querySelector('svg');
      var baseH = baseSvgEl ? baseSvgEl.getBoundingClientRect().height : 0;
      var wrapH = wrapEl ? (wrapEl.clientHeight || 500) : 500;
      // 2depth 높이는 1depth(베이스) 높이에 맞춘다. 측정 실패 시에도 베이스 상한(820)을 기준으로.
      var svgH = baseH > 120 ? baseH : Math.min(2 * dVb, wrapH - 20, 820);
      var dSvg = d3.select(drillEl).append('svg')
        .attr('viewBox', [-dVb, -dVb, 2 * dVb, 2 * dVb])
        .attr('width', '100%').attr('height', svgH)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('max-width', 'min(100%, min(1180px, 92vw))')
        .style('overflow', 'visible');
      drillEl.style.opacity = '1';
      dSvg.style('opacity', 0);

      var animDuration = 520;

      // 슬라이스를 출신색으로 분할 — outerR 보간으로 펼침
      function sliceSegData(a) {
        var span = a.endAngle - a.startAngle - a.padAngle;
        var start = a.startAngle + a.padAngle / 2;
        var n = a.data.data.value || 1, acc = start, out = [];
        ORIGIN_ORDER.forEach(function (ok) {
          var c = (a.data.data.breakdown[ok] || []).length;
          if (c === 0) return;
          var a1 = acc + span * (c / n);
          out.push({ origin: ok, s0: acc, s1: a1, count: c });
          acc = a1;
        });
        return out;
      }
      function drawSlice(gNode, a, or) {
        var segData = sliceSegData(a);
        var arcGen = d3.arc().innerRadius(dInnerR).outerRadius(or).cornerRadius(2);
        d3.select(gNode).selectAll('path').data(segData).join('path')
          .attr('class', 'oh-seg').attr('data-origin', function (sd) { return sd.origin; })
          .attr('d', function (sd) { return arcGen({ startAngle: sd.s0, endAngle: sd.s1 }); })
          .attr('fill', function (sd) { return ORIGIN_META[sd.origin].color; })
          .attr('fill-opacity', function (sd) { return originOpacity(sd.origin) * 0.95; })
          .attr('stroke', '#fff').attr('stroke-width', 1.8).attr('stroke-linejoin', 'round');
      }

      var sliceG = dSvg.append('g').attr('class', 'drill-arcs')
        .selectAll('g.slice').data(arcs).join('g').attr('class', 'slice')
        .style('cursor', 'pointer')
        .on('click', function (ev, a) { ev.stopPropagation(); hideDrill(); showTreemap(a.data, { demo: true }); });
      // 초기: 납작하게
      sliceG.each(function (a) { drawSlice(this, a, dInnerR); });

      requestAnimationFrame(function () {
        dSvg.transition().duration(200).style('opacity', 1);
        // 'grow' 이름 트랜지션 → 커서가 도넛 위에 있어도 펼침이 취소되지 않음 (슬라이스 잘림 방지)
        sliceG.transition('grow').duration(animDuration).ease(d3.easeCubicOut)
          .delay(function (a, i) { return i * 45; })
          .tween('grow', function (a) {
            var node = this, ir = d3.interpolate(dInnerR, dOuterR);
            return function (t) { drawSlice(node, a, ir(t)); };
          });
      });

      // 약재 링 (중분류 arc 바깥 — 약재마다 출신색 호 조각, 비활성 필터는 흐리게)
      var dotRingInner = dOuterR + 6, dotRingOuter = dOuterR + 18;
      var herbArc = d3.arc().innerRadius(dotRingInner).outerRadius(dotRingOuter).cornerRadius(1);
      var dotG = dSvg.append('g').attr('class', 'drill-dot-ring').attr('opacity', 0).attr('pointer-events', 'none');
      arcs.forEach(function (a) {
        var hl = a.data.data.herbs || [];
        if (hl.length === 0) return;
        var span = a.endAngle - a.startAngle - a.padAngle;
        if (span <= 0) return;
        var step = span / hl.length;
        var gapAngle = Math.min(step * 0.15, 0.008);
        hl.forEach(function (h, hi) {
          var center = a.startAngle + a.padAngle / 2 + step * (hi + 0.5);
          var halfSpan = step / 2 - gapAngle;
          if (halfSpan <= 0) halfSpan = step / 2;
          dotG.append('path')
            .attr('class', 'oh-dot').attr('data-origin', h.origin)
            .attr('d', herbArc({ startAngle: center - halfSpan, endAngle: center + halfSpan }))
            .attr('fill', ORIGIN_META[h.origin].color)
            .attr('fill-opacity', originOpacity(h.origin))
            .attr('stroke', '#fff').attr('stroke-width', 0.4);
        });
      });

      // 라벨 (이름 + 종수, 인라인)
      var dMidR = (dInnerR + dOuterR) / 2;
      var labelDelay = animDuration + arcs.length * 45;
      // 슬라이스가 인라인 라벨을 담기엔 너무 좁으면 콜아웃(선 라벨)로 처리.
      // (곡부는 기존 동작 유지를 위해 항상 콜아웃)
      var dCharPx = isMobile ? 12 : 15;
      function drillNeedsCallout(a) {
        if (a.data.data.subKey === '곡부') return true;
        var span = a.endAngle - a.startAngle - a.padAngle;
        // 좁은 슬라이스는 각도 기준으로도 콜아웃 — 수평 인라인 라벨이 상단 밀집 구간에서
        // 이웃과 겹치는 것을 막는다(인라인은 넓은 슬라이스에만 허용).
        if (span < 0.34) return true;
        var arcLen = span * dMidR;
        var need = (a.data.data.name || '').length * dCharPx + 6;
        return arcLen < need;
      }
      var dLabelG = dSvg.append('g').attr('pointer-events', 'none').attr('opacity', 0);
      arcs.forEach(function (a) {
        if (drillNeedsCallout(a)) return; // 좁은 슬라이스는 아래 callout으로
        var mid = (a.startAngle + a.endAngle) / 2;
        var lx = Math.cos(mid - Math.PI / 2) * dMidR;
        var ly = Math.sin(mid - Math.PI / 2) * dMidR;
        var tg = dLabelG.append('g').attr('transform', 'translate(' + lx + ',' + ly + ')').attr('text-anchor', 'middle');
        // 분류 체계별(유형별) 드릴과 동일 — 슬라이스 위 흰색 라벨
        // 유형별 보기 선버스트(드릴) 글씨와 통일: 이름 27px / 종수 20px
        tg.append('text').attr('class', 'dgb-drill-name').attr('dy', '-0.15em')
          .text(a.data.data.name);
        tg.append('text').attr('class', 'dgb-drill-count').attr('dy', '24px')
          .text(a.data.data.value + '종');
      });

      // 좁은 슬라이스는 라벨을 상시 표시하지 않고, 마우스 오버 시에만 콜아웃 1개를 띄운다.
      // (상시 콜아웃 스택이 시각적으로 지저분해지는 문제 → 호버 시 해당 위치만 표시)
      var hoverG = dSvg.append('g').attr('class', 'drill-hover-callout').attr('pointer-events', 'none');
      function showHoverCallout(a) {
        hoverG.selectAll('*').remove();
        var mid = (a.startAngle + a.endAngle) / 2;
        var cos = Math.cos(mid - Math.PI / 2), sin = Math.sin(mid - Math.PI / 2);
        var dir = (cos >= 0) ? 1 : -1;
        var fn = isMobile ? 12 : 14, fc = isMobile ? 10 : 11;
        var x1 = cos * (dOuterR + 6), y1 = sin * (dOuterR + 6);   // 슬라이스 바깥 가장자리(실제 각도)
        // 라벨 Y는 viewBox 안으로 클램프(상/하단 잘림 방지), X는 그 높이의 도넛 폭 바깥으로 빼서
        // 도넛 위에 겹치지 않게 한다. 위/아래 끝 슬라이스는 도넛 폭이 좁아 자연히 중앙 근처로 모인다.
        var labelY = sin * (dOuterR + 28);
        // 위/아래 끝 슬라이스도 wrap 상단으로 잘리지 않게 세로를 안쪽으로 클램프.
        var yLim = dVb - 50;
        if (labelY < -yLim) labelY = -yLim; else if (labelY > yLim) labelY = yLim;
        // 라벨은 도넛 바깥 고정 컬럼에 둔다 → 그래프와 안 겹침. (옆으로 살짝 튀어나와도 OK)
        var elbowX = dir * (dOuterR + 18);
        var labelX = dir * (dOuterR + 30);
        hoverG.append('polyline')
          .attr('points', x1 + ',' + y1 + ' ' + elbowX + ',' + labelY + ' ' + labelX + ',' + labelY)
          .attr('fill', 'none').attr('stroke', '#888').attr('stroke-width', 1).attr('stroke-linecap', 'round');
        var anchor = (dir > 0) ? 'start' : 'end';
        var tg = hoverG.append('g').attr('transform', 'translate(' + (labelX + dir * 2) + ',' + labelY + ')');
        tg.append('text').attr('class', 'dgb-drill-callout-name').attr('dy', '-0.35em')
          .attr('text-anchor', anchor).attr('font-size', fn + 'px').text(a.data.data.name);
        tg.append('text').attr('class', 'dgb-drill-callout-count').attr('dy', (fn + 7) + 'px')
          .attr('text-anchor', anchor).attr('font-size', fc + 'px').text(a.data.data.value + '종');
      }
      function hideHoverCallout() { hoverG.selectAll('*').remove(); }
      // 좁은 슬라이스(인라인 라벨이 없는 것)에만 호버 콜아웃 연결
      sliceG.filter(function (a) { return drillNeedsCallout(a); })
        .on('mouseenter.callout', function (ev, a) { showHoverCallout(a); })
        .on('mouseleave.callout', function () { hideHoverCallout(); });
      // 모든 슬라이스: 마우스 오버 시 색을 조금 진하게
      sliceG
        .on('mouseenter.hl', function () { d3.select(this).selectAll('path').style('filter', 'brightness(0.88)'); })
        .on('mouseleave.hl', function () { d3.select(this).selectAll('path').style('filter', null); });

      dLabelG.transition().duration(250).delay(labelDelay).attr('opacity', 1);
      dotG.transition().duration(350).delay(labelDelay).attr('opacity', 1);

      // 중앙 텍스트 — 유형별 보기 선버스트(드릴)와 통일: 제목 32px / 종수 22px
      var dCenter = dSvg.append('g').attr('text-anchor', 'middle').attr('pointer-events', 'none');
      dCenter.append('text').attr('class', 'dgb-center-title').attr('dy', '-0.2em')
        .text(mainD.data.name);
      dCenter.append('text').attr('class', 'dgb-center-sub').attr('dy', isMobile ? '28px' : '40px')
        .text(totalC + '종');

      // 1depth(드릴) 진입 시 필터 자동 시연 — 펼침 애니메이션이 끝난 뒤 시작.
      // 이 대분류에 실제로 존재하는 출신만 순환(0건 필터는 건너뜀).
      if (opts && opts.demo) startFilterDemo(labelDelay + 300, presentOriginsForMain(mainD));
    }

    // ── 중분류 클릭: 약재 트리맵 (비활성 필터 약재는 오퍼시티↓) ────────
    function showTreemap(d, opts) {
      if (!treemapEl) return;
      cancelFilterDemo();
      activeNode = d; viewState = 'treemap';
      if (backBtn) backBtn.setAttribute('aria-hidden', 'false');
      if (exploreHint) exploreHint.setAttribute('aria-hidden', 'true');
      treemapEl.innerHTML = '';
      treemapEl.setAttribute('aria-hidden', 'false');
      // 트리맵 배경(약재 타일 외) 클릭 → 한 단계 위(드릴 도넛)로 이동.
      // 약재 타일은 클릭 시 ev.stopPropagation() 하므로 여기로 버블링되지 않는다.
      treemapEl.onclick = function () {
        if (drillNode) { hideTreemap(); showDrill(drillNode, { demo: true }); }
      };
      // 1depth 도넛(선버스트) 렌더 높이 측정 — 2depth 트리맵 높이를 여기에 맞춘다.
      // (--treemap 클래스를 붙이면 선버스트 호스트가 display:none 되므로 그 전에 측정)
      var baseSvgEl2 = chartEl ? chartEl.querySelector('svg') : null;
      var baseDonutH = baseSvgEl2 ? Math.round(baseSvgEl2.getBoundingClientRect().height) : 0;
      wrapEl.classList.add('dashboard-sunburst-wrap--treemap');

      // 트리맵은 이 중분류(subKey)의 약재 "전체"(모든 출신)를 보여준다.
      // (드릴은 한 출신만 담지만, 3depth에서는 출신 필터를 오퍼시티로 적용하기 위해
      //  중분류 전체를 펼친다.) 데이터가 없으면 기존 단일-출신 목록으로 폴백.
      var subKey = d.data.subKey;
      var leaves = ((subKey && mixedHerbsBySub[subKey]) || d.data.herbs || []).slice();
      if (leaves.length === 0) return;
      // 필터 클릭 여부와 무관하게 약재 위치는 고정 — 강조는 오퍼시티(leafOpacity)로만 표현

      // 범례 hover 툴팁 숫자를 이 중분류 안의 출신별 종수로 바꾼다(전체 종수가 아님).
      var subCounts = {};
      var subBd = (subKey && mixedBreakdownBySub[subKey]) || d.data.breakdown || {};
      ORIGIN_ORDER.forEach(function (ok) { subCounts[ok] = (subBd[ok] || []).length; });
      setLegendCounts(subCounts);

      var title = document.createElement('div');
      title.className = 'dashboard-treemap-head';
      title.textContent = d.data.name + ' (' + leaves.length + '종)';
      treemapEl.appendChild(title);

      var tw = Math.max(260, (wrapEl.clientWidth || containerW) - 8);
      // 1depth와 2depth 높이 통일: 트리맵 전체 높이(제목+SVG)를 1depth 도넛 높이에 맞춘다.
      var th;
      if (baseDonutH > 200) {
        var headH = title.getBoundingClientRect().height || 40;
        th = Math.max(300, baseDonutH - headH - 14);
      } else {
        var vhCap = (typeof window !== 'undefined' && window.innerHeight) ? Math.round(window.innerHeight * 0.55) : 520;
        th = Math.max(300, Math.min(520, vhCap, Math.round(tw * 0.5)));
      }

      var tmRoot = d3.hierarchy({ children: leaves }).sum(function (n) { return n.value || 1; });
      d3.treemap().tile(d3.treemapSquarify).size([tw, th]).paddingOuter(3).paddingInner(2).round(true)(tmRoot);

      var svgT = d3.select(treemapEl).append('svg')
        .attr('viewBox', [0, 0, tw, th]).attr('width', '100%').attr('height', th);

      var tmLeaves = tmRoot.leaves();
      function leafColor(n) { return lighten(ORIGIN_META[n.data.origin].color, 0.5); }
      function leafOpacity(n) { return matchesFilter(n.data.origin) ? 1 : DIM_OP; }

      // 모달 좌우 탐색용 herb 목록 (표시 순서)
      var tmHerbList = [];
      tmLeaves.forEach(function (n) {
        var h = findHerb(n.data.entry);
        if (h) tmHerbList.push(h);
      });

      var cell = svgT.selectAll('g').data(tmLeaves).join('g')
        .attr('class', 'oh-cell').attr('data-origin', function (n) { return n.data.origin; })
        .attr('transform', function (n) { return 'translate(' + n.x0 + ',' + n.y0 + ')'; })
        .attr('opacity', function (n) { return leafOpacity(n); });

      var defs = svgT.append('defs');
      tmLeaves.forEach(function (n, i) {
        defs.append('clipPath').attr('id', 'otmclip-' + i)
          .append('rect').attr('width', Math.max(0, n.x1 - n.x0)).attr('height', Math.max(0, n.y1 - n.y0))
          .attr('rx', 3).attr('ry', 3);
      });

      cell.append('rect')
        .attr('width', function (n) { return Math.max(0, n.x1 - n.x0); })
        .attr('height', function (n) { return Math.max(0, n.y1 - n.y0); })
        .attr('rx', 3).attr('ry', 3)
        .attr('fill', function (n) { return leafColor(n); })
        .attr('stroke', '#fff').attr('stroke-width', 1.5)
        .style('cursor', function (n) { return n.data.entry ? 'pointer' : 'default'; })
        .on('click', function (ev, n) {
          ev.stopPropagation();
          if (!n.data.entry) return;
          var herb = findHerb(n.data.entry);
          if (herb && typeof window.openHerbIngredientModal === 'function') {
            window.openHerbIngredientModal(herb, tmHerbList, true);
          }
        });

      cell.append('title').text(function (n) {
        return (n.data.name || '') + ' · ' + ORIGIN_META[n.data.origin].label;
      });

      cell.each(function (n, i) {
        var herb = findHerb(n.data.entry);
        var thumbSrc = herb
          ? ((typeof window.getThumbnailForHerb === 'function' && window.getThumbnailForHerb(herb)) || (typeof getThumbnailPathFallback === 'function' ? getThumbnailPathFallback(herb) : ''))
          : '';
        if (!thumbSrc) return;
        var w = Math.max(0, n.x1 - n.x0), h = Math.max(0, n.y1 - n.y0);
        d3.select(this).append('image')
          .attr('href', thumbSrc).attr('x', 0).attr('y', 0)
          .attr('width', w).attr('height', h)
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .attr('clip-path', 'url(#otmclip-' + i + ')')
          .style('pointer-events', 'none');
      });

      var textCells = cell.filter(function (n) { return (n.x1 - n.x0) > 28 && (n.y1 - n.y0) > 16; });
      // 2depth(트리맵) 타일 글씨 — 1·2depth 글씨 통일 위해 +2px (9~14 → 11~16)
      function tmFontSize(n) { var w = n.x1 - n.x0, h = n.y1 - n.y0; return Math.min(16, Math.max(11, Math.min(w / 4, h / 2.5) + 2)) + 'px'; }
      function tmText(n) { var name = n.data.name || ''; var w = n.x1 - n.x0; if (name.length > 8 && w < 70) return name.slice(0, 6) + '…'; return name; }
      textCells.append('text')
        .attr('class', 'dgb-treemap-label dgb-treemap-label--stroke')
        .attr('x', function (n) { return (n.x1 - n.x0) / 2; }).attr('y', function (n) { return (n.y1 - n.y0) / 2; })
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', tmFontSize)
        .attr('pointer-events', 'none').text(tmText);
      textCells.append('text')
        .attr('class', 'dgb-treemap-label dgb-treemap-label--fill')
        .attr('x', function (n) { return (n.x1 - n.x0) / 2; }).attr('y', function (n) { return (n.y1 - n.y0) / 2; })
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', tmFontSize)
        .attr('pointer-events', 'none').text(tmText);

      // 2depth(트리맵) 진입 시 필터 자동 시연 — 이 중분류에 실제 약재가 있는
      // 출신만 순환한다. 예: 광물 → 향약·일반만 있으면 그 둘만 시연.
      if (opts && opts.demo) startFilterDemo(450, presentOrigins((subKey && mixedBreakdownBySub[subKey]) || d.data.breakdown));
    }

    // ── 닫기/뒤로 ───────────────────────────────────────────────────
    function hideTreemap() {
      if (!treemapEl) return;
      treemapEl.innerHTML = '';
      treemapEl.setAttribute('aria-hidden', 'true');
      wrapEl.classList.remove('dashboard-sunburst-wrap--treemap');
    }
    function hideDrill() {
      if (!drillEl) return;
      drillEl.style.opacity = '0';
      drillEl.style.pointerEvents = 'none';
      drillEl.setAttribute('aria-hidden', 'true');
      drillEl.innerHTML = '';
      chartEl.style.visibility = '';
    }
    function hideAll() {
      hideTreemap(); hideDrill();
      activeNode = null; drillNode = null; viewState = null;
      if (backBtn) backBtn.setAttribute('aria-hidden', 'true');
      if (exploreHint) exploreHint.setAttribute('aria-hidden', 'false');
    }

    /** 필터 변경/리사이즈 시 현재 보기 다시 그림 */
    function redrawCurrent() {
      if (viewState === 'treemap' && activeNode) {
        var node = activeNode;
        hideTreemap();
        showTreemap(node);
      } else if (viewState === 'drill' && drillNode) {
        showDrill(drillNode);
      } else {
        renderBase();
      }
    }

    if (backBtn) {
      backBtn.setAttribute('aria-hidden', 'true');
      backBtn.onclick = function () {
        if (viewState === 'treemap' && drillNode) { hideTreemap(); showDrill(drillNode, { demo: true }); }
        else {
          hideAll();
          // 선버스트로 복귀 → 진입 시연 1회
          startFilterDemo(450, ORIGIN_ORDER.filter(function (k) { return counts[k] > 0; }));
        }
      };
    }

    // 초기 렌더 — 진입 시연 1회
    renderBase({ demo: true });

    // 리사이즈 대응
    var _oTimer;
    var _oHandler = function () {
      clearTimeout(_oTimer);
      _oTimer = setTimeout(function () {
        if (!chartEl.offsetParent) return; // 숨김 상태면 스킵
        redrawCurrent();
      }, 150);
    };
    if (chartEl._originResizeHandler) window.removeEventListener('resize', chartEl._originResizeHandler);
    chartEl._originResizeHandler = _oHandler;
    window.addEventListener('resize', _oHandler);

    // ── 뎁스 공유: 현재 보기 상태 읽기/적용 API 등록 ───────────────────
    function navMainNode(mainKey) {
      return (root.children || []).find(function (n) { return n.data.mainKey === mainKey; }) || null;
    }
    dashboardNavRegistry.origin = {
      getNav: function () {
        if (viewState === 'treemap' && activeNode) {
          var main = activeNode.parent;
          return { depth: 2, mainKey: main && main.data ? main.data.mainKey : null, subKey: activeNode.data.subKey };
        }
        if (viewState === 'drill' && drillNode) {
          return { depth: 1, mainKey: drillNode.data.mainKey };
        }
        return { depth: 0 };
      },
      applyNav: function (state) {
        hideAll();
        if (!state || !state.depth) return;
        var mainNode = navMainNode(state.mainKey);
        if (!mainNode) return;
        if (state.depth === 1) { showDrill(mainNode); return; }
        var subNode = (mainNode.children || []).find(function (n) { return n.data.subKey === state.subKey; });
        if (!subNode) { showDrill(mainNode); return; }
        drillNode = mainNode; // 트리맵 → 드릴 → 베이스 순서로 뒤로가기 동작하도록
        showTreemap(subNode);
      }
    };
  }

  /** 잘 쓰이지 않는 희귀 약재 32선 섹션 렌더링 */
  function renderRareHerbsSection() {
    var el = document.getElementById('rare-herbs-section');
    if (!el || el.dataset.rendered === '1') return;
    el.dataset.rendered = '1';

    var RARE_HERBS = [
      { name: '정화수', hanja: '井華水', english: 'Well water (dawn)', img: 'asset/img/Well-water-(dawn).png',
        desc: '새벽에 처음 길은 우물물. 마음을 맑히고 열독을 풀었다.',
        reason: '현대 상수도 보급으로 우물 자체가 사라졌고, 과학적 약효 근거가 없어 처방에서 자연스럽게 소멸되었다.' },
      { name: '납설수', hanja: '臘雪水', english: 'Snow water (12th month)', img: 'asset/img/Snow-water-(12th-month).png',
        desc: '섣달에 내린 눈을 녹인 물. 열독을 내리는 데 썼다.',
        reason: '대기오염으로 눈에 중금속·산성 성분이 다량 포함되어 오히려 독성이 우려된다. 현대에는 약용으로 쓸 수 없다.' },
      { name: '밀타승', hanja: '密陀僧', english: 'Litharge (Lead monoxide)', img: 'asset/img/Litharge.png',
        desc: '납을 산화시켜 만든 가루. 종기·치질·악창의 외용약으로 썼다.',
        reason: '주성분인 납(Pb)이 피부와 점막을 통해 흡수되어 신경계와 신장을 손상시킨다는 것이 과학적으로 입증되었다. 현행 중금속 허용 기준을 크게 초과하여 의약품 원료 사용이 금지되었다.' },
      { name: '동벽토', hanja: '東壁土', english: 'East wall soil', img: 'asset/img/East-wall-soil.png',
        desc: '오래된 집의 동쪽 벽에서 긁어낸 흙. 위를 따뜻하게 하고 구토를 멈추는 데 활용했다.',
        reason: '현대 콘크리트·시멘트 건축으로 전통 흙벽 자체가 사라졌고, 약효의 과학적 근거도 입증되지 않아 폐기되었다.' },
      { name: '부조회', hanja: '釜竈灰', english: 'Iron forge ash', img: 'asset/img/Hearth-ash.png',
        desc: '부뚜막·아궁이 재. 오래 쌓인 열기를 담고 있어 해독·지혈에 쓰이던 광물성 약재.',
        reason: '가스·전기 조리가 보편화되며 오래된 아궁이가 소멸했고, 회분 성분만으로는 현대 의약 기준을 충족하지 못한다.' },
      { name: '경분', hanja: '輕粉', english: 'Mercury', img: 'asset/img/Mercury.png',
        desc: '수은을 승화시켜 만든 염화제일수은 결정. 강력한 살충·살균 효과가 있지만 맹독성으로 신중하게 썼다.',
        reason: '염화수은(HgCl)의 신경독성·신장독성이 과학적으로 입증되어 대부분 국가에서 의약품 원료 사용이 법으로 금지되었다.' },
      { name: '황단', hanja: '黃丹', english: 'Red Lead (Minium)', img: 'asset/img/Lead_oxide.png',
        desc: '납을 고온 산화시켜 만든 사산화삼납(Pb₃O₄) 결정. 외용 창약·해독·고약 기제로 광범위하게 쓰인 광물 약재.',
        reason: '납(Pb)의 신경독성·신장독성이 과학적으로 확인되었다. 피부 흡수를 통해서도 납중독이 발생할 수 있어, 현행 중금속 허용 기준을 대폭 초과하여 의약품 원료 사용이 금지되었다.' },
      { name: '비상', hanja: '砒霜', english: 'Arsenic', img: 'asset/img/Arsenic.png',
        desc: '천연 비소 광물. 학질·악창을 다스린, 가장 위험한 약재의 하나.',
        reason: '비소(As₂O₃)는 IARC 1군 발암물질로 지정되었다. 현행 의약품 안전 기준으로 경구 처방이 전면 금지되었다.' },
      { name: '진사', hanja: '辰砂', english: 'Cinnabar', img: 'asset/img/Cinnabar.png',
        desc: '천연 황화수은 광물. 붉은 빛으로 심신 안정·경련 진정에 썼다.',
        reason: '체내에 축적된 수은(Hg)이 신경계와 신장을 손상시킨다는 것이 과학적으로 증명되어 다수 국가에서 처방이 금지되었다.' },
      { name: '오공', hanja: '蜈蚣', english: 'Centipede', img: 'asset/img/Centipede.png',
        desc: '지네 전체. 독을 해독하고 경련을 멈추는 데 사용한 동물 약재로, 오늘날엔 거의 처방하지 않는다.',
        reason: '알레르기 쇼크 및 독소 반응 사례가 보고되고, 동물 약재에 대한 윤리·안전 기준 강화로 처방이 급격히 줄었다.' },
      { name: '야명사', hanja: '夜明砂', english: 'Bat', img: 'asset/img/Bat.png',
        desc: '박쥐의 말린 배설물. 야맹증·안질 치료에 썼다.',
        reason: '박쥐 배설물은 광견병·코로나바이러스 등 인수공통 전염병 매개 위험이 과학적으로 확인되어 현대 의료에서 사용이 금지되었다.' },
      { name: '모구음경', hanja: '牡狗陰莖', english: "Male Dog's Penis", img: 'asset/img/Dog-penis.png',
        desc: '수캐의 음경을 말린 것. 발기부전과 허리·무릎 냉증에 썼다.',
        reason: '동물 유래 성적 기관의 약리 효과를 뒷받침할 과학적 근거가 없으며, 동물 복지 기준 강화와 윤리적 문제 제기로 현대 한의학 처방에서 사실상 제외되었다.' },
      { name: '인중백', hanja: '人中白', english: 'Human urine', img: 'asset/img/Urinary_Calculus.png',
        desc: '오래 말린 인간의 소변 잔여물. 열독·코피·인후종통을 다스린다고 기록된 매우 특이한 약재.',
        reason: '병원성 미생물 오염 위험이 있으며, 현행 약사법상 인체 분비물의 의약품 사용이 허용되지 않는다.' },
      { name: '난발회', hanja: '亂髮灰', english: 'Human hair', img: 'asset/img/Human-hair.png',
        desc: '사람의 머리카락을 태운 재. 지혈과 어혈 해소에 쓰였으며 현대 한의학에서도 간혹 언급된다.',
        reason: '머리카락 연소 시 독성 아민 화합물이 생성될 수 있으며, 과학적 약리 기전이 전혀 규명되지 않아 처방에서 자연 소멸되었다.' },
      { name: '우박', hanja: '雹', english: 'Hailstones', img: 'asset/img/Hail.png',
        desc: '하늘에서 내린 우박. 위열을 식히고 눈을 밝히는 데 썼다.',
        reason: '현대 대기오염으로 우박에 황산염·질산염 등 오염물질이 다량 포함되어 약용 적합성을 완전히 상실했다.' },
      { name: '방경수', hanja: '方鏡水', english: 'Mirror condensation', img: 'asset/img/Mirror-condensation.png',
        desc: '청동 거울에 맺힌 이슬. 귀신 들린 병·간질에 쓴 주술적 약재.',
        reason: '음양론에 근거한 약재로 과학적 근거가 전혀 없으며, 구리 성분 용출로 인한 중금속 독성이 오히려 우려된다.' },
      { name: '웅황', hanja: '雄黃', english: 'Realgar', img: 'asset/img/Realgar.png',
        desc: '천연 황화비소(As₄S₄) 광물. 선명한 주황색으로 해독·살충·악창 치료에 두루 쓰인 광물 약재.',
        reason: '가열되거나 체내에서 분해되면 맹독성 비소 화합물로 전환된다. 비소의 발암성과 축적 독성이 입증되어 현대에는 내복 처방이 사실상 금지되었다.' },
      { name: '부인월수', hanja: '婦人月水', english: 'Menstrual Blood', img: 'asset/img/Menstrual-blood.png',
        desc: '여성의 월경혈. 어혈·귀신병·산후 복통을 다스리는 데 썼다.',
        reason: '감염성 질환 매개 위험이 높고, 현행 혈액 및 혈액제제에 관한 법률상 월경혈의 의약품 원료 사용이 허용되지 않는다.' },
      { name: '신생소아제', hanja: '新生小兒臍', english: 'Umbilical Cord', img: 'asset/img/Umbilical-cord.png',
        desc: '신생아의 말린 탯줄. 허약한 아이의 경련·야제·복통에 썼다.',
        reason: '병원성 미생물 오염 가능성이 있으며, 현행 의료폐기물 처리법상 탯줄은 의료폐기물로 분류되어 약용 목적의 별도 수거 자체가 불법이다.' },
      { name: '운모', hanja: '雲母', english: 'Mica', img: 'asset/img/mica.png',
        desc: '얇게 벗겨지는 규산염 광물. 안정·보기·이뇨에 갈아 썼다.',
        reason: '약효를 뒷받침할 과학적 근거가 없고, 미세 분말을 흡입·섭취할 경우 규폐증 등 호흡기·소화기 손상 위험이 있어 처방에서 자연 소멸되었다.' },
      { name: '자하거', hanja: '紫河車', english: 'Human Placenta', img: 'asset/img/Placenta.png',
        desc: '사람의 태반을 말려 가루 낸 것. 기·혈을 보한 최고급 보양제.',
        reason: '간염·HIV 등 혈액 매개 감염병을 옮길 위험이 높고, 인체 조직의 의약품 사용을 제한하는 현행 법규와 윤리 기준에 따라 처방에서 배제되었다.' },
      { name: '천령개', hanja: '天靈蓋', english: 'Human Skull Cap', img: 'asset/img/Skull-cap.png',
        desc: '오래 묻힌 사람 두개골의 정수리 뼈. 광증·간질·두통에 썼다.',
        reason: '인체 유골 수집·사용은 장사 등에 관한 법률로 형사처벌 대상이 된다. 현대 의학·윤리 기준에서 완전히 배제되었다.' },
      { name: '인중황', hanja: '人中黃', english: 'Fermented Human Feces', img: 'asset/img/Human-feces.png',
        desc: '대통에 사람 대변을 채워 삭힌 것. 열독·역병·식중독에 썼다.',
        reason: '살모넬라·장티푸스·기생충 등 치명적 병원체 전파 위험이 과학적으로 입증되었다. 현행 위생법상 의약품 원료로 사용이 불가하다.' },
      { name: '석청', hanja: '石靑', english: 'Azurite', img: 'asset/img/Azurite.png',
        desc: '천연 구리 탄산염 광물(남동광). 진한 청색으로 안질·정신 불안 치료에 쓰인 광물 약재.',
        reason: '구리 이온 과잉 섭취로 인한 간독성·용혈성 빈혈이 과학적으로 확인되었다. 현행 중금속 허용 기준을 초과하여 처방이 금지되었다.' },
      { name: '종유석', hanja: '鍾乳石', english: 'Stalactite', img: 'asset/img/Stalactite.png',
        desc: '석회암 동굴 천장에서 자라는 탄산칼슘 돌기. 폐를 보하고 냉증·기침을 다스리는 데 쓰였다.',
        reason: '동굴 생태계 보호법과 자연유산 보호 규정으로 채취 자체가 불법화되었다. 의약용 칼슘 보충제로 완전히 대체되었다.' },
      { name: '양진토', hanja: '梁塵土', english: 'Beam Dust', img: 'asset/img/Beam-dust.png',
        desc: '고택 대들보에 수십 년 쌓인 먼지. 간질·귀신병에 쓴 주술적 약재.',
        reason: '과학적 약효 근거가 전혀 없고, 중금속·곰팡이 독소 오염 우려가 있다. 현대 목조 건물이 희귀해져 수집 자체가 불가능하다.' },
      { name: '진육', hanja: '震肉', english: 'Lightning-Struck Animal Meat', img: 'asset/img/Lightning-struck-meat.png',
        desc: '벼락 맞아 즉사한 짐승의 고기. 경련·간질에 쓴 최희귀 약재.',
        reason: '음양론적 해석 외에 과학적 약리 기전이 전혀 없으며, 낙뢰로 즉사한 짐승을 수시로 조달하는 것 자체가 불가능하여 자연 소멸하였다.' },
      { name: '빈랑', hanja: '檳榔', english: 'Betel nut', img: 'asset/img/Betel-nut.png',
        desc: '빈랑나무의 씨앗. 기생충 구제·소화 촉진·부종에 두루 썼다.',
        reason: 'WHO가 빈랑 씨앗 저작(咀嚼)을 1군 발암물질로 지정하였다. 구강암·식도암 위험이 과학적으로 확인되어 현대 의료에서 내복 처방이 사실상 금지되었다.' },
      { name: '황정', hanja: '黃精', english: "Solomon's Seal (Polygonatum)", img: "asset/img/Solomon's-seal-rhizome.png",
        desc: '"선인반(仙人飯)"이라 불린 둥굴레속 뿌리. 오장을 편안히 하고 비위·심폐를 기른 자양 약재.',
        reason: '동의보감 《속방》에 "우리나라에서는 평안도에만 있다"고 기록될 만큼, 본래 한반도 최북부 고지대에서만 나던 약재다. 분단 이후 평안·함경 등 주요 자생지가 모두 휴전선 북쪽에 묶이면서, 남한에서는 동의보감이 가리키던 야생 황정을 구할 길이 사실상 끊겼다.' },
      { name: '극섭비승', hanja: '屐屧鼻繩', english: 'Sandal strap', img: 'asset/img/Sandal-strap.png',
        desc: '나막신·짚신 앞코에 꿴 끈. 목메임과 가슴 통증에 태워 먹었다.',
        reason: '나막신·짚신을 신지 않는 시대가 되며 약재의 재료 자체가 일상에서 사라졌다. "오래 닳은 끈일수록 좋다", "길에 버려진 왼쪽 짚신을 천리마(千里馬)라 하여 난산에 쓴다"는 식의 약리는 닮은 것이 닮은 것을 부른다는 주술적 유추일 뿐, 과학적 약효 근거가 없어 처방에서 자취를 감췄다.' }
    ];

    // 이름 → 한자 / 이름 → 약재 객체 (멤버 칩·펼침 카드용)
    var HANJA = {};
    var HERB_BY_NAME = {};
    RARE_HERBS.forEach(function (h) { HANJA[h.name] = h.hanja || ''; HERB_BY_NAME[h.name] = h; });

    /* ── 32종 중 "겹치는 사유"를 덜어낸 핵심 22종 (개별 약재 카드) ──
       카테고리별 액센트 색을 부여하고, 가로 스와이프 트랙에 흩뿌리듯 배치. */
    var CAT_COLOR = {
      mineral: ['#475569', '#1e293b'],   // 중금속·독성 광물
      water:   ['#0ea5e9', '#2563eb'],   // 사라진 물·기상
      human:   ['#e11d48', '#9f1239'],   // 인체 유래
      animal:  ['#f59e0b', '#ea580c'],   // 동물
      myth:    ['#7c3aed', '#6d28d9'],   // 주술적
      other:   ['#10b981', '#0d9488']    // 기타 광물·식물
    };
    // 핵심 22종 — 멸종위기/보호종 제외 + 중금속·환경 중복 제외하되, "이게 약이었다고?!" 싶은
    // 재미있는 약재(귀지·탯줄·대들보 먼지·우박 등) 위주로 큐레이션. 색이 몰리지 않게 교차 배열.
    var RARE_PICK = [
      ['정화수', 'water'], ['양진토', 'other'], ['밀타승', 'mineral'], ['야명사', 'animal'],
      ['황정', 'other'], ['운모', 'other'], ['빈랑', 'other'], ['천령개', 'human'],
      ['방경수', 'myth'], ['납설수', 'water'], ['인중황', 'human'], ['모구음경', 'animal'],
      ['진사', 'mineral'], ['자하거', 'human'], ['신생소아제', 'human'], ['진육', 'myth'],
      ['비상', 'mineral'], ['우박', 'water'], ['부인월수', 'human'], ['극섭비승', 'myth']
    ];
    // 흩뿌린 느낌 — 위아래 여러 방향으로 크게 엇갈리는 회전·세로 오프셋 패턴
    var ROT = [-9, 7, -5, 10, -3, 6, -11, 4];
    var DY  = [-42, 34, -20, 48, -34, 16, -50, 28];
    // z-index 변주 — 단순히 왼쪽이 아래로 깔리지 않게 겹침 순서를 섞는다
    var ZI  = [4, 9, 6, 2, 8, 3, 10, 5];
    // 이미지가 재미있는 약재는 위(앞)로 올라오도록 z 가산
    var FEATURED = { '정화수': 1, '야명사': 1, '천령개': 1, '빈랑': 1, '우박': 1, '진육': 1, '황정': 1, '극섭비승': 1 };
    // 특정 약재만 세로 오프셋을 개별 지정(슬롯 공유 DY를 덮어씀) — 음수일수록 위로
    var DY_OVERRIDE = { '방경수': -78 };

    var html = '<section class="rare-herbs-carousel-section" aria-labelledby="rare-herbs-title">';
    html += '<div class="rhc-dashboard overview-card">';
    html += '<div class="rhc-dashboard-header overview-card-header">';
    html += '<div>';
    html += '<h2 id="rare-herbs-title" class="rare-herbs-title overview-card-title">그땐 맞고 지금은 틀리다, 잘 쓰이지 않는 희귀 약재</h2>';
    html += '<p class="rhc-subtitle overview-card-subtitle">의학은 늘 시대의 언어로 쓰인다</p>';
    html += '</div>';
    html += '</div>';

    // ── 가로 스와이프 트랙 (호버/포커스 인터랙션은 CSS 만으로 처리) ──
    html += '<div class="rhc-track" id="rhc-track">';
    RARE_PICK.forEach(function (pick, i) {
      var herb = HERB_BY_NAME[pick[0]];
      if (!herb) return;
      var c = CAT_COLOR[pick[1]] || CAT_COLOR.other;
      var zBase = ZI[i % ZI.length] + (FEATURED[pick[0]] ? 30 : 0);
      var dyVal = (DY_OVERRIDE[pick[0]] != null) ? DY_OVERRIDE[pick[0]] : DY[i % DY.length];
      var styleVars = '--from:' + c[0] + ';--to:' + c[1] +
        ';--rot:' + ROT[i % ROT.length] + 'deg;--dy:' + dyVal + 'px;--z:' + zBase + ';';
      // 클릭(또는 Enter/Space)으로 떠오름 + 사라진 이유 노출 → role=button, aria-expanded
      html += '<article class="rhc-card" tabindex="0" role="button" aria-expanded="false" style="' + styleVars + '"' +
        ' aria-label="' + escapeHtml(herb.name + ' ' + (herb.hanja || '')) + '">';
      // 보이는 면: 약재 사진 + 설명 (클릭해도 그대로 보임)
      html += '<div class="rhc-card-face">';
      html += '<div class="rhc-card-photo"><img src="' + herb.img + '" alt="" loading="lazy" onerror="this.style.opacity=0"></div>';
      html += '<div class="rhc-card-info">';
      html += '<p class="rhc-card-hanja">' + escapeHtml(herb.hanja || '') +
              '<span class="rhc-card-eng">' + escapeHtml(herb.english || '') + '</span></p>';
      html += '<h3 class="rhc-card-name">' + escapeHtml(herb.name) + '</h3>';
      html += '<p class="rhc-card-desc">' + escapeHtml(herb.desc || '') + '</p>';
      html += '</div>'; // rhc-card-info
      html += '</div>'; // rhc-card-face
      // 클릭 시 오른쪽(다음 카드 자리)에 펼쳐지는 "지금 쓰이지 않는 이유" 카드
      html += '<div class="rhc-card-reason" aria-hidden="true">';
      html += '<div class="rare-popup-reason-block">';
      html += '<span class="rare-popup-reason-label">지금 쓰이지 않는 이유</span>';
      html += '<p class="rare-popup-reason">' + escapeHtml(herb.reason || '') + '</p>';
      html += '</div>';
      html += '</div>';
      html += '</article>';
    });
    // 마지막 카드 활성 시 우측 "이유" 카드가 화면 끝에 붙지 않도록 스크롤 여유 확보
    html += '<div class="rhc-track-spacer" aria-hidden="true"></div>';
    html += '</div>'; // rhc-track

    html += '</div>'; // rhc-dashboard
    html += '</section>';

    el.innerHTML = html;

    // ── 클릭하면 떠오름(+사라진 이유 노출) 인터랙션 ──────────────────
    var trackEl = document.getElementById('rhc-track');
    var cards   = Array.prototype.slice.call(trackEl.querySelectorAll('.rhc-card'));
    var activeCard = null;

    function setActive(card) {
      // 이미 떠 있는 카드를 다시 누르면 닫힘(토글), 다른 카드를 누르면 전환
      var closing = (card === activeCard);
      if (activeCard) {
        activeCard.classList.remove('is-active');
        activeCard.setAttribute('aria-expanded', 'false');
      }
      if (closing) {
        activeCard = null;
      } else {
        card.classList.add('is-active');
        card.setAttribute('aria-expanded', 'true');
        activeCard = card;
      }
      // 스페이서 폭(has-active)을 먼저 반영한 뒤 스크롤해야 마지막 카드도 가운데로 옮겨진다
      trackEl.classList.toggle('has-active', !!activeCard);
      if (activeCard) {
        // 활성 카드를 가운데로 가져와 오른쪽의 "이유 카드"가 보이도록 (페이지 세로 점프 방지)
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () { setActive(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          setActive(card);
        }
      });
    });
    // 카드 밖 클릭 / Esc 로 닫기
    document.addEventListener('click', function (e) {
      if (activeCard && !e.target.closest('.rhc-card')) setActive(activeCard);
    });
    document.addEventListener('keydown', function (e) {
      if (!activeCard) return;
      if (e.key === 'Escape') { setActive(activeCard); return; }
      // 팝업(떠오른 카드)이 열린 상태에서 좌/우 방향키로 이웃 카드로 이동
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var idx = cards.indexOf(activeCard);
        var nextIdx = (e.key === 'ArrowRight') ? idx + 1 : idx - 1;
        if (nextIdx >= 0 && nextIdx < cards.length) {
          setActive(cards[nextIdx]);
          // preventScroll: 브라우저 기본 포커스 스크롤이 setActive의 가운데 정렬과
          // 충돌해 카드가 화면 끝에 잘린 채 열리는 현상 방지
          cards[nextIdx].focus({ preventScroll: true });
        }
      }
    });
  }

  /** ══════════════════════════════════════════════════════════════
   *  멸종위기 약재 정보 아카이빙 대시보드
   *  ══════════════════════════════════════════════════════════════ */
  function renderEndangeredHerbsSection() {
    var el = document.getElementById('endangered-herbs-section');
    if (!el || el.dataset.rendered === '1') return;
    el.dataset.rendered = '1';

    /* ── 멸종위기 약재 데이터 ──
     * 출처:
     *  - 환경부 멸종위기 야생생물 종목록 고시 (야생생물 보호 및 관리에 관한 법률 시행규칙 [별표 1], 2022.12.9. 개정)
     *  - 해양수산부 해양보호생물 (해양생태계법 시행규칙 [별표 3], 2023.2.22. 개정)
     *  - 문화재청 천연기념물 (문화재보호법)
     *  - data/protected_species_korea_2023.json (449종 통합 DB)
     *  - 동의보감 탕액편 약재 데이터 (DONGUIBOGAM_HERBS) 매핑
     */
    var LEVEL_COLORS = {
      'I급': '#c0392b',       // 환경부 멸종위기 야생생물 Ⅰ급
      'II급': '#e67e22',      // 환경부 멸종위기 야생생물 Ⅱ급
      '해양보호': '#2471a3',  // 해양수산부 해양보호생물
      '천연기념물': '#7d3c98',// 문화재청 천연기념물
      '취약': '#d4a017',      // 법적 미지정·자생지 감소·채취 압력
      '관심': '#7f8c8d'       // 보전 관심 종 (자연 개체군 축소)
    };
    var LEVEL_CSS = {
      'I급': '1',
      'II급': '2',
      '해양보호': 'sea',
      '천연기념물': 'nm',
      '취약': 'vul',
      '관심': 'lc'
    };
    function levelDisplayLabel(lev) {
      if (lev === 'I급' || lev === 'II급') return '멸종위기 ' + lev;
      if (lev === '해양보호') return '해양보호생물';
      return lev;
    }

    /* herbId는 DONGUIBOGAM_HERBS의 ID — 목록탭에 존재하는 약재만 포함 (53종).
     * name/hanja는 렌더링 시 DONGUIBOGAM_HERBS에서 가져오고,
     * 여기에는 멸종위기 고유 정보(지역·좌표·위협·법적지위)만 보관한다.
     * 좌표는 시도 경계 GeoJSON(통계청 기반)과 동일한 메르카토르 투영으로 계산된 값. */
    var ENDANGERED_HERBS = [
      {
        herbId: 'ANIMAL_134',
        latin: 'Cervus nippon hortulorum',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 264, y: 79 }, { x: 322, y: 205 }],
        habitat: '백두대간 활엽수림과 산림 초지 (야생 개체군 절멸 상태)',
        usage: '보신양(補腎陽)·강근골(强筋骨), 허로·요통·신허냉증 치료',
        threat: '일제강점기 해수구제 사업과 녹용·녹혈을 노린 남획으로 야생 개체군이 절멸하였다. 현재 약용 녹용은 전량 사육 개체에서 생산된다.',
        desc: '동의보감에 "허로로 야위는 것과 사지·허리·등뼈가 쑤시고 아픈 것을 치료한다"고 기록된 대표 보양 약재 녹용(鹿茸). 기원종인 야생 대륙사슴(꽃사슴)은 한반도에서 절멸하여 멸종위기 Ⅰ급으로 지정되어 있다.'
      },
      {
        herbId: 'ANIMAL_141',
        latin: 'Panthera tigris altaica',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (한반도 절멸 · 2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 272, y: 58 }, { x: 314, y: 194 }],
        habitat: '과거 한반도 전역 대산맥 밀림지대 (현재 야생 절멸)',
        usage: '강근골(强筋骨)·거풍(祛風)·진통, 관절통·근육통·마비 치료',
        threat: '일제강점기 해수구제(害獸驅除) 사업과 과도한 포획으로 한반도에서 절멸하였다. 전 세계적으로도 야생 개체가 500마리 미만만 잔존하는 것으로 추정된다.',
        desc: '동의보감에 "근골을 강화하고 풍습을 제거한다"고 기록된 호골(虎骨). 한민족에게 민족의 상징으로 여겨지던 한국호랑이(백두산호랑이)는 20세기 초 무분별한 포획으로 한반도에서 완전히 절멸하였다. 현재 CITES 부속서 I로 국제 교역이 전면 금지되어 있다.'
      },
      {
        herbId: 'ANIMAL_142',
        latin: 'Panthera pardus orientalis',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (남한 절멸 위기 · 2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 268, y: 74 }, { x: 306, y: 214 }],
        habitat: '과거 한반도 전역의 산악 산림지대 (남한 야생 절멸 추정)',
        usage: '안오장(安五藏)·장근골(壯筋骨)·익기(益氣), 몸을 가볍게 하고 용맹하게 함',
        threat: '일제강점기 해수구제 사업과 모피·약재를 노린 남획으로 절멸하였다. 아무르표범은 전 세계 야생에 100여 마리만 잔존하는 것으로 추정되며, CITES 부속서 Ⅰ로 국제 거래가 전면 금지되어 있다.',
        desc: '동의보감에 "오장을 편안하게 하고 근골을 튼튼하게 하며 몸을 가볍게 하고 기운을 돋운다"고 기록된 표육(豹肉·표범의 고기). 한반도의 표범(아무르표범)은 호랑이와 함께 남획으로 자취를 감춰 멸종위기 Ⅰ급으로 지정되어 있다.'
      },
      {
        herbId: 'ANIMAL_151',
        latin: 'Lutra lutra',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (1998.2.19 환경부 지정) · 천연기념물 제330호 (1982.11.16 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '전남', '경남'],
        coords: [{ x: 231, y: 89 }, { x: 122, y: 400 }, { x: 222, y: 370 }],
        habitat: '수질이 맑고 먹이가 풍부한 산간 하천·강·하구',
        usage: '보허(補虛)·해열·이뇨, 허로(虛勞)·골증(骨蒸)·부종 치료',
        threat: '하천 오염과 댐·보 건설로 서식지가 단편화되었고, 과거에는 모피와 약재를 노린 남획이 이어졌다. 현재도 하천 생태계 교란이 지속되어 개체군 회복을 가로막고 있다.',
        desc: '동의보감에 "허(虛)를 보하고 열을 내린다"고 기록된 달간(獺肝). 수달의 간을 약재로 쓴다. 청정 수계의 최상위 포식자인 수달은 한국에서 멸종위기 Ⅰ급으로 지정된 희귀종이며, 강원·남해안 하천에 소수 개체군이 잔존한다.'
      },
      {
        herbId: 'ANIMAL_157',
        latin: 'Canis lupus coreanus',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (남한 절멸 · 2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 247, y: 153 }, { x: 297, y: 267 }],
        habitat: '과거 한반도 전역의 산림과 초원 (남한 야생 절멸)',
        usage: '오장(五臟) 보익, 허로 보양',
        threat: '해수구제 사업과 서식지 파괴로 남한에서는 절멸하였으며, 북한 일부 지역에 소수가 잔존하는 것으로 추정된다.',
        desc: '동의보감 탕액편 수부(獸部)에 수록된 낭육(狼肉·이리 고기). 한반도의 늑대는 20세기 중반 이후 남한에서 관찰 기록이 끊겨 절멸 상태이며, 멸종위기 Ⅰ급으로 지정되어 있다.'
      },
      {
        herbId: 'ANIMAL_150',
        latin: 'Vulpes vulpes peculiosa',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경북', '강원'],
        coords: [{ x: 268, y: 189 }, { x: 231, y: 142 }],
        habitat: '산림 가장자리와 구릉지의 굴 (소백산 복원 개체군)',
        usage: '불임·음양(陰痒)·소아 음퇴(陰㿉) 치료',
        threat: '살서제(쥐약)에 의한 2차 중독과 모피를 노린 남획으로 야생에서 사실상 절멸하였다. 현재 소백산 일대에서 복원 사업이 진행 중이다.',
        desc: '동의보감에 "여자가 아이를 낳지 못하는 것과 음부 질환에 쓴다"고 기록된 호음경(狐陰莖). 한국의 토종 여우는 1980년대 이후 야생에서 자취를 감춰 멸종위기 Ⅰ급으로 지정되었고, 소백산 일대에서 복원이 진행 중이다.'
      },
      {
        herbId: 'ANIMAL_139',
        latin: 'Naemorhedus caudatus',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (1998.2.19 환경부 지정) · 천연기념물 제217호 (1968.11.22 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 269, y: 66 }, { x: 339, y: 189 }],
        habitat: '설악산·울진 등 험준한 바위 절벽지대',
        usage: '평간식풍(平肝熄風)·안신(安神), 중풍 경련·심신불안 치료',
        threat: '밀렵과 폭설 고립, 도로 건설에 따른 서식지 단편화로 개체수가 줄어들고 있다.',
        desc: '동의보감에 "중풍으로 근육에 경련이 이는 것을 치료하고 심기를 안정시킨다"고 기록된 영양각(羚羊角). 정통 기원종은 중앙아시아의 사이가영양(CITES Ⅱ)이나 국내에서는 산양의 뿔이 대용되어 왔다. 산양은 멸종위기 Ⅰ급이자 천연기념물 제217호다.'
      },
      {
        herbId: 'ANIMAL_152',
        latin: 'Lutra lutra',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (1998.2.19 환경부 지정) · 천연기념물 제330호 (1982.11.16 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경남'],
        coords: [{ x: 222, y: 121 }, { x: 239, y: 349 }],
        habitat: '맑은 하천과 호안 수변',
        usage: '수창(水脹)·부종 치료',
        threat: '하천 정비 공사와 수질 오염으로 수변 서식지가 줄어들고 있다.',
        desc: '동의보감에 "오래된 수창(水脹)으로 거의 죽게 되었을 때 주로 쓴다"고 기록된 단육(猯肉). 본 데이터는 수달 고기로 풀이하여 멸종위기 Ⅰ급 수달과 연결하였으나, 한자 猯을 오소리로 보는 해석도 있다.'
      },
      {
        herbId: 'ANIMAL_095',
        latin: 'Myotis rufoniger',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (1998.2.19 환경부 지정) · 천연기념물 제452호 (2005.3.17 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['전남', '충북'],
        coords: [{ x: 106, y: 385 }, { x: 247, y: 189 }],
        habitat: '동굴·폐광에서 월동, 여름철 산림에서 활동',
        usage: '명목(明目)·오림(五淋) 치료, 야맹 개선',
        threat: '동굴 훼손과 폐광 입구 폐쇄로 월동지가 사라지고, 농약 사용으로 먹이가 되는 곤충이 감소하고 있다.',
        desc: '동의보감에 "눈을 밝게 하고 밤에 보면 눈에서 광채가 나게 한다"고 기록된 복익(伏翼·박쥐). 박쥐 통칭 약재로, 국내 대표 멸종위기종은 황금박쥐로 불리는 붉은박쥐(Ⅰ급·천연기념물 제452호)다.'
      },
      {
        herbId: 'MINERAL_004',
        latin: 'Cristaria plicata',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경남', '전북'],
        coords: [{ x: 272, y: 354 }, { x: 135, y: 313 }],
        habitat: '낙동강 등 큰 강 하류의 모래·진흙 바닥',
        usage: '안신(安神)·명목(明目), 정신안정·피부 재생',
        threat: '하천 준설과 수질 오염으로 대형 담수조개가 살 수 있는 서식지가 파괴되고 있다.',
        desc: '동의보감에 "마음과 정신을 안정시키고 눈을 밝게 한다"고 기록된 진주(眞珠). 담수 진주의 기원 패류인 귀이빨대칭이는 멸종위기 Ⅰ급으로 지정된 대형 민물조개다. 해산 진주조개류도 기원에 포함된다.'
      },
      {
        herbId: 'ANIMAL_039',
        latin: 'Cristaria plicata',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경남', '전북'],
        coords: [{ x: 264, y: 363 }, { x: 147, y: 318 }],
        habitat: '낙동강·금강 수계 큰 강과 저수지의 진흙 바닥',
        usage: '명목(明目)·지소갈(止消渴)·해열독(解熱毒), 부인 허로·혈붕·대하 치료',
        threat: '하천 준설과 보 건설, 수질 오염으로 대형 담수조개의 서식지가 파괴되었고, 유생이 기생하는 숙주 물고기의 감소도 번식을 가로막고 있다.',
        desc: '동의보감에 "눈을 밝게 하고 소갈을 멎게 하며 열독과 술독을 푼다"고 기록된 방합(蚌蛤). "오래된 방합은 진주를 함유한다"고 하였는데, 국내 담수산 대형 조개의 대표종인 귀이빨대칭이가 멸종위기 Ⅰ급으로 지정되어 있다.'
      },
      {
        herbId: 'ANIMAL_112',
        latin: 'Grus japonensis',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (1998.2.19 환경부 지정) · 천연기념물 제202호 (1968.5.31 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '서울·경기'],
        coords: [{ x: 185, y: 58 }, { x: 147, y: 79 }],
        habitat: '철원·연천 등 DMZ 일대 농경지와 습지 (월동)',
        usage: '기력 보강',
        threat: '월동지인 농경지가 줄고 개발 압력이 커지고 있다. 전 세계 생존 개체는 약 3,800마리 내외에 불과하다.',
        desc: '동의보감에 "고기는 기력을 돋운다"고 기록된 백학(白鶴). 두루미는 멸종위기 Ⅰ급이자 천연기념물 제202호로, 한국의 DMZ 일대가 세계 최대 월동지의 하나다.'
      },
      {
        herbId: 'ANIMAL_113',
        latin: 'Cygnus columbianus',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (2022.12.9. 환경부 고시) · 천연기념물 제201-1호 (1968.5.31 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경남', '전남'],
        coords: [{ x: 285, y: 359 }, { x: 106, y: 420 }],
        habitat: '낙동강 하구·주남저수지 등 큰 호수와 하구 (월동)',
        usage: '허로 보양, 외상 치료',
        threat: '하구 개발과 수질 오염으로 월동지가 줄어들고 있다.',
        desc: '동의보감에 수록된 천아육(天鵝肉)의 천아는 고니류를 가리킨다. 고니는 멸종위기 Ⅰ급(큰고니 Ⅱ급)이자 천연기념물 제201-1호로, 겨울철 남부 하구와 호수에서 월동한다.'
      },
      {
        herbId: 'ANIMAL_114',
        latin: 'Ciconia boyciana',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (1998.2.19 환경부 지정) · 천연기념물 제199호 (1968.5.30 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['충남', '충북'],
        coords: [{ x: 131, y: 217 }, { x: 197, y: 189 }],
        habitat: '하천·논 습지 (충남 예산 복원 개체군)',
        usage: '후비(喉痺)·주독(疰毒)·사교상(蛇咬傷) 치료',
        threat: '농약 사용과 습지 감소로 1971년 국내 텃새 개체군이 절멸하였다. 현재 예산황새공원을 중심으로 복원이 진행 중이다.',
        desc: '동의보감에 "다리뼈와 부리는 후비와 온갖 주독, 뱀이나 살무사에 물린 데 쓴다"고 기록된 관골(鸛骨). 황새는 멸종위기 Ⅰ급이자 천연기념물 제199호로, 텃새 개체군이 절멸했다가 충남 예산에서 복원되고 있다.'
      },
      {
        herbId: 'ANIMAL_107',
        latin: 'Mergus squamatus',
        level: 'I급',
        legalStatus: '멸종위기 야생생물 Ⅰ급 (1998.2.19 환경부 지정) · 천연기념물 제448호 (2005.3.17 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '전북'],
        coords: [{ x: 206, y: 68 }, { x: 189, y: 293 }],
        habitat: '자갈이 많은 맑은 강 (월동)',
        usage: '경계(驚悸) — 나쁜 것에 놀란 것을 치료',
        threat: '하천 정비와 골재 채취로 월동 하천 환경이 훼손되고 있다. 전 세계 개체수가 5천 마리 미만으로 추정된다.',
        desc: '동의보감에 "나쁜 것에 놀란 것을 치료한다"고 기록된 계칙(鸂鶒·비오리류). 비오리 통칭 약재로, 국내 도래 비오리류 가운데 호사비오리가 멸종위기 Ⅰ급이다.'
      },
      {
        herbId: 'PLANT_010',
        latin: 'Euryale ferox',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['서울·경기', '전북', '전남'],
        coords: [{ x: 181, y: 153 }, { x: 139, y: 308 }, { x: 114, y: 395 }],
        habitat: '물 깊이 0.5~1m의 수초 풍부한 연못·호수·늪',
        usage: '고신(固腎)·건비(健脾)·지사(止瀉), 유정(遺精)·대하·소화불량·설사 치료',
        threat: '서식 수계의 수질 오염과 농업용 배수로 정비, 습지 매립·개간, 수생식물 채취로 자생지가 줄어들고 있다.',
        desc: '동의보감에 "비(脾)를 건강히 하고 설사를 멎게 한다"고 기록된 검인(芡仁). 가시연밥이라고도 하며, 가시연꽃의 씨앗을 약재로 쓴다. 가시연꽃은 국내에서 멸종위기 Ⅱ급으로 지정된 수생식물로, 경기·전라 지역 일부 습지에 소수 개체군만 남아 있다.'
      },
      {
        herbId: 'PLANT_072',
        latin: 'Brasenia schreberi',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '서울·경기'],
        coords: [{ x: 276, y: 63 }, { x: 172, y: 111 }],
        habitat: '수질이 맑고 영양이 적은 산지 호수·늪 (수심 0.5~2m)',
        usage: '청위(淸胃)·이수(利水)·해열, 위열(胃熱)·구역·소변불리 치료',
        threat: '서식 수계의 부영양화와 수질 오염, 농약 유입에 더해 외래종 수초와의 경쟁으로 자생지가 줄어들고 있다.',
        desc: '동의보감에 "위(胃)를 맑게 하고 열을 내린다"고 기록된 순채(蓴菜). 연한 새순은 식용으로도 쓰인다. 맑은 호수에서 자라는 수생식물로 국내에서는 강원·경기 일부 청정 습지에만 잔존하며, 환경부 멸종위기 Ⅱ급으로 지정되어 있다.'
      },
      {
        herbId: 'PLANT_088',
        latin: 'Bupleurum latissimum',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['울릉도'],
        coords: [{ x: 470, y: 132 }],
        habitat: '울릉도 해안 근처 풀밭 및 비탈',
        usage: '화해소양(和解少陽), 한열왕래·간기울결 처방의 핵심 약재',
        threat: '울릉도라는 좁은 자생지에만 분포하여, 도서 개발과 채취 압력에 개체수가 크게 흔들린다.',
        desc: '동의보감에 "한열(寒熱)을 다스린다"고 기록된 시호(柴胡)의 한국 고유 자생 변종. 울릉도 일부 지역에만 분포하는 한국 특산종으로 자생지 보전이 시급하다.'
      },
      {
        herbId: 'PLANT_100',
        latin: 'Dendrobium moniliforme',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['전남', '경남', '제주'],
        coords: [{ x: 97, y: 451 }, { x: 264, y: 400 }, { x: 110, y: 556 }],
        habitat: '남부·도서 지역 바위 절벽 또는 노거수의 표면 착생',
        usage: '익위양음(益胃養陰), 생진지갈(生津止渴), 허열·구갈·시력 약화 치료',
        threat: '관상용 무단 채취가 끊이지 않고, 노거수와 암벽 등 착생 환경이 훼손되면서 야생 개체군이 급감하였다.',
        desc: '동의보감에 "위(胃)를 보하고 진액을 생기게 한다"고 기록된 난과 약재. 바위나 나무에 붙어 자라는 착생란으로, 남해안과 제주 일부에만 자생하며 약재·관상용으로 채취 압력이 매우 높다.'
      },
      {
        herbId: 'PLANT_271',
        latin: 'Cremastra unguiculata',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시) · 난초과 전 종 CITES 부속서 Ⅱ',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['전남', '제주'],
        coords: [{ x: 120, y: 412 }, { x: 115, y: 549 }],
        habitat: '남부지방과 제주의 습윤한 숲속 부엽토',
        usage: '옹종·누창(瘻瘡)·나력·멍울[結核] 치료, 기미 제거 (소독성 약재)',
        threat: '숲 바닥의 습한 부엽토에서만 자라는 까다로운 생육 특성에 더해, 약용·관상용 굴취가 이어져 자생 개체군이 줄어들고 있다.',
        desc: '동의보감에 "옹종·누창·나력·멍울에 주로 쓴다"고 기록된 산자고(山茨菰). 기원종인 약난초와 동속인 두잎약난초는 멸종위기 Ⅱ급으로 지정되어 있으며, 난초과 식물 전 종이 CITES 부속서 Ⅱ로 국제 거래가 규제된다.'
      },
      {
        herbId: 'PLANT_152',
        latin: 'Paeonia obovata',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['서울·경기', '강원', '전북'],
        coords: [{ x: 172, y: 100 }, { x: 272, y: 142 }, { x: 164, y: 329 }],
        habitat: '산지 낙엽수림 아래 비옥한 토양',
        usage: '양혈(養血), 유간(柔肝), 혈허로 인한 복통·월경통 치료',
        threat: '약재 채취와 산림 훼손으로 야생 개체가 급감하였고, 기후변화로 개화 시기까지 교란되고 있다.',
        desc: '동의보감에 "혈을 보하고 통증을 멎게 한다"고 기록된 핵심 약재(작약·芍藥). 사물탕(四物湯) 등 주요 처방에 쓰이며, 야생 산작약(백작약)은 환경부 멸종위기 Ⅱ급으로 지정되어 있다.'
      },
      {
        herbId: 'PLANT_155',
        latin: 'Scrophularia takesimensis',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['울릉도'],
        coords: [{ x: 473, y: 135 }],
        habitat: '울릉도 해안 절벽 및 풀밭',
        usage: '청열양혈(淸熱凉血), 자음강화(滋陰降火), 인후염·발열 치료',
        threat: '울릉도에만 자생하는 종으로, 해안 개발과 외래종 침입이 직접적인 위협이다.',
        desc: '동의보감에 "열을 식히고 진액을 보태준다"고 기록된 현삼(玄參)의 한국 고유 변종. 울릉도 해안에만 분포하는 특산종이다.'
      },
      {
        herbId: 'PLANT_263',
        latin: 'Aconitum coreanum',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '충북'],
        coords: [{ x: 239, y: 68 }, { x: 222, y: 194 }],
        habitat: '해발 700m 이상 고산 초지 및 능선부',
        usage: '거풍(祛風), 풍담(風痰)으로 인한 안면마비·경련 치료',
        threat: '고산지대의 기온 상승으로 서식 적지가 빠르게 줄고 있으며, 약재 채취 압력도 계속되고 있다.',
        desc: '동의보감에 "풍담(風痰)을 삭이고 안면을 바로잡는다"고 기록된 한국 고유종. 강원도 고산지대에 분포하나, 온난화로 아고산대가 줄어들며 자생지가 감소하고 있다.'
      },
      {
        herbId: 'PLANT_299',
        latin: 'Eleutherococcus senticosus',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 260, y: 95 }, { x: 314, y: 210 }],
        habitat: '깊은 산 계곡부의 서늘한 숲속',
        usage: '보간신(補肝腎)·강근골(强筋骨), 오로(五勞)·칠상(七傷) 보익',
        threat: '약용 수요에 따른 무분별한 채취와 산림 개발로 자생 개체군이 급감하였다.',
        desc: '동의보감에 "오로와 칠상을 보하고 정과 기를 보태주며 근골을 튼튼하게 한다"고 기록된 오가피(五加皮). 동속 자생종인 가시오갈피나무는 약용 채취 압력으로 급감하여 멸종위기 Ⅱ급으로 지정되어 있다.'
      },
      {
        herbId: 'PLANT_245',
        latin: 'Stellera chamaejasme',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['제주'],
        coords: [{ x: 126, y: 546 }],
        habitat: '제주 동부 오름의 양지바른 초지',
        usage: '적취(積聚)·징가·담음 제거 (독성 약재)',
        threat: '제주 초지 개발과 방목 감소에 따른 식생 변화로 자생지가 줄고, 관상용 굴취 피해도 이어지고 있다.',
        desc: '동의보감에 "적취·징가·현벽·담음을 깨뜨린다"고 기록된 독성 약재 낭독(狼毒). 기원종의 하나인 피뿌리풀은 국내에서는 제주 오름 일대에만 남은 멸종위기 Ⅱ급 식물이다.'
      },
      {
        herbId: 'PLANT_281',
        latin: 'Aconitum austrokoreense',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경북', '경남'],
        coords: [{ x: 239, y: 308 }, { x: 208, y: 356 }],
        habitat: '남부지방 산지 숲 가장자리의 습윤한 사면',
        usage: '거풍습(祛風濕)·진통, 풍습 마비·파상풍 치료',
        threat: '자생지가 좁은 데다 약용·관상용 채취 압력이 계속되고 있다.',
        desc: '동의보감에 "풍습으로 마비되고 아픈 것을 치료한다"고 기록된 초오(草烏)는 투구꽃속의 덩이뿌리다. 동속의 한국 특산종인 세뿔투구꽃은 멸종위기 Ⅱ급으로 지정되어 있다.'
      },
      {
        herbId: 'ANIMAL_143',
        latin: 'Prionailurus bengalensis',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '충남', '전남'],
        coords: [{ x: 239, y: 111 }, { x: 101, y: 215 }, { x: 131, y: 405 }],
        habitat: '산림 가장자리·하천변 덤불과 간척지 초지',
        usage: '귀주독기(鬼疰毒氣)·심통, 치루·악창 치료',
        threat: '로드킬과 서식지 단편화, 살서제에 의한 2차 중독이 주요 위협이다.',
        desc: '동의보감에 "명치가 아픈 데 주로 쓴다"고 기록된 리골(狸骨·살쾡이의 뼈). 삵은 호랑이·표범이 사라진 한반도에 남은 유일한 야생 고양잇과 동물로, 멸종위기 Ⅱ급이다.'
      },
      {
        herbId: 'ANIMAL_165',
        latin: 'Martes flavigula',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '전북', '경남'],
        coords: [{ x: 256, y: 142 }, { x: 193, y: 349 }, { x: 218, y: 359 }],
        habitat: '백두대간·지리산 일대의 성숙한 산림 (행동권이 매우 넓음)',
        usage: '분돈(奔豚)·산기(疝氣) 치료',
        threat: '넓은 산림에 의존해 살아가는 특성상, 산림 개발과 도로 건설로 인한 서식지 단편화가 직접적인 위협이다.',
        desc: '동의보감에 "분돈과 산기가 위로 치받쳐 죽을 것 같은 것을 치료한다"고 기록된 초서(貂鼠·노랑담비). 담비는 넓은 산림을 필요로 하는 상위 포식자로, 멸종위기 Ⅱ급이다.'
      },
      {
        herbId: 'ANIMAL_163',
        latin: 'Pteromys volans aluco',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (1998.2.19 환경부 지정) · 천연기념물 제328호 (1982.11.16 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 247, y: 89 }, { x: 314, y: 236 }],
        habitat: '노거수가 많은 침엽수·혼효림 (나무 구멍 둥지)',
        usage: '최생(催生) — 난산에 태를 내려 아기를 쉽게 낳게 함',
        threat: '노거수 벌채로 둥지로 쓸 나무와 활공 이동 경로가 줄어들고 있다.',
        desc: '동의보감에 "태를 떨어뜨려 아기를 쉽게 낳게 하는 데 쓴다"고 기록된 누서(鼺鼠·날다람쥐). 하늘다람쥐는 멸종위기 Ⅱ급이자 천연기념물 제328호다.'
      },
      {
        herbId: 'ANIMAL_055',
        latin: 'Pteromys volans aluco',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (1998.2.19 환경부 지정) · 천연기념물 제328호 (1982.11.16 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '충북'],
        coords: [{ x: 268, y: 116 }, { x: 218, y: 194 }],
        habitat: '산림의 바위틈과 나무 구멍',
        usage: '활혈정통(活血定痛), 명치 통증·월경불통 치료',
        threat: '서식지 산림 훼손과 노거수 감소로 서식 환경이 나빠지고 있다.',
        desc: '동의보감에 "명치가 시리고 아픈 데 쓰며 혈맥을 잘 통하게 한다"고 기록된 오령지(五靈脂·날다람쥐류의 말린 똥). 정통 기원종은 중국의 복서이나, 국내 근연종인 하늘다람쥐(Ⅱ급)와 연결된다.'
      },
      {
        herbId: 'ANIMAL_155',
        latin: 'Callorhinus ursinus',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시) · 해양수산부 해양보호생물 (2007년 제도 도입)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원'],
        coords: [{ x: 322, y: 121 }],
        habitat: '동해 연안 (겨울철 남하 회유), 번식지는 베링해 프리빌로프 제도',
        usage: '보신(補腎)·조양(助陽)·익정(益精), 신허로 인한 양위(陽萎)·요통·불임 치료',
        threat: '19~20세기 모피와 약재를 노린 대규모 상업적 포획으로 전 세계적으로 급감하였고, 현재도 회유 개체수가 줄어드는 추세다.',
        desc: '동의보감에 "신(腎)을 보하고 양기를 북돋운다"고 기록된 올눌제(膃肭臍, 해구신). 물개의 음경과 고환을 약재로 쓰는 것으로, 채취 과정에서 동물이 치명적 손상을 입는다. 현재 멸종위기 Ⅱ급으로 지정되어 채취·유통이 금지되어 있다.'
      },
      {
        herbId: 'ANIMAL_042',
        latin: 'Elaphe schrenckii',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['서울·경기', '강원', '전남'],
        coords: [{ x: 164, y: 121 }, { x: 231, y: 163 }, { x: 106, y: 430 }],
        habitat: '산림·농촌의 돌담과 폐가 주변',
        usage: '풍증·나병·은진(癮疹)·개선(疥癬) 치료',
        threat: '보신용 남획과 농촌 환경 변화로 서식지가 줄었으며, 로드킬 피해도 잇따르고 있다.',
        desc: '동의보감에 "열독풍과 온갖 풍, 은진, 개선을 치료한다"고 기록된 오사(烏蛇·검은 뱀). 먹구렁이로 해석할 경우 멸종위기 Ⅱ급 구렁이와 연결된다.'
      },
      {
        herbId: 'ANIMAL_096',
        latin: 'Falco peregrinus',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시) · 천연기념물 제323-7호 (1982.11.16 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['전남', '충남'],
        coords: [{ x: 72, y: 410 }, { x: 81, y: 215 }],
        habitat: '서·남해 도서의 해안 절벽 (번식)',
        usage: '흉터 제거 (외용)',
        threat: '과거 독성이 강한 농약의 영향으로 번식에 잇따라 실패했고, 해안과 섬 개발로 번식지가 위협받고 있다.',
        desc: '동의보감에 "흉터를 없애는 데 주로 쓴다"고 기록된 응시백(鷹屎白). 매는 멸종위기 Ⅱ급이자 천연기념물 제323-7호로, 서해 도서의 절벽에서 번식한다.'
      },
      {
        herbId: 'ANIMAL_127',
        latin: 'Strix aluco',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시) · 천연기념물 제324-1호 (1982.11.16 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '충북'],
        coords: [{ x: 243, y: 126 }, { x: 206, y: 210 }],
        habitat: '노거수가 많은 활엽수림 (나무 구멍 둥지)',
        usage: '야맹 개선 — 밤눈을 밝게 함',
        threat: '노거수 벌채로 둥지 자원이 줄어들고 있다.',
        desc: '동의보감에 "삼키면 밤에도 사물을 볼 수 있게 된다"고 기록된 효목(鴞目·올빼미의 눈). 올빼미는 멸종위기 Ⅱ급이자 천연기념물 제324-1호다.'
      },
      {
        herbId: 'ANIMAL_098',
        latin: 'Milvus migrans',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경남', '전남'],
        coords: [{ x: 314, y: 375 }, { x: 97, y: 415 }],
        habitat: '해안·항만 주변 (부산 일대에서 집단 월동)',
        usage: '두풍(頭風)·어지럼증·간질 치료',
        threat: '먹이 환경 변화와 농약 축적으로 급감하여, 국내 번식 개체군은 극소수만 남아 있다.',
        desc: '동의보감에 "두풍으로 어지러워 쓰러지는 것과 간질에 주로 쓴다"고 기록된 치두(鴟頭·솔개 대가리). 한때 흔한 텃새였던 솔개는 현재 멸종위기 Ⅱ급이다.'
      },
      {
        herbId: 'ANIMAL_092',
        latin: 'Anser fabalis',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['충남', '전남'],
        coords: [{ x: 97, y: 231 }, { x: 114, y: 410 }],
        habitat: '천수만·영암호 등 간척 농경지와 호수 (월동)',
        usage: '풍비(風痺)·편고(偏枯) 치료, 모발 생장',
        threat: '간척지 농경 방식의 변화와 월동지 개발 압력이 주요 위협이다.',
        desc: '동의보감에 "풍비로 힘줄이 당기는 것과 편고에 쓴다"고 기록된 안방(雁肪·기러기 기름). 기러기 통칭 약재로, 국내 월동 기러기류 가운데 큰기러기가 멸종위기 Ⅱ급이다.'
      },
      {
        herbId: 'ANIMAL_111',
        latin: 'Dryocopus martius',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시) · 천연기념물 제242호 (1973.4.12 지정)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['서울·경기', '강원'],
        coords: [{ x: 161, y: 105 }, { x: 264, y: 95 }],
        habitat: '광릉숲 등 노거수가 많은 성숙림',
        usage: '치루·충치·감닉창(疳䘌瘡) 치료',
        threat: '큰 나무에 의존해 번식하는 특성상, 성숙한 숲의 감소가 곧바로 생존 위협으로 이어진다.',
        desc: '동의보감에 "치루·아치감닉창·충치에 주로 쓴다"고 기록된 탁목조(啄木鳥·딱따구리). 딱따구리 통칭 약재로, 까막딱다구리는 Ⅱ급·천연기념물 제242호이며 동속의 크낙새는 Ⅰ급이다.'
      },
      {
        herbId: 'ANIMAL_110',
        latin: 'Numenius madagascariensis',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['충남', '전북'],
        coords: [{ x: 114, y: 282 }, { x: 114, y: 308 }],
        habitat: '서해안 갯벌 (봄·가을 이동기 중간 기착)',
        usage: '보허(補虛)',
        threat: '새만금을 비롯한 갯벌 매립으로, 먼 거리를 오가다 잠시 쉬어 가는 갯벌 쉼터가 사라지고 있다.',
        desc: '동의보감에 "허한 것을 보한다"고 기록된 휼육(鷸肉·도요새 고기). 도요류 통칭 약재로, 서해 갯벌에 기착하는 알락꼬리마도요가 멸종위기 Ⅱ급이다.'
      },
      {
        herbId: 'PLANT_153',
        latin: 'Iris dichotoma',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['서울·경기'],
        coords: [{ x: 101, y: 119 }],
        habitat: '서해 도서의 해안 초지와 바위지대',
        usage: '위열(胃熱)·황달 치료, 대소변 소통',
        threat: '도서 지역 개발과 관상용 채취 압력으로 자생지가 줄어들고 있다.',
        desc: '동의보감에 "위열에 주로 쓰며 황달을 치료한다"고 기록된 여실(蠡實·붓꽃류의 열매). 동속 자생종인 대청부채는 서해 도서에만 분포하는 멸종위기 Ⅱ급 식물이다.'
      },
      {
        herbId: 'PLANT_157',
        latin: 'Lilium dauricum',
        level: 'II급',
        legalStatus: '멸종위기 야생생물 Ⅱ급 (2022.12.9. 환경부 고시)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원'],
        coords: [{ x: 276, y: 79 }],
        habitat: '고산지대의 볕이 잘 드는 풀밭',
        usage: '상한백합병(傷寒百合病) 치료, 안신(安神), 대소변 소통',
        threat: '기후 온난화로 고산 자생지가 줄어들고 있으며, 관상용 채취 피해도 계속되고 있다.',
        desc: '동의보감에 "상한백합병을 치료하고 대소변을 잘 나오게 한다"고 기록된 백합(百合·나리류의 비늘줄기). 동속 자생종인 날개하늘나리는 고산에만 남은 멸종위기 Ⅱ급 식물이다.'
      },
      {
        herbId: 'ANIMAL_027',
        latin: 'Neophocaena asiaeorientalis',
        level: '해양보호',
        legalStatus: '해양수산부 해양보호생물 (2016.9. 지정, 현행 고시 2023.2.22.)',
        source: 'protected_species_korea_2023 · 해양수산부',
        regions: ['충남', '전남'],
        coords: [{ x: 81, y: 257 }, { x: 81, y: 441 }],
        habitat: '서·남해 연안의 얕은 바다',
        usage: '고독(蠱毒)·장학(瘴瘧) 치료',
        threat: '고기잡이 그물에 우연히 함께 걸려 해마다 많은 수가 죽고, 연안 개발과 물속 소음도 위협이 되고 있다.',
        desc: '동의보감에 수록된 해돈(海㹠)은 우리나라 토종 쇠돌고래인 상괭이로 본다. 웃는 돌고래로 불리는 상괭이는 고기잡이 그물에 걸려 죽는 일이 많아 크게 줄어, 해양보호생물로 지정되었다.'
      },
      {
        herbId: 'MINERAL_003',
        latin: 'Dendrophyllia cribrosa',
        level: '해양보호',
        legalStatus: '해양수산부 해양보호생물 (2023.2.22. 고시) · 환경부 멸종위기 야생생물 Ⅱ급 · 천연기념물 제456·457호 · CITES 부속서 Ⅱ',
        source: 'protected_species_korea_2023 · 해양수산부 환경부',
        regions: ['제주', '경남'],
        coords: [{ x: 112, y: 560 }, { x: 289, y: 390 }],
        habitat: '제주와 남해안의 깨끗한 암반 조하대 (조류가 빠른 수중 절벽)',
        usage: '진심지경(鎭心止驚)·명목(明目), 예막(瞖膜) 제거·코피 멎음',
        threat: '수온 상승과 연안 오염으로 군락이 백화·쇠퇴하고, 성장이 매우 느려 한 번 훼손되면 회복에 수십 년이 걸린다. 관상·장식용 채취도 계속 위협이 되고 있다.',
        desc: '동의보감에 "마음을 진정시키고 놀람을 멎게 하며 눈을 밝게 한다"고 기록된 산호(珊瑚). 국내 바다의 유착나무돌산호·해송 등 보호 산호류 19종이 해양보호생물·멸종위기 Ⅱ급·천연기념물로 지정되어 있고, 산호류는 CITES로 국제 거래가 규제된다.'
      },
      {
        herbId: 'ANIMAL_006',
        latin: 'Rhincodon typus',
        level: '해양보호',
        legalStatus: '해양수산부 해양보호생물 (2023.2.22. 고시) · CITES 부속서 Ⅱ · IUCN 위기(EN)',
        source: 'protected_species_korea_2023 · 해양수산부',
        regions: ['제주', '경남'],
        coords: [{ x: 99, y: 562 }, { x: 300, y: 398 }],
        habitat: '제주·남해의 따뜻한 바다 (여름철 회유)',
        usage: '귀주(鬼疰)·고독(蠱毒)·토혈, 물고기 식중독 치료',
        threat: '지느러미와 가죽을 노린 남획과 혼획으로 전 세계 상어 개체수가 급감하였다. 고래상어는 IUCN 위기(EN), 홍살귀상어는 심각한 위기(CR) 등급이다.',
        desc: '동의보감에 "귀주·고독·토혈과 물고기를 먹고 중독된 것에 주로 쓴다"고 기록된 교어피(鮫魚皮·상어 가죽). 상어 통칭 약재로, 국내 해역의 고래상어와 홍살귀상어가 해양보호생물로 지정되어 있다.'
      },
      {
        herbId: 'ANIMAL_108',
        latin: 'Aix galericulata',
        level: '천연기념물',
        legalStatus: '천연기념물 제327호 (1982.11.16 문화재청 지정)',
        source: 'protected_species_korea_2023 · 문화재청',
        regions: ['서울·경기', '강원'],
        coords: [{ x: 172, y: 116 }, { x: 247, y: 111 }],
        habitat: '산간 계류와 숲속 (나무 구멍 둥지)',
        usage: '제루(諸瘻)·개선(疥癬) 치료',
        threat: '계류 환경 훼손과 둥지목이 되는 노거수의 감소가 주요 위협이다.',
        desc: '동의보감에 "제루·개선에 주로 쓴다"고 기록된 원앙(鴛鴦). 부부 금슬의 상징인 원앙은 천연기념물 제327호로 보호받는다.'
      },
      {
        herbId: 'ANIMAL_126',
        latin: 'Cuculus poliocephalus',
        level: '천연기념물',
        legalStatus: '천연기념물 제447호 (2005.3.17 문화재청 지정)',
        source: 'protected_species_korea_2023 · 문화재청',
        regions: ['제주', '전남'],
        coords: [{ x: 106, y: 551 }, { x: 139, y: 400 }],
        habitat: '남부지방 숲 (여름철새, 휘파람새 둥지에 알을 맡겨 키움)',
        usage: '동의보감 금부(禽部) 자규(子規) 항목 수록',
        threat: '다른 새의 둥지에 알을 맡겨 새끼를 키우는데, 알을 맡길 새들이 줄고 숲 환경도 달라지면서 번식이 어려워지고 있다.',
        desc: '동의보감에 자규(子規)로 기록된 두견이. 소쩍새와 함께 한국 문학에 자주 등장하는 새로, 두견은 천연기념물 제447호로 지정된 여름철새다.'
      },
      {
        herbId: 'ANIMAL_085',
        latin: 'Gallus gallus domesticus',
        level: '천연기념물',
        legalStatus: '천연기념물 제265호 (1980.4.1 문화재청 지정)',
        source: 'protected_species_korea_2023 · 문화재청',
        regions: ['충남'],
        coords: [{ x: 156, y: 267 }],
        habitat: '충남 논산 연산 화악리 (토종 사육 품종)',
        usage: '심통·복통 치료, 허로 보익, 안태(安胎)',
        threat: '단일 사육지에 의존하고 있어 질병 등 돌발 위험에 취약하며, 토종 혈통 보존이 과제로 남아 있다.',
        desc: '동의보감에 "심통과 복통에 주로 쓰며 허하고 여윈 것을 보한다"고 기록된 오웅계육(烏雄雞肉·검은 수탉의 고기). 뼈와 살이 검은 연산 화악리의 오계는 천연기념물 제265호로 지정된 토종 품종이다.'
      },
      {
        herbId: 'ANIMAL_007',
        latin: 'Siniperca scherzeri',
        level: '천연기념물',
        legalStatus: '천연기념물 제190호 (1967.7.18 문화재청 지정)',
        source: 'protected_species_korea_2023 · 문화재청',
        regions: ['서울·경기'],
        coords: [{ x: 181, y: 126 }],
        habitat: '한강 중상류의 바위가 많은 맑은 물',
        usage: '허로·비위(脾胃) 보익, 장풍(腸風) 출혈 치료',
        threat: '하천 오염과 남획이 위협 요인이다. 황금색 변이 개체는 극히 드물게만 나타난다.',
        desc: '동의보감에 "허로를 보하고 비위를 보한다"고 기록된 궐어(鱖魚·쏘가리). 쏘가리의 황금색 변이인 한강의 황쏘가리는 천연기념물 제190호로 지정되어 있다.'
      },
      {
        herbId: 'PLANT_080',
        latin: 'Panax ginseng (wild)',
        level: '취약',
        legalStatus: '법정 미지정 (야생 개체 사실상 절멸) · 국가생물적색목록 평가종 (국립생물자원관, 2021)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '경북'],
        coords: [{ x: 264, y: 89 }, { x: 306, y: 226 }],
        habitat: '해발 400~1,200m 깊은 산 활엽수림',
        usage: '대보원기(大補元氣), 기력보강의 최상 약재',
        threat: '과도한 채취와 산림 개발로 야생 개체수가 급감하였고, 기후 온난화로 적정 서식 고도가 계속 높아지고 있다.',
        desc: '동의보감 탕액편에서 "보기(補氣)의 으뜸"으로 기록된 약재(인삼·人參). 재배 인삼과 달리 야생 산삼은 수십 년 이상 자라야 약효가 발현된다. 현재 자연 상태의 산삼은 거의 발견되지 않는다.'
      },
      {
        herbId: 'PLANT_161',
        latin: 'Epimedium koreanum',
        level: '취약',
        legalStatus: '법정 미지정 (자생 개체군 고립·축소) · 국가생물적색목록 평가종 (국립생물자원관, 2021)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '경북', '충북'],
        coords: [{ x: 247, y: 121 }, { x: 314, y: 215 }, { x: 206, y: 205 }],
        habitat: '산지 낙엽수림 하부 반그늘 환경',
        usage: '보양(補陽), 강근골(强筋骨), 신허요통·관절통 치료',
        threat: '숲이 도로·개발로 잘게 끊기고 다른 용도로 바뀌면서, 무리가 고립되고 줄어들고 있다.',
        desc: '동의보감에 "음위(陰萎)를 다스리고 근골을 튼튼히 한다"고 기록된 약재. 음양곽(淫羊藿)이라고도 한다. 줄기 하나에 잎이 9장 달리는 특이한 형태로, 한국 고유종이다.'
      },
      {
        herbId: 'PLANT_184',
        latin: 'Gastrodia elata',
        level: '취약',
        legalStatus: '법정 미지정 (공생 균류 생태계 교란) · 국가생물적색목록 평가종 (국립생물자원관, 2021)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '경북', '전남'],
        coords: [{ x: 256, y: 132 }, { x: 289, y: 257 }, { x: 147, y: 390 }],
        habitat: '참나무류 숲 속 뽕나무버섯균과 공생',
        usage: '평간식풍(平肝息風), 두통·어지럼증·경련 치료',
        threat: '함께 어울려 사는 땅속 곰팡이(균류) 환경이 망가지고, 마구잡이로 캐 가는 것이 주요 위협이다.',
        desc: '동의보감에 "풍을 다스리는 신약(神藥)"이라 불린 약재. 엽록소가 없어 버섯 균사와 공생하는 독특한 식물로, 생태 조건이 까다로워 기후변화에 취약하다.'
      },
      {
        herbId: 'PLANT_221',
        latin: 'Scopolia japonica',
        level: '취약',
        legalStatus: '법정 미지정 (자생지 협소·생태 변화) · 국가생물적색목록 평가종 (국립생물자원관, 2021)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '울릉도'],
        coords: [{ x: 281, y: 79 }, { x: 467, y: 129 }],
        habitat: '깊은 산 계곡부 습윤한 부엽토',
        usage: '진통·진경, 위경련·천식 완화 (아트로핀 함유)',
        threat: '계곡 생태계의 변화로 자생지가 좁아지고 개체수가 줄어들고 있다.',
        desc: '독성 알칼로이드를 함유해 "미치광이"라 이름 붙은 약재. 동의보감에 "낭탕(莨菪)"으로 기록되며, 적량 사용 시 경련·통증을 다스린다. 울릉도와 강원 심산에만 자생.'
      },
      {
        herbId: 'PLANT_250',
        latin: 'Pulsatilla koreana',
        level: '취약',
        legalStatus: '법정 미지정 (초지 감소·서식지 도시화) · 국가생물적색목록 평가종 (국립생물자원관, 2021)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['서울·경기', '충남', '전북'],
        coords: [{ x: 147, y: 153 }, { x: 122, y: 236 }, { x: 156, y: 308 }],
        habitat: '양지바른 풀밭, 산기슭 건조한 초지',
        usage: '청열해독(淸熱解毒), 이질·혈리(血痢) 치료',
        threat: '초지 감소와 도시화로 서식지가 사라지고 있으며, 제초제 사용의 영향도 받고 있다.',
        desc: '동의보감에 "열독(熱毒)을 풀고 이질을 멎게 한다"고 기록된 약재. 흰 털이 난 열매가 할머니 흰머리를 닮아 한자명 "백두옹(白頭翁)"이라 불린다.'
      },
      {
        herbId: 'PLANT_291',
        latin: 'Platycladus orientalis',
        level: '관심',
        legalStatus: '법정 미지정 (석회암 지대 개발) · 국가생물적색목록 평가종 (국립생물자원관, 2021)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['충북', '경북'],
        coords: [{ x: 256, y: 186 }, { x: 281, y: 231 }],
        habitat: '석회암 지대 바위틈',
        usage: '양혈지혈(凉血止血), 출혈·토혈·탈모 치료',
        threat: '석회암 지대 개발로 자연 개체군이 줄어들고 있다.',
        desc: '동의보감에 "피를 서늘하게 하여 출혈을 멎게 한다"고 기록된 약재. 야생 측백나무는 충북·경북 석회암 지대에 제한 분포하며, 자연 개체수가 줄어들고 있다.'
      }
    ];

    /* ── 대한민국 시도 경계 (통계청 행정구역 GeoJSON, 메르카토르 투영·단순화) ── */
    var PROVINCES = [
      { id: 'seoul', name: '서울·경기', labelX: 155.0, labelY: 123.6,
        d: 'M114.8,151.9 L111.7,154.9 L114.9,156.7 L118.1,162.2 L112.9,161.1 L109.5,162.6 L111.1,157.4 L109.9,154.9 L114.8,151.9Z M209.8,161.6 L204.7,170.1 L200.6,169.5 L200.1,174.1 L194.7,177.6 L194.7,179.3 L190.5,178.1 L185.6,179.6 L185.6,182.0 L180.3,184.4 L181.0,187.6 L173.2,191.6 L171.6,195.3 L164.3,189.2 L156.9,187.1 L153.6,190.6 L147.1,190.9 L139.9,194.1 L139.5,191.9 L136.2,191.2 L129.9,181.2 L126.7,181.1 L127.4,172.7 L131.2,168.4 L130.0,165.9 L126.4,166.9 L121.5,172.1 L119.2,167.3 L120.6,160.8 L119.5,159.5 L121.4,156.7 L129.9,158.7 L130.0,156.3 L133.0,154.0 L124.6,152.6 L121.5,147.7 L129.0,137.0 L126.0,133.3 L128.1,126.2 L132.7,127.6 L132.7,134.4 L136.5,132.5 L139.4,138.8 L141.3,137.3 L144.4,138.0 L147.8,135.3 L150.5,136.4 L151.8,139.4 L159.7,134.3 L160.9,131.8 L159.1,131.0 L162.6,125.5 L162.0,123.5 L155.9,125.5 L157.3,120.9 L154.3,111.2 L151.7,112.1 L148.8,110.7 L146.2,117.4 L143.1,115.1 L140.2,116.7 L139.3,121.9 L135.1,123.9 L131.3,121.0 L130.3,123.3 L124.6,122.2 L118.9,117.3 L116.5,120.6 L111.9,122.6 L108.2,115.8 L107.0,103.8 L114.9,105.2 L119.3,101.3 L120.3,97.0 L119.2,96.2 L121.8,93.2 L120.1,91.1 L120.2,83.9 L123.7,85.5 L126.2,84.3 L125.8,82.1 L133.3,79.9 L133.5,75.6 L136.9,77.2 L138.6,73.7 L138.6,71.3 L135.0,69.1 L133.1,70.9 L130.5,70.5 L126.5,65.6 L133.0,58.2 L136.9,55.5 L138.8,57.5 L143.5,56.9 L144.6,58.2 L146.1,56.7 L145.4,54.4 L156.6,48.2 L156.7,53.5 L161.0,54.6 L163.3,62.2 L166.1,63.6 L170.1,59.9 L171.6,60.4 L171.1,66.8 L173.4,66.9 L174.2,69.1 L183.4,67.0 L185.6,77.4 L192.4,79.1 L192.8,82.5 L197.7,83.9 L199.0,89.0 L197.6,92.4 L191.9,95.9 L191.3,97.8 L190.9,101.2 L192.9,104.5 L189.8,107.6 L194.3,108.6 L192.2,116.8 L194.1,118.4 L197.7,115.9 L206.5,122.8 L213.5,122.9 L218.3,126.3 L212.0,131.2 L214.5,139.3 L210.8,145.8 L211.5,152.0 L209.8,161.6Z M73.1,155.7 L77.5,159.6 L76.0,161.8 L73.9,162.3 L71.8,160.2 L73.1,155.7Z M103.4,154.1 L106.0,157.2 L102.3,160.6 L100.1,159.7 L100.6,155.7 L103.4,154.1Z M98.5,141.2 L100.9,143.9 L98.6,145.9 L98.5,141.2Z M112.4,131.7 L112.9,132.9 L106.4,135.4 L101.0,140.2 L93.8,135.3 L100.2,131.4 L104.4,131.4 L105.7,128.5 L112.4,131.7Z M130.3,123.3 L126.2,130.4 L126.0,133.3 L129.0,137.0 L128.2,139.5 L119.2,148.3 L115.6,148.3 L113.6,135.7 L114.7,126.2 L111.9,122.6 L116.5,120.6 L118.9,117.3 L124.6,122.2 L130.3,123.3Z M91.5,105.6 L90.9,109.1 L95.1,111.3 L95.5,114.2 L91.2,117.0 L90.6,112.7 L86.6,109.9 L88.2,106.2 L91.5,105.6Z M86.3,98.6 L92.1,100.4 L90.6,103.0 L83.1,105.2 L81.4,103.6 L82.8,99.7 L86.3,98.6Z M108.0,106.8 L109.8,120.8 L107.2,123.5 L95.6,120.3 L95.2,117.9 L97.9,116.0 L96.4,111.8 L92.8,108.7 L93.2,101.1 L97.0,97.6 L100.5,97.0 L106.5,102.0 L108.0,106.8Z M128.1,126.2 L131.3,121.0 L135.1,123.9 L137.1,123.5 L139.3,121.9 L140.2,116.7 L143.1,115.1 L145.4,118.0 L148.8,110.7 L155.4,112.0 L157.3,120.9 L155.9,125.5 L162.0,123.5 L162.6,125.5 L159.1,131.0 L160.9,131.8 L159.7,134.3 L151.8,139.4 L150.5,136.4 L147.8,135.3 L144.4,138.0 L141.3,137.3 L139.4,138.8 L136.5,132.5 L132.7,134.4 L132.7,127.6 L128.1,126.2Z' },
      { id: 'gangwon', name: '강원', labelX: 300.0, labelY: 125.0,
        d: 'M344.5,168.9 L336.8,172.0 L332.9,176.5 L333.5,179.5 L330.4,179.9 L322.1,173.7 L319.5,177.1 L307.7,174.6 L305.5,179.5 L301.4,178.8 L299.7,176.0 L296.2,175.0 L293.5,178.2 L293.5,181.2 L275.6,174.8 L273.5,172.3 L266.1,172.5 L263.9,170.8 L264.2,168.9 L258.9,167.7 L255.2,169.8 L252.9,167.4 L258.6,161.7 L253.2,162.5 L247.5,158.2 L245.2,161.3 L241.2,161.1 L234.1,164.5 L232.4,158.7 L229.6,157.2 L224.2,160.6 L225.5,164.5 L222.6,168.3 L220.2,167.0 L213.2,169.1 L209.5,162.2 L211.5,152.0 L210.8,145.8 L214.5,139.3 L212.0,131.2 L218.3,126.3 L213.5,122.9 L206.5,122.8 L197.7,115.9 L194.1,118.4 L192.2,116.8 L194.3,108.6 L189.8,107.6 L192.9,104.5 L190.9,101.2 L191.3,97.8 L191.9,95.9 L197.6,92.4 L198.6,85.6 L192.8,82.5 L192.4,79.1 L185.6,77.4 L183.4,67.0 L174.2,69.1 L173.4,66.9 L171.1,66.8 L171.6,60.4 L170.1,59.9 L166.1,63.6 L163.3,62.2 L161.0,54.6 L156.7,53.5 L156.6,48.2 L160.8,43.7 L162.7,45.6 L167.8,43.3 L173.4,45.6 L179.8,43.1 L189.9,47.0 L196.5,43.1 L200.7,44.3 L212.3,41.7 L214.3,44.7 L221.2,42.7 L236.1,45.9 L248.8,38.6 L254.3,33.0 L256.7,16.3 L260.1,14.0 L269.8,31.3 L269.0,33.6 L276.7,45.9 L281.6,63.2 L304.1,97.2 L318.8,113.4 L317.8,116.8 L323.9,123.8 L324.3,129.7 L343.9,159.6 L342.5,163.9 L344.5,168.9Z' },
      { id: 'chungbuk', name: '충북', labelX: 234.0, labelY: 227.0,
        d: 'M285.2,177.4 L283.3,180.1 L279.5,179.6 L276.2,185.0 L267.6,191.7 L266.2,197.1 L268.2,199.9 L265.9,203.8 L261.4,205.0 L257.6,203.5 L251.0,197.5 L250.3,200.1 L248.6,200.0 L249.0,203.5 L242.4,201.5 L239.7,204.4 L235.7,203.4 L233.5,210.5 L236.7,214.7 L232.7,212.7 L229.7,213.6 L227.6,211.6 L225.1,216.1 L221.4,216.3 L225.2,219.1 L225.1,224.0 L221.6,222.8 L220.3,220.1 L218.3,224.5 L213.9,226.7 L219.3,229.1 L223.0,235.4 L220.2,242.7 L221.7,251.0 L217.6,255.9 L218.4,259.4 L220.8,259.5 L221.8,257.7 L228.1,262.0 L231.7,259.8 L234.7,261.4 L233.3,263.1 L235.2,267.1 L229.6,267.2 L230.4,272.1 L228.0,275.7 L227.6,280.8 L220.6,285.5 L218.6,283.8 L213.1,286.4 L206.3,284.4 L204.5,281.5 L202.4,283.8 L196.7,274.1 L197.3,265.4 L191.7,262.2 L188.5,263.3 L188.0,261.1 L191.2,247.9 L193.7,246.7 L192.7,244.4 L189.4,245.7 L188.2,243.2 L189.4,241.4 L181.0,240.8 L181.0,231.9 L173.2,227.5 L170.7,222.2 L173.1,217.3 L171.3,216.4 L175.9,212.1 L175.5,210.0 L181.8,209.5 L181.0,205.5 L173.0,198.5 L171.6,195.3 L173.2,191.6 L181.0,187.6 L180.3,184.4 L185.6,182.0 L185.6,179.6 L190.5,178.1 L194.7,179.3 L194.7,177.6 L200.1,174.1 L200.6,169.5 L204.7,170.1 L209.8,161.6 L210.3,165.8 L213.2,169.1 L220.2,167.0 L222.6,168.3 L225.5,164.5 L224.2,160.6 L229.6,157.2 L232.4,158.7 L234.1,164.5 L241.2,161.1 L245.2,161.3 L247.5,158.2 L253.2,162.5 L257.1,160.8 L258.6,161.7 L258.0,163.6 L253.8,166.2 L253.6,168.8 L255.2,169.8 L258.9,167.7 L264.2,168.9 L263.9,170.8 L266.1,172.5 L271.4,171.6 L275.6,174.8 L285.2,177.4Z' },
      { id: 'chungnam', name: '충남', labelX: 144.0, labelY: 250.0,
        d: 'M100.2,248.0 L102.4,251.3 L96.3,248.5 L100.2,248.0Z M94.2,224.5 L97.4,227.7 L97.2,234.2 L100.4,244.6 L99.0,246.0 L95.0,245.5 L91.3,239.5 L90.0,227.4 L94.2,224.5Z M139.9,194.1 L147.1,190.9 L153.6,190.6 L156.9,187.1 L159.5,187.2 L170.0,193.2 L173.2,196.2 L173.0,198.5 L175.5,199.3 L175.3,201.8 L181.0,205.5 L181.8,209.5 L175.5,210.0 L175.9,212.1 L171.3,216.4 L161.1,211.9 L158.7,214.7 L161.2,217.7 L160.4,225.2 L163.6,227.8 L161.7,235.0 L164.3,242.2 L169.0,245.7 L171.0,245.0 L168.3,258.6 L175.9,268.4 L178.5,259.8 L181.5,265.9 L184.4,267.8 L186.4,264.8 L191.7,262.2 L197.3,265.4 L196.7,274.1 L200.6,280.8 L199.0,287.1 L192.3,284.5 L191.9,288.7 L185.5,289.5 L183.0,285.1 L180.9,287.0 L178.7,284.3 L175.7,274.4 L168.4,276.2 L168.0,278.1 L158.9,278.9 L158.6,280.7 L152.6,278.2 L151.6,273.2 L143.9,271.7 L138.5,273.3 L136.1,281.6 L126.5,285.4 L125.4,287.8 L119.2,286.7 L119.8,284.6 L116.8,282.1 L116.9,278.3 L112.2,273.6 L110.8,274.5 L106.9,272.2 L109.4,267.5 L108.3,263.2 L109.7,260.7 L106.1,254.3 L110.1,251.9 L104.2,248.3 L105.6,243.8 L104.5,234.6 L101.4,227.3 L103.8,225.2 L102.2,223.1 L102.6,219.1 L101.0,218.9 L99.5,225.8 L94.5,223.0 L94.2,218.6 L92.5,218.7 L93.8,223.1 L88.5,227.5 L87.9,219.2 L86.1,218.1 L86.7,212.8 L80.6,218.1 L75.0,218.7 L76.3,215.0 L78.4,213.5 L81.5,214.8 L82.6,213.2 L77.9,209.5 L75.5,213.5 L72.6,207.8 L76.0,206.2 L77.4,202.3 L76.3,200.9 L80.3,199.9 L81.5,194.6 L84.9,193.4 L82.6,196.6 L84.3,198.4 L86.6,196.3 L88.6,191.5 L87.8,187.9 L89.9,186.9 L89.3,192.3 L90.9,195.4 L88.7,200.6 L90.6,201.0 L87.6,203.2 L92.3,203.2 L91.2,199.2 L94.4,199.7 L94.5,197.0 L98.3,193.8 L95.9,190.0 L92.0,188.4 L91.3,184.9 L99.6,182.6 L104.0,187.5 L104.7,186.0 L101.9,181.5 L105.7,177.4 L117.4,184.4 L122.9,184.2 L129.2,186.6 L133.5,198.6 L140.1,195.6 L139.9,194.1Z M171.3,216.4 L173.1,217.3 L170.7,222.2 L173.2,227.5 L181.0,231.9 L181.4,236.7 L177.4,237.7 L174.7,244.3 L169.0,245.7 L164.3,242.2 L161.7,235.0 L163.6,227.8 L160.4,225.2 L161.2,217.7 L158.7,214.7 L161.1,211.9 L171.3,216.4Z M188.5,263.3 L184.4,267.8 L181.5,265.9 L178.5,259.8 L175.9,268.4 L168.3,258.6 L171.0,245.0 L174.7,244.3 L179.2,236.2 L181.2,237.9 L181.0,240.8 L189.4,241.4 L188.2,243.2 L189.4,245.7 L192.7,244.4 L193.7,246.7 L191.2,247.9 L189.2,253.5 L188.5,263.3Z' },
      { id: 'gyeongbuk', name: '경북', labelX: 302.0, labelY: 278.0,
        d: 'M351.6,323.7 L343.6,320.8 L339.4,324.0 L335.8,323.4 L335.3,318.5 L326.3,316.2 L319.9,320.7 L320.3,324.8 L318.1,323.8 L312.6,328.2 L306.8,325.1 L301.9,329.3 L297.5,330.2 L296.4,332.4 L285.6,329.2 L279.5,330.4 L275.5,326.5 L274.7,320.5 L276.1,316.7 L279.1,314.7 L282.2,314.9 L282.7,318.3 L287.7,316.5 L287.7,309.5 L290.5,307.8 L289.9,305.7 L294.4,299.8 L292.3,295.2 L293.0,290.9 L291.3,287.4 L288.4,286.3 L282.3,287.2 L277.2,290.9 L274.7,290.3 L275.4,294.1 L271.9,298.5 L269.7,297.5 L270.4,294.4 L265.6,296.0 L263.3,303.2 L270.6,305.6 L269.9,307.6 L265.8,307.5 L263.0,312.2 L266.8,316.1 L266.9,318.4 L260.1,318.4 L264.4,324.6 L262.9,327.7 L260.4,324.6 L256.3,323.3 L252.6,324.6 L251.1,323.2 L250.4,324.8 L244.4,323.5 L244.5,321.4 L247.6,320.3 L247.6,316.4 L243.5,309.9 L241.5,309.5 L241.1,306.1 L236.7,304.2 L231.8,305.5 L229.6,302.5 L225.2,302.7 L223.8,299.0 L221.2,298.9 L221.0,295.3 L223.2,293.9 L220.6,285.5 L227.6,280.8 L228.0,275.7 L230.4,272.1 L229.6,267.2 L235.2,267.1 L233.3,263.1 L234.7,261.4 L231.7,259.8 L228.1,262.0 L221.8,257.7 L220.8,259.5 L218.4,259.4 L217.6,255.9 L221.7,251.0 L220.2,242.7 L223.0,235.4 L219.3,229.1 L213.9,226.7 L218.3,224.5 L220.3,220.1 L221.6,222.8 L225.1,224.0 L225.2,219.1 L221.4,216.3 L225.1,216.1 L227.6,211.6 L229.7,213.6 L232.7,212.7 L236.7,214.7 L233.5,210.5 L235.7,203.4 L239.7,204.4 L242.4,201.5 L249.0,203.5 L248.6,200.0 L250.3,200.1 L251.0,197.5 L257.6,203.5 L261.4,205.0 L265.9,203.8 L268.2,199.9 L266.2,197.1 L267.6,191.7 L276.2,185.0 L279.5,179.6 L283.3,180.1 L285.2,177.4 L293.5,181.2 L293.5,178.2 L296.2,175.0 L299.7,176.0 L301.4,178.8 L305.5,179.5 L307.7,174.6 L319.5,177.1 L322.1,173.7 L330.4,179.9 L333.5,179.5 L332.9,176.5 L336.8,172.0 L344.5,168.9 L345.8,173.7 L349.7,177.5 L348.3,181.7 L348.8,195.8 L354.0,208.4 L353.8,215.6 L348.5,223.5 L351.4,235.9 L350.5,243.6 L345.8,253.5 L345.4,258.1 L345.6,268.3 L347.3,273.9 L350.8,277.5 L345.5,282.7 L351.8,288.7 L359.7,279.1 L361.6,279.9 L362.7,285.8 L357.4,295.4 L358.1,301.9 L351.6,323.7Z M274.7,320.5 L272.9,324.9 L268.0,325.0 L261.7,327.8 L264.4,324.6 L260.1,318.4 L266.9,318.4 L266.8,316.1 L263.0,312.2 L265.8,307.5 L269.9,307.6 L270.6,305.6 L263.3,303.2 L265.6,296.0 L270.4,294.4 L269.7,297.5 L271.9,298.5 L275.4,294.1 L274.7,290.3 L280.0,290.0 L282.3,287.2 L291.3,287.4 L294.4,299.8 L289.9,305.7 L290.5,307.8 L287.7,309.5 L288.4,315.4 L282.7,318.3 L282.2,314.9 L279.1,314.7 L276.1,316.7 L274.7,320.5Z' },
      { id: 'jeonbuk', name: '전북', labelX: 168.0, labelY: 302.0,
        d: 'M200.6,280.8 L202.4,283.8 L204.5,281.5 L206.3,284.4 L213.1,286.4 L218.6,283.8 L223.2,293.9 L217.6,301.6 L209.6,304.0 L207.4,308.7 L202.6,312.7 L202.6,317.7 L199.2,324.6 L199.8,327.1 L196.4,332.5 L201.9,340.7 L200.4,343.0 L203.1,344.5 L202.6,347.7 L198.3,352.9 L199.2,356.3 L196.8,358.5 L186.8,352.8 L183.4,353.6 L179.5,359.3 L177.1,357.5 L172.9,359.3 L169.2,358.4 L166.0,355.9 L165.4,358.0 L161.5,356.3 L157.1,359.7 L151.4,357.8 L153.3,352.9 L150.0,350.5 L151.5,346.2 L150.4,342.7 L145.0,346.6 L145.6,349.1 L141.9,349.9 L139.5,345.2 L133.0,340.6 L126.5,344.3 L125.1,351.8 L122.4,354.6 L119.7,354.4 L117.9,357.6 L114.5,356.0 L112.6,357.1 L113.5,359.1 L108.4,358.9 L107.5,354.5 L104.3,350.9 L104.9,348.3 L99.9,345.5 L104.4,337.2 L114.4,334.8 L115.6,332.0 L119.5,333.6 L120.1,330.9 L117.2,329.6 L105.1,330.4 L102.9,325.5 L114.3,316.7 L116.4,313.7 L116.0,309.6 L122.4,308.5 L128.3,310.7 L128.9,308.3 L121.8,303.1 L129.8,301.8 L130.9,298.8 L115.4,299.6 L115.4,293.8 L108.2,294.0 L107.6,290.8 L124.6,288.4 L126.5,285.4 L136.1,281.6 L138.5,273.3 L143.9,271.7 L151.6,273.2 L152.6,278.2 L158.6,280.7 L158.9,278.9 L168.0,278.1 L168.4,276.2 L175.7,274.4 L178.7,284.3 L180.9,287.0 L183.0,285.1 L185.5,289.5 L188.1,290.1 L191.9,288.7 L192.3,284.5 L199.0,287.1 L200.6,280.8Z' },
      { id: 'gyeongnam', name: '경남', labelX: 257.4, labelY: 359.3,
        d: 'M271.1,408.9 L273.2,413.9 L271.7,414.9 L269.2,411.8 L271.1,408.9Z M250.6,406.4 L252.8,408.7 L251.3,410.5 L247.5,408.2 L250.6,406.4Z M233.6,398.4 L236.4,403.4 L236.1,407.4 L228.2,406.1 L227.6,403.4 L231.4,398.4 L233.6,398.4Z M222.1,395.7 L225.0,398.9 L222.3,403.2 L227.0,410.0 L230.0,407.2 L235.9,408.3 L235.6,416.1 L233.0,418.7 L227.2,419.7 L226.6,412.8 L222.8,414.0 L223.5,417.0 L221.4,418.5 L217.2,415.6 L218.5,413.6 L214.7,404.7 L220.0,396.1 L222.1,395.7Z M287.5,386.1 L291.0,388.4 L288.7,392.3 L291.4,395.6 L291.1,398.9 L288.8,401.4 L290.3,402.9 L292.0,401.3 L292.7,403.6 L289.3,406.4 L292.5,411.3 L286.9,409.2 L287.0,412.0 L284.0,414.3 L287.8,416.8 L282.7,417.4 L283.6,418.7 L281.7,420.5 L279.2,419.0 L281.3,417.1 L278.9,416.5 L275.6,411.7 L279.5,410.3 L279.0,405.1 L273.8,409.7 L270.1,402.7 L274.7,398.0 L281.8,400.2 L279.6,395.7 L284.7,394.0 L285.0,392.3 L282.6,391.6 L283.4,389.3 L284.7,388.3 L285.2,391.5 L287.5,386.1Z M261.7,327.8 L268.0,325.0 L272.9,324.9 L274.7,320.5 L275.5,326.5 L281.4,331.0 L285.6,329.2 L296.4,332.4 L297.5,330.2 L301.9,329.3 L306.8,325.1 L312.6,328.2 L314.4,326.9 L315.9,327.4 L315.8,330.5 L311.7,333.0 L313.7,336.2 L323.0,339.7 L325.8,344.4 L330.5,345.4 L332.4,348.5 L330.3,353.4 L328.7,354.4 L326.5,353.1 L323.4,358.7 L315.2,362.4 L313.9,366.3 L304.5,368.4 L303.0,373.2 L297.0,374.1 L301.0,379.3 L297.6,381.1 L289.4,379.5 L288.2,375.0 L286.0,376.9 L282.0,375.4 L279.6,368.9 L277.9,371.4 L283.9,383.3 L278.9,385.0 L275.3,378.8 L274.0,380.3 L271.5,379.3 L269.3,382.9 L262.5,385.2 L263.2,386.6 L267.9,385.0 L268.1,383.1 L271.0,383.7 L270.1,386.0 L272.7,388.7 L269.4,391.5 L267.4,390.8 L265.8,400.9 L266.8,402.7 L268.4,398.8 L269.9,401.6 L268.5,405.8 L266.1,407.2 L267.6,407.8 L267.1,412.6 L264.7,414.3 L262.4,409.0 L259.1,407.6 L260.7,406.5 L262.1,407.9 L263.6,404.1 L255.7,400.1 L260.4,399.5 L258.6,395.8 L255.8,396.7 L254.4,399.9 L253.3,396.9 L250.9,395.9 L247.1,396.6 L247.7,401.0 L241.0,399.9 L235.4,397.5 L233.3,394.6 L235.1,392.4 L234.9,388.5 L233.0,386.8 L231.5,387.8 L232.1,391.0 L229.4,392.5 L227.6,391.4 L226.5,392.6 L224.8,388.9 L222.8,394.4 L212.9,396.3 L211.2,393.0 L213.1,388.4 L211.5,385.1 L205.4,379.7 L205.4,377.0 L199.3,371.1 L198.3,363.5 L195.6,358.7 L199.2,356.3 L198.3,352.9 L202.6,347.7 L203.1,344.5 L200.4,343.0 L201.9,340.7 L196.4,332.5 L199.8,327.1 L199.2,324.6 L202.6,317.7 L202.6,312.7 L207.4,308.7 L209.6,304.0 L217.6,301.6 L221.4,296.6 L221.2,298.9 L223.8,299.0 L225.2,302.7 L229.6,302.5 L231.8,305.5 L236.7,304.2 L241.1,306.1 L241.5,309.5 L243.5,309.9 L247.6,316.4 L247.6,320.3 L244.5,321.4 L244.4,323.5 L250.4,324.8 L251.1,323.2 L252.6,324.6 L256.3,323.3 L260.4,324.6 L261.7,327.8Z M351.6,323.7 L350.9,325.8 L352.9,330.4 L350.7,340.7 L346.2,341.7 L343.3,344.5 L344.5,345.2 L342.9,351.8 L344.0,354.0 L339.5,356.6 L337.4,355.4 L336.2,350.8 L331.0,350.7 L332.4,348.5 L330.5,345.4 L327.5,345.8 L323.0,339.7 L313.7,336.2 L311.7,333.0 L315.8,330.5 L315.9,327.4 L314.4,326.9 L318.1,323.8 L320.3,324.8 L319.9,320.7 L321.5,318.5 L326.3,316.2 L335.3,318.5 L335.8,323.4 L339.4,324.0 L343.6,320.8 L351.6,323.7Z M339.5,356.6 L336.2,357.7 L332.9,371.2 L330.3,373.8 L325.5,374.5 L324.3,380.0 L318.3,377.6 L317.5,379.2 L322.1,384.1 L321.1,385.1 L317.0,381.5 L311.4,386.8 L310.0,382.3 L300.4,382.0 L301.6,386.8 L300.4,388.9 L297.9,388.1 L297.2,384.7 L299.2,384.0 L299.4,380.1 L301.0,379.3 L297.0,374.1 L303.0,373.2 L304.5,368.4 L313.9,366.3 L315.2,362.4 L323.4,358.7 L326.5,353.1 L328.7,354.4 L331.0,350.7 L336.2,350.8 L337.4,355.4 L339.5,356.6Z' },
      { id: 'jeonnam', name: '전남', labelX: 170.0, labelY: 392.0,
        d: 'M109.9,473.2 L112.9,474.2 L112.3,476.8 L107.9,479.2 L106.2,477.5 L107.1,474.2 L109.9,473.2Z M119.2,471.7 L121.0,472.7 L119.4,480.1 L116.4,476.7 L118.1,474.4 L116.9,473.2 L119.2,471.7Z M138.5,469.5 L141.2,473.7 L140.4,475.8 L137.8,476.1 L134.7,473.8 L138.5,469.5Z M111.5,467.7 L115.4,469.6 L115.5,473.1 L113.1,474.0 L109.8,472.3 L111.5,467.7Z M67.5,459.2 L70.8,460.3 L72.0,463.4 L66.5,462.8 L65.9,460.8 L67.5,459.2Z M146.3,457.0 L148.7,457.9 L145.1,461.0 L143.9,458.1 L146.3,457.0Z M134.1,455.7 L138.9,457.9 L137.8,460.1 L134.6,461.3 L133.5,458.7 L129.1,458.3 L129.8,456.3 L131.0,457.7 L134.1,455.7Z M150.4,453.4 L155.1,455.2 L155.5,457.6 L151.6,458.2 L148.0,455.2 L148.4,453.4 L150.4,453.4Z M121.2,450.8 L125.2,453.4 L126.5,458.9 L128.4,459.8 L127.5,461.9 L122.0,461.8 L118.2,457.7 L117.4,452.8 L121.2,450.8Z M142.9,449.8 L140.6,455.5 L136.1,453.8 L137.9,450.6 L141.7,452.0 L142.9,449.8Z M133.7,446.8 L136.3,452.0 L130.1,453.0 L128.6,455.7 L127.8,450.4 L129.8,447.6 L133.7,446.8Z M151.5,445.2 L153.8,448.0 L153.0,450.6 L150.5,448.6 L151.5,445.2Z M186.1,443.8 L189.7,444.1 L192.2,446.1 L192.1,448.1 L188.5,449.8 L188.4,447.7 L185.3,445.4 L186.1,443.8Z M166.1,441.6 L167.1,443.5 L165.2,447.7 L157.9,447.8 L155.7,444.3 L157.9,442.0 L158.9,443.6 L166.1,441.6Z M185.7,436.3 L187.4,437.2 L185.9,439.9 L189.3,441.4 L185.2,443.1 L185.7,440.6 L183.6,439.0 L185.7,436.3Z M209.2,435.6 L213.9,441.6 L211.8,442.2 L207.9,439.3 L206.9,437.0 L209.2,435.6Z M85.1,431.9 L89.5,433.7 L89.7,435.6 L96.0,440.4 L94.6,446.7 L90.4,450.5 L86.3,451.3 L86.0,453.2 L78.6,455.8 L75.4,455.1 L71.6,449.1 L79.0,440.7 L85.4,437.2 L85.1,431.9Z M69.9,427.2 L73.4,431.9 L72.7,435.3 L68.2,438.0 L68.0,434.3 L70.9,433.0 L68.1,429.9 L69.9,427.2Z M68.2,424.8 L67.3,429.3 L69.6,432.4 L65.7,434.5 L65.0,427.6 L68.2,424.8Z M76.4,423.3 L79.5,424.5 L80.1,427.5 L77.6,429.2 L74.8,428.8 L73.2,426.1 L76.4,423.3Z M17.7,420.6 L19.6,421.3 L15.3,428.5 L13.6,427.9 L14.0,423.0 L15.2,420.8 L17.7,420.6Z M209.9,417.2 L213.4,420.5 L212.2,422.6 L214.6,431.8 L212.9,432.3 L206.7,428.5 L210.7,421.7 L209.9,417.2Z M61.5,417.6 L65.4,419.6 L64.9,422.2 L61.3,425.1 L57.1,423.0 L57.1,419.6 L61.5,417.6Z M70.9,412.7 L77.7,414.7 L80.5,418.7 L74.1,422.4 L69.8,418.9 L70.9,412.7Z M63.9,410.0 L64.0,414.6 L59.3,415.3 L59.4,418.5 L55.3,418.0 L54.9,414.1 L63.9,410.0Z M78.3,410.2 L78.7,414.4 L72.5,412.8 L77.2,408.2 L78.3,410.2Z M73.7,402.1 L76.7,405.9 L72.5,410.8 L69.0,405.5 L72.7,405.3 L73.7,402.1Z M207.3,400.5 L209.6,401.3 L209.7,403.1 L207.3,403.7 L205.1,401.9 L207.3,400.5Z M88.9,398.1 L92.7,400.9 L91.3,401.4 L91.2,404.3 L93.9,404.0 L95.1,405.7 L93.9,409.0 L91.8,408.6 L92.0,405.6 L83.1,405.5 L87.6,403.7 L89.3,401.0 L87.5,399.3 L88.9,398.1Z M69.4,396.7 L72.8,400.3 L71.3,404.1 L63.9,403.9 L65.3,399.0 L69.0,398.3 L69.4,396.7Z M208.9,395.6 L209.0,397.1 L212.9,398.8 L212.8,401.8 L206.2,399.1 L208.9,395.6Z M82.0,391.6 L83.4,392.2 L80.4,398.9 L79.8,395.7 L82.0,391.6Z M75.3,387.4 L78.5,388.7 L79.8,391.6 L77.3,396.5 L74.4,395.2 L75.3,390.1 L72.3,390.1 L75.3,387.4Z M76.4,384.3 L80.9,386.3 L80.5,387.7 L76.5,386.8 L75.3,385.0 L76.4,384.3Z M77.7,375.6 L74.8,378.4 L74.0,384.0 L68.2,384.0 L68.2,379.8 L74.0,375.7 L77.7,375.6Z M195.6,358.7 L198.3,363.5 L199.3,371.1 L205.4,377.0 L205.4,379.7 L213.1,388.4 L210.8,393.7 L200.8,401.8 L198.9,398.7 L196.7,398.4 L198.7,401.1 L196.6,402.9 L201.1,407.4 L205.7,404.5 L212.1,404.5 L210.0,417.0 L206.1,418.6 L202.3,415.0 L199.5,420.5 L200.8,426.1 L195.0,426.4 L193.4,421.8 L196.6,414.8 L193.9,409.8 L191.1,409.5 L192.3,407.3 L189.3,403.0 L186.8,406.0 L180.9,408.0 L182.5,409.4 L180.4,410.9 L180.6,414.9 L178.6,416.5 L180.0,419.5 L185.1,421.2 L184.9,423.6 L187.3,423.5 L189.7,431.6 L188.0,433.0 L180.3,432.7 L183.6,435.6 L180.9,440.5 L175.0,443.6 L175.7,446.4 L169.8,442.7 L171.1,441.2 L168.9,439.0 L163.7,437.6 L158.8,438.5 L156.8,436.2 L161.8,431.2 L161.8,428.1 L164.1,425.9 L164.8,427.9 L166.4,426.4 L168.4,419.6 L170.7,418.7 L170.8,423.4 L173.7,424.2 L175.3,419.8 L174.5,415.4 L169.3,417.4 L167.3,413.8 L162.5,421.5 L158.1,420.4 L147.0,429.3 L148.2,430.3 L146.0,433.8 L146.5,436.9 L144.0,437.8 L145.5,442.2 L142.2,446.2 L137.2,445.3 L138.1,448.1 L130.0,444.3 L130.2,433.8 L128.5,430.5 L127.3,441.5 L124.8,446.4 L115.6,450.8 L114.4,458.7 L107.3,461.3 L107.5,455.0 L104.2,455.2 L105.0,450.7 L107.2,449.6 L102.3,446.0 L102.5,437.7 L100.0,435.3 L97.6,436.5 L95.8,434.6 L90.3,434.2 L89.6,431.7 L87.4,431.2 L87.9,427.8 L85.4,424.3 L89.2,414.4 L92.1,416.8 L92.7,423.3 L95.5,429.0 L100.4,431.8 L92.8,422.1 L96.5,417.5 L94.7,416.8 L95.8,413.9 L101.6,412.2 L100.9,410.6 L97.6,412.2 L94.3,411.4 L98.1,405.2 L97.0,394.1 L95.7,393.1 L94.7,397.5 L92.7,398.9 L88.7,393.7 L89.7,391.6 L91.9,393.2 L94.1,391.6 L92.8,389.9 L96.6,387.6 L95.9,385.4 L93.4,386.3 L91.5,381.2 L89.2,385.3 L85.8,384.8 L87.0,386.4 L85.5,388.9 L83.0,387.8 L82.7,384.3 L77.6,383.4 L78.1,379.6 L83.5,380.2 L85.6,375.7 L91.2,376.5 L92.9,374.8 L92.1,380.9 L94.8,382.9 L97.2,382.4 L97.4,386.9 L100.9,384.5 L100.8,381.6 L102.5,380.9 L99.1,379.3 L92.5,370.6 L89.7,372.1 L88.9,367.0 L91.2,364.5 L91.1,360.8 L95.6,359.0 L99.3,346.5 L104.0,346.9 L104.3,350.9 L107.5,354.5 L108.4,358.9 L113.5,359.1 L112.6,357.1 L114.5,356.0 L117.9,357.6 L119.7,354.4 L122.4,354.6 L125.1,351.8 L126.5,344.3 L133.0,340.6 L139.5,345.2 L141.9,349.9 L145.6,349.1 L145.0,346.6 L150.4,342.7 L151.5,346.2 L150.0,350.5 L153.3,352.9 L151.4,357.8 L157.1,359.7 L161.5,356.3 L165.4,358.0 L166.0,355.9 L169.2,358.4 L172.9,359.3 L177.1,357.5 L179.5,359.3 L183.4,353.6 L186.8,352.8 L195.6,358.7Z M139.7,363.8 L145.4,371.2 L147.6,371.1 L149.2,373.2 L146.4,380.6 L143.5,382.8 L141.0,381.0 L129.0,384.8 L125.8,379.3 L118.4,377.9 L118.6,373.4 L120.1,372.9 L119.1,370.7 L121.4,368.3 L124.0,368.6 L125.5,364.6 L127.8,364.3 L127.1,366.3 L131.3,367.9 L139.7,363.8Z' },
      { id: 'jeju', name: '제주', labelX: 93.0, labelY: 568.0,
        d: 'M143.8,538.8 L144.7,542.5 L142.5,541.0 L143.8,538.8Z M129.2,534.7 L133.1,535.4 L135.6,538.7 L139.3,538.8 L140.2,544.1 L142.5,545.2 L139.7,552.3 L136.9,554.2 L133.8,560.5 L119.1,564.3 L114.0,567.8 L107.6,567.3 L103.3,569.1 L98.5,567.0 L90.8,567.5 L86.8,571.9 L77.4,562.1 L78.1,556.8 L89.8,544.8 L105.3,539.3 L116.9,537.6 L117.8,535.8 L129.2,534.7Z' },
      { id: 'ulleung', name: '울릉도', labelX: 452.0, labelY: 112.0,
        d: 'M472.9,126.7 L473.5,133.7 L469.4,136.0 L464.2,133.5 L463.4,130.5 L472.9,126.7Z M457.6,150.8 L460.2,148.9 L461.9,151.1 L459.5,153.2 Z M462.5,153.0 L464.6,151.7 L465.9,153.7 L463.7,155.0 Z' }
    ];

    /* ── HTML 생성 ── */
    var html = '<section class="endangered-section" aria-labelledby="endangered-title">';
    html += '<div class="endangered-dashboard overview-card">';
    html += '<div class="endangered-header overview-card-header">';
    html += '<h2 id="endangered-title" class="endangered-title overview-card-title">사라지는 것들의 목록, 멸종위기 약재들</h2>';
    html += '<p class="endangered-subtitle overview-card-subtitle">무분별한 개발과 남획, 기후변화로 수백 년간 쓰여온 약재들이 사라지고 있다</p>';
    html += '</div>';

    html += '<div class="endangered-body">';

    /* ── 지도 ── */
    html += '<div class="endangered-map-wrap">';
    html += '<svg class="endangered-map-svg" viewBox="0 0 488 586" xmlns="http://www.w3.org/2000/svg">';

    // 울릉도·독도 인셋 박스 — 실제 거리 비반영(압축 배치) 표시
    html += '<rect class="endangered-inset-box" x="400" y="92" width="82" height="82" rx="6"/>';

    // 도 경계
    PROVINCES.forEach(function (p) {
      html += '<path class="endangered-province" data-province="' + p.id + '" d="' + p.d + '"/>';
    });

    // 도 이름 라벨
    PROVINCES.forEach(function (p) {
      html += '<text class="endangered-province-label" x="' + p.labelX + '" y="' + p.labelY + '">' + p.name + '</text>';
    });
    html += '<text class="endangered-province-label endangered-province-label--dokdo" x="461.7" y="165.5">독도</text>';

    // 약재 마커
    ENDANGERED_HERBS.forEach(function (herb, hi) {
      var col = LEVEL_COLORS[herb.level] || '#888';
      herb.coords.forEach(function (c, ci) {
        html += '<g class="endangered-marker" data-herb="' + hi + '" data-coord="' + ci + '">';
        html += '<circle class="endangered-marker-pulse" cx="' + c.x + '" cy="' + c.y + '" r="8" fill="' + col + '" opacity="0.3"/>';
        html += '<circle cx="' + c.x + '" cy="' + c.y + '" r="6" fill="' + col + '" stroke="#fff" stroke-width="1.8"/>';
        html += '</g>';
      });
    });

    html += '</svg>';

    // 범례 (클릭 시 등급 필터)
    html += '<div class="endangered-legend" id="endangered-legend">';
    Object.keys(LEVEL_COLORS).forEach(function (lev) {
      html += '<button type="button" class="endangered-legend-item" data-level="' + lev + '">';
      html += '<span class="endangered-legend-dot" style="background:' + LEVEL_COLORS[lev] + '"></span>';
      html += levelDisplayLabel(lev);
      html += '</button>';
    });
    html += '</div>';
    html += '</div>'; // map-wrap

    /* ── 정보 패널 ── */
    html += '<div class="endangered-info-panel" id="endangered-info-panel">';

    // 지역 필터 칩
    html += '<div class="endangered-region-filters" id="endangered-region-filters">';
    var regionSet = {};
    ENDANGERED_HERBS.forEach(function (h) {
      h.regions.forEach(function (r) { regionSet[r] = true; });
    });
    var REGION_ORDER = ['서울·경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '울릉도'];
    var regionList = Object.keys(regionSet).sort(function (a, b) {
      return REGION_ORDER.indexOf(a) - REGION_ORDER.indexOf(b);
    });
    html += '<button type="button" class="endangered-region-chip endangered-region-chip--active" data-region="all">전체</button>';
    regionList.forEach(function (r) {
      html += '<button type="button" class="endangered-region-chip" data-region="' + r + '">' + r + '</button>';
    });
    html += '</div>';

    // 약재 리스트
    html += '<div class="endangered-herb-list-wrap">';
    html += '<div class="endangered-herb-list" id="endangered-herb-list">';
    var _allHerbsForChips = (window.DONGUIBOGAM_HERBS) || [];
    ENDANGERED_HERBS.forEach(function (herb, i) {
      var col = LEVEL_COLORS[herb.level] || '#888';
      var levelLabel = levelDisplayLabel(herb.level);
      var herbRecord = null;
      for (var _ci = 0; _ci < _allHerbsForChips.length; _ci++) {
        if (_allHerbsForChips[_ci].id === herb.herbId) { herbRecord = _allHerbsForChips[_ci]; break; }
      }
      var displayName = herbRecord ? herbRecord.korean_name : herb.latin;
      html += '<div class="endangered-herb-chip" data-herb-idx="' + i + '">';
      html += '<span class="endangered-herb-chip-dot" style="background:' + col + '"></span>';
      html += '<span class="endangered-herb-chip-name">' + displayName + '</span>';
      html += '<span class="endangered-herb-chip-level">' + levelLabel + '</span>';
      html += '</div>';
    });
    html += '</div>'; // herb-list

    // 필터 결과 없음 안내 + 초기화 버튼
    html += '<div class="endangered-empty" id="endangered-empty" aria-hidden="true">';
    html += '<p class="endangered-empty-text">필터 조건에 맞는 약재가 없습니다</p>';
    html += '<button type="button" class="endangered-empty-reset" id="endangered-empty-reset">필터 초기화</button>';
    html += '</div>';

    html += '</div>'; // herb-list-wrap

    html += '</div>'; // info-panel
    html += '</div>'; // body
    html += '</div>'; // dashboard
    html += '</section>';

    el.innerHTML = html;

    /* ── 인터랙션 ── */
    var markers     = el.querySelectorAll('.endangered-marker');
    var chips       = el.querySelectorAll('.endangered-herb-chip');
    var provinces   = el.querySelectorAll('.endangered-province');
    var regionChips = el.querySelectorAll('.endangered-region-chip');
    var legendItems = el.querySelectorAll('.endangered-legend-item');
    var activeRegion = 'all';
    var activeLevel  = 'all';

    /* ── 상세 팝업 모달 ── */
    var modal = document.getElementById('endangered-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'endangered-detail-modal';
      modal.className = 'endangered-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML =
        '<div class="endangered-modal-backdrop"></div>' +
        '<div class="endangered-modal-popup">' +
        '<button type="button" class="endangered-modal-close" aria-label="닫기">&times;</button>' +
        '<div class="endangered-modal-body"></div>' +
        '</div>';
      document.body.appendChild(modal);
      modal.querySelector('.endangered-modal-backdrop').addEventListener('click', closeDetailModal);
      modal.querySelector('.endangered-modal-close').addEventListener('click', closeDetailModal);
      document.addEventListener('keydown', function (e) {
        if (modal.getAttribute('aria-hidden') !== 'false') return;
        if (e.key === 'Escape') {
          closeDetailModal();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navDetail(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navDetail(1);
        }
      });
    }
    var modalBody = modal.querySelector('.endangered-modal-body');
    var currentDetailIdx = -1;

    function closeDetailModal() {
      modal.setAttribute('aria-hidden', 'true');
      currentDetailIdx = -1;
      markers.forEach(function (m) { m.classList.remove('endangered-marker--active'); });
      chips.forEach(function (c) { c.classList.remove('endangered-herb-chip--active'); });
    }

    /* 좌우 화살표 → 현재 필터로 보이는 약재들 사이에서 이전/다음으로 이동 */
    function navDetail(dir) {
      if (currentDetailIdx < 0) return;
      var visible = [];
      for (var i = 0; i < ENDANGERED_HERBS.length; i++) {
        if (herbVisible(ENDANGERED_HERBS[i])) visible.push(i);
      }
      if (visible.length <= 1) return;
      var pos = visible.indexOf(currentDetailIdx);
      if (pos < 0) pos = 0;
      var nextPos = (pos + dir + visible.length) % visible.length;
      showDetail(visible[nextPos]);
    }

    function showDetail(idx) {
      var herb = ENDANGERED_HERBS[idx];
      if (!herb) return;
      currentDetailIdx = idx;

      // 마커·칩 활성화
      markers.forEach(function (m) {
        m.classList.toggle('endangered-marker--active', parseInt(m.getAttribute('data-herb'), 10) === idx);
      });
      chips.forEach(function (c) {
        c.classList.toggle('endangered-herb-chip--active', parseInt(c.getAttribute('data-herb-idx'), 10) === idx);
      });

      // 상세 카드 — 이름/한자는 DONGUIBOGAM_HERBS에서 조회
      var _allHerbs = (window.DONGUIBOGAM_HERBS) || [];
      var _herbRecord = null;
      for (var _di = 0; _di < _allHerbs.length; _di++) {
        if (_allHerbs[_di].id === herb.herbId) { _herbRecord = _allHerbs[_di]; break; }
      }
      var detailName  = _herbRecord ? _herbRecord.korean_name : herb.latin;
      var detailHanja = _herbRecord ? (_herbRecord.hanja_name || '') : '';
      var levelLabel = levelDisplayLabel(herb.level);
      var cssCls = LEVEL_CSS[herb.level] || 'lc';
      var dhtml = '<div class="endangered-detail-card">';
      var thumb = (typeof window.getThumbnailForHerb === 'function' && _herbRecord)
        ? window.getThumbnailForHerb(_herbRecord) : null;
      if (thumb) {
        dhtml += '<img class="endangered-detail-img" src="' + thumb + '" alt="' + detailName + '" onerror="this.style.display=\'none\'">';
      }
      dhtml += '<span class="endangered-detail-level endangered-detail-level--' + cssCls + '">' + levelLabel + '</span>';
      dhtml += '<h3 class="endangered-detail-name">' + detailName + '</h3>';
      var hanjaLatinParts = [];
      if (detailHanja) hanjaLatinParts.push('<span class="endangered-detail-hanja">' + detailHanja + '</span>');
      if (herb.latin) hanjaLatinParts.push('<span class="endangered-detail-latin">' + herb.latin + '</span>');
      if (hanjaLatinParts.length) dhtml += '<p class="endangered-detail-hanja-latin">' + hanjaLatinParts.join(' · ') + '</p>';
      if (herb.legalStatus) {
        var legalParts = herb.legalStatus.split(') · ').map(function(p, i, arr) {
          return i < arr.length - 1 ? p + ')' : p;
        });
        var legalLines = legalParts.join('<br>');
        dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">지정내역</span><span class="endangered-detail-value">' + legalLines + '</span></div>';
      }
      dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">분포지역</span><span class="endangered-detail-value">' + herb.regions.join(', ') + '</span></div>';
      dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">서식환경</span><span class="endangered-detail-value">' + herb.habitat + '</span></div>';
      dhtml += '<div class="endangered-detail-threat"><span class="endangered-detail-threat-title">왜 사라졌을까?</span><p>' + herb.threat + '</p></div>';
      dhtml += '<p class="endangered-detail-desc">' + herb.desc + '</p>';

      dhtml += '</div>';
      modalBody.innerHTML = dhtml;

      modal.setAttribute('aria-hidden', 'false');
      modal.querySelector('.endangered-modal-popup').scrollTop = 0;
    }

    /* ── 지역 × 등급 복합 필터 ── */
    function herbVisible(herb) {
      var regionOk = activeRegion === 'all' || herb.regions.indexOf(activeRegion) >= 0 || herb.regions.indexOf('전국') >= 0;
      var levelOk  = activeLevel === 'all' || herb.level === activeLevel;
      return regionOk && levelOk;
    }

    function applyFilters() {
      // 칩 필터링
      var visibleCount = 0;
      chips.forEach(function (c) {
        var herb = ENDANGERED_HERBS[parseInt(c.getAttribute('data-herb-idx'), 10)];
        var show = herbVisible(herb);
        c.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      // 결과 없음 안내 토글
      var emptyEl = document.getElementById('endangered-empty');
      var listEl = document.getElementById('endangered-herb-list');
      if (emptyEl) emptyEl.setAttribute('aria-hidden', visibleCount === 0 ? 'false' : 'true');
      if (listEl) listEl.style.display = visibleCount === 0 ? 'none' : '';

      // 마커 필터링
      markers.forEach(function (m) {
        var herb = ENDANGERED_HERBS[parseInt(m.getAttribute('data-herb'), 10)];
        var show = herbVisible(herb);
        m.style.opacity = show ? '1' : '0.15';
        m.style.pointerEvents = show ? '' : 'none';
      });

      // 지역 칩 활성 표시
      regionChips.forEach(function (rc) {
        rc.classList.toggle('endangered-region-chip--active', rc.getAttribute('data-region') === activeRegion);
      });

      // 범례 활성 표시
      legendItems.forEach(function (li) {
        li.classList.toggle('endangered-legend-item--active', li.getAttribute('data-level') === activeLevel);
      });

      // 도 하이라이트 (지역 필터 기준)
      provinces.forEach(function (p) {
        if (activeRegion === 'all') {
          p.classList.remove('endangered-province--active');
          return;
        }
        var pid = p.getAttribute('data-province');
        var prov = null;
        PROVINCES.forEach(function (pr) { if (pr.id === pid) prov = pr; });
        p.classList.toggle('endangered-province--active', !!(prov && prov.name.indexOf(activeRegion) >= 0));
      });
    }

    function filterByRegion(region) {
      activeRegion = region;
      applyFilters();
    }

    function filterByLevel(level) {
      activeLevel = (activeLevel === level) ? 'all' : level;
      activeRegion = 'all'; // 등급 필터 선택 시 지역 필터는 해제
      applyFilters();
    }

    function resetFilters() {
      activeRegion = 'all';
      activeLevel = 'all';
      applyFilters();
    }

    // 마커 클릭 → 상세 팝업
    markers.forEach(function (m) {
      m.addEventListener('click', function () {
        showDetail(parseInt(m.getAttribute('data-herb'), 10));
      });
    });

    // 리스트 약재 클릭 → 상세 팝업
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        showDetail(parseInt(c.getAttribute('data-herb-idx'), 10));
      });
    });

    // 도 클릭 → 지역 필터
    provinces.forEach(function (p) {
      p.addEventListener('click', function () {
        var pid = p.getAttribute('data-province');
        var prov = null;
        PROVINCES.forEach(function (pr) { if (pr.id === pid) prov = pr; });
        if (!prov) return;
        // 도 이름에서 첫 단어 추출 (서울·경기→경기, 울릉도→울릉도)
        var regionName = prov.name.replace('·', '/').split('/').pop().replace('도', '');
        if (prov.id === 'seoul') regionName = '서울·경기';
        if (prov.id === 'ulleung') regionName = '울릉도';
        if (prov.id === 'jeju') regionName = '제주';
        // 이미 활성화된 지역이면 전체로 돌아감
        if (activeRegion === regionName) {
          filterByRegion('all');
        } else {
          filterByRegion(regionName);
        }
      });
    });

    // 지역 필터 칩 클릭
    regionChips.forEach(function (rc) {
      rc.addEventListener('click', function () {
        filterByRegion(rc.getAttribute('data-region'));
      });
    });

    // 범례 클릭 → 등급 필터 (재클릭 시 해제)
    legendItems.forEach(function (li) {
      li.addEventListener('click', function () {
        filterByLevel(li.getAttribute('data-level'));
      });
    });

    // 필터 초기화 버튼
    var resetBtn = el.querySelector('#endangered-empty-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }

    /* ── 등급 필터 자동 시연 ──
     * 스크롤이 이 섹션에 다다르면, 각 등급 필터를 2초씩 한 바퀴 보여준 뒤 전체로 복귀한다.
     * (향약·자주의학 자생지별 보기의 필터 시연과 동일한 방식) */
    var demoTimers = [];
    var demoActive = false;
    function cancelLevelDemo() {
      demoTimers.forEach(function (t) { clearTimeout(t); });
      demoTimers = [];
      demoActive = false;
    }
    // 실제로 약재가 존재하는 등급만 LEVEL_COLORS 순서대로 추린다 (0건 등급은 건너뜀)
    var demoLevels = Object.keys(LEVEL_COLORS).filter(function (lev) {
      return ENDANGERED_HERBS.some(function (h) { return h.level === lev; });
    });
    function startLevelDemo() {
      cancelLevelDemo();
      if (demoLevels.length === 0) return;
      demoActive = true;
      var BASE = 450;
      var DWELL = 1500;
      demoLevels.forEach(function (lev, i) {
        demoTimers.push(setTimeout(function () {
          if (!demoActive) return;
          activeLevel = lev;
          activeRegion = 'all';
          applyFilters();
        }, BASE + i * DWELL));
      });
      // 마지막 등급까지 보여준 뒤 전체(all) 상태로 복귀
      demoTimers.push(setTimeout(function () {
        if (!demoActive) return;
        activeLevel = 'all';
        activeRegion = 'all';
        applyFilters();
        demoActive = false;
      }, BASE + demoLevels.length * DWELL));
    }

    // 사용자가 직접 필터를 만지면 시연을 즉시 중단한다
    [legendItems, regionChips, chips, markers, provinces].forEach(function (group) {
      group.forEach(function (node) { node.addEventListener('click', cancelLevelDemo); });
    });

    // 섹션이 화면에 들어올 때마다 시연한다. 단, 화면 안에 머무는 동안에는
    // 한 번만 — 나갔다가(앵커 이동 포함) 다시 들어오면 또 시연한다.
    if ('IntersectionObserver' in window) {
      var demoInView = false;
      var demoIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!demoInView) {
              demoInView = true;
              startLevelDemo();
            }
          } else {
            demoInView = false;
            cancelLevelDemo();
          }
        });
      }, { threshold: 0.25 });
      demoIO.observe(el);
    }
  }

  /** 효능별 약재 수 기준 정렬된 목록 */
  function buildEfficacyHerbPairs() {
    var tags = (typeof window !== 'undefined' && window.DONGUIBOGAM_EFFICACY_TAGS) ? window.DONGUIBOGAM_EFFICACY_TAGS : [];
    var pairs = [];
    tags.forEach(function (tag) {
      var herbList = herbs.filter(function (h) { return (h.tags || []).indexOf(tag) >= 0; });
      if (herbList.length === 0) return;
      pairs.push({ tag: tag, herbs: herbList.slice() });
    });
    pairs.sort(function (a, b) { return (b.herbs.length - a.herbs.length) || (a.tag.localeCompare(b.tag, 'ko-KR')); });
    return pairs;
  }

  /** 3D 우주 시각화용: 몸 부위 카테고리 → 대분류(효능) → 중분류(곡부·어부 등) → 소분류(약재) */
  function buildEfficacyUniverseData() {
    var pairs = buildEfficacyHerbPairs();
    var bodyCatMap = (typeof window !== 'undefined' && window.EFFICACY_TO_BODY_CATEGORY) ? window.EFFICACY_TO_BODY_CATEGORY : {};
    var bodyOrder = (typeof window !== 'undefined' && window.EFFICACY_BODY_CATEGORY_ORDER) ? window.EFFICACY_BODY_CATEGORY_ORDER : [];
    var byBody = {};
    pairs.forEach(function (p) {
      var bodyCat = bodyCatMap[p.tag] || '기타';
      if (!byBody[bodyCat]) byBody[bodyCat] = [];
      var byCategory = {};
      (p.herbs || []).forEach(function (h) {
        var cat = getEffectCategory(h) || (h.category_detail || '').replace(/^[^-]+-/, '') || '미분류';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(h);
      });
      var groups = Object.keys(byCategory).map(function (cat) {
        return {
          category: cat,
          label: (SUB_CATEGORY_LABELS && SUB_CATEGORY_LABELS[cat]) ? SUB_CATEGORY_LABELS[cat] : cat,
          herbs: byCategory[cat]
        };
      });
      byBody[bodyCat].push({ tag: p.tag, herbs: p.herbs, groups: groups });
    });
    var categories = [];
    bodyOrder.forEach(function (key) {
      if (byBody[key] && byBody[key].length > 0) categories.push({ key: key, efficacies: byBody[key] });
    });
    Object.keys(byBody).forEach(function (key) {
      if (bodyOrder.indexOf(key) < 0) categories.push({ key: key, efficacies: byBody[key] });
    });
    return { categories: categories };
  }

  /** 3D 우주 시각화 */
  function renderEfficacyTree() {
    var container = document.getElementById('efficacy-tree-container');
    if (!container) return;
    var pairs = buildEfficacyHerbPairs();
    if (pairs.length === 0) {
      container.innerHTML = '<p class="efficacy-tree-empty">효능 태그가 있는 약재가 없습니다.</p>';
      return;
    }
    var universeData = buildEfficacyUniverseData();

    if (typeof window.initEfficacyUniverse3D !== 'function') {
      container.innerHTML = '<p class="efficacy-tree-empty">시각화 로딩 중...</p>';
      var moduleUrl = new URL('js/efficacy-universe-3d.js', document.baseURI).href;
      import(moduleUrl).then(function () {
        if (typeof window.initEfficacyUniverse3D === 'function') {
          requestAnimationFrame(function () { renderEfficacyTree(); });
        } else {
          container.innerHTML = '<p class="efficacy-tree-empty">시각화를 로드할 수 없습니다. HTTP 서버에서 실행해 주세요.</p>';
        }
      }).catch(function (err) {
        console.error('3D 모듈 로드 오류:', err);
        container.innerHTML = '<p class="efficacy-tree-empty">시각화를 로드할 수 없습니다. ' + (err && err.message ? err.message : '') + '</p>';
      });
      return;
    }
    requestAnimationFrame(function () {
      try {
        var api = window.initEfficacyUniverse3D(container, {
          universeData: universeData,
          onSubCategoryClick: function (_efficacyTag, _category, herbList, focusedHerb) {
            if (!herbList || herbList.length === 0) return;
            var herb = focusedHerb || herbList[0];
            if (window._efficacyUniverse2D && typeof window._efficacyUniverse2D.selectHerb === 'function') {
              window._efficacyUniverse2D.selectHerb(herb.id);
            }
            if (typeof window.openHerbIngredientModal === 'function') {
              window.openHerbIngredientModal(herb, herbList);
            }
          }
        });
        if (api && api.search && state.q && state.q.trim()) {
          api.search(state.q);
        }
      } catch (err) {
        console.error('3D 시각화 초기화 오류:', err);
        container.innerHTML = '<p class="efficacy-tree-empty">시각화를 로드할 수 없습니다.</p>';
      }
    });
  }

  function initEfficacyHelpPopup() {
    var btn = document.getElementById('efficacy-help-btn');
    var popup = document.getElementById('efficacy-help-popup');
    var closeBtn = popup ? popup.querySelector('.efficacy-help-close') : null;
    var backdrop = popup ? popup.querySelector('.efficacy-help-backdrop') : null;
    if (!btn || !popup) return;
    function openPopup() {
      popup.setAttribute('aria-hidden', 'false');
    }
    function closePopup() {
      popup.setAttribute('aria-hidden', 'true');
    }
    btn.addEventListener('click', openPopup);
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (backdrop) backdrop.addEventListener('click', closePopup);
  }

  function update() {
    if (state.viewMode === 'body') {
      refreshBodyDiseaseList();
      renderPrescView();
      return;
    }
    if (state.viewMode === 'efficacy') {
      if (window._efficacyUniverse3D && typeof window._efficacyUniverse3D.search === 'function') {
        window._efficacyUniverse3D.search(state.q);
      }
      return;
    }
    if (state.viewMode === 'data') return;
    updateChungbuHelp();
    var filtered = getFilteredList();
    var listPanel = document.getElementById('list-view');
    var emptyMsg = document.getElementById('empty-message');
    if (emptyMsg) {
      emptyMsg.setAttribute('aria-hidden', filtered.length > 0);
    }
    var resetBtn = document.getElementById('filter-reset-btn');
    if (resetBtn) {
      var hasFilter = !!state.q.trim() || !!state.mainCategory || !!state.subCategory || (state.selectedTags && state.selectedTags.length > 0);
      resetBtn.hidden = !hasFilter;
    }
    if (filtered.length === 0) {
      if (listPanel) listPanel.querySelector('.herb-list-grid').innerHTML = '';
      var countEl = document.getElementById('list-count');
      if (countEl) countEl.textContent = '0';
      var prefixEl = document.getElementById('list-caption-prefix');
      if (prefixEl) prefixEl.textContent = state.q.trim() ? '"' + state.q.trim() + '"' : '가나다순';
      return;
    }
    renderListView(filtered);
  }

  function getSimilarHerbsByTag(herb, tag, limit) {
    if (!herb || !herbs || !tag) return [];
    var herbId = herb.id;
    return herbs
      .filter(function (h) {
        if (h.id === herbId) return false;
        return (h.tags || []).indexOf(tag) >= 0;
      })
      .sort(function (a, b) { return (a.korean_name || '').localeCompare(b.korean_name || '', 'ko-KR'); })
      .slice(0, limit || 15);
  }

  /** effect.json의 herb_id 필드로 O(1) 룩업, 없으면 한자명 문자열 매칭으로 폴백 */
  var effectById = null;
  function buildEffectIndex() {
    if (!effectData || effectData.length === 0) return;
    effectById = {};
    for (var i = 0; i < effectData.length; i++) {
      var entry = effectData[i];
      if (entry.herb_id) effectById[entry.herb_id] = entry;
    }
  }
  function getEffectRecord(herb) {
    if (!herb || !effectData || effectData.length === 0) return null;
    if (!effectById) buildEffectIndex();
    if (effectById && herb.id && effectById[herb.id]) return effectById[herb.id];
    var hanja = (herb.hanja_name || '').trim();
    for (var i = 0; i < effectData.length; i++) {
      var entry = effectData[i];
      if (hanja && (entry.herb_hanja || '').trim() === hanja) return entry;
    }
    return null;
  }

  /** effect.json category 반환, 매칭 없으면 null */
  function getEffectCategory(herb) {
    var rec = getEffectRecord(herb);
    return (rec && rec.category) ? rec.category : null;
  }

  /** 필터 표시용 텍스트 (예: 식물-곡부) */
  function getFilterDisplayText(herb) {
    var effectCat = getEffectCategory(herb);
    if (!effectCat) return '미분류';
    var main = EFFECT_TO_MAIN[effectCat];
    var mainLabel = CATEGORY_LABELS[main] || main;
    var subLabel = (SUB_CATEGORY_LABELS && SUB_CATEGORY_LABELS[effectCat]) ? SUB_CATEGORY_LABELS[effectCat] : effectCat;
    return mainLabel + '-' + subLabel;
  }

  function updateHerbIngredientModalContent(herb) {
    var imgEl = document.getElementById('herb-ingredient-img');
    var titleEl = document.getElementById('herb-ingredient-title');
    var hanjaEl = document.getElementById('herb-ingredient-hanja');
    var latinEl = document.getElementById('herb-ingredient-latin');
    var categoryEl = document.getElementById('herb-ingredient-category');
    var tagsEl = document.getElementById('herb-ingredient-tags');
    var similarListEl = document.getElementById('herb-ingredient-similar-list');
    var glbEl = document.getElementById('herb-ingredient-glb');
    var noimgEl = document.getElementById('herb-ingredient-noimg');
    var isInsam = herb.id === 'PLANT_001' || (herb.korean_name || '').trim() === '인삼';

    if (ingredientGlbViewer) {
      ingredientGlbViewer.destroy();
      ingredientGlbViewer = null;
    }
    var useGlb = isInsam && glbEl && typeof window.createIngredientGlbViewer === 'function';
    if (glbEl) {
      glbEl.setAttribute('aria-hidden', useGlb ? 'false' : 'true');
      glbEl.style.display = useGlb ? 'block' : 'none';
    }

    if (useGlb) {
      if (imgEl) imgEl.style.display = 'none';
      if (noimgEl) noimgEl.setAttribute('aria-hidden', 'true');
      ingredientGlbViewer = window.createIngredientGlbViewer(glbEl, 'asset/insam.glb');
    } else {
      var thumbSrc = (typeof window.getThumbnailForHerb === 'function' && window.getThumbnailForHerb(herb)) || getThumbnailPathFallback(herb);
      if (imgEl) {
        if (thumbSrc) {
          imgEl.src = thumbSrc;
          imgEl.alt = herb.korean_name || '';
          imgEl.style.display = '';
          if (noimgEl) noimgEl.setAttribute('aria-hidden', 'true');
        } else {
          imgEl.src = '';
          imgEl.alt = '';
          imgEl.style.display = 'none';
          if (noimgEl) noimgEl.setAttribute('aria-hidden', 'false');
        }
      }
    }
    var effectRecordForModal = getEffectRecord(herb);
    var modalName = effectRecordForModal && effectRecordForModal.herb_korean ? toModernKorean(effectRecordForModal.herb_korean.trim()) : (toModernKorean(herb.korean_name || '') || herb.korean_name || '');
    var modalHanja = effectRecordForModal && effectRecordForModal.herb_hanja ? effectRecordForModal.herb_hanja.trim() : (herb.hanja_name || '');
    var modalTags = effectRecordForModal ? extractTagsFromEfficacy(effectRecordForModal) : (herb.tags || []);
    if (herb.tags && herb.tags.length > modalTags.length) modalTags = herb.tags;
    var modalEnglish = getDisplayEnglish(herb);
    var modalLatin = (modalEnglish || herb.latin_name || '').trim();
    if (modalLatin === (modalHanja || '').trim()) modalLatin = '';
    if (titleEl) titleEl.textContent = modalName;
    if (hanjaEl) hanjaEl.textContent = modalHanja;
    if (latinEl) latinEl.textContent = modalLatin;
    if (categoryEl) categoryEl.textContent = herb.category_detail ? '분류: ' + toModernKorean(herb.category_detail) : '';
    if (tagsEl) {
      tagsEl.innerHTML = '';
      tagsEl.classList.remove('herb-ingredient-tags--expanded');
      var tagsList = modalTags;
      var visibleCount = 5;
      var showMore = tagsList.length > visibleCount;
      tagsList.forEach(function (t, i) {
        var li = document.createElement('li');
        li.textContent = t;
        if (showMore && i >= visibleCount) li.classList.add('herb-ingredient-tags-hidden');
        tagsEl.appendChild(li);
      });
      if (showMore) {
        var moreLi = document.createElement('li');
        moreLi.className = 'herb-ingredient-tags-more';
        moreLi.setAttribute('role', 'button');
        moreLi.setAttribute('tabIndex', 0);
        moreLi.textContent = '+' + (tagsList.length - visibleCount);
        moreLi.addEventListener('click', function () {
          tagsEl.classList.add('herb-ingredient-tags--expanded');
          var hidden = tagsEl.querySelectorAll('.herb-ingredient-tags-hidden');
          for (var j = 0; j < hidden.length; j++) hidden[j].classList.remove('herb-ingredient-tags-hidden');
          moreLi.remove();
        });
        moreLi.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); moreLi.click(); } });
        tagsEl.appendChild(moreLi);
      }
    }

    var donguibogamEl = document.getElementById('herb-ingredient-donguibogam');
    if (donguibogamEl) {
      var hasRecord = false;
      var effectRecord = getEffectRecord(herb);
      if (effectRecord) {
        hasRecord = true;
        donguibogamEl.innerHTML = '';
        donguibogamEl.classList.add('has-effect-content');
        var seenText = {};
        for (var i = 1; i <= 10; i++) {
          var hanjaKey = 'efficacy_hanja_' + i;
          var koKey = 'efficacy_korean_' + i;
          var hanjaVal = effectRecord[hanjaKey];
          var koVal = effectRecord[koKey];
          var hanjaT = hanjaVal ? hanjaVal.trim() : '';
          var koT = koVal ? koVal.trim() : '';
          if (hanjaT && !seenText[hanjaT]) {
            seenText[hanjaT] = true;
            var chineseBlock = document.createElement('div');
            chineseBlock.className = 'donguibogam-chinese donguibogam-effect';
            chineseBlock.textContent = hanjaT;
            donguibogamEl.appendChild(chineseBlock);
          }
          if (koT && !seenText[koT]) {
            seenText[koT] = true;
            var koBlock = document.createElement('div');
            koBlock.className = 'donguibogam-ko donguibogam-effect';
            koBlock.textContent = koT;
            donguibogamEl.appendChild(koBlock);
          }
        }
      } else {
        donguibogamEl.classList.remove('has-effect-content');
      }
      if (!hasRecord) {
        donguibogamEl.classList.remove('has-effect-content');
        var record = (typeof window !== 'undefined' && window.DONGUIBOGAM_TEXTS) ? window.DONGUIBOGAM_TEXTS[herb.id] : null;
        if (record && typeof record === 'object' && (record.chinese || record.ko)) {
          hasRecord = true;
          donguibogamEl.innerHTML = '';
          var cs = (record.chinese || '').trim();
          var ks = (record.ko || '').trim();
          if (cs) {
            var chineseBlock = document.createElement('div');
            chineseBlock.className = 'donguibogam-chinese';
            chineseBlock.textContent = cs;
            donguibogamEl.appendChild(chineseBlock);
          }
          if (ks && ks !== cs) {
            var koBlock = document.createElement('div');
            koBlock.className = 'donguibogam-ko';
            koBlock.textContent = ks;
            donguibogamEl.appendChild(koBlock);
          }
        } else if (record && typeof record === 'string' && record.trim()) {
          hasRecord = true;
          donguibogamEl.textContent = record;
        }
      }
      if (!hasRecord) {
        donguibogamEl.innerHTML = '';
        var emptyMsg = document.createElement('p');
        emptyMsg.className = 'donguibogam-empty-msg';
        emptyMsg.textContent = '해당 약재에 대한 동의보감 기록이 등재되지 않았습니다. 한의학고전DB 페이지를 저장한 뒤 npm run parse-mediclassics-html 로 추가할 수 있습니다.';
        donguibogamEl.appendChild(emptyMsg);
      }
      donguibogamEl.classList.toggle('is-empty', !hasRecord);
    }

    var similarFiltersEl = document.getElementById('herb-ingredient-similar-filters');
    var similarSectionEl = document.querySelector('.herb-ingredient-similar');
    var hasTags = (herb.tags && herb.tags.length > 0);
    if (similarSectionEl) {
      similarSectionEl.style.display = hasTags ? '' : 'none';
      similarSectionEl.setAttribute('aria-hidden', hasTags ? 'false' : 'true');
    }
    if ((similarFiltersEl || similarListEl) && hasTags) {
      ingredientModalSimilarTag = herb.tags[0];
      renderSimilarSection(herb, ingredientModalSimilarTag);
    }
  }

  function renderSimilarSection(herb, selectedTag) {
    var similarFiltersEl = document.getElementById('herb-ingredient-similar-filters');
    var similarListEl = document.getElementById('herb-ingredient-similar-list');
    if (!herb || !similarListEl) return;

    var tags = herb.tags || [];
    if (similarFiltersEl) {
      similarFiltersEl.innerHTML = '';
      similarFiltersEl.classList.add('herb-similar-filters--expanded'); /* 기본으로 모두 표시 */
      var FILTER_GAP = 10;
      var MORE_BTN_RESERVE = 44;
      tags.forEach(function (tag) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'herb-similar-filter-btn' + (tag === selectedTag ? ' active' : '');
        btn.textContent = tag;
        btn.setAttribute('data-similar-tag', tag);
        btn.addEventListener('click', function () {
          ingredientModalSimilarTag = tag;
          var currentHerb = ingredientModalHerbList[ingredientModalHerbIndex];
          if (currentHerb) renderSimilarSection(currentHerb, tag);
        });
        similarFiltersEl.appendChild(btn);
      });
      function applyFilterOverflow() {
        if (similarFiltersEl.classList.contains('herb-similar-filters--expanded')) return;
        var oldMore = similarFiltersEl.querySelector('.herb-similar-filter-more');
        if (oldMore) oldMore.remove();
        var btns = similarFiltersEl.querySelectorAll('.herb-similar-filter-btn');
        for (var r = 0; r < btns.length; r++) btns[r].classList.remove('herb-similar-filter-hidden');
        if (btns.length <= 1) return;
        var containerW = similarFiltersEl.clientWidth;
        if (containerW <= 0) return;
        var w = 0;
        var fit = 0;
        for (var i = 0; i < btns.length; i++) {
          if (i > 0) w += FILTER_GAP;
          w += btns[i].offsetWidth;
          if (w > containerW - MORE_BTN_RESERVE) break;
          fit = i + 1;
        }
        if (fit >= btns.length || fit < 1) return;
        for (var j = fit; j < btns.length; j++) btns[j].classList.add('herb-similar-filter-hidden');
        var moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'herb-similar-filter-more';
        moreBtn.textContent = '+' + (btns.length - fit);
        moreBtn.addEventListener('click', function () {
          similarFiltersEl.classList.add('herb-similar-filters--expanded');
          for (var k = 0; k < btns.length; k++) btns[k].classList.remove('herb-similar-filter-hidden');
          moreBtn.remove();
        });
        similarFiltersEl.appendChild(moreBtn);
      }
      requestAnimationFrame(function () { applyFilterOverflow(); });
      setTimeout(applyFilterOverflow, 350);
    }

    var list = selectedTag ? getSimilarHerbsByTag(herb, selectedTag, 15) : [];
    similarListEl.innerHTML = '';
    list.forEach(function (h) {
      var sThumb = (typeof window.getThumbnailForHerb === 'function' && window.getThumbnailForHerb(h)) || getThumbnailPathFallback(h);
      var displayName = stripParentheticalFromName(h.korean_name || '');
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'herb-similar-card';
      card.setAttribute('data-herb-id', h.id);
      card.innerHTML = '<div class="herb-similar-thumb">' +
        (sThumb ? '<img src="' + escapeAttr(sThumb) + '" alt="">' : '<span class="herb-placeholder-txt">' + escapeHtml((displayName || '?')[0] || '?') + '</span>') +
        '</div><span class="herb-similar-name">' + escapeHtml(toModernKorean(displayName)) + '</span>';
      card.addEventListener('click', function () {
        openHerbIngredientModal(h);
      });
      similarListEl.appendChild(card);
    });
  }

  function updateIngredientModalNavButtons() {
    var prevBtn = document.querySelector('.herb-ingredient-nav-prev');
    var nextBtn = document.querySelector('.herb-ingredient-nav-next');
    var n = ingredientModalHerbList ? ingredientModalHerbList.length : 0;
    var canCycle = n > 1;
    if (prevBtn) prevBtn.disabled = !canCycle;
    if (nextBtn) nextBtn.disabled = !canCycle;
  }

  function resolveHerbsForModalNav(navList) {
    if (!navList || !Array.isArray(navList) || navList.length === 0) return null;
    var seen = {};
    var out = [];
    for (var i = 0; i < navList.length; i++) {
      var item = navList[i];
      var id = item && item.id;
      if (!id || seen[id]) continue;
      seen[id] = true;
      var full = herbs.find(function (h) { return h.id === id; });
      if (full) out.push(full);
    }
    return out.length > 0 ? out : null;
  }

  /** @param {object} herb
   *  @param {object[]=} navScopeHerbs 좌우 화살표 이동 범위 목록
   *  @param {boolean=} keepOrder true면 navScopeHerbs 순서를 그대로 유지 (트리맵 등) */
  function openHerbIngredientModal(herb, navScopeHerbs, keepOrder) {
    var modal = document.getElementById('herb-ingredient-modal');
    if (!modal || !herb) return;

    var list = null;
    var idx = -1;
    var resolvedNav = resolveHerbsForModalNav(navScopeHerbs);
    if (resolvedNav && resolvedNav.length > 0) {
      if (keepOrder) {
        // 트리맵 등: 전달된 순서 그대로 유지
        list = resolvedNav;
      } else {
        /* 효능 패널 그리드와 동일: korean_name 가나다 (efficacy-universe-2d.js sortHerbsByKoreanName) */
        list = resolvedNav.slice().sort(function (a, b) {
          return (a.korean_name || '').localeCompare(b.korean_name || '', 'ko-KR');
        });
      }
      idx = list.findIndex(function (h) { return h.id === herb.id; });
      if (idx < 0) list = null;
    }
    if (!list) {
      list = getFilteredList().slice().sort(function (a, b) {
        return (a.korean_name || '').localeCompare(b.korean_name || '', 'ko-KR');
      });
      idx = list.findIndex(function (h) { return h.id === herb.id; });
      if (idx < 0) {
        list = herbs.slice().sort(function (a, b) {
          return (a.korean_name || '').localeCompare(b.korean_name || '', 'ko-KR');
        });
        idx = list.findIndex(function (h) { return h.id === herb.id; });
      }
    }
    ingredientModalHerbList = list;
    ingredientModalHerbIndex = idx >= 0 ? idx : 0;

    updateHerbIngredientModalContent(herb);
    updateIngredientModalNavButtons();
    modal.setAttribute('aria-hidden', 'false');
  }

  function showPrevHerb() {
    var n = ingredientModalHerbList ? ingredientModalHerbList.length : 0;
    if (n <= 1) return;
    var i = ingredientModalHerbIndex;
    if (i < 0 || i >= n) i = 0;
    ingredientModalHerbIndex = (i - 1 + n) % n;
    var herb = ingredientModalHerbList[ingredientModalHerbIndex];
    if (herb) {
      updateHerbIngredientModalContent(herb);
      updateIngredientModalNavButtons();
    }
  }

  function showNextHerb() {
    var n = ingredientModalHerbList ? ingredientModalHerbList.length : 0;
    if (n <= 1) return;
    var i = ingredientModalHerbIndex;
    if (i < 0 || i >= n) i = 0;
    ingredientModalHerbIndex = (i + 1) % n;
    var herb = ingredientModalHerbList[ingredientModalHerbIndex];
    if (herb) {
      updateHerbIngredientModalContent(herb);
      updateIngredientModalNavButtons();
    }
  }

  function closeHerbIngredientModal() {
    if (ingredientGlbViewer) {
      ingredientGlbViewer.destroy();
      ingredientGlbViewer = null;
    }
    var glbEl = document.getElementById('herb-ingredient-glb');
    if (glbEl) {
      glbEl.setAttribute('aria-hidden', 'true');
      glbEl.style.display = 'none';
    }
    var imgEl = document.getElementById('herb-ingredient-img');
    if (imgEl) imgEl.style.display = '';
    var modal = document.getElementById('herb-ingredient-modal');
    if (modal) modal.setAttribute('aria-hidden', 'true');
  }

  function bindHerbIngredientModalClose() {
    var modal = document.getElementById('herb-ingredient-modal');
    var backdrop = modal ? modal.querySelector('.herb-ingredient-backdrop') : null;
    var closeBtn = modal ? modal.querySelector('.herb-ingredient-close') : null;
    if (backdrop) backdrop.addEventListener('click', closeHerbIngredientModal);
    if (closeBtn) closeBtn.addEventListener('click', closeHerbIngredientModal);

    document.addEventListener('keydown', function (e) {
      if (modal.getAttribute('aria-hidden') !== 'false') return;
      if (e.key === 'ArrowLeft') {
        showPrevHerb();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        showNextHerb();
        e.preventDefault();
      }
    });

    var prevNav = document.querySelector('.herb-ingredient-nav-prev');
    var nextNav = document.querySelector('.herb-ingredient-nav-next');
    if (prevNav) prevNav.addEventListener('click', function (e) { e.stopPropagation(); showPrevHerb(); });
    if (nextNav) nextNav.addEventListener('click', function (e) { e.stopPropagation(); showNextHerb(); });
  }

  /** body view의 증상 목록을 검색어·hotspot 선택에 맞게 갱신 */
  function refreshBodyDiseaseList() {
    var prescriptions = (typeof window !== 'undefined' && window.DONGUIBOGAM_PRESCRIPTIONS) ? window.DONGUIBOGAM_PRESCRIPTIONS : [];
    var base = state.bodyViewDiseaseIds && state.bodyViewDiseaseIds.length > 0
      ? prescriptions.filter(function (p) { return state.bodyViewDiseaseIds.indexOf(p.id) >= 0; })
      : prescriptions;
    var list = getFilteredPrescriptionsFromBase(base);
    fillBodyDiseaseList(list);
  }

  /** 기준 목록을 검색어로 필터링 */
  function getFilteredPrescriptionsFromBase(base) {
    var q = state.q.trim().toLowerCase();
    if (!q) return base;
    return base.filter(function (p) {
      var name = (p.name || '').toLowerCase();
      var formula = (p.formula || '').toLowerCase();
      var hanja = (p.hanja || '').toLowerCase();
      var desc = (p.description || '').toLowerCase();
      return name.indexOf(q) >= 0 || formula.indexOf(q) >= 0 || hanja.indexOf(q) >= 0 || desc.indexOf(q) >= 0;
    });
  }

  function fillBodyDiseaseList(prescriptionList) {
    var listPlaceholder = document.getElementById('body-disease-list-placeholder');
    var listEl = document.getElementById('body-disease-list');
    if (!listEl) return;
    var pEl = listPlaceholder ? listPlaceholder.querySelector('p') : null;
    if (pEl && prescriptionList.length === 0 && state.q.trim()) {
      pEl.innerHTML = '검색 조건에 맞는 처방이 없습니다.';
    } else if (pEl && prescriptionList.length === 0) {
      pEl.innerHTML = '왼쪽 인체 부위를 클릭하면<br>해당 증상 목록이 나옵니다';
    }
    listEl.innerHTML = prescriptionList.map(function (p) {
      return '<button type="button" class="disease-card" data-id="' + escapeAttr(p.id) + '" data-formula="' + escapeAttr(p.formula || '') + '">' +
        '<span class="disease-name">' + escapeHtml(p.name) + '</span>' +
        '<span class="disease-formula">' + escapeHtml(p.formula || '') + '</span>' +
        '</button>';
    }).join('');
    if (prescriptionList.length > 0) {
      if (listPlaceholder) listPlaceholder.setAttribute('aria-hidden', 'true');
      listEl.setAttribute('aria-hidden', 'false');
    } else {
      if (listPlaceholder) listPlaceholder.setAttribute('aria-hidden', 'false');
      listEl.setAttribute('aria-hidden', 'true');
    }
  }

  /* ── 처방 브라우저 (처방 탭) ── */
  var _prescViewBound = false;
  var _prescActiveTypeFilter = '';
  var _prescBodyPartFilter = '';
  var _PRESC_TYPE_NAMES = { tang: '탕', hwan: '환', san: '산', go: '고', dan: '단' };
  // 키 이름은 HTML body3d-chips의 data-part와 GLB partId 인코딩에 맞춰 둔 별칭일 뿐,
  // 한국어 해부학적 의미와는 어긋난다. 매핑은 다음과 같다:
  //   head  → 흉부 버튼,   chest → 복부 버튼,   abdomen → 신장·생식 버튼,   skull → 머리 버튼
  // 성별 공통(중성) 키워드. 성별-특이 키워드는 _GENDER_PART_KEYWORDS 로 분리.
  var _BODY_PART_KEYWORDS = {
    head:    ['기침', '천식', '가래', '폐', '불면', '심신', '담음', '심화', '심열', '불안', '두근', '심계', '흉', '인후', '목'],
    chest:   ['소화', '위장', '식욕', '구토', '구역', '비위', '변비', '설사', '장조', '복통', '위', '장', '부종', '소변불리'],
    abdomen: ['소변', '빈뇨', '신허', '신장', '혈허', '요통', '하복'],
    skull:   ['두통', '편두통', '어지럼', '중풍', '졸도', '코막힘', '눈', '시력', '이명', '발열', '오한', '감기', '고열', '두면', '안면', '귀'],
    arms:    ['관절', '풍습', '근골', '타박', '골절', '마비', '팔', '손', '관절통'],
    legs:    ['부종', '냉증', '수족', '습증', '다리', '발', '무릎', '관절통'],
    skin:    ['피부', '종기', '화상', '습진', '가려움', '화농', '악창', '독소', '염증', '상처'],
  };
  // 성별별로만 매핑되는 부위 키워드 — 활성 성별과 일치할 때만 부위 필터에 합류
  var _GENDER_PART_KEYWORDS = {
    female: {
      abdomen: ['생리', '월경', '산후', '부인', '임신', '오조', '안태', '유산', '대하', '붕루'],
    },
    male: {
      abdomen: ['유정', '신양', '양위', '음위', '조루'],
    },
  };
  // 반대 성별에서는 처방 자체를 목록에서 제외 (부위 필터 무관, 검색·전체 보기 때도 적용)
  var _GENDER_EXCLUDE_KEYWORDS = {
    male:   ['부인', '월경', '생리', '산후', '임신', '오조', '안태', '유산', '대하', '붕루'],
    female: ['유정', '양위', '음위', '조루'],
  };
  var _BODY_PART_LABELS = {
    head: '흉부', chest: '복부', abdomen: '신장·생식',
    skull: '머리', arms: '팔', legs: '다리', skin: '피부·기타',
  };
  var _prescGender = 'male';

  /* ── 제형 상세 데이터 ── */
  var PRESC_TYPE_DETAIL = {
    tang: {
      icon: '🍵',
      name: '탕',
      hanja: '湯 (탕)',
      img: 'asset/prescription/herbal_tang.png',
      summary: '약재를 물에 넣고 끓여 달인 액체를 복용하는 한의학의 가장 기본적인 제형입니다. 동의보감에 수록된 처방 중 가장 많은 비중을 차지하며, 급성 질환과 복잡한 증상에 폭넓게 활용됩니다.',
      trait: '흡수가 빠르고 효과가 신속하게 나타납니다. 약재의 성분이 물에 잘 용출되어 체내 흡수율이 높으며, 약재 배합에 따라 효능을 정밀하게 조절할 수 있습니다.',
      usage: '하루 1~2회, 식전 또는 식후 1시간에 따뜻하게 복용합니다. 약이 식으면 효력이 떨어질 수 있으므로 반드시 따뜻한 상태로 복용합니다.',
      efficacy: ['발한(發汗)', '해열(解熱)', '보기(補氣)', '활혈(活血)', '이수(利水)', '진해(鎭咳)'],
      formulas: ['계지탕(桂枝湯)', '마황탕(麻黃湯)', '사군자탕(四君子湯)', '육미탕(六味湯)', '소시호탕(小柴胡湯)'],
      guide: '급성 질환, 발열·오한 등 외감 증상, 빠른 효과가 필요한 경우에 적합합니다. 소화기가 약하거나 장기 복용이 필요한 경우에는 환·산 제형을 고려합니다.'
    },
    hwan: {
      icon: '⚪',
      name: '환',
      hanja: '丸 (환)',
      img: 'asset/prescription/herbal_whan.png',
      summary: '약재를 가루로 만든 후 꿀·밀가루풀·약즙 등의 결합제로 반죽하여 작고 둥근 알 모양으로 빚은 제형입니다. 오랜 기간 복용하는 보약이나 만성 질환에 가장 널리 사용됩니다.',
      trait: '효과가 완만하고 지속적으로 나타납니다. 소화 흡수 속도가 느려 위장에 자극이 적고, 장기 복용에 적합합니다. 꿀로 빚은 밀환(蜜丸)은 보익 효과가 뛰어납니다.',
      usage: '하루 2~3회, 식후 30분에 따뜻한 물이나 염탕수(소금물)와 함께 복용합니다. 알약 크기에 따라 1회 복용량이 다르므로 처방에 따릅니다.',
      efficacy: ['보양(補陽)', '보음(補陰)', '안신(安神)', '소화(消化)', '명목(明目)', '장수(長壽)'],
      formulas: ['팔미환(八味丸)', '공진단(拱辰丹)', '귀비환(歸脾丸)', '육미지황환(六味地黃丸)', '소합향원(蘇合香元)'],
      guide: '만성 허약·보양 목적, 장기 복용이 필요한 경우, 노인·허증 환자에게 적합합니다. 급성 질환이나 빠른 효과가 필요한 경우에는 탕 제형을 우선합니다.'
    },
    san: {
      icon: '🌾',
      name: '산',
      hanja: '散 (산)',
      img: 'asset/prescription/herbal_san.png',
      summary: '약재를 건조한 후 곱게 빻아 만든 가루 형태의 제형입니다. 조제가 간편하고 보관이 용이하며, 물이나 술·죽에 타서 복용하거나 직접 환부에 바르기도 합니다.',
      trait: '탕보다 효과는 완만하고 환보다는 빠릅니다. 소화 흡수 면적이 넓어 위장에서 쉽게 흡수됩니다. 열을 가하지 않아 휘발성 성분이 보존됩니다.',
      usage: '하루 2~3회, 따뜻한 물·미음·술 등에 타서 복용합니다. 외용 목적일 경우 환부에 직접 바르거나 붙입니다.',
      efficacy: ['지통(止痛)', '발한(發汗)', '건비(健脾)', '행기(行氣)', '소적(消積)', '지혈(止血)'],
      formulas: ['오령산(五苓散)', '향사평위산(香砂平胃散)', '패독산(敗毒散)', '익원산(益元散)', '평위산(平胃散)'],
      guide: '외감 초기, 소화 장애, 외상·피부 질환(외용)에 적합합니다. 방향성 성분이 많은 약재나 고열 처리 시 효능이 손상되는 약재에 활용합니다.'
    },
    go: {
      icon: '🍯',
      name: '고',
      hanja: '膏 (고)',
      img: 'asset/prescription/herbal_go.png',
      summary: '약재를 오랫동안 달인 후 여과하여 졸이거나 꿀·설탕 등을 더해 점성 있는 농축 형태로 만든 제형입니다. 내복용(膏方)과 외용(고약) 두 가지로 구분됩니다.',
      trait: '자양강장 효과가 지속적이며, 내복용은 흡수가 부드럽고 위장에 자극이 적습니다. 외용 고약은 환부에 직접 작용하여 소염·진통 효과를 냅니다.',
      usage: '내복: 하루 1~2회, 따뜻한 물에 녹여 식전에 복용합니다. 외용: 환부를 깨끗이 씻은 후 얇게 도포하고 거즈로 덮어 고정합니다.',
      efficacy: ['자음(滋陰)', '보혈(補血)', '윤조(潤燥)', '소염(消炎)', '진통(鎭痛)', '수렴(收斂)'],
      formulas: ['경옥고(瓊玉膏)', '익수고(益壽膏)', '자하거고(紫河車膏)', '청심연자고(淸心蓮子膏)'],
      guide: '소모성 질환, 음허(陰虛)·혈허(血虛) 상태, 장기 자양강장이 필요한 경우에 적합합니다. 만성 피부 질환, 관절통, 근육통의 외용에도 활용합니다.'
    },
    dan: {
      icon: '💊',
      name: '단',
      hanja: '丹 (단)',
      img: 'asset/prescription/herbal_dan.png',
      summary: '귀한 광물성 약재나 동물성 약재를 포함하여 정제된 방식으로 만든 소량 고효능 제형입니다. 제조 과정이 정밀하고 약재 배합이 엄격하여 한의학 제형 중 가장 귀한 것으로 여겨집니다.',
      trait: '소량으로도 강력한 효능을 발휘합니다. 귀한 약재를 집약적으로 사용하여 정신·의식 관련 증상이나 응급 상황에 효과가 빠릅니다.',
      usage: '1회 소량(대개 1~3g), 따뜻한 물 또는 생강탕·술과 함께 복용합니다. 과량 복용 시 독성이 있을 수 있으므로 반드시 처방에 따라 복용합니다.',
      efficacy: ['개규(開竅)', '안신(安神)', '해독(解毒)', '활혈(活血)', '강심(强心)', '진경(鎭痙)'],
      formulas: ['우황청심원(牛黃淸心元)', '안궁우황환(安宮牛黃丸)', '소합향원(蘇合香元)', '자설단(紫雪丹)', '지보단(至寶丹)'],
      guide: '심신 불안, 의식 혼탁, 중풍 응급 등 급성 신경 증상에 적합합니다. 귀하고 강한 약재를 사용하므로 남용을 삼가고 전문가의 처방에 따라 복용합니다.'
    }
  };

  function openPrescDetail() {
    var modal  = document.getElementById('presc-detail-modal');
    var dashEl = document.getElementById('presc-dashboard');
    if (!modal || !dashEl) return;

    var TYPES = ['tang', 'hwan', 'san', 'go', 'dan'];

    /* ── 제형별 상세 카드 5개 ── */
    var html = '<div class="pcd-cards">';

    TYPES.forEach(function (t) {
      var d = PRESC_TYPE_DETAIL[t];
      html += '<article class="pcd-card pcd-card-' + t + '">';

      html += '<div class="pcd-card-head pcd-col-' + t + '">';
      html += '<span class="pcd-card-hanja-main">' + escapeHtml(d.hanja.split(' ')[0]) + '</span>';
      html += '<span class="pcd-card-name-sub">' + escapeHtml(d.name) + '</span>';
      html += '</div>';

      if (d.img) {
        html += '<div class="pcd-card-img-wrap">';
        html += '<img class="pcd-card-img" src="' + escapeAttr(d.img) + '" alt="' + escapeAttr(d.name) + ' 제형 사진" loading="lazy">';
        html += '</div>';
      }

      html += '<p class="pcd-card-summary">' + escapeHtml(d.summary) + '</p>';

      html += '<div class="pcd-card-block">';
      html += '<span class="pcd-block-label">특성</span>';
      html += '<p class="pcd-block-text">' + escapeHtml(d.trait) + '</p>';
      html += '</div>';

      html += '<div class="pcd-card-block">';
      html += '<span class="pcd-block-label">복용 방법</span>';
      html += '<p class="pcd-block-text">' + escapeHtml(d.usage) + '</p>';
      html += '</div>';

      html += '<div class="pcd-card-block">';
      html += '<span class="pcd-block-label">대표 효능</span>';
      html += '<div class="pcd-tags">';
      d.efficacy.forEach(function (tag) {
        html += '<span class="pcd-tag pcd-col-' + t + '">' + escapeHtml(tag) + '</span>';
      });
      html += '</div></div>';


      html += '</article>';
    });

    html += '</div>';

    dashEl.innerHTML = html;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closePrescDetail() {
    var modal = document.getElementById('presc-detail-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderPrescView() {
    var prescriptions = (window.DONGUIBOGAM_PRESCRIPTIONS) || [];
    var gridEl = document.getElementById('presc-grid');
    if (!gridEl) return;

    function matchesSearch(p, q) {
      if (!q) return true;
      var haystack = ((p.formula || '') + ' ' + (p.name || '') + ' ' + (p.hanja || '') + ' ' + (p.description || '') + ' ' + (p.type_label || '')).toLowerCase();
      return haystack.indexOf(q) >= 0;
    }

    function fillGrid() {
      var q = state.q.trim().toLowerCase();
      var excludeKws = _GENDER_EXCLUDE_KEYWORDS[_prescGender] || [];
      var genderExtra = (_GENDER_PART_KEYWORDS[_prescGender] || {});
      var list = prescriptions.filter(function (p) {
        var typeOk = _prescActiveTypeFilter ? p.type === _prescActiveTypeFilter : true;
        var searchOk = matchesSearch(p, q);
        var hayBase = ((p.name || '') + ' ' + (p.description || '')).toLowerCase();
        var genderOk = !excludeKws.some(function(kw) { return hayBase.indexOf(kw) >= 0; });
        var partOk = true;
        if (_prescBodyPartFilter) {
          var kws = (_BODY_PART_KEYWORDS[_prescBodyPartFilter] || []).concat(genderExtra[_prescBodyPartFilter] || []);
          partOk = kws.length > 0 && kws.some(function(kw) { return hayBase.indexOf(kw) >= 0; });
        }
        return typeOk && searchOk && partOk && genderOk;
      }).sort(function (a, b) {
        var an = ((a.formula || '').split(' ')[0]) || a.name || '';
        var bn = ((b.formula || '').split(' ')[0]) || b.name || '';
        return an.localeCompare(bn, 'ko-KR');
      });

      /* 필터 상태 바 */
      var pfsLabel = document.getElementById('pfs-label');
      var pfsResetBtn = document.getElementById('pfs-reset');
      if (pfsLabel) {
        var hasFilter = _prescActiveTypeFilter || q || _prescBodyPartFilter;
        if (hasFilter) {
          var parts = [];
          if (_prescBodyPartFilter) parts.push(_BODY_PART_LABELS[_prescBodyPartFilter] || _prescBodyPartFilter);
          if (_prescActiveTypeFilter) parts.push(_PRESC_TYPE_NAMES[_prescActiveTypeFilter] + ' 제형');
          if (q) parts.push('"' + q + '"');
          pfsLabel.textContent = parts.join(' · ') + ' · ' + list.length + '개';
        } else {
          pfsLabel.textContent = '가나다순 · ' + list.length + '개';
        }
        if (pfsResetBtn) pfsResetBtn.hidden = !hasFilter;
      }

      gridEl.innerHTML = list.length === 0
        ? '<div class="empty-message presc-empty-message">' +
            '<img class="empty-message-icon" src="asset/main/ico_noResult.png" alt="">' +
            '<p class="empty-message-text">검색·필터 조건에 맞는 처방이 없습니다.</p>' +
          '</div>'
        : list.map(function (p) {
          var typeLabel = p.type_label || '';
          var typeClass = 'ptag-' + (p.type || 'all');
          var formulaName = (p.formula || '').split(' ')[0];
          var desc = (p.description || '').trim();
          return '<button type="button" class="presc-card ' + typeClass + '" data-id="' + escapeAttr(p.id) + '">' +
            '<span class="presc-card-type">' + escapeHtml(typeLabel) + '</span>' +
            '<span class="presc-card-name">' + escapeHtml(formulaName) + '</span>' +
            (desc ? '<span class="presc-card-desc">' + escapeHtml(desc) + '</span>' : '') +
            '</button>';
        }).join('');
    }

    fillGrid();

    if (!_prescViewBound) {
      _prescViewBound = true;

      /* body3d 부위 선택 이벤트 수신 */
      document.addEventListener('body3dPartSelected', function(e) {
        _prescBodyPartFilter = e.detail.partId || '';
        fillGrid();
      });

      /* body3d 성별 변경 이벤트 수신 — 성별 특이 처방 필터링 */
      document.addEventListener('body3dGenderChanged', function(e) {
        _prescGender = e.detail.gender || 'male';
        fillGrid();
      });

      /* 제형 탭 클릭 */
      var typeRow = document.getElementById('presc-type-row');
      if (typeRow) {
        typeRow.addEventListener('click', function (e) {
          if (e.target.closest('.presc-compare-btn')) return; /* 비교 버튼은 별도 처리 */
          var btn = e.target.closest('.presc-type-card');
          if (!btn) return;
          typeRow.querySelectorAll('.presc-type-card').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          _prescActiveTypeFilter = btn.getAttribute('data-ptype') || '';
          fillGrid();
        });

        /* 제형 카드 hover → 우측 컬럼에 이미지 프리뷰 표시
           - 카드 아래에 떠 있는 카드 형태로 표시
           - data-img 속성이 있는 카드만 활성화 (전체 버튼은 제외) */
        var previewEl   = document.getElementById('presc-type-preview');
        var previewImg  = document.getElementById('presc-type-preview-img');
        var previewCap  = document.getElementById('presc-type-preview-cap');
        if (previewEl && previewImg && previewCap) {
          var capByType = {
            tang: { title: '탕(湯) · 달인 액체', desc: ['약재를 물에 넣고 끓여 달인 액체를 복용하는 한의학의 가장 기본적인 제형', '동의보감에 수록된 처방 중 가장 많은 비중을 차지', '급성 질환과 복잡한 증상에 폭넓게 사용'] },
            hwan: { title: '환(丸) · 둥글게 빚은 형태', desc: ['약재를 가루로 만든 후 꿀·밀가루·약즙 등의 결합체로 반죽하여 작고 둥근 알 모양으로 빚은 제형', '오랜 기간 복용하는 보약이나 만성 질환에 널리 사용'] },
            san:  { title: '산(散) · 곱게 빻은 가루', desc: ['약재를 건조한 후 곱게 빻아 만든 가루 형태의 제형', '조제가 간편하고 보관이 용이', '물·술·즙 등에 타서 복용하거나 직접 환부에 발라 사용'] },
            go:   { title: '고(膏) · 농축 졸임액', desc: ['약재를 오랫동안 달인 후 여과하여 졸이거나 꿀·설탕 등을 더해 점성 있는 농축 형태로 만든 제형', '먹는 내복고와 피부에 바르는 외용고로 나뉨'] },
            dan:  { title: '단(丹) · 단련 환약', desc: ['귀한 광물성 약재나 동물성 약재를 포함하여 정제된 방식으로 만든 제형', '약재 배합이 엄격하여 한의학 제형 중 가장 귀한 것으로 여김', '소량 고효능으로 응급상황에 빠른 효과'] }
          };
          function _showPrescTypePreview(card) {
            var src = card.getAttribute('data-img');
            var type = card.getAttribute('data-ptype') || '';
            if (!src) return;
            var info = capByType[type] || {};
            previewImg.src = src;
            previewImg.alt = info.title || '';
            var titleEl = previewCap.querySelector('.ptc-preview-title');
            var descEl  = previewCap.querySelector('.ptc-preview-desc');
            if (titleEl) titleEl.textContent = info.title || '';
            if (descEl)  descEl.innerHTML = (info.desc || []).map(function(line) {
              return '<span class="ptc-desc-line"><span class="ptc-bullet">·</span><span class="ptc-bullet-text">' + line + '</span></span>';
            }).join('');
            /* position: fixed 기준 → viewport 좌표 그대로 사용 (overflow/stacking 회피) */
            var cardRect = card.getBoundingClientRect();
            var cx = cardRect.left + cardRect.width / 2;
            var cy = cardRect.bottom + 8;
            previewEl.style.left = cx + 'px';
            previewEl.style.top  = cy + 'px';
            previewEl.setAttribute('aria-hidden', 'false');
          }
          function _hidePrescTypePreview() {
            previewEl.setAttribute('aria-hidden', 'true');
          }
          /* 이벤트 위임 — 카드가 동적으로 추가되더라도 동작 */
          typeRow.addEventListener('mouseover', function (e) {
            var card = e.target.closest('.presc-type-card[data-img]');
            if (card) _showPrescTypePreview(card);
          });
          typeRow.addEventListener('mouseout', function (e) {
            var card = e.target.closest('.presc-type-card[data-img]');
            if (!card) return;
            /* mouseout이 자식 요소(span)로 이동할 때도 발생 — 실제 카드 밖으로 나갔는지 확인 */
            var to = e.relatedTarget;
            if (to && card.contains(to)) return;
            _hidePrescTypePreview();
          });
          typeRow.addEventListener('focusin', function (e) {
            var card = e.target.closest('.presc-type-card[data-img]');
            if (card) _showPrescTypePreview(card);
          });
          typeRow.addEventListener('focusout', _hidePrescTypePreview);
        }
      }

      /* 제형 비교 버튼 */
      var compareBtn = document.getElementById('presc-compare-btn');
      if (compareBtn) {
        compareBtn.addEventListener('click', function () {
          openPrescDetail();
        });
      }

      /* 제형 상세 팝업 닫기 */
      var detailModal = document.getElementById('presc-detail-modal');
      if (detailModal) {
        var closeBtn = detailModal.querySelector('.presc-detail-close');
        var backdrop = detailModal.querySelector('.presc-detail-backdrop');
        if (closeBtn) closeBtn.addEventListener('click', closePrescDetail);
        if (backdrop) backdrop.addEventListener('click', closePrescDetail);
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && detailModal.getAttribute('aria-hidden') === 'false') {
            closePrescDetail();
          }
        });
      }

      /* 필터 초기화 버튼 */
      var pfsResetBtn = document.getElementById('pfs-reset');
      if (pfsResetBtn) {
        pfsResetBtn.addEventListener('click', function () {
          _prescActiveTypeFilter = '';
          _prescBodyPartFilter = '';
          /* 3D 뷰어 칩도 초기화 */
          document.querySelectorAll('.body3d-chip').forEach(function(c) {
            c.classList.toggle('body3d-chip--active', c.dataset.part === '');
          });
          var labelEl = document.getElementById('body3d-selected-label');
          if (labelEl) labelEl.classList.remove('visible');
          state.q = '';
          var searchEl = document.getElementById('search-herb');
          if (searchEl) searchEl.value = '';
          var typeRow = document.getElementById('presc-type-row');
          if (typeRow) {
            typeRow.querySelectorAll('.presc-type-card').forEach(function (b) { b.classList.remove('active'); });
            var allBtn = typeRow.querySelector('.presc-type-card[data-ptype=""]');
            if (allBtn) allBtn.classList.add('active');
          }
          if (typeof window.__prescBodyViewerReset === 'function') window.__prescBodyViewerReset();
          fillGrid();
        });
      }

      /* 처방 카드 클릭 → 웹캠 게임 시작 */
      gridEl.addEventListener('click', function (e) {
        var card = e.target.closest('.presc-card');
        if (!card) return;
        var id = card.getAttribute('data-id');
        if (!id) return;
        if (typeof window.Patient3D !== 'undefined' && window.Patient3D.setGender) {
          window.Patient3D.setGender(_prescGender);
        }
        if (typeof window.HerbHandGame !== 'undefined' && typeof window.HerbHandGame.startById === 'function') {
          /* 처방 탭의 부위 필터 키(GLB partId 별칭)를 게임 좌표계(PAIN_PART_MAP 키)로 변환해
             전달해야, 한 처방이 여러 부위 키워드에 걸릴 때도 진입한 필터의 부위가 강조된다.
             script.js   head=흉부 chest=복부 abdomen=신장·생식 skull=머리
             hand-game   head=머리 chest=흉부 stomach=복부 abdomen=신장·생식 torso=피부 */
          var SCRIPT_TO_GAME_PART = {
            head: 'chest', chest: 'stomach', abdomen: 'abdomen',
            skull: 'head', arms: 'arms', legs: 'legs', skin: 'torso'
          };
          if (typeof window.HerbHandGame.setActiveBodyFilter === 'function') {
            window.HerbHandGame.setActiveBodyFilter(SCRIPT_TO_GAME_PART[_prescBodyPartFilter] || null);
          }
          window.HerbHandGame.startById(id);
        }
      });

      /* 제형 카드 행 sticky 압축: 스크롤 컨테이너의 scrollTop 기반 히스테리시스로 토글.
         IO 방식은 압축 시 행 높이 감소 → 콘텐츠 적을 때 scrollTop 클램프 → 센티넬 재등장 → 토글 반복
         으로 떨림이 발생하므로 사용하지 않는다. */
      (function () {
        var sentinel = document.getElementById('presc-type-sentinel');
        var row = document.getElementById('presc-type-row');
        if (!sentinel || !row) return;

        var scroller = row.closest('.presc-right-col') || row.parentElement;
        if (!scroller) return;

        function updateStickyTop() {
          var header = document.querySelector('.header-glass');
          var h = header ? header.getBoundingClientRect().height : 0;
          document.documentElement.style.setProperty('--presc-sticky-top', h + 'px');
        }
        updateStickyTop();
        window.addEventListener('resize', updateStickyTop, { passive: true });

        /* 진입/이탈 임계점을 다르게 두어 토글 채터링 방지 */
        var ENTER = 24;  /* 이 값 이상 스크롤되면 압축 진입 */
        var EXIT  = 8;   /* 이 값 미만으로 되돌아오면 압축 해제 */
        var ticking = false;
        function update() {
          ticking = false;
          var y = scroller.scrollTop;
          if (row.classList.contains('is-sticky')) {
            if (y < EXIT) row.classList.remove('is-sticky');
          } else {
            if (y > ENTER) row.classList.add('is-sticky');
          }
        }
        scroller.addEventListener('scroll', function () {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(update);
        }, { passive: true });
        update();
      }());
    }
  }

  /** 분류 버튼 문구 동기화: 선택된 상세가 있으면 "식물-곡부" 형태로 표시 */
  function syncMainCategoryButtonLabels() {
    document.querySelectorAll('[data-filter-main]').forEach(function (btn) {
      var main = btn.getAttribute('data-filter-main');
      var baseLabel = CATEGORY_LABELS[main] || main;
      if (state.mainCategory === main && state.subCategory) {
        var subLabel = (SUB_CATEGORY_LABELS && SUB_CATEGORY_LABELS[state.subCategory]) ? SUB_CATEGORY_LABELS[state.subCategory] : state.subCategory;
        btn.textContent = baseLabel + '-' + subLabel;
      } else {
        btn.textContent = baseLabel;
      }
    });
  }

  function renderSubCategoryChips(mainCat) {
    var wrap = document.getElementById('sub-category-wrap');
    var container = document.querySelector('.sub-category-chips[data-role="sub-category-chips"]');
    if (!wrap || !container) return;
    var subs = SUB_CATEGORIES[mainCat] || [];
    if (subs.length === 0) {
      wrap.setAttribute('aria-hidden', 'true');
      wrap.classList.remove('visible');
      container.innerHTML = '';
      return;
    }
    wrap.setAttribute('aria-hidden', 'false');
    wrap.classList.add('visible');
    container.innerHTML = subs.map(function (s) {
      var label = (SUB_CATEGORY_LABELS && SUB_CATEGORY_LABELS[s]) ? SUB_CATEGORY_LABELS[s] : s;
      return '<button type="button" class="sub-category-btn" data-filter-sub="' + escapeAttr(s) + '">' + escapeHtml(label) + '</button>';
    }).join('');
    document.querySelectorAll('.sub-category-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var sub = this.getAttribute('data-filter-sub');
        state.subCategory = state.subCategory === sub ? '' : sub;
        document.querySelectorAll('.sub-category-btn').forEach(function (x) { x.classList.toggle('active', x.getAttribute('data-filter-sub') === state.subCategory); });
        update();
        wrap.classList.remove('visible');
        wrap.setAttribute('aria-hidden', 'true');
        syncMainCategoryButtonLabels();
      });
      b.classList.toggle('active', b.getAttribute('data-filter-sub') === state.subCategory);
    });
  }

  function bindFilters() {
    var searchEl = document.getElementById('search-herb');
    if (searchEl) {
      var _searchTimer = null;
      searchEl.addEventListener('input', function () {
        state.q = searchEl.value;
        if (state.viewMode === 'efficacy') {
          if (_searchTimer) clearTimeout(_searchTimer);
          _searchTimer = setTimeout(function () { _searchTimer = null; update(); }, 350);
        } else {
          update();
        }
      });
    }
    document.querySelectorAll('[data-filter-main]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var main = this.getAttribute('data-filter-main');
        var wrap = document.getElementById('sub-category-wrap');
        var chips = document.querySelector('.sub-category-chips[data-role="sub-category-chips"]');
        var popupOpen = !!wrap && wrap.classList.contains('visible');
        function closePopup() {
          if (wrap) { wrap.classList.remove('visible'); wrap.setAttribute('aria-hidden', 'true'); }
        }
        // 3단계 토글: ①선택(하위 팝업 열기) → ②다시 클릭(팝업 닫고 카테고리 전체 표시) → ③다시 클릭(해제)
        if (state.mainCategory !== main) {
          // ① 새 카테고리 선택 — 하위 팝업 열기 (이 시점에도 목록은 카테고리 전체)
          state.mainCategory = main;
          state.subCategory = '';
          renderSubCategoryChips(main);
        } else if (popupOpen || state.subCategory) {
          // ② 같은 카테고리 + (팝업 열림 또는 하위 선택됨) — 팝업 닫고 하위 해제 → 카테고리 전체 표시
          state.subCategory = '';
          closePopup();
        } else {
          // ③ 같은 카테고리 + 팝업 닫힘 — 필터 해제
          state.mainCategory = '';
          state.subCategory = '';
          closePopup();
          if (chips) chips.innerHTML = '';
        }
        syncMainCategoryButtonLabels();
        document.querySelectorAll('[data-filter-main]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-filter-main') === state.mainCategory); });
        update();
      });
    });
    document.querySelectorAll('.function-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = this.getAttribute('data-function');
        if (!tag) return;
        var idx = state.selectedTags.indexOf(tag);
        if (idx >= 0) state.selectedTags.splice(idx, 1);
        else state.selectedTags.push(tag);
        this.classList.toggle('active', state.selectedTags.indexOf(tag) >= 0);
        update();
      });
    });
    var resetBtn = document.getElementById('filter-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.q = '';
        state.mainCategory = '';
        state.subCategory = '';
        state.selectedTags = [];
        var searchEl = document.getElementById('search-herb');
        if (searchEl) searchEl.value = '';
        document.querySelectorAll('[data-filter-main]').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.function-filter').forEach(function (b) { b.classList.remove('active'); });
        var subWrap = document.getElementById('sub-category-wrap');
        if (subWrap) {
          subWrap.setAttribute('aria-hidden', 'true');
          subWrap.classList.remove('visible');
        }
        var subChips = document.querySelector('.sub-category-chips[data-role="sub-category-chips"]');
        if (subChips) subChips.innerHTML = '';
        if (typeof syncMainCategoryButtonLabels === 'function') syncMainCategoryButtonLabels();
        update();
      });
    }
  }

  function bindViewTabs() {
    document.querySelectorAll('[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = this.getAttribute('data-view');
        setViewMode(view);
        if (typeof window._updateStickyHeader === 'function') window._updateStickyHeader();
        if (view === 'list') update();
      });
    });
  }

  /** 모바일(768px 이하)에서 데이터 탭 라벨을 짧게 표시 */
  function syncViewTabLabelsMobile() {
    var dataTab = document.getElementById('view-data');
    if (!dataTab) return;
    var short = window.matchMedia('(max-width: 768px)').matches;
    dataTab.textContent = '가치';
  }

  function startSearchRotatingText() {
    var hintEl = document.getElementById('search-rotating-hint');
    var inputEl = document.getElementById('search-herb');
    var wrapEl = document.querySelector('.header-search-inner');
    if (!hintEl || !inputEl) return;

    var phrases = [
      '두통이 있으신가요?',
      '피로 회복이 필요하신가요?',
      '소화가 잘 안 되시나요?',
      '면역력을 키우고 싶으신가요?',
      '혈액 순환이 걱정이신가요?',
      '심신이 불안정하신가요?',
      '부기가 있으신가요?',
      '기력이 떨어지셨나요?',
      '기침·가래가 있으신가요?',
      '열이 나거나 염증이 있으신가요?',
      '피부 해독이 필요하신가요?',
      '동의보감 처방을 찾아보세요.'
    ];
    var idx = 0;
    var intervalId = null;
    var fadeDuration = 400;

    function tick() {
      hintEl.classList.add('rolling-fade-out');
      setTimeout(function () {
        hintEl.textContent = phrases[idx];
        idx = (idx + 1) % phrases.length;
        hintEl.classList.remove('rolling-fade-out');
      }, fadeDuration);
    }
    function startRolling() {
      if (intervalId) return;
      hintEl.classList.remove('hidden');
      hintEl.setAttribute('aria-hidden', 'false');
      inputEl.placeholder = '';
      tick();
      intervalId = setInterval(tick, 3800);
    }
    function stopRolling() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      hintEl.classList.add('hidden');
      hintEl.setAttribute('aria-hidden', 'true');
      inputEl.placeholder = '약재·처방 검색 (한글, 영문, 학명, 효능)';
    }

    inputEl.addEventListener('focus', function () {
      stopRolling();
      if (wrapEl) wrapEl.classList.add('focused');
    });
    inputEl.addEventListener('blur', function () {
      if (wrapEl) wrapEl.classList.remove('focused');
      if (inputEl.value.trim() === '') startRolling();
    });

    if (wrapEl) {
      wrapEl.addEventListener('click', function () {
        if (document.activeElement !== inputEl) inputEl.focus();
      });
    }

    startRolling();
  }

  function renderEfficacyFilters() {
    var container = document.querySelector('.function-filters[data-efficacy-source="effect-efficacy-map"]');
    if (!container) return;
    var allTags = (typeof window !== 'undefined' && window.DONGUIBOGAM_EFFICACY_TAGS && window.DONGUIBOGAM_EFFICACY_TAGS.length > 0)
      ? window.DONGUIBOGAM_EFFICACY_TAGS.slice()
      : ['기력보강', '면역강화', '열내림', '염증완화', '심신안정', '혈액순환', '부종완화', '피부해독', '소화력강화'];
    var tagCounts = {};
    allTags.forEach(function (tag) { tagCounts[tag] = 0; });
    herbs.forEach(function (h) {
      (h.tags || []).forEach(function (t) {
        if (tagCounts.hasOwnProperty(t)) tagCounts[t]++;
      });
    });
    allTags.sort(function (a, b) {
      return (tagCounts[b] - tagCounts[a]) || (a.localeCompare(b, 'ko-KR'));
    });
    var topCount = 9;
    var primaryTags = allTags.slice(0, topCount);
    var moreTags = allTags.slice(topCount);
    var primaryHtml = primaryTags.map(function (tag) {
      return '<button type="button" class="function-filter" data-function="' + escapeAttr(tag) + '">' + escapeHtml(tag) + '</button>';
    }).join('');
    var moreHtml = moreTags.length > 0
      ? '<span class="function-filters-more" id="efficacy-filters-more" aria-hidden="true">'
        + moreTags.map(function (tag) {
          return '<button type="button" class="function-filter" data-function="' + escapeAttr(tag) + '">' + escapeHtml(tag) + '</button>';
        }).join('')
        + '</span><button type="button" class="efficacy-more-btn" id="efficacy-more-btn" aria-expanded="false">+ 더보기</button>'
      : '';
    container.innerHTML = primaryHtml + moreHtml;
    var moreWrap = document.getElementById('efficacy-filters-more');
    var moreBtn = document.getElementById('efficacy-more-btn');
    if (moreBtn && moreWrap) {
      moreBtn.addEventListener('click', function () {
        var expanded = moreWrap.classList.toggle('visible');
        moreBtn.setAttribute('aria-expanded', expanded);
        moreBtn.textContent = expanded ? '접기' : '+ 더보기';
      });
    }
  }

  function loadEffectData() {
    if (typeof window !== 'undefined' && window.EFFECT_DATA && Array.isArray(window.EFFECT_DATA)) {
      effectData = window.EFFECT_DATA;
      return;
    }
    fetch('effect.json')
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (arr) { effectData = Array.isArray(arr) ? arr : []; effectById = null; })
      .catch(function () { effectData = []; });
  }

  function init() {
    loadEffectData();
    renderEfficacyFilters();
    syncMainCategoryButtonLabels();
    document.querySelectorAll('[data-filter-main]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-filter-main') === state.mainCategory);
    });
    document.querySelectorAll('.function-filter').forEach(function (b) {
      var tag = b.getAttribute('data-function');
      b.classList.toggle('active', state.selectedTags.indexOf(tag) >= 0);
    });
    initChapterTabs();
    initChaptersModal();
    initHorizontalTimeline();
    initStoryReveal();
    initHyangQuoteBrush();
    bindFilters();
    bindViewTabs();
    syncViewTabLabelsMobile();
    window.addEventListener('resize', syncViewTabLabelsMobile);
    initEfficacyHelpPopup();
    initCoachmarks();
    bindHero();
    startSearchRotatingText();
    bindHerbIngredientModalClose();
    initStickyListHeader();
    initTopButton();
    initOverviewAnchorNav();
    window.openHerbIngredientModal = openHerbIngredientModal;
    setViewMode('list');
    update();
  }

  function initChapterTabs() {
    var tabs = document.querySelectorAll('.dgbg-chapters-tab');
    var panels = document.querySelectorAll('.dgbg-chapters-panel');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-chapter');
        tabs.forEach(function (t) {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-chapter') === target);
        });
      });
    });
  }

  function initChaptersModal() {
    var modal = document.getElementById('dgbg-chapters-modal');
    if (!modal || modal.dataset.bound === '1') return;
    modal.dataset.bound = '1';

    var opener = document.querySelector('[data-open-chapters]');
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var closeBtn = modal.querySelector('.dgbg-chapters-modal-close');
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if (opener) {
      opener.addEventListener('click', open);
      opener.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    }
    modal.querySelectorAll('[data-close-chapters]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') close();
    });
  }

  function initHorizontalTimeline() {
    if (initHorizontalTimeline._done) return;
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.dgbg-htl-node'));
    if (!nodes.length) return;
    initHorizontalTimeline._done = true;

    var details = document.querySelectorAll('.dgbg-htl-detail');
    // 설명글: 문장이 '다.'로 끝날 때마다 줄바꿈(<br>)
    document.querySelectorAll('.dgbg-htl-detail-desc').forEach(function (p) {
      if (p.dataset.brDone) return;
      p.dataset.brDone = '1';
      p.innerHTML = p.innerHTML.replace(/다\.\s+/g, '다.<br>');
    });
    var scroller = document.querySelector('.dgbg-htl-scroll');
    var track = document.querySelector('.dgbg-htl-track');
    var wrapper = document.querySelector('.dgbg-htl-wrapper');
    var introPanel = document.querySelector('.dgbg-intro-panel');
    var section = document.getElementById('ov-dgbg');
    var yearEl = document.getElementById('dgbg-active-year');
    var AUTO_MS = 5000;

    // data-htl-idx → 노드 매핑 (DOM 순서와 분리)
    var byIdx = {};
    nodes.forEach(function (n) { byIdx[n.getAttribute('data-htl-idx')] = n; });
    // 가지(계보·해외 전파)는 기본 숨김 → 해당 본류 노드가 활성일 때만 스르륵 등장
    var lineageBranch = track ? track.querySelector('.dgbg-htl-branch') : null;
    var spreadBranch = track ? track.querySelector('.dgbg-htl-jbranch') : null;
    var LINEAGE_KEYS = ['3', '0', '1', '2']; // 편찬 시작 + 계보 노드들
    var SPREAD_KEYS = ['6', '14', '15'];     // 완성·간행 + 전파 노드들
    // 연도(htlIdx)별 배경 이미지 파일명 (asset/background/<값>.png)
    var BG_IMAGES = { '3': '1596', '4': '1597', '5': '1608', '6': '1613', '7': '1799', '8': '1884', '9': '1910', '10': '1951', '12': '2009' };
    // 자동 진행 순서 — 본류(1596→2026)만 순회. 계보(0,1,2)·해외 전파(14,15) 가지는
    // 자동에서 제외하고 클릭으로만 볼 수 있다.
    var ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].filter(function (i) {
      return byIdx[i];
    });

    var pos = -1;
    var autoTimer = null;
    var userTook = false;
    var inView = false;
    var introDone = false;     // 인트로(1596-2026 → 1596 → 편찬시작) 완료 여부
    var introTimers = [];       // 인트로 예약 타이머 (사용자 클릭 시 취소)

    // 해당 연도(htlIdx)에 배경 이미지가 있으면 패널 뒤에 표시 (asset/background/<연도>.png)
    // 2026(오늘날, idx 13)은 사진 대신 은은하게 흐르는 무지개빛 그라데이션
    function applyBg(key) {
      if (!introPanel) return;
      var k = String(key);
      var isNow = (k === '13');
      introPanel.classList.toggle('dgbg-bg-aurora', isNow);
      if (isNow) {
        introPanel.classList.remove('dgbg-bg-on');
        return;
      }
      var bgYear = BG_IMAGES[k];
      if (bgYear) {
        // var()로 넘긴 url은 이 변수를 소비하는 CSS 파일(css/data.css) 기준으로 해석되므로 ../ 필요
        introPanel.style.setProperty('--dgbg-bg-img', 'url("../asset/background/' + bgYear + '.png")');
        introPanel.classList.add('dgbg-bg-on');
      } else {
        introPanel.classList.remove('dgbg-bg-on');
      }
    }

    function setActive(htlIdx, skipInk) {
      var key = String(htlIdx);
      nodes.forEach(function (n) {
        n.classList.toggle('active', n.getAttribute('data-htl-idx') === key);
      });
      details.forEach(function (d) {
        d.classList.toggle('active', d.getAttribute('data-htl-idx') === key);
      });
      updateBranches(key);
      applyBg(key); // 해당 연도 배경 이미지 표시/해제
      var node = byIdx[key];
      if (!node) return;
      var yEl = node.querySelector('.dgbg-htl-node-year');
      if (yearEl && yEl && !skipInk) {
        // 선택된 연도 숫자도 향약 인용과 같은 먹 번짐으로 나타난다
        inkifyYear(yEl.textContent);
      }
      if (scroller) {
        // offsetLeft는 absolute 가지 노드에서 부정확 → 화면 좌표로 보정
        var nr = node.getBoundingClientRect();
        var sr = scroller.getBoundingClientRect();
        var target = scroller.scrollLeft + (nr.left - sr.left) - (scroller.clientWidth - nr.width) / 2;
        scroller.scrollTo({ left: target, behavior: 'smooth' });
      }
    }

    function goTo(p) {
      pos = (p + ORDER.length) % ORDER.length;
      setActive(ORDER[pos]);
    }

    // 활성 노드에 따라 계보(1596 위)·전파(1613 위) 가지를 스르륵 보이고/숨긴다
    function updateBranches(key) {
      var lineageOpen = LINEAGE_KEYS.indexOf(key) >= 0;
      var spreadOpen = SPREAD_KEYS.indexOf(key) >= 0;
      if (lineageBranch) lineageBranch.classList.toggle('is-revealed', lineageOpen);
      if (spreadBranch) spreadBranch.classList.toggle('is-revealed', spreadOpen);
      if (track) {
        track.classList.toggle('htl-lineage-open', lineageOpen);
        track.classList.toggle('htl-spread-open', spreadOpen);
      }
      if (lineageOpen || spreadOpen) {
        // 가지가 슬라이드되는 0.5초 동안 매 프레임 다시 그려 연결선이 가지를 따라오게 한다
        // (한 번만 그리면 시작/끝 위치가 달라 막대가 위로 올라갔다 내려오는 점프가 생김)
        var startTs = null;
        var follow = function (ts) {
          if (startTs === null) startTs = ts;
          drawConnectors();
          if (ts - startTs < 620) requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);
      }
    }

    // 큰 연도 숫자를 향약 인용과 같은 먹 번짐으로 써 내려간다.
    // "-"는 왼쪽→오른쪽으로 그어지는 긴 선(.dgbg-year-line)으로 대체.
    function inkifyYear(textStr) {
      if (!yearEl) return;
      yearEl.classList.remove('dgbg-ink-active');
      yearEl.classList.remove('dgbg-ink-settled');
      var tokens = String(textStr).split(/(\s+)/); // 공백 보존
      yearEl.textContent = '';
      var i = 0;
      tokens.forEach(function (tok) {
        if (/^\s+$/.test(tok) || tok === '') {
          yearEl.appendChild(document.createTextNode(tok));
        } else if (tok === '-' || tok === '–' || tok === '—') {
          var line = document.createElement('span');
          line.className = 'dgbg-year-line';
          line.style.setProperty('--i', i);
          yearEl.appendChild(line);
          i++;
        } else {
          var span = document.createElement('span');
          span.className = 'dgbg-ink-word';
          span.style.setProperty('--i', i);
          span.textContent = tok;
          yearEl.appendChild(span);
          i++;
        }
      });
      void yearEl.offsetWidth;   // 리플로우 → 애니메이션 재시작
      yearEl.classList.add('dgbg-ink-active');
    }

    // 진입 시 "1596 - 2026" 범위 표기를 먹 번짐으로 1회 재생
    function inkBleedYear() {
      if (!yearEl || yearEl.dataset.inkDone) return;
      yearEl.dataset.inkDone = '1';
      inkifyYear(yearEl.textContent);
    }

    // 번짐 완료 후, 트랜지션이 먹히도록 정적 표시 상태로 고정
    function settleRange() {
      if (!yearEl) return;
      yearEl.classList.remove('dgbg-ink-active');
      yearEl.classList.add('dgbg-ink-settled');
    }

    // 인트로: '-'와 2026이 오른쪽으로 밀려나며 사라지고, 1596은 가운데로 미끄러져 남는다
    function recedeRange() {
      if (!yearEl) return;
      var line = yearEl.querySelector('.dgbg-year-line');
      if (line) line.classList.add('is-receding');
      var words = yearEl.querySelectorAll('.dgbg-ink-word');
      if (words.length >= 2) words[words.length - 1].classList.add('is-receding'); // 2026
      var first = words[0]; // 1596
      if (first) {
        // settle가 부모 잉크 필터를 제거하므로, 글라이드하는 1596에는 잉크 번짐을 직접 유지
        first.style.filter = 'url(#dgbg-ink-threshold)';
        var er = yearEl.getBoundingClientRect();
        var fr = first.getBoundingClientRect();
        var dx = (er.left + er.width / 2) - (fr.left + fr.width / 2);
        first.style.transition = 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)';
        requestAnimationFrame(function () { first.style.transform = 'translateX(' + dx + 'px)'; });
      }
    }

    // 1596만 남은 상태에서 '편찬 시작'을 누른 것처럼 활성화 (숫자는 그대로 유지)
    function pressFirst() {
      if (userTook) return;
      if (yearEl) {
        var keep = yearEl.querySelector('.dgbg-ink-word'); // 첫 단어(1596)
        yearEl.textContent = '';
        if (keep) {
          keep.classList.remove('is-receding');
          keep.style.transition = 'none';
          keep.style.transform = 'none'; // 가운데(자연 위치)로 — 글라이드한 위치와 동일해 점프 없음
          keep.style.filter = 'url(#dgbg-ink-threshold)'; // 잉크 번짐 유지
          yearEl.appendChild(keep);
        }
      }
      setActive('3', true);            // 노드/설명/계보 가지 활성화 (재-번짐 없이)
      pos = ORDER.indexOf(3);
      introDone = true;
      inView = true;
      startAuto();                     // 이후 1597, 1608… 자동 진행
    }

    // 인트로 전체 시퀀스 (1회) — "1596 - 2026" 표기 동안에도 1596 배경을 깐다
    function playIntro() {
      if (!yearEl || yearEl.dataset.introPlayed) return;
      yearEl.dataset.introPlayed = '1';
      applyBg('3');                    // 0) 인트로부터 1596.png 배경 표시
      inkBleedYear();                  // 1) "1596 - 2026" 번짐
      introTimers.push(setTimeout(function () { if (!userTook) settleRange(); }, 1500));
      introTimers.push(setTimeout(function () { if (!userTook) recedeRange(); }, 1750));
      introTimers.push(setTimeout(function () { if (!userTook) pressFirst(); }, 2250));
    }

    // 다른 페이지/섹션에 갔다가 돌아오면 처음 "1596 - 2026" 인트로부터 다시 재생되도록 초기화
    function resetIntro() {
      introTimers.forEach(clearTimeout);
      introTimers = [];
      stopAuto();
      userTook = false;
      introDone = false;
      pos = ORDER.indexOf(3);
      if (yearEl) {
        delete yearEl.dataset.introPlayed;
        delete yearEl.dataset.inkDone;
        yearEl.classList.remove('dgbg-ink-active', 'dgbg-ink-settled');
        yearEl.textContent = '1596 - 2026';
      }
      // 노드/설명/가지를 기본(편찬 시작) 상태로 되돌린다 — 재번짐 없이
      setActive('3', true);
    }

    function startAuto() {
      if (autoTimer || userTook || !inView || !introDone) return;
      autoTimer = setInterval(function () { goTo(pos + 1); }, AUTO_MS);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        userTook = true;
        introDone = true;
        introTimers.forEach(clearTimeout);
        introTimers = [];
        stopAuto();
        var p = ORDER.indexOf(parseInt(node.getAttribute('data-htl-idx'), 10));
        if (p >= 0) goTo(p); else setActive(node.getAttribute('data-htl-idx'));
      });
    });

    // 읽는 동안 멈춤 — 마우스를 올리면 정지, 떠나면(직접 클릭 안 했으면) 재개
    if (wrapper) {
      wrapper.addEventListener('mouseenter', stopAuto);
      wrapper.addEventListener('mouseleave', function () { startAuto(); });
    }

    // 가지(계보·해외 전파) 연결선을 실제 노드 위치로 그린다
    function drawConnectors() {
      if (!track) return;
      var svg = track.querySelector('.dgbg-htl-svg');
      if (!svg) return;
      var w = track.scrollWidth || track.offsetWidth;
      var h = track.offsetHeight;
      if (!w || !h) return;
      var tr = track.getBoundingClientRect();
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      function dot(i) {
        var el = track.querySelector('.dgbg-htl-node[data-htl-idx="' + i + '"] .dgbg-htl-node-dot');
        if (!el) return null;
        var r = el.getBoundingClientRect();
        return { x: r.left - tr.left + r.width / 2, y: r.top - tr.top + r.height / 2 };
      }
      function seg(anchorIdx, branchIdx, cls) {
        var a = dot(anchorIdx), b = dot(branchIdx);
        if (!a || !b) return '';
        return '<path' + (cls ? ' class="' + cls + '"' : '') +
          ' d="M' + b.x + ' ' + b.y + ' L' + b.x + ' ' + a.y + ' L' + a.x + ' ' + a.y + '"/>';
      }
      // 앵커(예: 1613)에서 뻗어나가는 뒤집힌 ㄱ자: 앵커 점에서 위로 → 가지 노드로 수평
      function segFromAnchor(anchorIdx, branchIdx, cls) {
        var a = dot(anchorIdx), b = dot(branchIdx);
        if (!a || !b) return '';
        return '<path' + (cls ? ' class="' + cls + '"' : '') +
          ' d="M' + a.x + ' ' + a.y + ' L' + a.x + ' ' + b.y + ' L' + b.x + ' ' + b.y + '"/>';
      }
      // 본선: 1596 → 2026 은 실선, 2026(오늘날) 이후는 점선으로 미래를 향해 이어진다
      var first = dot(3), last = dot(13);
      var mainLine = '';
      if (first && last) {
        mainLine =
          '<path class="htl-mainline" d="M' + first.x + ' ' + last.y + ' L' + last.x + ' ' + last.y + '"/>' +
          '<path class="htl-mainline htl-mainline--dashed" d="M' + last.x + ' ' + last.y + ' L' + w + ' ' + last.y + '"/>';
      }
      // 계보 노드(1398·1433·1433)는 화살표 대신 가로 연결선으로 사슬처럼 잇는다
      function hline(i1, i2, cls) {
        var p = dot(i1), q = dot(i2);
        if (!p || !q) return '';
        return '<path' + (cls ? ' class="' + cls + '"' : '') + ' d="M' + p.x + ' ' + p.y + ' L' + q.x + ' ' + q.y + '"/>';
      }
      // 계보 가지의 책 dot을 1596 dot 바로 아래로 정렬해 riser 꺾임을 없앤다
      // (책은 rem 기준 고정 위치, 1596은 뷰포트 비례 → 그대로 두면 어긋남)
      if (lineageBranch) {
        var alignN = dot(3), alignB = dot(2);
        if (alignN && alignB) {
          var curLeft = parseFloat(lineageBranch.style.left) || 0;
          lineageBranch.style.left = (curLeft + (alignN.x - alignB.x)) + 'px';
        }
      }
      // 전파선 끝(1613 쪽)이 투명하게 사라지는 세로 그라데이션 정의
      // 가지 연결선의 본선(1596·1613) 쪽 끝이 넓게 투명해지며 사라지는 세로 그라데이션
      var defs = '<defs><linearGradient id="dgbg-spread-grad" x1="0" y1="1" x2="0" y2="0">' +
        '<stop offset="0" stop-color="#a9a298" stop-opacity="0"/>' +
        '<stop offset="0.78" stop-color="#a9a298" stop-opacity="1"/>' +
        '<stop offset="1" stop-color="#a9a298" stop-opacity="1"/>' +
        '</linearGradient></defs>';
      // 계보(세로 표기): 1596에서 위로 라이저(3→2, 끝부분 그라데이션) + 계보 노드들을 잇는 세로선(0→2)
      // 전파: 1613(완성·간행)에서 위로 뻗어 일본·중국 전파로 가는 뒤집힌 ㄱ자
      svg.innerHTML = defs + mainLine + seg(3, 2, 'seg-lineage') + hline(0, 2, 'seg-lineage') +
        segFromAnchor(6, 14, 'spread') + segFromAnchor(6, 15, 'spread');
    }
    var redrawT;
    window.addEventListener('resize', function () {
      clearTimeout(redrawT);
      redrawT = setTimeout(drawConnectors, 150);
    });

    // 개요 탭에서 연혁이 화면에 보일 때만 자동재생 + 연결선 그리기
    if ('IntersectionObserver' in window && section) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          inView = e.isIntersecting;
          if (inView) {
            drawConnectors();
            requestAnimationFrame(drawConnectors);
            setTimeout(drawConnectors, 320);
            startAuto();
          } else {
            stopAuto();
          }
        });
      }, { threshold: 0.35 });
      io.observe(section);
    } else {
      inView = true;
      drawConnectors();
      setTimeout(drawConnectors, 320);
      startAuto();
    }

    // "1596 - 2026" 큰 숫자가 보이면 인트로 시퀀스 재생.
    // 화면에서 완전히 벗어나면 초기화 후 재무장 → 다른 페이지 갔다 돌아오면 처음부터 다시 재생
    if (yearEl) {
      if ('IntersectionObserver' in window) {
        var introArmed = true;
        var yio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && e.intersectionRatio >= 0.6) {
              if (introArmed) { introArmed = false; playIntro(); }
            } else if (!e.isIntersecting) {
              if (!introArmed) { introArmed = true; resetIntro(); }
            }
          });
        }, { threshold: [0, 0.6] });
        yio.observe(yearEl);
      } else {
        playIntro();
      }
    }

    // 시작 화면은 "1596 - 2026" 범위 표기를 유지 (goTo(0)로 단일 연도를 덮어쓰지 않음).
    // 자동재생 첫 틱(또는 노드 클릭) 때부터 개별 연도로 전환된다.
    setTimeout(drawConnectors, 120);
  }

  // 향약관 인용 — 화면 진입 시 먹 번짐(ink bleed) 연출
  function initHyangQuoteBrush() {
    var quote = document.querySelector('.dgbg-hyang-quote');
    if (!quote) return;
    var text = quote.querySelector('.dgbg-hyang-quote-text');
    var cite = quote.querySelector('.dgbg-hyang-quote-cite');

    // 요소 텍스트를 단어 span으로 쪼개 차례로 번져 들어오게 한다.
    // startIndex부터 --i를 이어 부여하고, 마지막으로 쓴 인덱스 다음 값을 반환.
    function splitIntoInkWords(el, startIndex) {
      var i = startIndex;
      var tokens = el.textContent.split(/(\s+)/); // 공백 보존
      el.textContent = '';
      tokens.forEach(function (tok) {
        if (/^\s+$/.test(tok) || tok === '') {
          el.appendChild(document.createTextNode(tok));
        } else {
          var span = document.createElement('span');
          span.className = 'dgbg-ink-word';
          span.style.setProperty('--i', i);
          span.textContent = tok;
          el.appendChild(span);
          i++;
        }
      });
      return i;
    }

    if (text && !text.dataset.inkSplit) {
      var next = splitIntoInkWords(text, 0);
      // 출처는 본문이 다 번진 뒤 한 박자 쉬고 이어서 번진다
      if (cite) splitIntoInkWords(cite, next + 2);
      text.dataset.inkSplit = '1';
    }

    if (!('IntersectionObserver' in window)) {
      quote.classList.add('is-writing');
      return;
    }
    // 진입(50% 이상) 시 재생, 완전히 벗어나면 리셋 → 재진입할 때마다 다시 번진다
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          quote.classList.add('is-writing');
        } else if (!e.isIntersecting) {
          quote.classList.remove('is-writing');
        }
      });
    }, { threshold: [0, 0.5] });
    io.observe(quote);
  }

  function initStoryReveal() {
    if (initStoryReveal._done) return;
    var panels = document.querySelectorAll('.dgbg-story-panel');
    if (!panels.length) return;
    initStoryReveal._done = true;
    if (!('IntersectionObserver' in window)) {
      panels.forEach(function (p) { p.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    panels.forEach(function (p) { io.observe(p); });
  }

  var COACHMARK_CACHE_MS = 5 * 60 * 1000;
  var coachmarks = {};

  function isClickInsideAnyCoachmark(target) {
    var nodes = document.querySelectorAll('.coachmark[aria-hidden="false"]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].contains(target)) return true;
    }
    return false;
  }

  function createCoachmark(id, storageKey) {
    var coachmark = document.getElementById(id);
    if (!coachmark) return null;

    try {
      var dismissedAt = parseInt(localStorage.getItem(storageKey) || '0', 10);
      if (dismissedAt && Date.now() - dismissedAt < COACHMARK_CACHE_MS) {
        coachmark.remove();
        return null;
      }
    } catch (_) { /* localStorage 비활성: 표시 */ }

    var docClickArmed = false;
    var listening = false;
    var dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      coachmark.setAttribute('aria-hidden', 'true');
      try { localStorage.setItem(storageKey, String(Date.now())); } catch (_) {}
      if (listening) {
        document.removeEventListener('click', onDocClick, true);
        listening = false;
      }
    }

    function onDocClick(e) {
      if (!docClickArmed) return;
      if (isClickInsideAnyCoachmark(e.target)) return;
      dismiss();
    }

    function show() {
      if (dismissed) return;
      if (coachmark.getAttribute('aria-hidden') === 'false') return;
      coachmark.setAttribute('aria-hidden', 'false');
      docClickArmed = false;
      setTimeout(function () { docClickArmed = true; }, 250);
      if (!listening) {
        document.addEventListener('click', onDocClick, true);
        listening = true;
      }
    }

    var closeBtn = coachmark.querySelector('.coachmark-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dismiss();
      });
    }

    return { show: show, dismiss: dismiss, el: coachmark };
  }

  function initCoachmarks() {
    coachmarks.filter = createCoachmark('filter-coachmark', 'dgbg.filterCoachmarkDismissedAt');
    coachmarks.efficacy = createCoachmark('efficacy-coachmark', 'dgbg.efficacyCoachmarkDismissedAt');
    coachmarks.prescControls = createCoachmark('presc-controls-coachmark', 'dgbg.prescControlsCoachmarkDismissedAt');
    coachmarks.prescRx = createCoachmark('presc-rx-coachmark', 'dgbg.prescRxCoachmarkDismissedAt');

    if (coachmarks.filter) {
      var hero = document.getElementById('hero');
      if (!hero || hero.classList.contains('hero-dismissed')) {
        coachmarks.filter.show();
      } else {
        var observer = new MutationObserver(function () {
          if (hero.classList.contains('hero-dismissed')) {
            observer.disconnect();
            setTimeout(function () { if (coachmarks.filter) coachmarks.filter.show(); }, 350);
          }
        });
        observer.observe(hero, { attributes: true, attributeFilter: ['class'] });
      }
    }
  }

  function showEfficacyCoachmarkIn2D() {
    if (!coachmarks.efficacy) return;
    var coachEl = coachmarks.efficacy.el;
    var wrap2d = document.querySelector('.efficacy-2d-graph-wrap');
    if (wrap2d) {
      if (coachEl.parentNode !== wrap2d) wrap2d.appendChild(coachEl);
      coachmarks.efficacy.show();
      return;
    }
    var treeContainer = document.getElementById('efficacy-tree-container');
    if (!treeContainer) return;
    var observer = new MutationObserver(function () {
      var w = document.querySelector('.efficacy-2d-graph-wrap');
      if (!w) return;
      observer.disconnect();
      if (coachEl.parentNode !== w) w.appendChild(coachEl);
      coachmarks.efficacy.show();
    });
    observer.observe(treeContainer, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 5000);
  }

  function maybeShowViewCoachmarks(mode) {
    if (mode === 'efficacy' && coachmarks.efficacy) {
      setTimeout(showEfficacyCoachmarkIn2D, 300);
    } else if (mode === 'body') {
      setTimeout(function () {
        if (coachmarks.prescControls) coachmarks.prescControls.show();
        if (coachmarks.prescRx) coachmarks.prescRx.show();
      }, 300);
    }
  }

  function bindHero() {
    var hero = document.getElementById('hero');
    var heroIntro = document.getElementById('hero-intro');
    var heroIntroTyped = document.getElementById('hero-intro-typed');
    var heroIntroSkip = document.getElementById('hero-intro-skip');

    function hideIntro() {
      if (!heroIntro) return;
      heroIntro.classList.add('fade-out');
      setTimeout(function () {
        dismissAndGo('list');
      }, 200);
    }

    if (heroIntro && heroIntroTyped) {
      var introText = heroIntro.getAttribute('data-intro-text') || '';
      var typingSpeed = 95;
      var idx = 0;
      var commaIdx = introText.indexOf(',');
      var isMobile = function () { return window.matchMedia('(max-width: 768px)').matches; };
      function getDisplayHtml(len) {
        if (!isMobile() || commaIdx === -1 || len <= commaIdx + 1) {
          return introText.slice(0, len);
        }
        return introText.slice(0, commaIdx + 1) + '<br>' + introText.slice(commaIdx + 1, len);
      }
      function typeNext() {
        if (idx < introText.length) {
          if (isMobile() && commaIdx !== -1) {
            heroIntroTyped.innerHTML = getDisplayHtml(idx);
          } else {
            heroIntroTyped.textContent = introText.slice(0, idx);
          }
          idx += 1;
          setTimeout(typeNext, typingSpeed);
        } else {
          if (isMobile() && commaIdx !== -1) {
            heroIntroTyped.innerHTML = getDisplayHtml(introText.length);
          } else {
            heroIntroTyped.textContent = introText;
          }
          heroIntro.classList.add('typing-done');
          setTimeout(hideIntro, 380);
        }
      }
      setTimeout(typeNext, 400);
    }

    if (heroIntroSkip) {
      heroIntroSkip.addEventListener('click', hideIntro);
    }

    var galleryInner = document.getElementById('hero-gallery-bg');
    if (galleryInner) {
      var inner = galleryInner.querySelector('.hero-gallery-inner');
      if (inner) {
        hero.addEventListener('mousemove', function (e) {
          var rect = hero.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          var gx = Math.max(-12, Math.min(12, x * 24));
          var gy = Math.max(-12, Math.min(12, -y * 24));
          var dist = Math.sqrt(x * x + y * y);
          var gz = Math.round(dist * 50);
          inner.style.setProperty('--gx', gx + 'deg');
          inner.style.setProperty('--gy', gy + 'deg');
          inner.style.setProperty('--gz', gz + 'px');
        });
        hero.addEventListener('mouseleave', function () {
          inner.style.setProperty('--gx', '0deg');
          inner.style.setProperty('--gy', '0deg');
          inner.style.setProperty('--gz', '0px');
        });
      }
    }

    function dismissAndGo(view) {
      if (!hero || hero.classList.contains('hero-dismissed')) return;
      hero.classList.add('hero-dismissed');
      var header = document.querySelector('.header-glass');
      if (header) header.classList.add('header-post-hero');
      if (view) setViewMode(view);
      if (view === 'list') update();
    }

    var heroFloatCta = document.getElementById('hero-float-cta');
    if (heroFloatCta) {
      heroFloatCta.addEventListener('click', function () {
        dismissAndGo('list');
      });
    }
    var logoStrip = document.getElementById('header-logo-strip');
    if (logoStrip) {
      logoStrip.addEventListener('click', function () {
        // 인트로(hero)가 아직 살아 있으면 무시 — hero가 dismissed된 이후에만 동작
        var hero = document.getElementById('hero');
        if (hero && !hero.classList.contains('hero-dismissed')) return;
        // 필터 전체 초기화
        state.q = '';
        state.mainCategory = '';
        state.subCategory = '';
        state.selectedTags = [];
        var searchEl = document.getElementById('search-herb');
        if (searchEl) searchEl.value = '';
        document.querySelectorAll('[data-filter-main]').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.function-filter').forEach(function (b) { b.classList.remove('active'); });
        var subWrap = document.getElementById('sub-category-wrap');
        if (subWrap) {
          subWrap.setAttribute('aria-hidden', 'true');
          subWrap.classList.remove('visible');
        }
        var subChips = document.querySelector('.sub-category-chips[data-role="sub-category-chips"]');
        if (subChips) subChips.innerHTML = '';
        if (typeof syncMainCategoryButtonLabels === 'function') syncMainCategoryButtonLabels();
        // 약재 목록 뷰로 이동
        setViewMode('list');
        update();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function initStickyListHeader() {
    var header = document.querySelector('.header-glass');
    var headerTopRow = document.querySelector('.header-top-row');
    if (!header || !headerTopRow) return;

    /* 단일 임계값이면 접힘 직후 scroll 앵커/레이아웃으로 scrollY가 경계를 넘나들며 필터 sticky top이 덜덜 떨림 */
    var SCROLL_COLLAPSE_AFTER = 100;
    var SCROLL_EXPAND_BEFORE = 24;
    var stickyTrackRaf = null;

    function updateStickyFilterTop() {
      var h = header.getBoundingClientRect().height;
      /* Math.round는 DPR/서브픽셀에서 헤더 실제 높이와 sticky top이 1px 어긋나 흰 줄이 생길 수 있음 */
      document.documentElement.style.setProperty('--sticky-filter-top', h.toFixed(3) + 'px');
    }

    /*
     * 검색창 max-height 트랜지션(~0.35s) 동안 헤더 높이와 sticky 필터의 top을 매 프레임 맞춤.
     * 스크롤 이벤트에서는 호출하지 않으므로 이전처럼 경계에서 덜덜 떨리지 않음.
     */
    function syncStickyTopDuringHeaderTransition() {
      if (stickyTrackRaf) cancelAnimationFrame(stickyTrackRaf);
      updateStickyFilterTop();
      var start = performance.now();
      var durationMs = 420;
      function frame(now) {
        updateStickyFilterTop();
        if (now - start < durationMs) {
          stickyTrackRaf = requestAnimationFrame(frame);
        } else {
          stickyTrackRaf = null;
          updateStickyFilterTop();
        }
      }
      stickyTrackRaf = requestAnimationFrame(frame);
    }

    function updateSearchCollapse() {
      var isListView = state.viewMode === 'list';
      var hidden = document.body.classList.contains('list-search-hidden');
      var y = window.scrollY;

      if (!isListView) {
        if (hidden) {
          document.body.classList.remove('list-search-hidden');
          syncStickyTopDuringHeaderTransition();
        }
        return;
      }

      if (hidden) {
        if (y < SCROLL_EXPAND_BEFORE) {
          document.body.classList.remove('list-search-hidden');
          syncStickyTopDuringHeaderTransition();
        }
      } else if (y > SCROLL_COLLAPSE_AFTER) {
        document.body.classList.add('list-search-hidden');
        syncStickyTopDuringHeaderTransition();
      }
    }

    window.addEventListener('scroll', updateSearchCollapse, { passive: true });
    window.addEventListener('resize', function () {
      updateStickyFilterTop();
      updateSearchCollapse();
    }, { passive: true });

    /* 뷰 전환 시 외부에서 호출 가능하도록 노출 */
    window._updateStickyHeader = updateSearchCollapse;
    window._syncStickyListChrome = function () {
      updateSearchCollapse();
      updateStickyFilterTop();
    };

    updateStickyFilterTop();
  }

  function initOverviewAnchorNav() {
    var nav = document.querySelector('.overview-anchor-nav');
    if (!nav) return;
    var inner = nav.querySelector('.overview-anchor-nav-inner');
    var links = Array.prototype.slice.call(nav.querySelectorAll('.overview-anchor-link'));
    if (!links.length) return;
    var header = document.querySelector('.header-glass');
    var sections = links.map(function (l) {
      return document.getElementById(l.getAttribute('data-target'));
    });

    function topOffset() {
      var hH = header ? header.getBoundingClientRect().height : 0;
      var nH = nav.getBoundingClientRect().height;
      return hH + nH + 12;
    }

    function setActive(id) {
      links.forEach(function (l) {
        var on = l.getAttribute('data-target') === id;
        l.classList.toggle('active', on);
        l.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && inner) {
          /* 가로 스크롤에서 활성 탭이 보이도록 중앙 정렬 (세로 스크롤은 건드리지 않음) */
          inner.scrollTo({ left: l.offsetLeft - (inner.clientWidth - l.offsetWidth) / 2, behavior: 'smooth' });
        }
      });
    }

    /* 클릭 직후엔 스크롤 스파이가 중간 섹션을 깜빡이지 않도록 잠시 억제 */
    var suppressSpy = false;
    var suppressTimer = null;

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        var id = link.getAttribute('data-target');
        var target = document.getElementById(id);
        if (!target) return;
        var y = target.getBoundingClientRect().top + window.scrollY - topOffset();
        setActive(id);
        suppressSpy = true;
        if (suppressTimer) clearTimeout(suppressTimer);
        suppressTimer = setTimeout(function () { suppressSpy = false; }, 750);
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      });
    });

    function onScroll() {
      if (suppressSpy || state.viewMode !== 'data') return;
      var line = topOffset() + 8;
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        if (s && s.getBoundingClientRect().top <= line) current = s;
      }
      if (current) setActive(current.id);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initTopButton() {
    var topBtn = document.getElementById('top-btn');
    if (!topBtn) return;
    function onScroll() {
      if (window.scrollY > 300) {
        topBtn.classList.add('visible');
      } else {
        topBtn.classList.remove('visible');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
