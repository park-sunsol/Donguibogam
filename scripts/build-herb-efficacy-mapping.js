#!/usr/bin/env node
/**
 * effect.json + DONGUIBOGAM_EFFICACY_KOREAN_MAP → 약재별 효능 태그 매핑 생성
 * 출력: data/herb-efficacy-mapping.json, data/herb-efficacy-mapping.csv
 * 실행: node scripts/build-herb-efficacy-mapping.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EFFECT_JSON = path.join(ROOT, 'data', 'effect.json');
const MAP_JS = path.join(ROOT, 'data', 'effect-map.js');
const SUPPLEMENT = require('./herb-efficacy-supplement.js');
const OUT_JSON = path.join(ROOT, 'data', 'herb-efficacy-mapping.json');
const OUT_CSV = path.join(ROOT, 'data', 'herb-efficacy-mapping.csv');
const OUT_BODY = path.join(ROOT, 'data', 'herb-body-category-summary.json');

// 첨부 efficacy-body-category.js 기준 — 신체 부위 중심 카테고리
const BODY_CATEGORY_OF_TAG = {
  '시력보조': '머리·눈·귀', '이명완화': '머리·눈·귀', '두통완화': '머리·눈·귀',
  '기침완화': '호흡·폐', '가래완화': '호흡·폐', '호흡완화': '호흡·폐',
  '심신안정': '심·신경', '불안완화': '심·신경', '수면진정': '심·신경', '경련완화': '심·신경',
  '소화력강화': '위·소화', '구역완화': '위·소화', '가스완화': '위·소화', '변비완화': '위·소화', '갈증해소': '위·소화',
  '간해독': '간·담',
  '혈액순환': '혈·순환', '혈액보강': '혈·순환', '출혈멎음': '혈·순환', '어혈개선': '혈·순환',
  '월경': '여성·부인', '출산보조': '여성·부인', '태보': '여성·부인',
  '신장보강': '신장·소변', '소변개선': '신장·소변', '부종완화': '신장·소변',
  '뼈근육강화': '근골·관절', '관절통완화': '근골·관절', '통증완화': '근골·관절',
  '피부해독': '피부', '피부개선': '피부', '가려움완화': '피부', '상처회복': '피부',
  '기력보강': '정기·기력', '면역강화': '정기·기력', '피로회복': '정기·기력', '진액보충': '정기·기력',
  '냉증완화': '정기·기력', '감기완화': '정기·기력', '노화완화': '정기·기력', '기억력개선': '정기·기력',
  '염증완화': '염증·해독', '해독': '염증·해독', '구충': '염증·해독',
  // 첨부에 누락된 태그 보완 (한방 통상 분류)
  '열내림': '염증·해독', '살균': '염증·해독',
  '간보호': '간·담',
  '뼈강화': '근골·관절',
  '상처치유': '피부',
  '대하완화': '여성·부인',
  '비염완화': '머리·눈·귀',
  '혈압조절': '혈·순환',
  '윤활': '정기·기력', '습기제거': '정기·기력', '습기개선': '정기·기력', '남성건강보조': '정기·기력',
  // 매핑 사전 우측값에 있지만 정규 태그 목록에는 없는 별칭들
  '숙면유도': '심·신경', '정신맑음': '심·신경',
  '허리통증완화': '근골·관절', '배변원활': '위·소화', '피부해독': '피부',
};

const BODY_CATEGORY_CLUSTER = {
  '머리·눈·귀': 0,
  '호흡·폐': 1, '위·소화': 1, '간·담': 1,
  '혈·순환': 2, '정기·기력': 2, '심·신경': 2,
  '신장·소변': 3, '여성·부인': 3,
  '근골·관절': 4,
  '피부': 5,
  '염증·해독': 6,
  '기타': 7,
};

const BODY_CATEGORY_ORDER = [
  '기타', '머리·눈·귀', '호흡·폐', '심·신경', '위·소화', '간·담', '혈·순환',
  '여성·부인', '신장·소변', '근골·관절', '피부', '정기·기력', '염증·해독',
];

function loadMap() {
  const code = fs.readFileSync(MAP_JS, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return {
    map: sandbox.window.DONGUIBOGAM_EFFICACY_KOREAN_MAP || {},
    primary: sandbox.window.DONGUIBOGAM_EFFICACY_PRIMARY_TAGS || [],
    all: sandbox.window.DONGUIBOGAM_EFFICACY_TAGS || [],
  };
}

function extractTags(effectRecord, mapKeysSorted, map) {
  let text = '';
  for (let i = 1; i <= 10; i++) {
    const k = effectRecord['efficacy_korean_' + i];
    const h = effectRecord['efficacy_hanja_' + i];
    if (k && typeof k === 'string') text += k + ' ';
    if (h && typeof h === 'string') text += h + ' ';
  }
  const tags = [];
  const hits = {};
  for (const key of mapKeysSorted) {
    if (text.indexOf(key) >= 0) {
      const tag = map[key];
      if (!tag) continue;
      if (tags.indexOf(tag) < 0) tags.push(tag);
      hits[tag] = (hits[tag] || 0) + 1;
    }
  }
  return { tags, hits };
}

/** 보조 매핑 키(한글명) 후보 — herb_korean 표기 변동에 대비해 다중 키 시도 */
function supplementKeysFor(herbKorean) {
  if (!herbKorean) return [];
  const keys = new Set();
  const trimmed = String(herbKorean).trim();
  keys.add(trimmed);
  const noParen = trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (noParen) keys.add(noParen);
  const m = trimmed.match(/\(([^)]+)\)\s*$/);
  if (m) keys.add(m[1].trim());
  return Array.from(keys);
}

