/**
 * effect.json → effect-data.js (window.EFFECT_DATA)
 * 로컬(file://)에서도 동의보감 기록이 보이도록 스크립트로 포함
 * 실행: node scripts/build-effect-data-js.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EFFECT_JSON = path.join(ROOT, 'effect.json');
const OUT_JS = path.join(ROOT, 'effect-data.js');

const data = JSON.parse(fs.readFileSync(EFFECT_JSON, 'utf8'));
const js = '// effect.json 기반 동의보감 기록 (build-effect-data-js.js로 생성)\nwindow.EFFECT_DATA = ' + JSON.stringify(data) + ';\n';
fs.writeFileSync(OUT_JS, js, 'utf8');
console.log('effect-data.js 생성 완료. 항목 수:', data.length);
