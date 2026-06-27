#!/usr/bin/env node
/**
 * data/herb-efficacy-mapping.json의 태그를 data/herb-data.js의 DONGUIBOGAM_HERBS에 주입
 * (런타임에서 herbs[].tags를 읽는 2D/3D 그래프·필터·검색에 매핑 결과 즉시 반영)
 *
 * 실행: node scripts/sync-herb-tags.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HERB_DATA_JS = path.join(ROOT, 'data', 'herb-data.js');
const MAPPING_JSON = path.join(ROOT, 'data', 'herb-efficacy-mapping.json');

function loadHerbsFromJs(jsCode) {
  const sandbox = { window: {} };
  vm.runInNewContext(jsCode, sandbox);
  return sandbox.window.DONGUIBOGAM_HERBS || [];
}

function main() {
  const jsCode = fs.readFileSync(HERB_DATA_JS, 'utf8');
  const herbs = loadHerbsFromJs(jsCode);
  const mapping = JSON.parse(fs.readFileSync(MAPPING_JSON, 'utf8'));
  const tagsById = Object.fromEntries(mapping.map((m) => [m.herb_id, m.tags || []]));

  let changed = 0;
  let unchanged = 0;
  let missing = 0;
  const updated = herbs.map((h) => {
    const newTags = tagsById[h.id];
    if (!newTags) { missing++; return h; }
    const oldTags = h.tags || [];
    const same = oldTags.length === newTags.length && oldTags.every((t, i) => t === newTags[i]);
    if (same) { unchanged++; return h; }
    changed++;
    return Object.assign({}, h, { tags: newTags });
  });

  // 기존 herb-data.js의 DONGUIBOGAM_HERBS = [...] 줄만 교체 (HERB_ENGLISH_SUPPLEMENT 등 다른 블록은 보존)
  const newHerbsLine = 'window.DONGUIBOGAM_HERBS = ' + JSON.stringify(updated) + ';';
  const re = /window\.DONGUIBOGAM_HERBS\s*=\s*\[[\s\S]*?\];/;
  if (!re.test(jsCode)) {
    console.error('!! DONGUIBOGAM_HERBS 블록 정규식 매치 실패 - 파일 구조 변경?');
    process.exit(1);
  }
  const newCode = jsCode.replace(re, newHerbsLine);
  fs.writeFileSync(HERB_DATA_JS, newCode, 'utf8');

  console.log('=== herb-data.js tags 동기화 ===');
  console.log(`전체 약재: ${herbs.length}`);
  console.log(`태그 갱신:   ${changed}`);
  console.log(`태그 동일:   ${unchanged}`);
  console.log(`매핑 없음:   ${missing}`);
  console.log(`업데이트 파일: ${path.relative(ROOT, HERB_DATA_JS)}`);
}

main();
