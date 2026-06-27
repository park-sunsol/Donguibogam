#!/usr/bin/env node
/**
 * donguibogam-texts.js를 빈 객체로 초기화합니다.
 *
 * 동의보감 기록은 한의학고전DB(mediclassics.kr)의 실제 원문(성질·맛·주치 등)과
 * 매핑되어야 하며, 효능 나열만 한 가짜 문구는 사용하지 않습니다.
 * 실제 원문·한글은 다음으로만 채웁니다:
 *   - npm run parse-mediclassics-html (탕액편 권01·02·03 페이지를 저장한 HTML에서 추출)
 *   - 또는 npm run fetch-mediclassics-detail (mediclassics-content-map.json 매핑 후)
 *
 * 사용: node scripts/generate-default-donguibogam-texts.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'donguibogam-texts.js');

const content = `// 동의보감 기록: 한의학고전DB(mediclassics.kr) 원문으로만 채웁니다.
// parse-mediclassics-html 또는 fetch-mediclassics-detail 실행 후 여기에 실제 원문·한글이 들어갑니다.
// (효능 나열이 아닌 '성질이 평하고 맛은 달며...' 형태의 원문을 사용해야 합니다.)
window.DONGUIBOGAM_TEXTS = {};
`;

fs.writeFileSync(OUT_PATH, content, 'utf8');
console.log('donguibogam-texts.js를 빈 객체로 초기화했습니다. 한의학고전DB HTML 파싱으로 실제 원문을 채우세요.');
