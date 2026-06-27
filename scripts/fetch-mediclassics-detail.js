#!/usr/bin/env node
/**
 * 한의학고전DB(mediclassics.kr)에서 content_XXX별 상세 본문을 가져와
 * 약재(herb id)와 매핑한 뒤 DONGUIBOGAM_TEXTS로 출력합니다.
 *
 * 매핑: scripts/mediclassics-content-map.json
 *   형식: { "PLANT_001": { "volume": 20, "contentId": 432 }, ... }
 *   - volume: 20=탕액편 권01, 21=권02, 22=권03
 *   - contentId: URL의 #content_432 에서 432
 *
 * 사용:
 *   1. mediclassics-content-map.example.json 을 복사해 mediclassics-content-map.json 생성
 *   2. 사이트에서 각 약재 항목을 열어 content_XXX 번호를 확인해 매핑에 추가
 *   3. node scripts/fetch-mediclassics-detail.js
 *
 * 출력: donguibogam-texts.js (index.html에서 이 파일을 script로 로드하면 상세 문구 사용)
 *
 * 참고: 한의학고전DB가 본문을 클라이언트에서 로드하면 초기 HTML에 content_XXX가 없을 수 있음.
 *       그 경우 Puppeteer로 페이지를 열고 #content_XXX 영역을 추출하는 방식이 필요할 수 있음.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const MAP_PATH = path.join(__dirname, 'mediclassics-content-map.json');
const HERBS_DATA_PATH = path.join(ROOT, 'herbs-data.js');
const OUT_PATH = path.join(ROOT, 'donguibogam-texts.js');

const BASE_URL = 'https://www.mediclassics.kr/books/8/volume';

function loadHerbs() {
  const content = fs.readFileSync(HERBS_DATA_PATH, 'utf8');
  const match = content.match(/window\.DONGUIBOGAM_HERBS\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!match) throw new Error('DONGUIBOGAM_HERBS 배열을 찾을 수 없습니다.');
  return JSON.parse(match[1]);
}

function loadMap() {
  if (!fs.existsSync(MAP_PATH)) {
    console.error('매핑 파일이 없습니다:', MAP_PATH);
    console.error('scripts/mediclassics-content-map.example.json 을 복사해 mediclassics-content-map.json 을 만들고,');
    console.error('한의학고전DB에서 각 약재의 content_XXX 번호를 채운 뒤 다시 실행하세요.');
    process.exit(1);
  }
  const raw = fs.readFileSync(MAP_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const map = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key === 'comment' || !value || typeof value !== 'object') continue;
    if (value.volume != null && value.contentId != null) map[key] = value;
  }
  return map;
}

function fetchHtml(volume) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${volume}`;
    https.get(url, { headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0 (compatible; DonguibogamArchive/1)' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * HTML 문자열에서 id="content_XXX" 인 요소의 텍스트를 추출합니다.
 * 서버가 본문을 내려주지 않으면(SPA) 빈 객체가 나올 수 있음.
 */
function extractContentBlocks(html) {
  const byId = {};
  const regex = /<[^>]+id=["']content_(\d+)["'][^>]*>([\s\S]*?)(?=<[^>]+id=["']content_\d+["']|$)/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const id = parseInt(m[1], 10);
    let raw = m[2];
    raw = raw.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    raw = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (raw) byId[id] = raw;
  }
  if (Object.keys(byId).length === 0) {
    const alt = /id=["']content_(\d+)["'][^>]*>([\s\S]*?)<\/div>/gi;
    while ((m = alt.exec(html)) !== null) {
      const id = parseInt(m[1], 10);
      let raw = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (raw) byId[id] = raw;
    }
  }
  return byId;
}

async function main() {
  const herbs = loadHerbs();
  const map = loadMap();
  const herbIds = Object.keys(map);
  if (herbIds.length === 0) {
    console.error('매핑에 항목이 없습니다. mediclassics-content-map.json 에 herb id → { volume, contentId } 를 추가하세요.');
    process.exit(1);
  }

  const volumesNeeded = [...new Set(herbIds.map((id) => map[id].volume))];
  const volumeToContent = {};

  for (const vol of volumesNeeded) {
    process.stderr.write(`volume ${vol} fetch ... `);
    const html = await fetchHtml(vol);
    volumeToContent[vol] = extractContentBlocks(html);
    const count = Object.keys(volumeToContent[vol]).length;
    process.stderr.write(`${count} content blocks\n`);
  }

  const DONGUIBOGAM_TEXTS = {};
  for (const herbId of herbIds) {
    const { volume, contentId } = map[herbId];
    const blocks = volumeToContent[volume];
    const text = blocks && blocks[contentId];
    if (text) DONGUIBOGAM_TEXTS[herbId] = text;
    else console.warn(`no content for ${herbId} volume=${volume} contentId=${contentId}`);
  }

  const out = `// 한의학고전DB(mediclassics.kr) content_XXX 스크래핑 결과. fetch-mediclassics-detail.js 로 생성.\nwindow.DONGUIBOGAM_TEXTS = ${JSON.stringify(DONGUIBOGAM_TEXTS, null, 2)};\n`;
  fs.writeFileSync(OUT_PATH, out, 'utf8');
  console.log('총', Object.keys(DONGUIBOGAM_TEXTS).length, '개 약재 상세 문구 →', OUT_PATH);
  console.log('index.html에 <script src="donguibogam-texts.js"></script> 를 script.js 전에 추가하면 적용됩니다.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
