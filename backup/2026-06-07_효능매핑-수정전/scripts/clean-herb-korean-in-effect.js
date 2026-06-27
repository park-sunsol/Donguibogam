/**
 * effect.json의 herb_korean에서 영어·한자를 제거한다.
 * 제거 시: 영어/한자 앞의 쉼표(,) 또는 해당 부분을 감싼 () 괄호도 함께 삭제.
 */
const fs = require('fs');
const path = require('path');

const effectPath = path.join(__dirname, '..', 'effect.json');
const data = JSON.parse(fs.readFileSync(effectPath, 'utf8'));

// 한자 (CJK 통합 한자, 확장 A)
const HANJA_REG = /[\u4e00-\u9fff\u3400-\u4dbf]/;
// 라틴(영어) 문자
const LATIN_REG = /[A-Za-z]/;

function isOnlyHanjaAndSpaces(s) {
  if (!s || !s.trim()) return false;
  return !/[^\s\u4e00-\u9fff\u3400-\u4dbf]/.test(s);
}

function isOnlyLatinAndSpaces(s) {
  if (!s || !s.trim()) return false;
  return !/[^\sA-Za-z]/.test(s);
}

function cleanHerbKorean(value) {
  if (typeof value !== 'string') return value;
  let s = value;

  // 1. ", " + 영어(공백 포함) 제거 — 예: ", Cinnabar", ", Muscovite"
  s = s.replace(/,\s*[A-Za-z][A-Za-z\s]*/g, '');

  // 2. 공백 + 영어 단어 제거 (끝이나 괄호 앞) — 예: "남동광 Azurite" → "남동광"
  s = s.replace(/\s+[A-Za-z][A-Za-z]*(\s*\)|$)/g, '$1');

  // 3. 한자만 또는 영어만 들어 있는 괄호 () 제거 (중첩 반복)
  let prev = '';
  while (prev !== s) {
    prev = s;
    // ( 한자+공백 ) 제거
    s = s.replace(/\s*\(([\s\u4e00-\u9fff\u3400-\u4dbf]*)\)\s*/g, (_, content) =>
      isOnlyHanjaAndSpaces(content) ? '' : `(${content})`
    );
    // ( 영어+공백 ) 제거
    s = s.replace(/\s*\(([\sA-Za-z]*)\)\s*/g, (_, content) =>
      isOnlyLatinAndSpaces(content) ? '' : `(${content})`
    );
  }

  // 4. 문자열 내 한자 문자 제거 — 예: "靑竹皮가" → "가"
  s = s.replace(/[\u4e00-\u9fff\u3400-\u4dbf]+/g, '');

  // 5. 빈 괄호 "()" 제거
  s = s.replace(/\s*\(\s*\)\s*/g, '');
  // 6. 불필요한 공백·쉼표 정리
  s = s.replace(/\s*,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  s = s.replace(/,(\s*)\)/, ')').replace(/\(\s*,/, '(');

  return s.trim();
}

let changed = 0;
data.forEach((item, i) => {
  if (!item.herb_korean) return;
  const before = item.herb_korean;
  const after = cleanHerbKorean(before);
  if (before !== after) {
    changed++;
    console.log(`[${i}] ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
    item.herb_korean = after;
  }
});

fs.writeFileSync(effectPath, JSON.stringify(data, null, 4), 'utf8');
console.log(`\nDone. Updated ${changed} herb_korean entries.`);
