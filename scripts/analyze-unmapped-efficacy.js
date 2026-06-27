#!/usr/bin/env node
/**
 * effect.json 전체를 훑어 매핑되지 않은 효능 구절을 추출
 * 실행: node scripts/analyze-unmapped-efficacy.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EFFECT_JSON = path.join(ROOT, 'effect.json');
const MAP_JS = path.join(ROOT, 'effect-efficacy-map.js');

function loadMap() {
  const code = fs.readFileSync(MAP_JS, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.DONGUIBOGAM_EFFICACY_KOREAN_MAP || {};
}

function collectAllEfficacyText(data) {
  const texts = [];
  for (const entry of data) {
    for (let i = 1; i <= 10; i++) {
      const v = entry['efficacy_korean_' + i];
      if (v && typeof v === 'string') texts.push(v);
    }
  }
  return texts.join('\n');
}

function extractEfficacyPhrases(text) {
  const phrases = new Set();
  // "X을/를 치료" 패턴
  const r1 = /([가-힣\(\)\s]{2,24})(?:을|를)\s*(?:치료|멎게|없애|풀|낫게|해소|완화|개선|보하고|도와|돕는다)/g;
  let m;
  while ((m = r1.exec(text))) phrases.add(m[1].trim());
  // "X에 주로" 패턴
  const r2 = /([가-힣\(\)\s]{2,24})에\s*(?:주로|쓰인)/g;
  while ((m = r2.exec(text))) phrases.add(m[1].trim());
  // "주로 X" 패턴
  const r3 = /주로\s+([가-힣\(\)\s]{2,20})/g;
  while ((m = r3.exec(text))) phrases.add(m[1].trim());
  // "X을/를 낫게" 등
  const r4 = /([가-힣\(\)\s]{2,20})(?:을|를)\s*(?:낫게|해소|기르|도와|돕는)/g;
  while ((m = r4.exec(text))) phrases.add(m[1].trim());
  return Array.from(phrases);
}

function getMatchedKey(phrase, mapKeysByLen) {
  for (const key of mapKeysByLen) {
    if (phrase.includes(key) || key.includes(phrase)) return key;
  }
  return null;
}

function main() {
  const data = JSON.parse(fs.readFileSync(EFFECT_JSON, 'utf8'));
  const map = loadMap();
  const mapKeys = Object.keys(map).sort((a, b) => b.length - a.length);
  const fullText = collectAllEfficacyText(data);

  const phrases = extractEfficacyPhrases(fullText);
  const unmapped = [];
  for (const p of phrases) {
    if (p.length < 3 || p.length > 30) continue;
    const matched = getMatchedKey(p, mapKeys);
    if (!matched) {
      unmapped.push(p);
    }
  }

  // 빈도 수 계산
  const freq = {};
  for (const p of unmapped) {
    let count = 0;
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const c = (fullText.match(re) || []).length;
    if (c > 0) freq[p] = (freq[p] || 0) + c;
  }
  for (const p of unmapped) {
    if (!freq[p]) {
      const c = (fullText.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      freq[p] = c;
    }
  }

  const sorted = [...new Set(unmapped)].filter(p => p.length >= 3 && p.length <= 28)
    .sort((a, b) => (freq[b] || 0) - (freq[a] || 0));

  console.log('=== 매핑되지 않은 효능 구절 (빈도순, 2회 이상 등장) ===\n');
  let count = 0;
  for (const p of sorted) {
    const c = freq[p] || 1;
    if (c >= 2) {
      console.log(`${c}\t${p}`);
      count++;
    }
  }
  console.log(`\n총 ${count}개 (2회 이상)`);
}

main();
