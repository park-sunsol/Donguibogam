#!/usr/bin/env node
/**
 * effect.json 전체 → herbs-data.js 변환
 * effect.json에 있는 모든 약재를 DONGUIBOGAM_HERBS로 담습니다.
 * efficacy_korean_* 텍스트를 분석해 효능 태그(갈증해소, 소화력강화 등)를 추출합니다.
 *
 * 실행: node scripts/build-herbs-from-effect.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EFFECT_JSON = path.join(ROOT, 'effect.json');
const MAP_JS = path.join(ROOT, 'effect-efficacy-map.js');
const SUPPLEMENT_JS = path.join(ROOT, 'herb-efficacy-supplement.js');
const OUT_PATH = path.join(ROOT, 'herbs-data.js');

function loadEfficacyMap() {
  const code = fs.readFileSync(MAP_JS, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  const map = sandbox.window.DONGUIBOGAM_EFFICACY_KOREAN_MAP;
  return map || {};
}

function collectEfficacyText(entry) {
  const parts = [];
  for (let i = 1; i <= 10; i++) {
    const val = entry['efficacy_korean_' + i];
    if (val && typeof val === 'string') parts.push(val);
  }
  return parts.join(' ');
}

function extractTags(text, koreanMap) {
  const tags = new Set();
  const keys = Object.keys(koreanMap).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (text.includes(key)) tags.add(koreanMap[key]);
  }
  return Array.from(tags);
}

/** effect category → main category (수부(獸)=짐승→동물, 수부(水)=물→기타, 금부(禽)=조류→동물, 금부(金)=금속→광물) */
const EFFECT_TO_MAIN = {
  곡부: 'plant', 과부: 'plant', 목부: 'plant', 채부: 'plant', 초부: 'plant',
  석부: 'mineral', 옥부: 'mineral', '금부(金)': 'mineral',
  어부: 'animal', '금부(禽)': 'animal', '수부(獸)': 'animal', 인부: 'animal', 충부: 'animal',
  '수부(水)': 'other', 토부: 'other'
};
const CATEGORY_LABELS = { plant: '식물', animal: '동물', mineral: '광물', other: '기타', unclassified: '미분류' };
const SUB_LABELS = { '금부(金)': '금부', '금부(禽)': '금부', '수부(獸)': '수부', '수부(水)': '수부' };

function main() {
  if (!fs.existsSync(EFFECT_JSON)) {
    console.error('effect.json을 찾을 수 없습니다:', EFFECT_JSON);
    process.exit(1);
  }

  const effectData = JSON.parse(fs.readFileSync(EFFECT_JSON, 'utf8'));
  if (!Array.isArray(effectData)) {
    console.error('effect.json은 배열이어야 합니다.');
    process.exit(1);
  }

  const efficacyMap = loadEfficacyMap();
  const counters = { plant: 0, animal: 0, mineral: 0, other: 0, unclassified: 0 };
  const herbs = effectData.map((entry) => {
    const effectCat = entry.category || '';
    const mainCat = EFFECT_TO_MAIN[effectCat] || 'unclassified';
    const prefix = mainCat === 'unclassified' ? 'OTHER' : mainCat.toUpperCase().replace('plant', 'PLANT').replace('animal', 'ANIMAL').replace('mineral', 'MINERAL').replace('other', 'OTHER');
    counters[mainCat] = (counters[mainCat] || 0) + 1;
    const num = counters[mainCat];
    const id = `${prefix}_${String(num).padStart(3, '0')}`;

    const subLabel = SUB_LABELS[effectCat] || effectCat;
    const mainLabel = CATEGORY_LABELS[mainCat] || mainCat;
    const categoryDetail = mainCat !== 'unclassified'
      ? `${mainLabel}-${subLabel}`
      : '미분류';

    const efficacyText = collectEfficacyText(entry);
    let tags = extractTags(efficacyText, efficacyMap);
    // 효능 설명이 거의 없는 약재: 현대 효능 보조 매핑 적용
    if (tags.length === 0) {
      const supplement = require(SUPPLEMENT_JS);
      const herbName = (entry.herb_korean || '').trim();
      const supplementalTags = supplement[herbName];
      if (Array.isArray(supplementalTags) && supplementalTags.length > 0) {
        tags = supplementalTags;
      }
    }

    return {
      id,
      category: mainCat,
      category_detail: categoryDetail,
      korean_name: (entry.herb_korean || '').trim(),
      hanja_name: (entry.herb_hanja || '').trim().replace(/^\s*唐\s*/, ''),
      latin_name: '',
      english_name: '',
      tags
    };
  });

  const js = '// 동의보감 탕액편 약재 데이터 (effect.json 전체에서 생성)\nwindow.DONGUIBOGAM_HERBS = ' + JSON.stringify(herbs, null, 0) + ';\n';
  fs.writeFileSync(OUT_PATH, js, 'utf8');
  console.log('herbs-data.js 생성 완료. 항목 수:', herbs.length);
  console.log('  식물:', counters.plant, '동물:', counters.animal, '광물:', counters.mineral, '기타:', counters.other);
}

main();