function applySupplement(herbKorean, tags, hits) {
  const keys = supplementKeysFor(herbKorean);
  let supplemental = null;
  let matchedKey = null;
  for (const k of keys) {
    if (Array.isArray(SUPPLEMENT[k])) { supplemental = SUPPLEMENT[k]; matchedKey = k; break; }
  }
  if (!supplemental) return { tags, hits, supplementApplied: false };
  const merged = tags.slice();
  const newHits = Object.assign({}, hits);
  for (const t of supplemental) {
    if (merged.indexOf(t) < 0) merged.push(t);
    newHits[t] = (newHits[t] || 0) + 1;
  }
  return { tags: merged, hits: newHits, supplementApplied: true, supplementKey: matchedKey, supplementTags: supplemental };
}

function csvEscape(s) {
  if (s == null) return '';
  const str = String(s);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function tagsToBodyCategories(tags, hits) {
  const counts = {};
  for (const t of tags) {
    const cat = BODY_CATEGORY_OF_TAG[t] || '기타';
    const weight = hits[t] || 1;
    counts[cat] = (counts[cat] || 0) + weight;
  }
  const sorted = Object.entries(counts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return BODY_CATEGORY_ORDER.indexOf(a[0]) - BODY_CATEGORY_ORDER.indexOf(b[0]);
  });
  return {
    body_categories: sorted.map(([c]) => c),
    body_category_hits: counts,
    primary_body_category: sorted.length ? sorted[0][0] : '기타',
    cluster: sorted.length ? (BODY_CATEGORY_CLUSTER[sorted[0][0]] ?? 7) : 7,
  };
}

