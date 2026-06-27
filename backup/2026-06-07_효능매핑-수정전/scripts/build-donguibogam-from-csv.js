#!/usr/bin/env node
/**
 * donguibogam_master_herbs_200_extended.csv(EUC-KR)를 읽어
 * 수록위치 끝의 한자명으로 약재를 매칭하고, 고문헌원문·번역문을
 * donguibogam-texts.js로 생성합니다.
 *
 * CSV 컬럼: 고문헌자료아이디, 한약재아이디, 한의서명, 수록위치, 고문헌원문, 번역문, 번역문출처
 * 수록위치 예: 湯液篇卷之三 > 草部 下 > 葛根 → "葛根"으로 한자 매칭
 *
 * 사용: node scripts/build-donguibogam-from-csv.js
 */

const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'donguibogam_master_herbs_200_extended.csv');
const HERBS_DATA_PATH = path.join(ROOT, 'herbs-data.js');
const OUT_PATH = path.join(ROOT, 'donguibogam-texts.js');

function loadHerbs() {
  const content = fs.readFileSync(HERBS_DATA_PATH, 'utf8');
  const match = content.match(/window\.DONGUIBOGAM_HERBS\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!match) throw new Error('DONGUIBOGAM_HERBS 배열을 찾을 수 없습니다.');
  return JSON.parse(match[1]);
}

function normalizeHanja(s) {
  if (!s || typeof s !== 'string') return '';
  return s.replace(/\s+/g, '').replace(/參/g, '蔘').trim();
}

function findHerbByHanja(herbs, hanjaText) {
  if (!hanjaText) return null;
  const norm = normalizeHanja(hanjaText);
  const exact = herbs.find((h) => normalizeHanja(h.hanja_name) === norm);
  if (exact) return exact;
  const firstWord = (hanjaText.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) || [])[0];
  if (firstWord) {
    const fwNorm = normalizeHanja(firstWord);
    const partial = herbs.find((h) => {
      const hNorm = normalizeHanja(h.hanja_name);
      if (!hNorm) return false;
      if (hNorm === fwNorm) return true;
      if (hNorm.includes('/')) {
        return hNorm.split('/').some((part) => normalizeHanja(part) === fwNorm);
      }
      return hNorm.startsWith(fwNorm) || fwNorm.startsWith(hNorm);
    });
    if (partial) return partial;
  }
  return null;
}

function parseCsvLine(line) {
  const cols = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote && c === ',') {
      cols.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  cols.push(cur.trim());
  return cols;
}

const HANJA_ALIASES = {
  '甘菊花': '菊花',
  '野菊花': '菊花',
  '茯神': '茯苓',
  '白茯苓': '茯苓',
  '赤茯苓': '茯苓',
};

function extractHanjaFromLocation(location) {
  if (!location || typeof location !== 'string') return [];
  const parts = location.split(/\s*>\s*/).map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1] || '';
  const prev = parts.length >= 2 ? parts[parts.length - 2] : '';
  const lastHanja = (last.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) || []).join('');
  const prevHanja = (prev.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) || []).join('');
  const candidates = [lastHanja];
  if (HANJA_ALIASES[lastHanja]) candidates.push(HANJA_ALIASES[lastHanja]);
  if (lastHanja.length <= 2 && prevHanja.length >= 2) candidates.push(prevHanja);
  if (lastHanja.startsWith('甘') && lastHanja.length > 1) candidates.push(lastHanja.slice(1));
  if (lastHanja.startsWith('野') && lastHanja.length > 1) candidates.push(lastHanja.slice(1));
  return [...new Set(candidates)].filter(Boolean);
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV 파일이 없습니다:', CSV_PATH);
    process.exit(1);
  }

  const herbs = loadHerbs();
  const buf = fs.readFileSync(CSV_PATH);
  const str = iconv.decode(buf, 'euc-kr');
  const lines = str.split(/\r?\n/).filter((line) => line.trim());

  const header = lines[0];
  const dataLines = lines.slice(1);

  const texts = {};
  let matched = 0;
  let skipped = 0;
  const unmatched = [];

  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    if (cols.length < 6) continue;
    const [, , , location, chinese, ko] = cols;
    const hanjaCandidates = extractHanjaFromLocation(location);
    let herb = null;
    for (const hanja of hanjaCandidates) {
      herb = findHerbByHanja(herbs, hanja);
      if (herb) break;
    }
    if (herb) {
      if (!texts[herb.id] || (chinese && chinese.length > (texts[herb.id].chinese || '').length)) {
        texts[herb.id] = { chinese: chinese || '', ko: ko || '' };
      }
      matched++;
    } else {
      skipped++;
      const firstHanja = hanjaCandidates[0];
      if (firstHanja) unmatched.push({ hanja: firstHanja, location: location.slice(0, 60) });
    }
  }

  const out = `// 동의보감 기록 (donguibogam_master_herbs_200_extended.csv 기반)
// npm run build-donguibogam-from-csv 로 재생성
window.DONGUIBOGAM_TEXTS = ${JSON.stringify(texts, null, 0)};
`;

  fs.writeFileSync(OUT_PATH, out, 'utf8');
  console.log('donguibogam-texts.js 생성 완료:', OUT_PATH);
  console.log('매칭:', matched, '건, 미매칭:', skipped, '건');
  if (unmatched.length > 0 && unmatched.length <= 30) {
    console.log('미매칭 한자 예:', unmatched.slice(0, 15).map((u) => u.hanja + ' @ ' + u.location));
  } else if (unmatched.length > 30) {
    console.log('미매칭 한자 예 (처음 15건):', unmatched.slice(0, 15).map((u) => u.hanja + ' @ ' + u.location));
  }
}

main();
