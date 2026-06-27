#!/usr/bin/env node
/**
 * THUMBNAIL_BY_ID 매핑용 참조 목록 생성
 * - herbs-data.js의 모든 약재 (id, korean_name)
 * - asset/Img의 이미지 파일 목록
 * 실행: node scripts/list-herb-thumbnail-reference.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HERBS_JS = path.join(ROOT, 'herbs-data.js');
const IMG_DIR = path.join(ROOT, 'asset', 'Img');
const OUT_REF = path.join(ROOT, 'THUMBNAIL_REFERENCE.md');

const herbsCode = fs.readFileSync(HERBS_JS, 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(herbsCode, sandbox);
const herbs = sandbox.window.DONGUIBOGAM_HERBS || [];

const imgs = fs.existsSync(IMG_DIR)
  ? fs.readdirSync(IMG_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f)).sort()
  : [];

const lines = [
  '# 썸네일 매핑 참조',
  '',
  '## asset/Img 이미지 파일 (' + imgs.length + '개)',
  '```',
  ...imgs.map((f) => '  ' + f),
  '```',
  '',
  '## 약재 ID · 한글명 (herbs-data.js, ' + herbs.length + '개)',
  '| ID | 한글명 |',
  '|----|--------|',
  ...herbs.map((h) => '| ' + (h.id || '') + ' | ' + (h.korean_name || '').replace(/\|/g, '\\|') + ' |'),
  '',
  '## 현재 herb-viewer.js에 등록된 ID (참고)',
  '```',
  "  PLANT_001(인삼), PLANT_006(계피), PLANT_016(국화), PLANT_017(금은화), PLANT_019(괴화),",
  "  PLANT_024(구기자), PLANT_026(결명자), PLANT_031(감초), PLANT_032(생강), PLANT_033(건강),",
  "  PLANT_034(대추), PLANT_039(길경), PLANT_058(갈근), PLANT_059(계지복령), PLANT_069(도인),",
  "  PLANT_089(찹쌀), PLANT_097(녹두), PLANT_149(무화과), PLANT_363(도토리),",
  "  ANIMAL_021(해마), ANIMAL_039(문어), MINERAL_007(석고), MINERAL_016(옥), MINERAL_026(홍옥석)",
  '```',
];

fs.writeFileSync(OUT_REF, lines.join('\n'), 'utf8');
console.log('THUMBNAIL_REFERENCE.md 생성 완료.');
console.log('  약재:', herbs.length, '개');
console.log('  이미지:', imgs.length, '개');