function main() {
  const data = JSON.parse(fs.readFileSync(EFFECT_JSON, 'utf8'));
  const { map, primary, all } = loadMap();
  const mapKeysSorted = Object.keys(map).sort((a, b) => b.length - a.length);

  const result = [];
  let autoMapped = 0;
  let supplementOnly = 0;
  let supplementBoosted = 0;
  let unmapped = 0;
  const tagFreq = {};
  const bodyCatFreq = {};
  const herbsByBodyCat = {};
  const supplementUsedKeys = new Set();

  for (const entry of data) {
    const auto = extractTags(entry, mapKeysSorted, map);
    const sup = applySupplement(entry.herb_korean || '', auto.tags, auto.hits);
    const tags = sup.tags;
    const hits = sup.hits;

    if (sup.supplementApplied) supplementUsedKeys.add(sup.supplementKey);
    if (auto.tags.length > 0 && sup.supplementApplied) supplementBoosted++;
    else if (auto.tags.length > 0) autoMapped++;
    else if (sup.supplementApplied && tags.length > 0) supplementOnly++;
    else unmapped++;

    for (const t of tags) tagFreq[t] = (tagFreq[t] || 0) + 1;

    const body = tagsToBodyCategories(tags, hits);
    for (const c of body.body_categories) bodyCatFreq[c] = (bodyCatFreq[c] || 0) + 1;
    if (tags.length > 0) {
      const pc = body.primary_body_category;
      (herbsByBodyCat[pc] = herbsByBodyCat[pc] || []).push({
        herb_id: entry.herb_id || '',
        herb_korean: entry.herb_korean || '',
        herb_hanja: entry.herb_hanja || '',
        tags,
      });
    }

    const source = sup.supplementApplied
      ? (auto.tags.length > 0 ? 'auto+supplement' : 'supplement')
      : (auto.tags.length > 0 ? 'auto' : 'none');

    result.push({
      herb_id: entry.herb_id || '',
      category: entry.category || '',
      herb_korean: entry.herb_korean || '',
      herb_hanja: entry.herb_hanja || '',
      tags,
      tag_hits: hits,
      auto_tags: auto.tags,
      supplement_tags: sup.supplementTags || [],
      tag_source: source,
      body_categories: body.body_categories,
      body_category_hits: body.body_category_hits,
      primary_body_category: body.primary_body_category,
      cluster: body.cluster,
    });
  }
  const mapped = autoMapped + supplementOnly + supplementBoosted;

  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), 'utf8');

  const header = ['herb_id', 'category', 'herb_korean', 'herb_hanja', 'tag_count', 'tags', 'tag_source', 'primary_body_category', 'body_categories', 'cluster'];
  const lines = [header.join(',')];
  for (const r of result) {
    lines.push([
      csvEscape(r.herb_id),
      csvEscape(r.category),
      csvEscape(r.herb_korean),
      csvEscape(r.herb_hanja),
      r.tags.length,
      csvEscape(r.tags.join('|')),
      csvEscape(r.tag_source),
      csvEscape(r.primary_body_category),
      csvEscape(r.body_categories.join('|')),
      r.cluster,
    ].join(','));
  }
  fs.writeFileSync(OUT_CSV, lines.join('\n'), 'utf8');

  const summary = {
    body_category_order: BODY_CATEGORY_ORDER,
    body_category_cluster: BODY_CATEGORY_CLUSTER,
    body_category_count: bodyCatFreq,
    herbs_by_primary_body_category: Object.fromEntries(
      BODY_CATEGORY_ORDER
        .filter((c) => herbsByBodyCat[c])
        .map((c) => [c, herbsByBodyCat[c].sort((a, b) => (a.herb_korean || '').localeCompare(b.herb_korean || '', 'ko'))])
    ),
  };
  fs.writeFileSync(OUT_BODY, JSON.stringify(summary, null, 2), 'utf8');

  const sortedTagFreq = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]);
  const supplementKeys = Object.keys(SUPPLEMENT);
  console.log('=== 약재 → 효능 태그 매핑 결과 ===');
  console.log(`전체 약재: ${data.length}`);
  console.log(`태그 매핑됨: ${mapped} (${(mapped / data.length * 100).toFixed(1)}%)`);
  console.log(`  - auto만:           ${autoMapped}`);
  console.log(`  - auto+supplement:  ${supplementBoosted}`);
  console.log(`  - supplement만:     ${supplementOnly}`);
  console.log(`태그 없음: ${unmapped}`);
  console.log(`보조 사전 항목: ${supplementKeys.length}, 적용된 키: ${supplementUsedKeys.size}`);
  console.log(`사용된 고유 태그: ${sortedTagFreq.length} / 정의된 전체: ${all.length}`);
  console.log('\n--- 태그별 빈도(상위 25) ---');
  for (const [tag, n] of sortedTagFreq.slice(0, 25)) {
    const star = primary.includes(tag) ? '★' : ' ';
    console.log(`${star} ${tag.padEnd(10, ' ')}\t${n}`);
  }
  console.log('\n--- 신체 부위 카테고리(주 카테고리 기준 약재 수) ---');
  const sortedCat = BODY_CATEGORY_ORDER
    .map((c) => [c, (herbsByBodyCat[c] || []).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  for (const [c, n] of sortedCat) console.log(`  ${c.padEnd(8, ' ')}\t${n}`);
  console.log(`\n출력: ${path.relative(ROOT, OUT_JSON)}, ${path.relative(ROOT, OUT_CSV)}, ${path.relative(ROOT, OUT_BODY)}`);
}

main();
