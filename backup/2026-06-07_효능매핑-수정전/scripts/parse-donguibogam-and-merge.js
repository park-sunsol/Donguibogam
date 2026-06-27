#!/usr/bin/env node
/**
 * 동의보감 탕액편 txt 3권을 파싱하여 약재(CH)와 효능(SS)을 추출하고,
 * herbs-data.js의 기존 약재에 태그를 보강하고, 없는 약재는 추가합니다.
 *
 * 사용: node scripts/parse-donguibogam-and-merge.js [txt디렉토리]
 * txt디렉토리 기본값: ~/Downloads
 */

const fs = require('fs');
const path = require('path');
const efficacyMap = require('./donguibogam-efficacy-map.js');

const DOWNLOADS = process.env.HOME
  ? path.join(process.env.HOME, 'Downloads')
  : path.join('/Users', 'hanacardux', 'Downloads');
const TXT_DIR = process.argv[2] || DOWNLOADS;

const TXT_FILES = [
  '동의보감_탕액편_권01(20260214).txt',
  '동의보감_탕액편_권02(20260214).txt',
  '동의보감_탕액편_권03(20260214).txt',
];

const BB_TO_CATEGORY = {
  '水部': 'water',
  '土部': 'mineral',
  '穀部': 'plant',
  '人部': 'other',
  '禽部': 'animal',
  '獸部': 'animal',
  '魚部': 'animal',
  '蟲部': 'animal',
  '果部': 'plant',
  '菜部': 'plant',
  '草部 上': 'plant',
  '草部 下': 'plant',
  '木部': 'plant',
  '玉部': 'mineral',
  '石部': 'mineral',
  '金部': 'mineral',
  '湯液序例': null,
};

const CATEGORY_PREFIX = {
  plant: 'PLANT',
  animal: 'ANIMAL',
  mineral: 'MINERAL',
  water: 'WATER',
  other: 'OTHER',
};

/** 한자명 정규화: 매칭용 (參→蔘, 薑→姜 등) */
function normalizeHanja(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/\s+/g, '')
    .replace(/參/g, '蔘')
    .replace(/唐/g, '')
    .trim();
}

/** CH 라인에서 한자명 추출 (첫 번째 단어 또는 공백 전까지) */
function parseCHLine(line) {
  const content = (line.split('\t')[1] || '').trim();
  const firstSpace = content.indexOf(' ');
  const hanja = firstSpace > 0 ? content.slice(0, firstSpace).trim() : content;
  const rest = firstSpace > 0 ? content.slice(firstSpace + 1).trim() : '';
  const korean = rest && /[\uAC00-\uD7A3]/.test(rest) ? rest : '';
  return { hanja: hanja.replace(/\s/g, ''), korean };
}

/** SS 텍스트에서 효능 맵 키가 포함된 경우 해당 한글 태그 수집 (긴 키 우선) */
function extractTagsFromSS(ssText) {
  const tags = new Set();
  const keys = Object.keys(efficacyMap).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (ssText.includes(key)) tags.add(efficacyMap[key]);
  }
  return tags;
}

/** 3개 txt 파일에서 CH/SS/BB 파싱 */
function parseAllTxt() {
  const herbs = new Map(); // hanja key -> { hanja, korean, category, tags }
  let currentBB = null;

  for (const filename of TXT_FILES) {
    const filepath = path.join(TXT_DIR, filename);
    if (!fs.existsSync(filepath)) {
      console.warn('파일 없음:', filepath);
      continue;
    }
    const raw = fs.readFileSync(filepath, 'utf8');
    const lines = raw.split(/\r?\n/);

    let current = null;

    for (const line of lines) {
      if (line.startsWith('BB\t')) {
        const bb = line.slice(3).trim();
        currentBB = bb;
        continue;
      }
      if (line.startsWith('CH\t')) {
        const { hanja, korean } = parseCHLine(line);
        if (!hanja) continue;
        const category = BB_TO_CATEGORY[currentBB] || 'plant';
        current = { hanja, korean, category, tags: new Set() };
        const key = normalizeHanja(hanja);
        if (!herbs.has(key)) herbs.set(key, current);
        else current = herbs.get(key);
        continue;
      }
      if (line.startsWith('SS\t') && current) {
        const ssText = line.slice(3).trim();
        const newTags = extractTagsFromSS(ssText);
        newTags.forEach((t) => current.tags.add(t));
      }
    }
  }

  return Array.from(herbs.values()).map((h) => ({
    hanja: h.hanja,
    korean: h.korean,
    category: h.category,
    tags: Array.from(h.tags),
  }));
}

