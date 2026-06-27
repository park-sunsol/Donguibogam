#!/usr/bin/env node
/**
 * 매핑 갭 분석:
 *   1) effect.json 한글·한자 본문에서 빈출하는 구절 중 DONGUIBOGAM_EFFICACY_KOREAN_MAP에 없는 것
 *   2) tag_source==='none' 약재의 본문에서 다른 약재 본문 빈출 구절 비교
 *   3) DONGUIBOGAM_EFFICACY_TAGS 중 미사용 태그
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EFFECT = path.join(ROOT, 'data', 'effect.json');
const MAP_JS = path.join(ROOT, 'data', 'effect-map.js');
const RESULT = path.join(ROOT, 'data', 'herb-efficacy-mapping.json');

function loadMap() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(MAP_JS, 'utf8'), sandbox);
  return sandbox.window;
}

function buildText(e) {
  let t = '';
  for (let i = 1; i <= 10; i++) {
    if (e['efficacy_korean_' + i]) t += e['efficacy_korean_' + i] + ' ';
    if (e['efficacy_hanja_' + i]) t += e['efficacy_hanja_' + i] + ' ';
  }
  return t;
}

function main() {
  const data = JSON.parse(fs.readFileSync(EFFECT, 'utf8'));
  const result = JSON.parse(fs.readFileSync(RESULT, 'utf8'));
  const w = loadMap();
  const map = w.DONGUIBOGAM_EFFICACY_KOREAN_MAP || {};
  const allTags = w.DONGUIBOGAM_EFFICACY_TAGS || [];
  const mapKeys = Object.keys(map);
  const usedTags = new Set();
  for (const r of result) for (const t of r.tags) usedTags.add(t);

  // 한자 2-3자 구절 빈도
  const hanjaFreq = {};
  // 한글 동의보감 효능 동사구 후보
  const koreanVerbFreq = {};
  for (const e of data) {
    const text = buildText(e);
    // 한자 2자 시퀀스
    const hMatches = text.match(/[一-鿿]{2,4}/g) || [];
    for (const m of hMatches) {
      if (m.length < 2) continue;
      hanjaFreq[m] = (hanjaFreq[m] || 0) + 1;
    }
    // 한글 동사 패턴: ...을/를 (멎게|치료|없애|풀|낫게|보하|돕|기르)
    const vMatches = text.match(/[가-힣\(\)\s]{2,18}(?:을|를)\s*(?:멎게|치료|없|풀|낫|보하|돕|기르|돕는다|당기게|밝게|통하게|튼튼하|편안하)/g) || [];
    for (const m of vMatches) {
      const trimmed = m.replace(/\s+/g, ' ').trim();
      if (trimmed.length < 4 || trimmed.length > 24) continue;
      koreanVerbFreq[trimmed] = (koreanVerbFreq[trimmed] || 0) + 1;
    }
  }

  // 매핑 안 된 한자 (3+자, 빈도 4+)
  const unmappedHanja = Object.entries(hanjaFreq)
    .filter(([k, n]) => n >= 4 && k.length >= 2 && !mapKeys.some(mk => mk === k || (mk.length >= 2 && (mk.indexOf(k) >= 0 || k.indexOf(mk) >= 0))))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60);

  // 매핑 안 된 한글 (빈도 3+)
  const unmappedKorean = Object.entries(koreanVerbFreq)
    .filter(([k, n]) => n >= 3 && !mapKeys.some(mk => mk.length >= 4 && (k.indexOf(mk) >= 0 || mk.indexOf(k) >= 0)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);

  console.log('=== 미매핑 한자 빈출 구절 (빈도 4회+) ===');
  for (const [k, n] of unmappedHanja) console.log(`  ${n}\t${k}`);
  console.log('\n=== 미매핑 한글 빈출 동사구 (빈도 3회+) ===');
  for (const [k, n] of unmappedKorean) console.log(`  ${n}\t${k}`);

  // 미사용 태그
  const unused = allTags.filter(t => !usedTags.has(t));
  console.log('\n=== 미사용 태그 (' + unused.length + ') ===');
  for (const t of unused) console.log('  ' + t);
}

main();
