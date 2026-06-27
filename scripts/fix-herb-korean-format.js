#!/usr/bin/env node
/**
 * effect.json herb_korean 포맷 수정
 * - A(B) → A (B) (띄어쓰기)
 * - A(A) → A (괄호 안이 앞과 동일하면 괄호부 삭제)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EFFECT_JSON = path.join(ROOT, 'effect.json');

function fixHerbKorean(val) {
  if (!val || typeof val !== 'string') return val;
  const trimmed = val.trim();
  const match = trimmed.match(/^(.+?)\(([^)]+)\)\s*$/);
  if (!match) return trimmed;
  const [, before, inside] = match;
  const beforeTrim = before.trim();
  const insideTrim = inside.trim();
  if (beforeTrim === insideTrim) {
    return beforeTrim;
  }
  if (before.endsWith(' ')) {
    return trimmed;
  }
  return beforeTrim + ' (' + insideTrim + ')';
}

function main() {
  const data = JSON.parse(fs.readFileSync(EFFECT_JSON, 'utf8'));
  let changeCount = 0;
  for (const entry of data) {
    if (!entry.herb_korean) continue;
    const fixed = fixHerbKorean(entry.herb_korean);
    if (fixed !== entry.herb_korean) {
      console.log(entry.herb_korean, '→', fixed);
      entry.herb_korean = fixed;
      changeCount++;
    }
  }
  fs.writeFileSync(EFFECT_JSON, JSON.stringify(data, null, 4) + '\n', 'utf8');
  console.log('\n총', changeCount, '건 수정. effect.json 저장 완료.');
}

main();