/** herbs-data.js에서 배열 추출 */
function loadHerbsData(herbsPath) {
  const content = fs.readFileSync(herbsPath, 'utf8');
  const match = content.match(/window\.DONGUIBOGAM_HERBS\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!match) throw new Error('DONGUIBOGAM_HERBS 배열을 찾을 수 없습니다.');
  return JSON.parse(match[1]);
}

/** 카테고리별 최대 번호 계산 */
function getMaxIds(herbs) {
  const max = { PLANT: 0, ANIMAL: 0, MINERAL: 0, WATER: 0, OTHER: 0 };
  for (const h of herbs) {
    const m = h.id.match(/^([A-Z]+)_(\d+)$/);
    if (m) {
      const n = parseInt(m[2], 10);
      if (n > max[m[1]]) max[m[1]] = n;
    }
  }
  return max;
}

/** 한자명으로 기존 약재 찾기 (정규화 후 비교) */
function findExisting(herbs, hanja) {
  const norm = normalizeHanja(hanja);
  const exact = herbs.find((h) => normalizeHanja(h.hanja_name) === norm);
  if (exact) return exact;
  return herbs.find((h) => h.hanja_name === hanja || h.hanja_name.includes(hanja) || hanja.includes(h.hanja_name));
}

/** category_detail 기본값 */
function defaultCategoryDetail(category) {
  const d = {
    plant: '식물-기타',
    animal: '동물-기타',
    mineral: '광물-기타',
    water: '수부-기타',
    other: '기타',
  };
  return d[category] || '기타';
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const herbsDataPath = path.join(projectRoot, 'herbs-data.js');

  console.log('동의보감 txt 파싱 중:', TXT_DIR);
  const parsed = parseAllTxt();
  console.log('파싱된 약재 수:', parsed.length);

  let herbs = loadHerbsData(herbsDataPath);
  const maxIds = getMaxIds(herbs);

  const usedIds = new Set(herbs.map((h) => h.id));
  const merged = new Set();

  for (const p of parsed) {
    const existing = findExisting(herbs, p.hanja);
    if (existing) {
      merged.add(existing.id);
      const newTags = [...new Set([...(existing.tags || []), ...(p.tags || [])])];
      existing.tags = newTags;
      continue;
    }

    const cat = p.category === 'other' ? 'plant' : p.category;
    const prefix = CATEGORY_PREFIX[cat] || 'PLANT';
    let num = maxIds[prefix] + 1;
    maxIds[prefix] = num;
    let id = `${prefix}_${String(num).padStart(3, '0')}`;
    while (usedIds.has(id)) {
      num++;
      maxIds[prefix] = num;
      id = `${prefix}_${String(num).padStart(3, '0')}`;
    }
    usedIds.add(id);

    herbs.push({
      id,
      category: cat,
      category_detail: defaultCategoryDetail(cat),
      korean_name: p.korean || p.hanja,
      hanja_name: p.hanja,
      latin_name: '',
      english_name: '',
      tags: p.tags && p.tags.length ? p.tags : ['기력보강'],
    });
  }

  const out = `// 동의보감 탕액편 약재 데이터 (엑셀에서 생성 + 동의보감 txt 병합)\nwindow.DONGUIBOGAM_HERBS = ${JSON.stringify(herbs)};`;
  fs.writeFileSync(herbsDataPath, out, 'utf8');
  console.log('herbs-data.js 저장 완료. 총 약재 수:', herbs.length);
}

main();
