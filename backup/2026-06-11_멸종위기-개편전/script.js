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

  var FUNCTIONS_VISIBLE_COUNT = 3;

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
    var list = herbs.slice();
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
      var visibleCount = Math.min(FUNCTIONS_VISIBLE_COUNT, tags.length);
      var hiddenCount = tags.length - visibleCount;
      var visibleTags = tags.slice(0, visibleCount);
      var tagsHtml = visibleTags.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('');
      var moreBtn = '';
      if (hiddenCount > 0) {
        moreBtn = '<button type="button" class="functions-more" data-full="' + escapeAttr(tags.join(',')) + '">+' + hiddenCount + '</button>';
      }
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
    if (typeof window.initGlbViewers === 'function') {
      window.initGlbViewers();
      requestAnimationFrame(function () { window.initGlbViewers(); });
    }
  }

  function bindFunctionsMoreClicks() {
    document.querySelectorAll('.herb-card .functions-more').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wrap = btn.closest('.functions-wrap');
        var ul = wrap && wrap.querySelector('ul.functions');
        if (!ul) return;
        var full = btn.getAttribute('data-full');
        var all = full ? full.split(',') : [];
        ul.innerHTML = all.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('');
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


  /* 개요 탭 배경: 동·의·보·감 lottie 드로온 (사라락 나타남) */
  var _overviewLottie = null;
  function initOverviewLottie() {
    if (_overviewLottie || typeof window.lottie === 'undefined') return _overviewLottie;
    var els = document.querySelectorAll('.dgbg-hero-char[data-lottie]');
    if (!els.length) return null;
    _overviewLottie = [];
    els.forEach(function (el) {
      var anim = window.lottie.loadAnimation({
        container: el,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: el.getAttribute('data-lottie')
      });
      anim.setSpeed(1.6);
      _overviewLottie.push(anim);
    });
    return _overviewLottie;
  }
  function playOverviewLottie() {
    var anims = initOverviewLottie();
    if (!anims) return;
    anims.forEach(function (anim, i) {
      var draw = function () {
        anim.goToAndStop(0, true);
        setTimeout(function () { anim.goToAndPlay(0, true); }, i * 320);
      };
      if (anim.isLoaded) draw();
      else anim.addEventListener('DOMLoaded', draw);
    });
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
    if (dataCaption) {
      if (mode === 'data') {
        dataCaption.classList.remove('data-view-caption--in');
        void dataCaption.offsetWidth;
        requestAnimationFrame(function () {
          dataCaption.classList.add('data-view-caption--in');
          playOverviewLottie();
        });
      } else {
        dataCaption.classList.remove('data-view-caption--in');
      }
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
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
    html += '<div class="dashboard-chart-block dashboard-sunburst-block">';
    html += '<div class="dashboard-block-header">';
    html += '<h2 class="dashboard-block-title">탕액편 약재 분류</h2>';
    html += '<p class="dashboard-block-subtitle">동의보감 탕액편에 수록된 ' + total + '종 약재의 대분류·중분류 구성 · 클릭하면 확대됩니다</p>';
    html += '</div>';
    html += '<div class="dashboard-sunburst-wrap" id="dashboard-sunburst-wrap">';
    html += '<button type="button" class="dashboard-sunburst-back-btn" id="dashboard-sunburst-back-btn" aria-label="상위로 돌아가기" aria-hidden="true">&lsaquo;</button>';
    html += '<div class="dashboard-sunburst-stage">';
    html += '<div id="dashboard-sunburst" class="dashboard-sunburst dashboard-sunburst-svg-host" aria-label="분류·상세분류 줌 가능 선버스트 차트"></div>';
    html += '<div id="dashboard-sunburst-treemap" class="dashboard-sunburst-treemap" aria-hidden="true"></div>';
    html += '</div>';
    html += '</div>';
    html += '<p class="dashboard-sunburst-hint">대분류·중분류 클릭: 확대 · 상세 분류(초부 등)에서는 사각형 타일로 펼쳐짐 · «뒤로» 또는 배경: 한 단계 위로</p></div>';
    html += '</div>';
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
          var size = isMobile ? Math.min(400, containerW - 16) : Math.min(640, containerW - 32);
          size = Math.max(260, size);

          var innerR  = size * 0.20;   // 가운데 빈 원
          var outerR1 = size * 0.40;   // 대분류 바깥 반지름
          var outerR2 = size * 0.56;   // 중분류 바깥 반지름
          var vb = outerR2 + 80;       // viewBox 반절 (callout 라벨 여백 포함)

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
            .style('font-family', '"Apple SD Gothic Neo","Malgun Gothic",sans-serif')
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
            .attr('dy', '0.35em')
            .attr('font-size', isMobile ? '11px' : '13px')
            .attr('font-weight', '700')
            .attr('fill', '#fff')
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
          var labelFsName    = isMobile ? '9px'  : '11px';
          var labelFsCount   = isMobile ? '8px'  : '9px';
          var lineGap        = isMobile ? 11 : 13;
          // 호 길이 계산 (각도 × 중간 반지름)
          function arcLen(d) { return (d.x1 - d.x0) * arcMidR; }

          // 이름 글자수 × 글자폭(px) 기준으로 인라인 표시 가능 여부 판단
          // subKey 기준으로 강제 callout 처리 (name이 줄임말로 바뀌므로 subKey로 판별)
          var FORCE_CALLOUT_KEYS = ['금부(金)', '옥부'];
          var charPx = isMobile ? 8 : 10; // 한 글자 폭 대략
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
            .attr('dy', '-0.15em')
            .attr('font-size', labelFsName)
            .attr('font-weight', '600')
            .attr('fill', '#222')
            .text(function (d) { return d.data.name; });

          subLabelGroups.append('text')
            .attr('dy', lineGap + 'px')
            .attr('font-size', labelFsCount)
            .attr('fill', '#444')
            .text(function (d) { return d.value + '종'; });

          // ── callout: 이름이 arc 안에 못 들어가는 슬라이스 ────────────
          var calloutR    = outerR2 + 8;   // 선 시작점 반지름
          var calloutElbR = outerR2 + 28;  // 꺾임 지점 기본 반지름

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
            var minGap = isMobile ? 12 : 15;
            for (var ui = 0; ui < usedYMain.length; ui++) {
              if (Math.abs(usedYMain[ui] - (rawY + bump)) < minGap) {
                bump += (rawY + bump <= usedYMain[ui]) ? -minGap : minGap;
              }
            }
            usedYMain.push(rawY + bump);

            var x1 = cos * calloutR,    y1 = sin * calloutR;
            var x2 = cos * baseElbR,    y2 = sin * baseElbR + bump;
            var x3 = x2 + dir * 14,    y3 = y2;

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
              .attr('dy', '-0.15em')
              .attr('font-size', isMobile ? '8px' : '10px')
              .attr('font-weight', '600')
              .attr('fill', '#333')
              .attr('text-anchor', anchor)
              .text(d.data.name);
            tg.append('text')
              .attr('dy', isMobile ? '9px' : '11px')
              .attr('font-size', isMobile ? '7px' : '9px')
              .attr('fill', '#666')
              .attr('text-anchor', anchor)
              .text(d.value + '종');
          });

          // ── 중앙 텍스트 ──────────────────────────────────────────────
          var centerG = svg.append('g').attr('class', 'center-label').attr('text-anchor', 'middle');
          centerG.append('text').attr('dy', '-0.2em')
            .attr('font-size', isMobile ? '18px' : '24px')
            .attr('font-weight', '700').attr('fill', '#333')
            .text('탕액편');
          centerG.append('text').attr('dy', isMobile ? '22px' : '30px')
            .attr('font-size', isMobile ? '13px' : '18px')
            .attr('fill', '#888')
            .text(rawData.length + '종');

          // ── 드릴다운 / 트리맵 공통 UI 요소 ─────────────────────────
          var treemapEl  = document.getElementById('dashboard-sunburst-treemap');
          var sunburstWrap = document.getElementById('dashboard-sunburst-wrap');
          var hintEl = sunburstEl.closest && sunburstEl.closest('.dashboard-sunburst-block')
            ? sunburstEl.closest('.dashboard-sunburst-block').querySelector('.dashboard-sunburst-hint')
            : null;
          var backBtn = document.getElementById('dashboard-sunburst-back-btn');
          var activeNode = null;

          // 드릴다운 오버레이 div (대분류 클릭 시 새 도넛 차트)
          var drillEl = document.createElement('div');
          drillEl.className = 'sunburst-drill-overlay';
          drillEl.setAttribute('aria-hidden', 'true');
          drillEl.style.cssText = [
            'position:absolute', 'inset:0', 'background:rgba(255,255,255,0.97)',
            'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
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

            drillEl.innerHTML = '';
            drillEl.setAttribute('aria-hidden', 'false');
            drillEl.style.pointerEvents = 'all';

            // ── 크기: 대분류 원과 동일한 size/반지름 사용
            var dInnerR   = innerR;         // 대분류 innerR 그대로
            var dOuterR   = outerR2;        // 대분류 outerR2 그대로 (전체 원 바깥 반지름)
            var dCalloutR = dOuterR + 10;
            var dElbR     = dOuterR + 48;
            var dVb       = dElbR   + 80;
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

            // SVG — viewBox 기반이므로 height만 제한
            var svgH = Math.min(2 * dVb + 20, wrapH - 60, 700);
            var dSvg = d3.select(drillEl).append('svg')
              .attr('viewBox', [-dVb, -dVb, 2 * dVb, 2 * dVb])
              .attr('width',  '100%')
              .attr('height', svgH)
              .attr('preserveAspectRatio', 'xMidYMid meet')
              .style('font-family', '"Apple SD Gothic Neo","Malgun Gothic",sans-serif')
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
              .on('mouseenter', function () {
                d3.select(this).transition().duration(100).attr('fill-opacity', 1).attr('stroke-width', 3);
              })
              .on('mouseleave', function () {
                d3.select(this).transition().duration(160).attr('fill-opacity', 0.9).attr('stroke-width', 2);
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
                d3.select(this)
                  .transition()
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
              tg.append('text').attr('dy', '-0.15em')
                .attr('font-size', '22px').attr('font-weight', '600')
                .attr('fill', '#fff').text(a.data.data.name);
              tg.append('text').attr('dy', '24px')
                .attr('font-size', '15px')
                .attr('fill', 'rgba(255,255,255,0.85)').text(a.data.data.value + '종');
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
                  (elbX + dir * 18) + ',' + elbY
                ].join(' '))
                .attr('fill', 'none').attr('stroke', '#aaa').attr('stroke-width', 1).attr('stroke-linecap', 'round');
              var anchor = cos >= 0 ? 'start' : 'end';
              var tg = calloutLineG.append('g')
                .attr('transform', 'translate(' + (elbX + dir * 20) + ',' + elbY + ')');
              tg.append('text').attr('dy', '-0.15em')
                .attr('font-size', '22px').attr('font-weight', '600')
                .attr('fill', '#333').attr('text-anchor', anchor).text(a.data.data.name);
              tg.append('text').attr('dy', '24px')
                .attr('font-size', '15px')
                .attr('fill', '#666').attr('text-anchor', anchor).text(a.data.data.value + '종');
            });

            // 인라인 + callout + 도트링 페이드인
            dLabelG.transition().duration(250).delay(labelDelay).attr('opacity', 1);
            calloutLineG.transition().duration(250).delay(labelDelay).attr('opacity', 1);
            dotG.transition().duration(350).delay(labelDelay).attr('opacity', 1);

            // 중앙 텍스트 (즉시 표시)
            var dCenter = dSvg.append('g').attr('text-anchor', 'middle').attr('pointer-events', 'none');
            dCenter.append('text').attr('dy', '-0.2em')
              .attr('font-size', isMobile ? '18px' : '24px').attr('font-weight', '700').attr('fill', '#333')
              .text(mainD.data.name);
            dCenter.append('text').attr('dy', isMobile ? '22px' : '30px')
              .attr('font-size', isMobile ? '13px' : '18px').attr('fill', '#888')
              .text(total + '종');

          }

          // ── 트리맵 (중분류 클릭 시 표시) ─────────────────────────────
          function showTreemap(d, isSub) {
            if (!treemapEl || !sunburstWrap) return;
            activeNode = d;
            viewState  = 'treemap';
            if (backBtn) backBtn.setAttribute('aria-hidden', 'false');
            if (hintEl) hintEl.textContent = '';
            treemapEl.innerHTML = '';
            treemapEl.setAttribute('aria-hidden', 'false');
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
            var th = Math.max(300, Math.min(600, Math.round(tw * 0.6)));

            // 트리맵 레이아웃
            var tmRoot = d3.hierarchy({ children: leaves }).sum(function (n) { return n.value || 1; });
            d3.treemap().tile(d3.treemapSquarify).size([tw, th]).paddingOuter(3).paddingInner(2).round(true)(tmRoot);

            var svgT = d3.select(treemapEl).append('svg')
              .attr('viewBox', [0, 0, tw, th])
              .attr('width', '100%').attr('height', th);

            var baseColor = isSub ? lighten(getMainColor(d), 0.25) : (CATEGORY_COLORS[d.data.mainKey] || '#999');

            // 배경색 밝기 계산 → 폰트색 결정 (#fff / #000)
            function colorLuminance(hex) {
              var c = hex.replace('#', '');
              if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
              var r = parseInt(c.slice(0,2),16)/255;
              var g = parseInt(c.slice(2,4),16)/255;
              var b = parseInt(c.slice(4,6),16)/255;
              var toLinear = function(v) { return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
              return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
            }
            function rgbLuminance(rgb) {
              // rgb(r,g,b) 형식 파싱
              var m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              if (!m) return colorLuminance(baseColor);
              var toLinear = function(v) { v=v/255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); };
              return 0.2126*toLinear(+m[1])+0.7152*toLinear(+m[2])+0.0722*toLinear(+m[3]);
            }
            function getFontColor(fillColor) {
              var lum = fillColor.startsWith('rgb') ? rgbLuminance(fillColor) : colorLuminance(fillColor);
              return lum > 0.179 ? '#000' : '#fff';
            }

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

            // stroke 레이어 (외곽선으로 이미지 위 가독성)
            textCells.append('text')
              .attr('x', function (n) { return (n.x1 - n.x0) / 2; })
              .attr('y', function (n) { return (n.y1 - n.y0) / 2; })
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .attr('font-size', function (n) {
                var w = n.x1 - n.x0, h = n.y1 - n.y0;
                return Math.min(14, Math.max(9, Math.min(w / 4, h / 2.5))) + 'px';
              })
              .attr('font-weight', '700')
              .attr('fill', 'none')
              .attr('stroke', function (_n, i) {
                return getFontColor(cellColor(i)) === '#fff' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';
              })
              .attr('stroke-width', 3)
              .attr('stroke-linejoin', 'round')
              .attr('pointer-events', 'none')
              .text(function (n) {
                var name = n.data.name || '';
                var w = n.x1 - n.x0;
                if (name.length > 8 && w < 70) return name.slice(0, 6) + '…';
                return name;
              });

            // 실제 텍스트 레이어
            textCells.append('text')
              .attr('x', function (n) { return (n.x1 - n.x0) / 2; })
              .attr('y', function (n) { return (n.y1 - n.y0) / 2; })
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .attr('font-size', function (n) {
                var w = n.x1 - n.x0, h = n.y1 - n.y0;
                return Math.min(14, Math.max(9, Math.min(w / 4, h / 2.5))) + 'px';
              })
              .attr('font-weight', '700')
              .attr('fill', function (_n, i) { return getFontColor(cellColor(i)); })
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
          }

          function hideAll() {
            hideTreemap();
            hideDrill();
            activeNode = null;
            drillNode  = null;
            viewState  = null;
            if (backBtn) backBtn.setAttribute('aria-hidden', 'true');
            if (hintEl) hintEl.textContent = '';
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
        });
      }
    }
    renderRareHerbsSection();
    renderEndangeredHerbsSection();
  }

  /** 잘 쓰이지 않는 희귀 약재 31선 섹션 렌더링 */
  function renderRareHerbsSection() {
    var el = document.getElementById('rare-herbs-section');
    if (!el || el.dataset.rendered === '1') return;
    el.dataset.rendered = '1';

    var RARE_HERBS = [
      { name: '정화수', hanja: '井華水', english: 'Well water (dawn)', img: 'asset/img/Well-water-(dawn).png',
        desc: '음기가 가장 짙은 새벽에 길어 올린 우물의 첫 물. 마음을 맑히고 열독을 풀어 주는 데 쓰였다.',
        reason: '현대 상수도 보급으로 우물 자체가 사라졌고, 과학적 약효 근거가 없어 처방에서 자연스럽게 소멸되었다.' },
      { name: '납설수', hanja: '臘雪水', english: 'Snow water (12th month)', img: 'asset/img/Snow-water-(12th-month).png',
        desc: '섣달(12월) 눈이 녹은 물. 열독을 내리고 벌레를 죽이는 데 이용한 극히 희귀한 천연약재.',
        reason: '대기오염으로 눈에 중금속·산성 성분이 다량 포함되어 오히려 독성이 우려된다. 현대에는 약용으로 쓸 수 없다.' },
      { name: '올눌제', hanja: '膃肭臍', english: 'Fur Seal Genitalia', img: 'asset/img/Seal-genital.png',
        desc: '물개의 말린 음경과 고환. 신양(腎陽)을 크게 보하여 발기 부전·허리 통증·불임 치료에 쓰인 최고급 동물 보양 약재.',
        reason: '두건물개(Callorhinus ursinus)는 CITES 부속서 Ⅰ 등재 국제보호종이다. 해양포유류 보호 협약으로 포획·거래가 전면 금지되어 원료 수급이 불가능해졌다.' },
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
      { name: '유황', hanja: '硫黃', english: 'Sulfur', img: 'asset/img/Sulfur.png',
        desc: '화산 기원의 순수 황. 양기를 강하게 북돋우고 냉증·무릎 통증에 쓰인 독성 광물 약재.',
        reason: '고농도 내복 시 황화수소 독성과 위장 출혈 위험이 확인되었다. 경구 투여는 현대 한의학에서 거의 허용되지 않는다.' },
      { name: '비상', hanja: '砒霜', english: 'Arsenic', img: 'asset/img/Arsenic.png',
        desc: '천연 비소 광물. 극소량으로 학질·악성 창종을 다스린, 한의학에서 가장 위험한 약재 중 하나.',
        reason: '비소(As₂O₃)는 IARC 1군 발암물질로 지정되었다. 현행 의약품 안전 기준으로 경구 처방이 전면 금지되었다.' },
      { name: '진사', hanja: '辰砂', english: 'Cinnabar', img: 'asset/img/Cinnabar.png',
        desc: '천연 황화수은 광물. 붉은 빛으로 심신 안정, 경련 진정에 쓰였으나 강한 독성을 지닌다.',
        reason: '체내에 축적된 수은(Hg)이 신경계와 신장을 손상시킨다는 것이 과학적으로 증명되어 다수 국가에서 처방이 금지되었다.' },
      { name: '오공', hanja: '蜈蚣', english: 'Centipede', img: 'asset/img/Centipede.png',
        desc: '지네 전체. 독을 해독하고 경련을 멈추는 데 사용한 동물 약재로, 오늘날엔 거의 처방하지 않는다.',
        reason: '알레르기 쇼크 및 독소 반응 사례가 보고되고, 동물 약재에 대한 윤리·안전 기준 강화로 처방이 급격히 줄었다.' },
      { name: '야명사', hanja: '夜明砂', english: 'Bat', img: 'asset/img/Bat.png',
        desc: '박쥐의 말린 배설물. 야맹증과 안질 치료에 써 왔으며 냄새가 강렬해 현대에는 쓰임이 거의 없다.',
        reason: '박쥐 배설물은 광견병·코로나바이러스 등 인수공통 전염병 매개 위험이 과학적으로 확인되어 현대 의료에서 사용이 금지되었다.' },
      { name: '모구음경', hanja: '牡狗陰莖', english: "Male Dog's Penis", img: 'asset/img/Dog-penis.png',
        desc: '수캐의 음경을 말린 것. 신양을 보하여 발기 부전과 허리·무릎 냉증을 다스리는 데 쓰인 동물 보양 약재.',
        reason: '동물 유래 성적 기관의 약리 효과를 뒷받침할 과학적 근거가 없으며, 동물 복지 기준 강화와 윤리적 문제 제기로 현대 한의학 처방에서 사실상 제외되었다.' },
      { name: '인중백', hanja: '人中白', english: 'Human urine', img: 'asset/img/Urinary_Calculus.png',
        desc: '오래 말린 인간의 소변 잔여물. 열독·코피·인후종통을 다스린다고 기록된 매우 특이한 약재.',
        reason: '병원성 미생물 오염 위험이 있으며, 현행 약사법상 인체 분비물의 의약품 사용이 허용되지 않는다.' },
      { name: '난발회', hanja: '亂髮灰', english: 'Human hair', img: 'asset/img/Human-hair.png',
        desc: '사람의 머리카락을 태운 재. 지혈과 어혈 해소에 쓰였으며 현대 한의학에서도 간혹 언급된다.',
        reason: '머리카락 연소 시 독성 아민 화합물이 생성될 수 있으며, 과학적 약리 기전이 전혀 규명되지 않아 처방에서 자연 소멸되었다.' },
      { name: '우박', hanja: '雹', english: 'Hailstones', img: 'asset/img/Hail.png',
        desc: '하늘에서 내린 우박. 위열을 식히고 눈을 밝히는 데 쓰인, 구하기 극히 어려운 기상 약재.',
        reason: '현대 대기오염으로 우박에 황산염·질산염 등 오염물질이 다량 포함되어 약용 적합성을 완전히 상실했다.' },
      { name: '방경수', hanja: '方鏡水', english: 'Mirror condensation', img: 'asset/img/Mirror-condensation.png',
        desc: '청동 거울 표면에 맺힌 이슬. 귀신 들린 병과 간질 치료에 쓰인 주술적 성격의 약재.',
        reason: '음양론에 근거한 약재로 과학적 근거가 전혀 없으며, 구리 성분 용출로 인한 중금속 독성이 오히려 우려된다.' },
      { name: '연산호', hanja: '軟珊瑚', english: 'Coral', img: 'asset/img/Coral.png',
        desc: '붉은 산호 가지. 눈을 밝히고 경련을 진정시키는 데 쓰인 해양 광물 약재.',
        reason: '산호는 CITES 부속서 Ⅱ 등재 종으로 국제 거래가 엄격히 제한된다. 해양생태계 보호 정책으로 채취가 금지되었다.' },
      { name: '영양각', hanja: '羚羊角', english: 'Saiga Antelope Horn', img: 'asset/img/Antelope-horn.png',
        desc: '영양(saiga)의 뿔. 간열을 내리고 경련을 멎게 하며 눈을 밝히는 데 쓰인 희귀 동물 약재.',
        reason: '사이가 영양은 CITES 부속서 Ⅱ 등재 멸종위기종이 되었다. 뿔의 국제 거래가 규제되어 현재는 수입이 불가하다.' },
      { name: '부인월수', hanja: '婦人月水', english: 'Menstrual Blood', img: 'asset/img/Menstrual-blood.png',
        desc: '여성의 월경혈. 어혈을 풀고 귀신 들린 병·경련·해산 후 복통 등을 다스리는 데 쓰인 인체 분비물 약재.',
        reason: '감염성 질환 매개 위험이 높고, 현행 혈액 및 혈액제제에 관한 법률상 월경혈의 의약품 원료 사용이 허용되지 않는다.' },
      { name: '신생소아제', hanja: '新生小兒臍', english: "Newborn's Umbilical Cord", img: 'asset/img/Umbilical-cord.png',
        desc: '신생아의 말린 탯줄. 허약한 아이의 경련·야제(夜啼)·복통에 쓰였으며, 아이의 탯줄을 태워 약으로 쓰는 독특한 관습에서 비롯되었다.',
        reason: '병원성 미생물 오염 가능성이 있으며, 현행 의료폐기물 처리법상 탯줄은 의료폐기물로 분류되어 약용 목적의 별도 수거 자체가 불법이다.' },
      { name: '서각', hanja: '犀角', english: 'Rhinoceros Horn', img: 'asset/img/Rhinoceros-horn.png',
        desc: '코뿔소의 뿔. 극렬한 열독을 해독하고 뇌염 등의 고열을 치료하는 데 쓰인 최고급 동물 약재.',
        reason: 'CITES 부속서 Ⅰ 등재로 코뿔소 뿔 국제 거래가 1977년부터 전면 금지되었다. 현재 소지만으로도 형사처벌 대상이다.' },
      { name: '호골', hanja: '虎骨', english: 'Tiger Bone', img: 'asset/img/Tiger-bone.png',
        desc: '호랑이의 뼈. 관절염·신경통·풍증 치료에 쓰인 가장 강력한 동물 약재 중 하나.',
        reason: '호랑이가 CITES 부속서 Ⅰ에 등재되어 거래가 완전히 금지되었다. 한국에서는 이미 멸종하여 구할 수 없고, 밀거래 시 국제 형사처벌 대상이다.' },
      { name: '천령개', hanja: '天靈蓋', english: 'Human Skull Cap', img: 'asset/img/Skull-cap.png',
        desc: '오래 묻혔다 꺼낸 사람의 두개골 정수리 뼈. 광증·간질·악성 두통 치료에 쓰인 특이한 약재.',
        reason: '인체 유골 수집·사용은 장사 등에 관한 법률로 형사처벌 대상이 된다. 현대 의학·윤리 기준에서 완전히 배제되었다.' },
      { name: '인중황', hanja: '人中黃', english: 'Fermented Human Feces', img: 'asset/img/Human-feces.png',
        desc: '감초를 담은 대나무 통에 사람의 대변을 채워 오래 삭힌 것. 열독·역병·식중독 치료에 쓰였다.',
        reason: '살모넬라·장티푸스·기생충 등 치명적 병원체 전파 위험이 과학적으로 입증되었다. 현행 위생법상 의약품 원료로 사용이 불가하다.' },
      { name: '이색', hanja: '耳塞', english: 'Earwax', img: 'asset/img/Earwax.png',
        desc: '인간의 귀지. 눈에 들어간 이물질을 빼내거나 악충에 물린 데에 바르는 민간 처방에 쓰인 특이한 인체 분비물.',
        reason: '귀지의 약리 성분에 대한 과학적 근거가 없으며, 현행 의약품 기준상 처방 재료로 인정받지 못한다.' },
      { name: '석청', hanja: '石靑', english: 'Azurite', img: 'asset/img/Azurite.png',
        desc: '천연 구리 탄산염 광물(남동광). 진한 청색으로 안질·정신 불안 치료에 쓰인 광물 약재.',
        reason: '구리 이온 과잉 섭취로 인한 간독성·용혈성 빈혈이 과학적으로 확인되었다. 현행 중금속 허용 기준을 초과하여 처방이 금지되었다.' },
      { name: '종유석', hanja: '鍾乳石', english: 'Stalactite', img: 'asset/img/Stalactite.png',
        desc: '석회암 동굴 천장에서 자라는 탄산칼슘 돌기. 폐를 보하고 냉증·기침을 다스리는 데 쓰였다.',
        reason: '동굴 생태계 보호법과 자연유산 보호 규정으로 채취 자체가 불법화되었다. 의약용 칼슘 보충제로 완전히 대체되었다.' },
      { name: '양진토', hanja: '梁塵土', english: 'Beam Dust', img: 'asset/img/Beam-dust.png',
        desc: '고택 대들보 위에 수십 년 쌓인 먼지. 간질·귀신병 치료에 쓰인 주술적 성격의 약재.',
        reason: '과학적 약효 근거가 전혀 없고, 중금속·곰팡이 독소 오염 우려가 있다. 현대 목조 건물이 희귀해져 수집 자체가 불가능하다.' },
      { name: '진육', hanja: '震肉', english: 'Lightning-Struck Animal Meat', img: 'asset/img/Lightning-struck-meat.png',
        desc: '벼락을 맞아 즉사한 짐승의 고기. 하늘의 강렬한 양기를 담았다 하여 경련·간질 치료에 쓰였다는 동의보감 최희귀 약재 중 하나.',
        reason: '음양론적 해석 외에 과학적 약리 기전이 전혀 없으며, 낙뢰로 즉사한 짐승을 수시로 조달하는 것 자체가 불가능하여 자연 소멸하였다.' },
      { name: '빈랑', hanja: '檳榔', english: 'Betel nut', img: 'asset/img/Betel-nut.png',
        desc: '빈랑나무(Areca catechu)의 씨앗. 기생충 구제·소화 촉진·부종 제거에 폭넓게 쓰인 열대산 약재.',
        reason: 'WHO가 빈랑 씨앗 저작(咀嚼)을 1군 발암물질로 지정하였다. 구강암·식도암 위험이 과학적으로 확인되어 현대 의료에서 내복 처방이 사실상 금지되었다.' }
    ];

    var CARD_COLORS = [
      { bg: '#2d4a3e', light: '#4a7a62' },
      { bg: '#6b3a2a', light: '#9c5840' },
      { bg: '#1e3a5f', light: '#2e5c96' },
      { bg: '#4a3d2a', light: '#7a6444' },
      { bg: '#3a2d4a', light: '#5e4878' },
      { bg: '#2a3d1e', light: '#426030' },
      { bg: '#4a2a2a', light: '#7a4242' },
      { bg: '#1e4a4a', light: '#2e7878' },
      { bg: '#3d3a1e', light: '#625e30' },
      { bg: '#2a1e3d', light: '#422e60' },
    ];

    var N = RARE_HERBS.length; // 31

    var html = '<section class="rare-herbs-carousel-section" aria-labelledby="rare-herbs-title">';
    html += '<div class="rhc-dashboard">';
    html += '<div class="rhc-dashboard-header">';
    html += '<div>';
    html += '<h2 id="rare-herbs-title" class="rare-herbs-title">잘 쓰이지 않는 희귀 약재 31선</h2>';
    html += '<p class="rare-herbs-subtitle">동의보감에 기록됐으나 현대에는 거의 쓰이지 않는 특이한 약재들. 드래그하거나 카드를 클릭하세요.</p>';
    html += '</div>';
    html += '<button type="button" class="rhc-expand-btn" id="rhc-expand-btn" aria-label="펼쳐서보기"><span>펼쳐서보기</span><svg class="rhc-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></button>';
    html += '</div>';
    html += '<div class="rhc-scene" id="rhc-scene">';
    html += '<div class="rhc-track" id="rhc-track">';

    RARE_HERBS.forEach(function (herb, i) {
      var col = CARD_COLORS[i % CARD_COLORS.length];
      html += '<div class="rhc-card" data-herb-idx="' + i + '"';
      html += ' tabindex="0" role="button" aria-label="' + herb.name + '"';
      html += ' style="--card-bg:' + col.bg + ';--card-light:' + col.light + '">';
      html += '<div class="rhc-card-face">';
      html += '<div class="rhc-card-img-wrap">';
      html += '<img class="rhc-card-img" src="' + herb.img + '" alt="" loading="lazy" onerror="this.style.opacity=\'0\'">';
      html += '</div>';
      html += '<span class="rhc-card-name">' + herb.name + '</span>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div>'; // rhc-track
    html += '</div>'; // rhc-scene

    html += '</div>'; // rhc-dashboard
    html += '</section>';

    el.innerHTML = html;

    // 약재 상세 팝업 오버레이 — body에 직접 append해야 position:fixed가 viewport 기준으로 동작
    var popupHtml = '<div class="rare-herbs-overlay" id="rare-herbs-overlay" aria-hidden="true">';
    popupHtml += '<div class="rare-herbs-overlay-backdrop" id="rare-herbs-overlay-backdrop"></div>';
    popupHtml += '<div class="rare-herbs-popup" id="rare-herbs-popup" role="dialog" aria-modal="true" aria-labelledby="rare-popup-name">';
    popupHtml += '<button type="button" class="rare-herbs-popup-close" id="rare-herbs-popup-close" aria-label="닫기">&times;</button>';
    popupHtml += '<div class="rare-herbs-popup-img-wrap">';
    popupHtml += '<img id="rare-popup-img" class="rare-herbs-popup-img" src="" alt="" onerror="this.style.opacity=\'0\'">';
    popupHtml += '</div>';
    popupHtml += '<div class="rare-herbs-popup-body">';
    popupHtml += '<p class="rare-popup-hanja-line"><span id="rare-popup-hanja" class="rare-popup-hanja"></span><span id="rare-popup-english" class="rare-popup-english"></span></p>';
    popupHtml += '<h3 id="rare-popup-name" class="rare-popup-name"></h3>';
    popupHtml += '<p id="rare-popup-desc" class="rare-popup-desc"></p>';
    popupHtml += '<div class="rare-popup-reason-block">';
    popupHtml += '<span class="rare-popup-reason-label">지금 쓰이지 않는 이유</span>';
    popupHtml += '<p id="rare-popup-reason" class="rare-popup-reason"></p>';
    popupHtml += '</div>';
    popupHtml += '</div>';
    popupHtml += '</div>';
    popupHtml += '</div>';
    var popupEl = document.createElement('div');
    popupEl.innerHTML = popupHtml;
    document.body.appendChild(popupEl.firstChild);

    // 펼쳐서보기 오버레이 — body에 직접 append해야 position:fixed가 viewport 기준으로 동작
    var expandHtml = '<div class="rhc-expand-overlay" id="rhc-expand-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-label="희귀 약재 30종 전체 보기">';
    expandHtml += '<div class="rhc-expand-backdrop" id="rhc-expand-backdrop"></div>';
    expandHtml += '<div class="rhc-expand-content">';
    expandHtml += '<div class="rhc-expand-header">';
    expandHtml += '<button type="button" class="rhc-expand-close" id="rhc-expand-close" aria-label="닫기">&times;</button>';
    expandHtml += '</div>';
    expandHtml += '<div class="rhc-expand-grid">';
    RARE_HERBS.forEach(function (herb, i) {
      var col = CARD_COLORS[i % CARD_COLORS.length];
      expandHtml += '<button type="button" class="rhc-expand-card" data-herb-idx="' + i + '"';
      expandHtml += ' style="--card-bg:' + col.bg + ';--card-light:' + col.light + ';--stagger-i:' + i + '">';
      expandHtml += '<div class="rhc-expand-card-img-wrap">';
      expandHtml += '<img src="' + herb.img + '" alt="" loading="lazy" onerror="this.style.opacity=\'0\'">';
      expandHtml += '</div>';
      expandHtml += '<span class="rhc-expand-card-name">' + herb.name + '</span>';
      expandHtml += '</button>';
    });
    expandHtml += '</div>';
    expandHtml += '</div>';
    expandHtml += '</div>';
    var expandEl = document.createElement('div');
    expandEl.innerHTML = expandHtml;
    document.body.appendChild(expandEl.firstChild);

    // ── 수평 갤러리 ──────────────────────────────────────────────────
    var scene = document.getElementById('rhc-scene');
    var track = document.getElementById('rhc-track');
    var cards = track ? Array.prototype.slice.call(track.querySelectorAll('.rhc-card')) : [];

    var CARD_GAP    = 14;
    var AUTO_SPEED  = 0.048; // px/ms
    var scrollDir   = -1;    // -1 = 왼쪽(앞으로)

    var currentX    = 0;
    var targetX     = 0;
    var velX        = 0;
    var isDragging  = false;
    var isHovered   = false;
    var dragStartX  = 0;
    var dragStartTrackX = 0;
    var dragDeltaX  = 0;
    var lastDragX   = 0;
    var lastDragT   = 0;
    var lastTs, rafId, paused = false;

    function getCardW() {
      return (cards[0] ? cards[0].offsetWidth : 138) + CARD_GAP;
    }

    function calcBounds() {
      var sceneW = scene.offsetWidth;
      var cardW  = getCardW();
      return {
        maxX: 0,
        minX: -(N * cardW) + sceneW
      };
    }

    function initX() {
      var b = calcBounds();
      currentX = b.maxX;
      targetX  = b.maxX;
    }

    function tick(ts) {
      if (lastTs === undefined) lastTs = ts;
      var dt = ts - lastTs;
      lastTs = ts;
      if (dt > 100) dt = 16;

      if (!isDragging) {
        velX *= 0.88;
        if (!isHovered) targetX += scrollDir * AUTO_SPEED * dt;
        targetX += velX;
        var b = calcBounds();
        if (targetX < b.minX) { targetX = b.minX; scrollDir = 1;  velX *= -0.25; }
        if (targetX > b.maxX) { targetX = b.maxX; scrollDir = -1; velX *= -0.25; }
      }

      currentX += (targetX - currentX) * 0.12;
      track.style.transform = 'translateX(' + currentX.toFixed(2) + 'px) translateY(-50%)';

      // 카드별 원근감 효과
      var sceneW  = scene.offsetWidth;
      var centerX = sceneW / 2;
      var cardW   = getCardW();
      cards.forEach(function (card, i) {
        var cardCenterX = currentX + i * cardW + (cardW - CARD_GAP) / 2;
        var dist  = (cardCenterX - centerX) / (sceneW * 0.52);
        dist = Math.max(-1.2, Math.min(1.2, dist));
        var absD  = Math.abs(dist);
        var rotY  = dist * 44;
        var scale = 1 - absD * 0.15;
        var bright = 1 - absD * 0.38;
        var opa   = 0.45 + (1 - Math.min(absD, 1)) * 0.55;
        card.style.transform = 'rotateY(' + rotY.toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')';
        card.style.filter    = 'brightness(' + bright.toFixed(2) + ')';
        card.style.opacity   = opa.toFixed(3);
      });

      if (!paused) rafId = requestAnimationFrame(tick);
    }

    function onDragStart(e) {
      isDragging = true;
      velX = 0;
      dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
      dragStartTrackX = currentX;
      dragDeltaX = 0;
      lastDragX = dragStartX;
      lastDragT = Date.now();
      scene.style.cursor = 'grabbing';
    }
    function onDragMove(e) {
      if (!isDragging) return;
      var x   = e.touches ? e.touches[0].clientX : e.clientX;
      var now = Date.now();
      var dt2 = now - lastDragT;
      if (dt2 > 0) velX = (x - lastDragX) / dt2 * 10;
      lastDragX = x;
      lastDragT = now;
      dragDeltaX = x - dragStartX;
      targetX    = dragStartTrackX + dragDeltaX;
    }
    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      scene.style.cursor = 'grab';
    }

    scene.addEventListener('mousedown',  onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup',   onDragEnd);
    scene.addEventListener('touchstart', onDragStart, { passive: true });
    window.addEventListener('touchmove', onDragMove,  { passive: true });
    window.addEventListener('touchend',  onDragEnd);
    scene.addEventListener('mouseenter', function () { isHovered = true; });
    scene.addEventListener('mouseleave', function () { isHovered = false; });

    // 화면 밖에 있을 때 rAF 절약
    var observer = new IntersectionObserver(function (entries) {
      paused = !entries[0].isIntersecting;
      if (!paused) {
        lastTs = undefined;
        if (!rafId) rafId = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }, { threshold: 0 });
    if (scene) observer.observe(scene);

    window._rhcWakeup = function () {
      if (paused) return;
      lastTs = undefined;
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    // 시작
    paused = false;
    requestAnimationFrame(function () {
      initX();
      lastTs = undefined;
      rafId = requestAnimationFrame(tick);
    });

    window.addEventListener('resize', function () { initX(); });

    // ── 이벤트 연결 ────────────────────────────────────────────────
    var overlay   = document.getElementById('rare-herbs-overlay');
    var popupClose = document.getElementById('rare-herbs-popup-close');
    var backdropEl = document.getElementById('rare-herbs-overlay-backdrop');
    var currentPopupIdx = -1;
    function openRarePopup(idx) {
      var herb = RARE_HERBS[idx];
      if (!herb) return;
      currentPopupIdx = idx;
      var img = document.getElementById('rare-popup-img');
      img.src = herb.img;
      img.alt = herb.name;
      img.style.opacity = '';
      document.getElementById('rare-popup-hanja').textContent = herb.hanja;
      document.getElementById('rare-popup-english').textContent = herb.english || '';
      document.getElementById('rare-popup-name').textContent = herb.name;
      document.getElementById('rare-popup-desc').textContent = herb.desc;
      document.getElementById('rare-popup-reason').textContent = herb.reason || '';
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('rare-herbs-overlay--open');
      document.body.classList.add('rare-herbs-modal-open');
    }

    function closeRarePopup() {
      currentPopupIdx = -1;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('rare-herbs-overlay--open');
      document.body.classList.remove('rare-herbs-modal-open');
    }

    function navRarePopup(delta) {
      if (currentPopupIdx < 0) return;
      var n = RARE_HERBS.length;
      openRarePopup((currentPopupIdx + delta + n) % n);
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (Math.abs(dragDeltaX) > 8) return;
        e.stopPropagation();
        openRarePopup(parseInt(card.getAttribute('data-herb-idx'), 10));
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRarePopup(parseInt(card.getAttribute('data-herb-idx'), 10));
        }
      });
    });

    if (popupClose) popupClose.addEventListener('click', closeRarePopup);
    if (backdropEl) backdropEl.addEventListener('click', closeRarePopup);

    // 펼쳐서보기
    var expandOverlay  = document.getElementById('rhc-expand-overlay');
    var expandBackdrop = document.getElementById('rhc-expand-backdrop');
    var expandClose    = document.getElementById('rhc-expand-close');
    var expandBtn      = document.getElementById('rhc-expand-btn');

    function openExpand() {
      expandOverlay.setAttribute('aria-hidden', 'false');
      expandOverlay.classList.add('rhc-expand-overlay--open');
      document.body.classList.add('rare-herbs-modal-open');
    }
    function closeExpand() {
      expandOverlay.setAttribute('aria-hidden', 'true');
      expandOverlay.classList.remove('rhc-expand-overlay--open');
      document.body.classList.remove('rare-herbs-modal-open');
    }

    if (expandBtn)      expandBtn.addEventListener('click', openExpand);
    if (expandClose)    expandClose.addEventListener('click', closeExpand);
    if (expandBackdrop) expandBackdrop.addEventListener('click', closeExpand);

    expandOverlay && expandOverlay.querySelectorAll('.rhc-expand-card').forEach(function (card) {
      card.addEventListener('click', function () {
        closeExpand();
        openRarePopup(parseInt(card.getAttribute('data-herb-idx'), 10));
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (overlay && overlay.classList.contains('rare-herbs-overlay--open')) closeRarePopup();
        if (expandOverlay && expandOverlay.classList.contains('rhc-expand-overlay--open')) closeExpand();
      }
      if (overlay && overlay.classList.contains('rare-herbs-overlay--open')) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); navRarePopup(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navRarePopup(1); }
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
     *  - data/protected_species_korea_2023.json (449종 통합 DB)
     *  - 동의보감 탕액편 약재 데이터 (DONGUIBOGAM_HERBS) 매핑
     */
    var LEVEL_COLORS = {
      'I급': '#c0392b',     // 환경부 멸종위기 야생생물 Ⅰ급
      'II급': '#e67e22',    // 환경부 멸종위기 야생생물 Ⅱ급
      '취약': '#d4a017',    // 법적 미지정·자생지 감소·채취 압력
      '관심': '#7f8c8d'     // 보전 관심 종 (자연 개체군 축소)
    };
    var LEVEL_CSS = {
      'I급': '1',
      'II급': '2',
      '취약': 'vul',
      '관심': 'lc'
    };

    /* herbId는 DONGUIBOGAM_HERBS의 ID — 목록탭에 이미 존재하는 약재만 포함.
     * name/hanja는 렌더링 시 DONGUIBOGAM_HERBS에서 가져오고,
     * 여기에는 멸종위기 고유 정보(지역·좌표·위협·법적지위)만 보관한다. */
    var ENDANGERED_HERBS = [
      {
        herbId: 'PLANT_080',
        latin: 'Panax ginseng (wild)',
        level: '취약',
        legalStatus: '법적 미지정 (야생 개체 사실상 절멸)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '경북'],
        coords: [{ x: 290, y: 110 }, { x: 310, y: 195 }],
        habitat: '해발 400~1,200m 깊은 산 활엽수림',
        usage: '대보원기(大補元氣), 기력보강의 최상 약재',
        threat: '과도한 채취와 산림 개발로 야생 개체수 급감, 기후 온난화로 적정 서식 고도가 상승 중',
        desc: '동의보감 탕액편에서 "보기(補氣)의 으뜸"으로 기록된 약재(인삼·人參). 재배 인삼과 달리 야생 산삼은 수십 년 이상 자라야 약효가 발현된다. 현재 자연 상태의 산삼은 거의 발견되지 않는다.'
      },
      {
        herbId: 'PLANT_263',
        latin: 'Aconitum coreanum',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '충북'],
        coords: [{ x: 275, y: 105 }, { x: 235, y: 175 }],
        habitat: '해발 700m 이상 고산 초지 및 능선부',
        usage: '거풍(祛風), 풍담(風痰)으로 인한 안면마비·경련 치료',
        threat: '고산지대 기온 상승으로 서식 적지가 빠르게 축소, 약재 채취 압력 지속',
        desc: '동의보감에 "풍담(風痰)을 삭이고 안면을 바로잡는다"고 기록된 한국 고유종. 강원도 고산지대에 분포하나, 온난화로 아고산대가 줄어들며 자생지가 감소하고 있다.'
      },
      {
        herbId: 'PLANT_161',
        latin: 'Epimedium koreanum',
        level: '취약',
        legalStatus: '법적 미지정 (자생 개체군 고립·축소)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '경북', '충북'],
        coords: [{ x: 285, y: 100 }, { x: 305, y: 190 }, { x: 240, y: 180 }],
        habitat: '산지 낙엽수림 하부 반그늘 환경',
        usage: '보양(補陽), 강근골(强筋骨), 신허요통·관절통 치료',
        threat: '서식지 단편화와 산림 전용으로 개체군이 고립·축소',
        desc: '동의보감에 "음위(陰萎)를 다스리고 근골을 튼튼히 한다"고 기록된 약재. 음양곽(淫羊藿)이라고도 한다. 줄기 하나에 잎이 9장 달리는 특이한 형태로, 한국 고유종이다.'
      },
      {
        herbId: 'PLANT_152',
        latin: 'Paeonia obovata',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경기', '강원', '전북'],
        coords: [{ x: 210, y: 120 }, { x: 270, y: 95 }, { x: 175, y: 270 }],
        habitat: '산지 낙엽수림 아래 비옥한 토양',
        usage: '양혈(養血), 유간(柔肝), 혈허로 인한 복통·월경통 치료',
        threat: '약재 채취·산림 훼손으로 야생 개체 급감, 기후변화로 개화 시기 교란',
        desc: '동의보감에 "혈을 보하고 통증을 멎게 한다"고 기록된 핵심 약재(작약·芍藥). 사물탕(四物湯) 등 주요 처방에 쓰이며, 야생 산작약(백작약)은 환경부 멸종위기 Ⅱ급으로 지정되어 있다.'
      },
      {
        herbId: 'PLANT_100',
        latin: 'Dendrobium moniliforme',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['전남', '경남', '제주'],
        coords: [{ x: 165, y: 335 }, { x: 280, y: 305 }, { x: 155, y: 405 }],
        habitat: '남부·도서 지역 바위 절벽 또는 노거수의 표면 착생',
        usage: '익위양음(益胃養陰), 생진지갈(生津止渴), 허열·구갈·시력 약화 치료',
        threat: '관상용 무단 채취와 노거수·암벽 환경 훼손으로 야생 개체군 급감',
        desc: '동의보감에 "위(胃)를 보하고 진액을 생기게 한다"고 기록된 난과 약재. 바위나 나무에 붙어 자라는 착생란으로, 남해안과 제주 일부에만 자생하며 약재·관상용으로 채취 압력이 매우 높다.'
      },
      {
        herbId: 'PLANT_088',
        latin: 'Bupleurum latissimum',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['울릉도'],
        coords: [{ x: 360, y: 120 }],
        habitat: '울릉도 해안 근처 풀밭 및 비탈',
        usage: '화해소양(和解少陽), 한열왕래·간기울결 처방의 핵심 약재',
        threat: '울릉도라는 좁은 자생지, 도서 개발 및 채취 압력으로 개체수 위협',
        desc: '동의보감에 "한열(寒熱)을 다스린다"고 기록된 시호(柴胡)의 한국 고유 자생 변종. 울릉도 일부 지역에만 분포하는 한국 특산종으로 자생지 보전이 시급하다.'
      },
      {
        herbId: 'PLANT_155',
        latin: 'Scrophularia takesimensis',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['울릉도'],
        coords: [{ x: 365, y: 128 }],
        habitat: '울릉도 해안 절벽 및 풀밭',
        usage: '청열양혈(淸熱凉血), 자음강화(滋陰降火), 인후염·발열 치료',
        threat: '울릉도 한정 자생, 해안 개발과 외래종 침입',
        desc: '동의보감에 "열을 식히고 진액을 보태준다"고 기록된 현삼(玄參)의 한국 고유 변종. 울릉도 해안에만 분포하는 특산종이다.'
      },
      {
        herbId: 'PLANT_184',
        latin: 'Gastrodia elata',
        level: '취약',
        legalStatus: '법적 미지정 (공생 균류 생태계 교란)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '경북', '전남'],
        coords: [{ x: 280, y: 108 }, { x: 315, y: 200 }, { x: 155, y: 330 }],
        habitat: '참나무류 숲 속 뽕나무버섯균과 공생',
        usage: '평간식풍(平肝息風), 두통·어지럼증·경련 치료',
        threat: '공생 균류 생태계 교란, 무분별한 채취',
        desc: '동의보감에 "풍을 다스리는 신약(神藥)"이라 불린 약재. 엽록소가 없어 버섯 균사와 공생하는 독특한 식물로, 생태 조건이 까다로워 기후변화에 취약하다.'
      },
      {
        herbId: 'PLANT_221',
        latin: 'Scopolia japonica',
        level: '취약',
        legalStatus: '법적 미지정 (자생지 협소·생태 변화)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['강원', '울릉도'],
        coords: [{ x: 275, y: 102 }, { x: 355, y: 148 }],
        habitat: '깊은 산 계곡부 습윤한 부엽토',
        usage: '진통·진경, 위경련·천식 완화 (아트로핀 함유)',
        threat: '계곡 생태 변화와 개체수 감소',
        desc: '독성 알칼로이드를 함유해 "미치광이"라 이름 붙은 약재. 동의보감에 "낭탕(莨菪)"으로 기록되며, 적량 사용 시 경련·통증을 다스린다. 울릉도와 강원 심산에만 자생.'
      },
      {
        herbId: 'PLANT_250',
        latin: 'Pulsatilla koreana',
        level: '취약',
        legalStatus: '법적 미지정 (초지 감소·서식지 도시화)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['경기', '충남', '전북'],
        coords: [{ x: 208, y: 125 }, { x: 175, y: 198 }, { x: 178, y: 265 }],
        habitat: '양지바른 풀밭, 산기슭 건조한 초지',
        usage: '청열해독(淸熱解毒), 이질·혈리(血痢) 치료',
        threat: '초지 감소·도시화로 서식지 소실, 제초제 사용 영향',
        desc: '동의보감에 "열독(熱毒)을 풀고 이질을 멎게 한다"고 기록된 약재. 흰 털이 난 열매가 할머니 흰머리를 닮아 한자명 "백두옹(白頭翁)"이라 불린다.'
      },
      {
        herbId: 'PLANT_291',
        latin: 'Platycladus orientalis',
        level: '관심',
        legalStatus: '법적 미지정 (석회암 지대 개발)',
        source: '동의보감 탕액편 · 환경부 산림청',
        regions: ['충북', '경북'],
        coords: [{ x: 238, y: 182 }, { x: 308, y: 198 }],
        habitat: '석회암 지대 바위틈',
        usage: '양혈지혈(凉血止血), 출혈·토혈·탈모 치료',
        threat: '석회암 지대 개발과 자연 개체군 축소',
        desc: '동의보감에 "피를 서늘하게 하여 출혈을 멎게 한다"고 기록된 약재. 야생 측백나무는 충북·경북 석회암 지대에 제한 분포하며, 자연 개체수가 줄어들고 있다.'
      },
      {
        herbId: 'ANIMAL_169',
        latin: 'Moschus moschiferus',
        level: 'I급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅰ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 290, y: 110 }, { x: 310, y: 195 }],
        habitat: '해발 600m 이상 침엽수·활엽수 혼효림 밀림지대',
        usage: '개규(開竅)·진통·안신, 심복제통·경련·안면신경마비 치료',
        threat: '사향 채취 목적의 밀렵과 서식지 산림 개발로 개체수 급감, 현재 국내 야생 개체 사실상 절멸',
        desc: '동의보감에 "귀신을 몰아내고 모든 독을 제거한다"고 기록된 최고급 약재 사향(麝香). 수컷 사향노루의 배꼽 분비샘에서 채취하는 이 약재는 채취 과정에서 동물이 치명적 손상을 입어 밀렵의 직접 원인이 되었다. 현재 CITES 부속서 I 국제 교역 금지 대상이다.'
      },
      {
        herbId: 'ANIMAL_170',
        latin: 'Mauremys reevesii',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경기', '전남', '경남'],
        coords: [{ x: 210, y: 128 }, { x: 165, y: 330 }, { x: 278, y: 305 }],
        habitat: '수초가 풍부한 강·하천·저수지·논 주변의 햇볕 드는 수변',
        usage: '자음잠양(滋陰潛陽), 신허·골증노열(骨蒸勞熱)·월경불순 치료',
        threat: '서식 수계 오염과 수변 환경 훼손, 식용·약용 목적 남획, 외래종 붉은귀거북과의 경쟁',
        desc: '동의보감에 "음을 보하고 열을 내린다"고 기록된 구판(龜板)의 기원종. 등딱지(배갑)를 약재로 쓴다. 학명 Chinemys reevesii는 Mauremys reevesii의 구 동의어이며, 남생이는 한국 고유 담수거북으로 현재 멸종위기 Ⅱ급으로 지정되어 채취·판매가 금지되어 있다.'
      },
      {
        herbId: 'ANIMAL_141',
        latin: 'Panthera tigris altaica',
        level: 'I급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅰ급 (한반도 절멸)',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경북'],
        coords: [{ x: 288, y: 108 }, { x: 308, y: 198 }],
        habitat: '과거 한반도 전역 대산맥 밀림지대 (현재 야생 절멸)',
        usage: '강근골(强筋骨)·거풍(祛風)·진통, 관절통·근육통·마비 치료',
        threat: '일제강점기 해수구제(害獸驅除) 사업과 과도한 포획으로 한반도에서 절멸, 전 세계적으로 500마리 미만 잔존',
        desc: '동의보감에 "근골을 강화하고 풍습을 제거한다"고 기록된 호골(虎骨). 한민족에게 민족의 상징으로 여겨지던 한국호랑이(백두산호랑이)는 20세기 초 무분별한 포획으로 한반도에서 완전히 절멸하였다. 현재 CITES 부속서 I로 국제 교역이 전면 금지되어 있다.'
      },
      {
        herbId: 'ANIMAL_151',
        latin: 'Lutra lutra',
        level: 'I급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅰ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '전남', '경남'],
        coords: [{ x: 285, y: 102 }, { x: 162, y: 332 }, { x: 276, y: 308 }],
        habitat: '수질이 맑고 먹이가 풍부한 산간 하천·강·하구',
        usage: '보허(補虛)·해열·이뇨, 허로(虛勞)·골증(骨蒸)·부종 치료',
        threat: '하천 오염과 댐·보 건설로 서식지 단편화, 과거 모피·약재 목적 남획, 현재 하천 생태계 교란 지속',
        desc: '동의보감에 "허(虛)를 보하고 열을 내린다"고 기록된 달간(獺肝). 수달의 간을 약재로 쓴다. 청정 수계의 최상위 포식자인 수달은 한국에서 멸종위기 Ⅰ급으로 지정된 희귀종이며, 강원·남해안 하천에 소수 개체군이 잔존한다.'
      },
      {
        herbId: 'ANIMAL_155',
        latin: 'Callorhinus ursinus',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원'],
        coords: [{ x: 355, y: 105 }],
        habitat: '동해 연안 (겨울철 남하 회유), 번식지는 베링해 프리빌로프 제도',
        usage: '보신(補腎)·조양(助陽)·익정(益精), 신허로 인한 양위(陽萎)·요통·불임 치료',
        threat: '19~20세기 모피·약재 목적의 대규모 상업적 포획으로 전 세계적 급감, 현재 회유 개체 수 감소 추세',
        desc: '동의보감에 "신(腎)을 보하고 양기를 북돋운다"고 기록된 올눌제(膃肭臍, 해구신). 물개의 음경과 고환을 약재로 쓰는 것으로, 채취 과정에서 동물이 치명적 손상을 입는다. 현재 멸종위기 Ⅱ급으로 지정되어 채취·유통이 금지되어 있다.'
      },
      {
        herbId: 'PLANT_010',
        latin: 'Euryale ferox',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['경기', '전북', '전남'],
        coords: [{ x: 208, y: 130 }, { x: 178, y: 265 }, { x: 160, y: 328 }],
        habitat: '물 깊이 0.5~1m의 수초 풍부한 연못·호수·늪',
        usage: '고신(固腎)·건비(健脾)·지사(止瀉), 유정(遺精)·대하·소화불량·설사 치료',
        threat: '서식 수계 수질 오염과 농업용 배수로 정비, 수생식물 채취 및 습지 매립·개간',
        desc: '동의보감에 "비(脾)를 건강히 하고 설사를 멎게 한다"고 기록된 검인(芡仁). 가시연밥이라고도 하며, 가시연꽃의 씨앗을 약재로 쓴다. 가시연꽃은 국내에서 멸종위기 Ⅱ급으로 지정된 수생식물로, 경기·전라 지역 일부 습지에 소수 개체군만 남아 있다.'
      },
      {
        herbId: 'PLANT_072',
        latin: 'Brasenia schreberi',
        level: 'II급',
        legalStatus: '환경부 멸종위기 야생생물 Ⅱ급',
        source: 'protected_species_korea_2023 · 환경부',
        regions: ['강원', '경기'],
        coords: [{ x: 280, y: 108 }, { x: 205, y: 125 }],
        habitat: '수질이 맑고 영양이 적은 산지 호수·늪 (수심 0.5~2m)',
        usage: '청위(淸胃)·이수(利水)·해열, 위열(胃熱)·구역·소변불리 치료',
        threat: '서식지 수계 부영양화와 수질 오염, 농약 유입, 외래종 수초와의 경쟁',
        desc: '동의보감에 "위(胃)를 맑게 하고 열을 내린다"고 기록된 순채(蓴菜). 연한 새순은 식용으로도 쓰인다. 맑은 호수에서 자라는 수생식물로 국내에서는 강원·경기 일부 청정 습지에만 잔존하며, 환경부 멸종위기 Ⅱ급으로 지정되어 있다.'
      }
    ];

    /* ── 대한민국 도별 SVG 경로 (간소화) ── */
    var PROVINCES = [
      { id: 'seoul',    name: '서울·경기', labelX: 195, labelY: 140,
        d: 'M175,100 L225,95 L240,105 L245,130 L240,155 L225,165 L195,170 L170,165 L160,145 L162,120 Z' },
      { id: 'gangwon',  name: '강원',     labelX: 290, labelY: 108,
        d: 'M240,60 L290,50 L340,65 L355,90 L350,130 L330,150 L295,155 L260,150 L245,130 L240,105 L225,95 L230,70 Z' },
      { id: 'chungbuk', name: '충북',     labelX: 240, labelY: 188,
        d: 'M195,170 L225,165 L260,150 L275,160 L280,185 L270,205 L245,215 L215,210 L195,200 L185,185 Z' },
      { id: 'chungnam', name: '충남',     labelX: 165, labelY: 208,
        d: 'M130,175 L160,165 L170,165 L195,170 L185,185 L195,200 L190,220 L170,235 L145,240 L125,225 L115,200 L120,185 Z' },
      { id: 'gyeongbuk', name: '경북',    labelX: 310, labelY: 210,
        d: 'M275,160 L295,155 L330,150 L350,165 L355,200 L345,235 L325,250 L295,255 L270,245 L260,225 L270,205 L280,185 Z' },
      { id: 'jeonbuk', name: '전북',      labelX: 175, labelY: 268,
        d: 'M145,240 L170,235 L190,220 L215,210 L245,215 L240,240 L225,260 L200,275 L170,280 L148,270 L140,255 Z' },
      { id: 'gyeongnam', name: '경남',    labelX: 280, labelY: 300,
        d: 'M225,260 L260,260 L295,255 L325,250 L330,275 L320,305 L295,320 L265,325 L240,315 L225,295 L218,278 Z' },
      { id: 'jeonnam', name: '전남',      labelX: 160, labelY: 325,
        d: 'M115,285 L148,270 L170,280 L200,275 L225,260 L218,278 L225,295 L215,320 L195,340 L165,350 L135,345 L115,325 L108,305 Z' },
      { id: 'jeju',     name: '제주',     labelX: 155, labelY: 405,
        d: 'M120,392 L145,385 L175,388 L190,398 L185,412 L165,420 L140,418 L120,408 Z' },
      { id: 'ulleung',  name: '울릉도',   labelX: 362, labelY: 122,
        d: 'M352,115 L362,112 L370,118 L368,128 L358,130 L350,124 Z' }
    ];

    /* ── HTML 생성 ── */
    var html = '<section class="endangered-section" aria-labelledby="endangered-title">';
    html += '<div class="endangered-dashboard">';
    html += '<div class="endangered-header">';
    html += '<h2 id="endangered-title" class="endangered-title">멸종위기 약재 정보 아카이빙</h2>';
    html += '<p class="endangered-subtitle-right">환경부 멸종위기 야생생물 종목록 고시(2022.12.9.)와 동의보감 탕액편 약재 데이터를 교차 매핑한 결과입니다.<br>지도의 마커를 클릭하면 분포·법적 지정·연결된 약재 정보를 확인할 수 있습니다.</p>';
    html += '</div>';

    html += '<div class="endangered-body">';

    /* ── 지도 ── */
    html += '<div class="endangered-map-wrap">';
    html += '<svg class="endangered-map-svg" viewBox="80 40 310 400" xmlns="http://www.w3.org/2000/svg">';

    // 도 경계
    PROVINCES.forEach(function (p) {
      html += '<path class="endangered-province" data-province="' + p.id + '" d="' + p.d + '"/>';
    });

    // 도 이름 라벨
    PROVINCES.forEach(function (p) {
      html += '<text class="endangered-province-label" x="' + p.labelX + '" y="' + p.labelY + '">' + p.name + '</text>';
    });

    // 약재 마커
    ENDANGERED_HERBS.forEach(function (herb, hi) {
      var col = LEVEL_COLORS[herb.level] || '#888';
      herb.coords.forEach(function (c, ci) {
        html += '<g class="endangered-marker" data-herb="' + hi + '" data-coord="' + ci + '">';
        html += '<circle class="endangered-marker-pulse" cx="' + c.x + '" cy="' + c.y + '" r="6" fill="' + col + '" opacity="0.3"/>';
        html += '<circle cx="' + c.x + '" cy="' + c.y + '" r="5" fill="' + col + '" stroke="#fff" stroke-width="1.5"/>';
        html += '</g>';
      });
    });

    html += '</svg>';

    // 범례
    html += '<div class="endangered-legend">';
    Object.keys(LEVEL_COLORS).forEach(function (lev) {
      html += '<span class="endangered-legend-item">';
      html += '<span class="endangered-legend-dot" style="background:' + LEVEL_COLORS[lev] + '"></span>';
      html += (lev === 'I급' || lev === 'II급') ? '멸종위기 ' + lev : lev;
      html += '</span>';
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
    var regionList = Object.keys(regionSet).sort(function (a, b) { return a.localeCompare(b, 'ko-KR'); });
    html += '<button type="button" class="endangered-region-chip endangered-region-chip--active" data-region="all">전체</button>';
    regionList.forEach(function (r) {
      html += '<button type="button" class="endangered-region-chip" data-region="' + r + '">' + r + '</button>';
    });
    html += '</div>';

    // 약재 리스트
    html += '<div class="endangered-herb-list" id="endangered-herb-list">';
    var _allHerbsForChips = (window.DONGUIBOGAM_HERBS) || [];
    ENDANGERED_HERBS.forEach(function (herb, i) {
      var col = LEVEL_COLORS[herb.level] || '#888';
      var levelLabel = (herb.level === 'I급' || herb.level === 'II급') ? '멸종위기 ' + herb.level : herb.level;
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
    html += '</div>';

    // 상세 영역
    html += '<div id="endangered-detail-area">';
    html += '<div class="endangered-info-placeholder">';
    html += '<span class="endangered-info-placeholder-icon">&#127807;</span>';
    html += '지도의 마커 또는 목록을 클릭하면<br>약재의 상세 정보가 표시됩니다';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // info-panel
    html += '</div>'; // body
    html += '</div>'; // dashboard
    html += '</section>';

    el.innerHTML = html;

    /* ── 인터랙션 ── */
    var markers   = el.querySelectorAll('.endangered-marker');
    var chips     = el.querySelectorAll('.endangered-herb-chip');
    var provinces = el.querySelectorAll('.endangered-province');
    var detailArea = document.getElementById('endangered-detail-area');
    var regionChips = el.querySelectorAll('.endangered-region-chip');
    var activeRegion = 'all';

    function showDetail(idx) {
      var herb = ENDANGERED_HERBS[idx];
      if (!herb) return;
      activeHerbIdx = idx;

      // 마커 활성화
      markers.forEach(function (m) {
        var mIdx = parseInt(m.getAttribute('data-herb'), 10);
        m.classList.toggle('endangered-marker--active', mIdx === idx);
      });

      // 칩 활성화
      chips.forEach(function (c) {
        var cIdx = parseInt(c.getAttribute('data-herb-idx'), 10);
        c.classList.toggle('endangered-herb-chip--active', cIdx === idx);
      });

      // 도 하이라이트
      var herbRegionIds = [];
      herb.regions.forEach(function (r) {
        PROVINCES.forEach(function (p) {
          if (p.name.indexOf(r) >= 0 || (r === '전국')) herbRegionIds.push(p.id);
        });
      });
      if (herb.regions.indexOf('전국') >= 0) {
        herbRegionIds = PROVINCES.map(function (p) { return p.id; });
      }
      provinces.forEach(function (p) {
        var pid = p.getAttribute('data-province');
        p.classList.toggle('endangered-province--active', herbRegionIds.indexOf(pid) >= 0);
      });

      // 상세 카드 — 이름/한자는 DONGUIBOGAM_HERBS에서 조회
      var _allHerbs = (window.DONGUIBOGAM_HERBS) || [];
      var _herbRecord = null;
      for (var _di = 0; _di < _allHerbs.length; _di++) {
        if (_allHerbs[_di].id === herb.herbId) { _herbRecord = _allHerbs[_di]; break; }
      }
      var detailName  = _herbRecord ? _herbRecord.korean_name : herb.latin;
      var detailHanja = _herbRecord ? (_herbRecord.hanja_name || '') : '';
      var levelLabel = (herb.level === 'I급' || herb.level === 'II급') ? '멸종위기 ' + herb.level : herb.level;
      var cssCls = LEVEL_CSS[herb.level] || 'lc';
      var dhtml = '<div class="endangered-detail-card">';
      dhtml += '<span class="endangered-detail-level endangered-detail-level--' + cssCls + '">' + levelLabel + '</span>';
      dhtml += '<h3 class="endangered-detail-name">' + detailName + '</h3>';
      if (detailHanja) dhtml += '<p class="endangered-detail-hanja">' + detailHanja + '</p>';
      dhtml += '<p class="endangered-detail-latin">' + herb.latin + '</p>';
      if (herb.legalStatus) {
        dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">법적 지정</span><span class="endangered-detail-value">' + herb.legalStatus + '</span></div>';
      }
      dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">분포지역</span><span class="endangered-detail-value">' + herb.regions.join(', ') + '</span></div>';
      dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">서식환경</span><span class="endangered-detail-value">' + herb.habitat + '</span></div>';
      dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">약효</span><span class="endangered-detail-value">' + herb.usage + '</span></div>';
      dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">위협요인</span><span class="endangered-detail-value">' + herb.threat + '</span></div>';
      if (herb.herbId) {
        var linkLabel = _herbRecord ? (_herbRecord.korean_name + ' · 약재 보기 →') : (herb.herbId + ' · 약재 보기 →');
        dhtml += '<div class="endangered-detail-row"><span class="endangered-detail-label">동의보감 약재</span><span class="endangered-detail-value endangered-detail-link" data-herb-id="' + herb.herbId + '">' + linkLabel + '</span></div>';
      }
      dhtml += '<p class="endangered-detail-desc">' + herb.desc + '</p>';
      if (herb.source) {
        dhtml += '<p class="endangered-detail-source">출처: ' + herb.source + '</p>';
      }
      dhtml += '</div>';
      detailArea.innerHTML = dhtml;
      /* 약재 ID 클릭 → 약재 상세 모달 오픈 */
      var herbLink = detailArea.querySelector('.endangered-detail-link');
      if (herbLink) {
        herbLink.addEventListener('click', function () {
          var hid = herbLink.getAttribute('data-herb-id');
          if (!hid) return;
          var allHerbs = (window.DONGUIBOGAM_HERBS) || [];
          var found = null;
          for (var i = 0; i < allHerbs.length; i++) {
            if (allHerbs[i].id === hid) { found = allHerbs[i]; break; }
          }
          if (found && typeof window.openHerbIngredientModal === 'function') {
            window.openHerbIngredientModal(found);
          }
        });
      }
    }

    function filterByRegion(region) {
      activeRegion = region;
      regionChips.forEach(function (rc) {
        rc.classList.toggle('endangered-region-chip--active', rc.getAttribute('data-region') === region);
      });

      // 칩 필터링
      chips.forEach(function (c) {
        var idx = parseInt(c.getAttribute('data-herb-idx'), 10);
        var herb = ENDANGERED_HERBS[idx];
        var show = region === 'all' || herb.regions.indexOf(region) >= 0 || herb.regions.indexOf('전국') >= 0;
        c.style.display = show ? '' : 'none';
      });

      // 마커 필터링
      markers.forEach(function (m) {
        var mIdx = parseInt(m.getAttribute('data-herb'), 10);
        var herb = ENDANGERED_HERBS[mIdx];
        var show = region === 'all' || herb.regions.indexOf(region) >= 0 || herb.regions.indexOf('전국') >= 0;
        m.style.opacity = show ? '1' : '0.15';
        m.style.pointerEvents = show ? '' : 'none';
      });

      // 도 하이라이트
      provinces.forEach(function (p) {
        if (region === 'all') {
          p.classList.remove('endangered-province--active');
          return;
        }
        var pid = p.getAttribute('data-province');
        var prov = null;
        PROVINCES.forEach(function (pr) { if (pr.id === pid) prov = pr; });
        var match = prov && prov.name.indexOf(region) >= 0;
        p.classList.toggle('endangered-province--active', match);
      });
    }

    // 마커 클릭
    markers.forEach(function (m) {
      m.addEventListener('click', function () {
        showDetail(parseInt(m.getAttribute('data-herb'), 10));
      });
    });

    // 칩 클릭
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
        if (prov.id === 'seoul') regionName = '경기';
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
        if (state.mainCategory === main) {
          state.mainCategory = '';
          state.subCategory = '';
          document.getElementById('sub-category-wrap').setAttribute('aria-hidden', 'true');
          document.getElementById('sub-category-wrap').classList.remove('visible');
          document.querySelector('.sub-category-chips[data-role="sub-category-chips"]').innerHTML = '';
          syncMainCategoryButtonLabels();
        } else {
          state.mainCategory = main;
          state.subCategory = '';
          renderSubCategoryChips(main);
          syncMainCategoryButtonLabels();
        }
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
    dataTab.textContent = short ? '개요' : '프로젝트 개요';
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
    initHorizontalTimeline();
    initStatCountUp();
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

  function initHorizontalTimeline() {
    var nodes = document.querySelectorAll('.dgbg-htl-node');
    var details = document.querySelectorAll('.dgbg-htl-detail');
    if (!nodes.length) return;
    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var idx = node.getAttribute('data-htl-idx');
        nodes.forEach(function (n) { n.classList.remove('active'); });
        details.forEach(function (d) { d.classList.remove('active'); });
        node.classList.add('active');
        var target = document.querySelector('.dgbg-htl-detail[data-htl-idx="' + idx + '"]');
        if (target) target.classList.add('active');
      });
    });
  }

  function initStatCountUp() {
    var nums = document.querySelectorAll('.dgbg-intro-stat-num[data-count-target]');
    if (!nums.length) return;
    var duration = 1400;

    nums.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count-target'), 10);
      var useComma = el.getAttribute('data-count-format') === 'comma';
      var start = performance.now();

      function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 4);
        var current = Math.round(target * ease);
        el.textContent = useComma ? current.toLocaleString('ko-KR') : String(current);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
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
