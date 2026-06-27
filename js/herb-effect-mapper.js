/**
 * 동의보감 약재 ↔ effect.json 매칭
 * 별칭(도인/복숭아씨, 도핵인/복숭아씨)·한자 변형(唐 등)·괄호 내 이름 교차 매칭
 */
(function () {
  'use strict';

  function norm(s) {
    if (!s || typeof s !== 'string') return '';
    return String(s).replace(/\s+/g, '').trim();
  }

  function normHanja(s) {
    if (!s || typeof s !== 'string') return '';
    return String(s).replace(/^\s*唐\s*/, '').replace(/\s+/g, '').trim();
  }

  /** 한글명에서 모든 변형 추출: "의이인(율무)" → ["의이인","율무"], "복숭아씨(도인)" → ["복숭아씨","도인"] */
  /** 단, 공통어(고기·육·뼈·간 등)는 길이 3자 미만이면 매칭에서 제외 (오매칭 방지) */
  var GENERIC_WORDS = { '고기': 1, '육': 1, '뼈': 1, '간': 1, '피': 1, '물': 1, '수': 1, '기름': 1, '가죽': 1, '쓸개': 1, '뿔': 1, '껍질': 1, '흙': 1, '재': 1, '肉': 1 };
  function extractKoreanVariants(s) {
    if (!s || typeof s !== 'string') return [];
    var out = {};
    var before = String(s).replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (before) out[norm(before)] = true;
    var m = String(s).match(/\(([^)]+)\)/);
    if (m) {
      m[1].split(/[/,，、\s]+/).forEach(function (part) {
        var p = norm(part);
        if (p && p.length >= 1) out[p] = true;
      });
    }
    if (s && s.indexOf('(') < 0) out[norm(s)] = true;
    return Object.keys(out);
  }

  /** '고기', '육' 등 공통어는 부분 일치에 사용하지 않음 (오매칭 방지) */
  function isTrivialOverlap(pk, ek) {
    if (!pk || !ek) return true;
    if (pk === ek) return false;
    var shorter = pk.length <= ek.length ? pk : ek;
    if (GENERIC_WORDS[shorter]) return true;
    if (shorter.length < 3) return true;
    return false;
  }

  /** 한자 동의어: 동일 약재의 다른 표기 */
  var HANJA_ALIASES = {
    '桃核仁': ['桃仁'],
    '桃仁': ['桃核仁'],
    '桂皮': ['肉桂'],
    '薏苡仁': ['薏苡']
  };

  function getHanjaEquivalents(h) {
    if (!h) return [];
    var list = [normHanja(h), norm(h)].filter(Boolean);
    var key = norm(h);
    if (HANJA_ALIASES[key]) {
      HANJA_ALIASES[key].forEach(function (a) { list.push(a); });
    }
    Object.keys(HANJA_ALIASES || {}).forEach(function (k) {
      if ((HANJA_ALIASES[k] || []).indexOf(key) >= 0) list.push(k);
    });
    return list;
  }

  /** herb(페이지 약재)와 effect 항목이 같은 약재인지 */
  function isSameHerb(herb, effectEntry) {
    var phHanjas = getHanjaEquivalents(herb.hanja_name);
    var pkVariants = extractKoreanVariants(herb.korean_name);
    var eh = normHanja(effectEntry.herb_hanja) || norm(effectEntry.herb_hanja);
    var ekVariants = extractKoreanVariants(effectEntry.herb_korean || '');

    if (phHanjas.length && eh) {
      for (var i = 0; i < phHanjas.length; i++) {
        if (phHanjas[i] === eh) return true;
        if (phHanjas[i] && eh && (phHanjas[i].indexOf(eh) >= 0 || eh.indexOf(phHanjas[i]) >= 0)) return true;
      }
    }

    for (var pi = 0; pi < pkVariants.length; pi++) {
      for (var ei = 0; ei < ekVariants.length; ei++) {
        var pk = pkVariants[pi];
        var ek = ekVariants[ei];
        if (!pk || !ek) continue;
        if (pk === ek) return true;
        if (isTrivialOverlap(pk, ek)) continue;
        if (pk.indexOf(ek) >= 0 || ek.indexOf(pk) >= 0) return true;
      }
    }

    var ekFull = (effectEntry.herb_korean || '').trim();
    if (herb.korean_name && ekFull.indexOf(herb.korean_name) >= 0) return true;
    for (var j = 0; j < pkVariants.length; j++) {
      var pk = pkVariants[j];
      if (!pk || pk.length < 2 || ekFull.indexOf(pk) < 0) continue;
      if (GENERIC_WORDS[pk]) continue;
      return true;
    }
    return false;
  }

  /** effect.json 배열에서 herb에 해당하는 기록 찾기 */
  /** herbs와 effects가 effect.json에서 동일 순서로 생성된 경우 인덱스로 직접 매칭 (수부 오매칭 방지) */
  function findEffectRecord(herb, effectData, herbsForIndex) {
    if (!herb || !effectData || !effectData.length) return null;
    if (herbsForIndex && Array.isArray(herbsForIndex) && herbsForIndex.length === effectData.length) {
      var idx = herbsForIndex.findIndex(function (h) { return h && h.id === herb.id; });
      if (idx >= 0 && idx < effectData.length) return effectData[idx];
    }
    for (var i = 0; i < effectData.length; i++) {
      if (isSameHerb(herb, effectData[i])) return effectData[i];
    }
    return null;
  }

  if (typeof window !== 'undefined') {
    window.HerbEffectMapper = {
      findEffectRecord: findEffectRecord,
      isSameHerb: isSameHerb,
      extractKoreanVariants: extractKoreanVariants,
      normHanja: normHanja
    };
  }
})();
