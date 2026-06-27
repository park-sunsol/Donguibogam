# 프로젝트 구조 변경 이력

폴더 삭제·이동·이름 변경 등 구조적 변경사항을 기록합니다.
원복이 필요할 때 이 파일을 참조하세요.

---

## 2026-06-27

### [삭제] 미사용 한지 텍스처 SVG 제거
- **대상 경로:** `asset/prescription/hanji_texture.svg`(삭제)
- **변경 내용:** 처방 책 패널 한지 질감을 `asset/main/background.png` 오버레이(`.book-texture`) 방식으로 전환하면서, 책 배경에 직접 깔던 `hanji_texture.svg`가 더 이상 참조되지 않아 삭제. 가장자리 헤짐 마스크 `book_frayed_mask.svg`는 계속 사용.
- **이유:** 사용자 요청 — 텍스처 소스를 background.png로 교체하고 미사용 SVG 정리
- **원복 방법:** 책 텍스처를 SVG 방식으로 되돌리려면 이전 커밋/백업에서 `hanji_texture.svg`를 복원하고 `.book-open` 배경에 `url("../asset/prescription/hanji_texture.svg")` 레이어를 재추가
- **날짜:** 2026-06-27

---

## 2026-06-18

### [수정] 독활 괄호 한글명 동정 오류 정정 (땃두릅나무 → 땅두릅)
- **대상 경로:** `data/effect.json`(원천) 및 파생 데이터 `data/herb-data.js`, `data/effect-map.js`, `data/efficacy-universe.json`, `data/efficacy-universe.js`, `data/herb-efficacy-mapping.json`, `data/herb-body-category-summary.json`, `data/herb-origin.js`(build-herb-origin 재생성)
- **변경 내용:** PLANT_090 독활(獨活)의 괄호 한글명을 `(땃두릅나무)` → `(땅두릅)`으로 정정. 근거: 분류가 초부(풀)이고 효능 원문이 "이 풀은…", "독요초(獨搖草)"라고 풀로 명시 → 독활은 여러해살이 풀인 땅두릅(Aralia cordata/continentalis). 반면 "땃두릅나무"는 목본 가시관목 Oplopanax elatus로 이름만 유사한 다른 식물(목본일 수 없음). 괄호약재 505종 전수검사(중복 라벨/"~의 일종"·類 자기동정/분류↔라벨/원문 "이 풀·나무"↔라벨 4종 교차검증)에서 유기노초 외 유일하게 확인된 동일 유형 오류. 부자·천웅(오두), 산조인·백극(멧대추나무) 중복은 같은 식물의 다른 부위/형태로 오류 아님. `effect.json` 수정 후 `herb-origin.js`만 `npm run build-herb-origin`으로 재생성, 나머지 파생 파일은 정확 문자열 치환. JSON 유효성 확인.
- **이유:** 사용자 요청 — 유기노초처럼 괄호명이 잘못 표기된 약재 전수검사 결과 독활 1건 추가 확인됨
- **원복 방법:** 위 파일들의 `독활 (땅두릅)`을 `독활 (땃두릅나무)`로 되돌림
- **날짜:** 2026-06-18

### [수정] 유기노초 괄호 한글명 동정 오류 정정 (절굿대 → 쑥의 일종)
- **대상 경로:** `data/effect.json`(원천) 및 파생 데이터 `data/herb-data.js`, `data/effect-map.js`, `data/efficacy-universe.json`, `data/efficacy-universe.js`, `data/herb-efficacy-mapping.json`, `data/herb-body-category-summary.json`, `data/herb-origin.js`(build-herb-origin 재생성)
- **변경 내용:** PLANT_254 유기노초(劉寄奴草)의 괄호 한글명이 누로(漏蘆, PLANT_117)와 동일한 `(절굿대)`로 잘못 중복돼 있던 것을 `(쑥의 일종)`으로 정정. 근거: 효능 원문이 "싹·줄기는 쑥과 비슷하고… 쑥의 일종이다(蒿之類也)"라고 직접 명시 → Artemisia anomala(기호, 奇蒿)류로, 엉겅퀴류인 절굿대(漏蘆 = Echinops/Rhaponticum)와 무관. 누로의 `(절굿대)`는 표준 동정이 맞아 그대로 유지. `effect.json` 수정 후 `herb-origin.js`만 `npm run build-herb-origin`으로 재생성(build-herbs-from-effect·build-effect-data 스크립트는 루트 경로를 가리켜 현 `data/` 구조와 어긋나 미실행), 나머지 파생 파일은 정확 문자열 치환. JSON 유효성·`누로 (절굿대)` 보존 확인.
- **이유:** 사용자 요청 — 누로·유기노초가 둘 다 `(절굿대)`로 표기된 것이 맞는지 검토 결과 유기노초가 오류로 확인됨
- **원복 방법:** 위 파일들의 `유기노초 (쑥의 일종)`을 `유기노초 (절굿대)`로 되돌림
- **날짜:** 2026-06-18

---

## 2026-06-14

### [추가] 향약/토착화/일반 약재 출신 분류 + 「향약과 자주의학」 그래프 보기 전환
- **대상 경로:** 신규 `scripts/build-herb-origin.js`(분류 생성기), 신규 `data/herb-origin.js`(생성물, `window.HERB_ORIGIN`), 수정 `index.html`·`script.js`·`css/data.css`·`package.json`.
- **변경 내용:** 동의보감 탕액편 효능 원문(`effect.json`)의 산지·향명·이종(移種) 기록을 신호어로 추출해 약재 641종을 **향약(native·185)/토착화(naturalized·3)/일반(general·453)** 3등급으로 분류(`herb_id` 키). 대시보드(`dashboard-container`)에 "분류 체계별 ↔ 향약 분류별" 토글 추가: 기존 선버스트는 그대로 두고, 향약 분류별 보기는 출신 색(향약 초록/토착화 호박/일반 회색)으로 재배치한 트리맵 + 범례(겸 출신 필터)를 새로 렌더(`renderOriginView`/`getHerbOrigin`/`setupDashboardViewToggle`). `index.html`에 `<script src="data/herb-origin.js">` 로드 추가, `package.json`에 `build-herb-origin` 스크립트 추가.
- **이유:** 사용자 요청 — 동의보감이 인용한 조선 의서의 의의(조선 자생 향약재 정리·해외 약재 토착화 노력)를 그래프에 구분 표시.
- **원복 방법:** `backup/2026-06-14_향약자주의학-그래프-보완전/`의 `script.js`·`index.html`·`css/data.css`를 원위치로 덮어쓰고, `data/herb-origin.js`·`scripts/build-herb-origin.js` 삭제, `package.json`의 `build-herb-origin` 스크립트 라인 제거.
- **날짜:** 2026-06-14

### [이름변경] 메인 연 GLB 파일명 변경 (lotus-root* → lotus-main*)
- **대상 경로:** `asset/glb/lotus-root.glb` → `asset/glb/lotus-main.glb`, `asset/glb/lotus-root-parts.glb` → `asset/glb/lotus-main-parts.glb` (사용자가 직접 변경). 별도로 새 `asset/glb/lotus-root.glb`(연근 상세 모델)가 추가됨.
- **변경 내용:** `js/lotus-parts-3d.js`의 메인 모델 로드 경로를 `lotus-root-parts.glb` → `lotus-main-parts.glb`로 갱신(주석 포함). 상세 GLB의 `root` 매핑은 새 `lotus-root.glb`를 그대로 가리키므로 변경 없음.
- **이유:** 사용자 요청 — 메인/상세 모델 명명 정리(메인은 lotus-main*, 부위 상세는 lotus-leaf/seed/root).
- **원복 방법:** 파일명을 원복하고 `lotus-parts-3d.js`의 로드 경로를 `lotus-root-parts.glb`로 되돌림.
- **날짜:** 2026-06-14

### [수정] lotus-seed.glb 2요소 → 1요소 (왼쪽 요소 삭제)
- **대상 경로:** `asset/glb/lotus-seed.glb` (원본 백업: `backup/lotus-seed_2026-06-14_2elements.glb`)
- **변경 내용:** 한 메시에 좌(-X, 매끈한 통씨)·우(+X, 배아가 보이는 갈라진 씨) 2개 요소가 합쳐져 있던 것을 Blender MCP에서 분리해 **왼쪽(-X) 요소 삭제**, 오른쪽만 남기고 원점 재정렬·재내보내기(6.8MB→3.3MB). 부위 상세 보조 뷰어(연자)에서 단일 씨앗만 보이게 함.
- **이유:** 사용자 요청 — 메인 GLB 부위 클릭 시 우측에 뜨는 상세 GLB에서 연자가 2개로 보이는 문제.
- **원복 방법:** `asset/glb/lotus-seed.glb`를 `backup/lotus-seed_2026-06-14_2elements.glb`로 덮어쓰기.
- **날짜:** 2026-06-14

### [추가] 개요 탭 출처 영역 하단 서명용 그라데이션 드로온 lottie 4종
- **대상 경로:** `asset/hero/{dong,yi,bao,gam}_gradient_color.json` (신규 4개)
- **변경 내용:** 프로젝트 개요 탭 출처(`footer.data-view-sources`) 하단에 "동의보감" 글써지는 lottie 서명 추가. 백업 원본(`backup/hero_lottie_drawon_original/*_gradient_drawon.json`, 그라데이션 stroke 보존본)을 복사해 `_gradient_color.json`으로 사용. hero 배경용 `asset/hero/*_gradient_drawon.json`(흰색 stroke)과 구분.
- **이유:** 사용자 요청 — 배경 그라데이션 밴드 없이 글자 자체가 그라데이션 컬러로 써지고, 화면 전체 폭을 채우도록.
- **원복 방법:** `asset/hero/*_gradient_color.json` 4개 삭제, `index.html`의 `.data-view-sign` 블록과 `css/data.css`의 `.data-view-sign`/`.dgbg-sign-char` 규칙, `script.js`의 `initSignLottie`/`playSignLottie`/`initSignLottieObserver` 및 호출부 제거.
- **날짜:** 2026-06-14

### [수정] 연 GLB 잎·줄기 해부학적 재절단 (높이 절단 → 식물 구조 기반)
- **대상 경로:** `asset/glb/lotus-root-parts.glb` (직전 백업: `backup/lotus-root-parts_2026-06-14_pre-anatomical-recut.glb`)
- **변경 내용:** 기존 `leaf`/`stem` 분리가 수평면(z≈0.15) 절단이라 잎 노드가 줄기 일부를 포함하던 문제 해결. Blender MCP에서 leaf+stem 병합 후 **반경 PCA(R=0.05)로 선형(줄기 튜브) vs 평면(잎 블레이드)** 분류 + 다수결 스무딩으로 재분리. 줄기는 모든 잎·꽃자루 포함, 잎은 블레이드만 보유. 뿌리줄기 근처 두꺼운 베이스 블롭(z<0.13)은 줄기로 귀속. GLB 노드 5개(root/flower/core/leaf/stem) 유지, leaf/stem 지오메트리만 교체. `js/lotus-parts-3d.js` 존 이름 동일해 로직 변경 없음(주석만 갱신).
- **이유:** 사용자 요청 — 뷰어에서 하엽(잎) 선택 시 줄기까지 함께 강조되는 문제. "식물 구조 기반 해부학적 관점"으로 재절단 지시.
- **원복 방법:** `asset/glb/lotus-root-parts.glb`를 `backup/lotus-root-parts_2026-06-14_pre-anatomical-recut.glb`로 덮어쓰기.
- **날짜:** 2026-06-14

### [수정] 연 GLB에 꽃 중심부(화탁=씨방부) 존 추가 — `core` 노드 분리
- **대상 경로:** `asset/glb/lotus-root-parts.glb` (원본 백업: `backup/lotus-root-parts_2026-06-14_pre-core-split.glb`)
- **변경 내용:** Blender MCP로 기존 `flower`(단일 융합 메시)에서 꽃 중심 화탁 영역을 **중심축 반경 기준(평면 절단 아님)** 으로 선택해 `core` 노드로 분리. GLB 노드가 4개(root/flower/leaf/stem) → 5개(+`core`)가 됨. `js/lotus-parts-3d.js`의 `ZONES`에 `core` 추가, 연수·연방·연자·연심 4부위를 `flower`→`core` 존으로 재매핑, `ZONE_PRIMARY.core='receptacle'` 추가.
- **이유:** 사용자 요청 — 기존 부위 구분이 단순 높이(축) 절단이라 상세 카테고리 표현 불가. 연방·연자·연심을 꽃 중심부(상위 카테고리)에 묶고, 축 기준이 아닌 해부학적(방사형) 분리로 정교화.
- **원복 방법:** `asset/glb/lotus-root-parts.glb`를 백업 파일로 덮어쓰고, `lotus-parts-3d.js`의 `ZONES`에서 `core` 제거 + 연수/연방/연자/연심 zone을 `flower`로 되돌림 + `ZONE_PRIMARY`에서 `core` 항목 삭제.
- **날짜:** 2026-06-14

---

## 2026-06-13

### [추가] 테스티모니얼 카드 컴포넌트(독립 데모 파일)
- **대상 경로:** `testimonial-cards.html`
- **변경 내용:**
  - Dribbble "Testimonial Card Hover Interaction" 스타일의 테스티모니얼 카드 컴포넌트 신규 추가
  - 흩뿌려진 부채꼴(scattered fan) 배치 + 호버/포커스 인터랙션(떠오름·정렬·액센트 채움·형제 흐리기)
  - 단일 자체 완결 HTML: 외부 CDN/빌드 의존성 0 (인라인 CSS + 바닐라 JS) — file://·시크릿모드에서도 항상 렌더링
  - 본 사이트(바닐라 JS 정적 페이지)와는 무관한 독립 데모. `index.html`/`script.js`에 연결하지 않음
- **이유:** 사용자 요청 — 호버 인터랙션 테스티모니얼 카드 제작. 초기엔 React+Tailwind(CDN)로 했으나 CDN 미로드 시 빈 화면 문제 발생 → 사용자의 스택 변경 허용 및 프로젝트가 바닐라/`file://` 기반인 점을 고려해 의존성 0 단일 파일로 재작성
- **원복 방법:** `testimonial-cards.html` 삭제
- **날짜:** 2026-06-13

---

## 2026-06-11

### [추가] 멸종위기 약재 영역 개편 전 백업 폴더 생성
- **대상 경로:** `backup/2026-06-11_멸종위기-개편전/` (`script.js`, `features.css`)
- **변경 내용:**
  - 멸종위기 약재 대시보드 개편(`renderEndangeredHerbsSection`) 직전의 `script.js`·`css/features.css` 원본 백업
  - 개편 내용: 간이 다각형 지도 → 통계청 시도 경계 GeoJSON 기반 정밀 SVG 지도(메르카토르 투영, viewBox 0 0 488 586), ENDANGERED_HERBS 18건 → 48건(환경부 Ⅰ급 13·Ⅱ급 24, 해양보호생물 1, 천연기념물 4, 미지정 취약·관심 6), 약재 목록에 존재하지 않던 사향(ANIMAL_169)·구판(ANIMAL_170) 항목 삭제
- **이유:** 사용자 컨펌(2026-06-11) 후 멸종위기 약재 영역 전면 개편 — 원본 보존
- **원복 방법:** `backup/2026-06-11_멸종위기-개편전/script.js` → `script.js`, `backup/2026-06-11_멸종위기-개편전/features.css` → `css/features.css`로 복사
- **날짜:** 2026-06-11

---

## 2026-06-08

### [추가] 처방 완료 화면 — 고(膏)·단(丹) 제형 완료 이미지 연동
- **대상 경로:** `asset/prescription/finish_go.png`, `asset/prescription/finish_dan.png`, `js/hand-herb-game.js`
- **변경 내용:**
  - 신규 완료 이미지 2종(`finish_go.png`, `finish_dan.png`) 추가 — 기존 탕·산·환에 더해 5개 제형 완료 이미지 전부 구비
  - `showComplete()`의 `FINISH_IMG` 매핑에 `go: 'finish_go'`, `dan: 'finish_dan'` 추가 (기존 고·단은 기본 탕 이미지로 폴백됐음)
  - "고·단은 추후 추가 예정" 주석 제거
- **이유:** 사용자 요청 — 고·단 전용 완료 이미지 추가됨에 따라 반영
- **원복 방법:** `js/hand-herb-game.js`의 `FINISH_IMG`에서 `go`·`dan` 항목 제거(폴백 `finish_tang` 복귀), 이미지 파일 삭제
- **날짜:** 2026-06-08

---

## 2026-06-07

### [수정] 처방 조제 게임 — 단(丹) 모드 인터랙션 교체: 풀무질 → 금박 입히기
- **대상 경로:** `js/hand-herb-game.js`
- **변경 내용:**
  - 단 모드를 **양손 풀무질(화로 단련)** → **한 손으로 단약을 집어(pinch) 금박 위에서 문질러 입히기**로 전면 교체
  - `setupDanMode` 상태 재정의: `{ idx, coverage(0~1), grabbed, pillX/pillY, lastHX/lastHY, sparkles[], pellets[] }` (기존 `puffs/fireIntensity/leftPhase/sparks` 제거)
  - `updateDanMode`: 한 손(`getMainHand`) 기준 — 단약 근처에서 집으면(pinch + `GRAB_DIST+18`) grab, 집은 채 이동량(`mv`) 누적으로 `coverage` 상승, 100%면 `finishDanPellet`. 놓으면 도포율 유지한 채 받침으로 복귀
  - 신규 함수 `spawnGoldSparkle`(금가루 반짝임), `finishDanPellet`(완성 단을 트레이로 날리고 `consumeHerbAt` 호출). 기존 `detectBellows`·`registerDanPuff` 제거
  - `drawDanScene` 전면 재작성: 화로·불꽃 → **칠기 받침 + 금박지(빛결 흐름) + 단약(붉은 베이스 위로 차오르는 금박 코트, 구체 클리핑) + 금가루 + 금박 % 게이지 + 완성된 금빛 단 트레이**
  - 코치 문구(PC/모바일) "단 제련하기/풀무질" → "단 금박 입히기/집어서 문지르기"로 교체
  - **모바일:** 좌·우 풀무 버튼(`setupDanTouchButtons`) 제거 → 캔버스 드래그(집어서 문지르기)로 입력. 함수는 잔재 정리(no-op)로 축소, 호출부 `setupDanTouchButtons(false)`
- **이유:** 사용자 요청 — 풀무질 대신 금박 입히기가 더 적합. 고증: 동의보감 단(丹) 처방 **금박진심단(金箔鎭心丹)**(구성: 금박·주사·우황·사향·인삼)이 약에 금박을 입히는 기법을 그대로 보여줌
- **원복 방법:** `js/hand-herb-game.js`의 단 모드 4함수(`setupDanMode`·`updateDanMode`·`drawDanScene` + 신규 `spawnGoldSparkle`/`finishDanPellet`)를 풀무질 버전(`detectBellows`·`registerDanPuff` 포함)으로 환원, `setupDanTouchButtons`에 풀무 버튼 생성 로직 복원 + 호출부 `currentType === 'dan' && mobile` 복원, 코치 문구·danState 주석 환원 (git/이전 스냅샷 참조)
- **날짜:** 2026-06-07

### [추가] 처방 조제 게임 — 고(膏) 모드 영상 연동 + 휘젓기 효과음
- **대상 경로:** `asset/prescription/go_background.mp4`(신규), `asset/sound/`(신규: `stirring.mp3`·`stirring_2.mp3`), `index.html`, `js/hand-herb-game.js`, `js/sfx.js`
- **변경 내용:**
  - `index.html`: `herb-game-go-source` 비디오 태그 추가(san/whan과 동일한 오프스크린 프레임 소스)
  - `js/hand-herb-game.js`: 고 모드를 캔버스 직접 묘사(가마솥·즙·거품·주걱) → **영상 프레임 스크럽** 방식으로 전환. `setupGoMode`에 프레임 상태 추가 + `preloadGoFrames`(san 패턴 복제), `updateGoMode`는 `drawGoBgFrame`(농축 진행도로 프레임 스크럽) + 휘젓기 감지 + `drawGoHint`(원형 화살표 + 게이지). 기존 `drawGoScene` 제거
  - **휘젓기 방향 무관 처리**: 기존 시계방향(`d>0`)만 진행 → `Math.abs(d)` 누적으로 시계/반시계 모두 인정(영상 방향에 안 끌림)
  - 효과음: 능동 휘젓기 중 `stir`(stirring.mp3) 루프 on/off, 고 화면 내내 `stir_bg`(stirring_2.mp3) 은은한 배경 루프. `startGame`/`stopGame`에서 루프 시작·정지 처리
  - `js/sfx.js` SOUND_MAP에 `stir`(loop, vol 0.55)·`stir_bg`(loop, vol 0.22) 추가
- **이유:** 사용자 요청 — 고 제형을 탕과 차별화된 졸이기 영상으로 연동, 휘젓기 소리(stirring)와 은은한 배경음(stirring_2) 추가
- **원복 방법:** `index.html`의 go-source 태그 제거, `js/hand-herb-game.js`의 고 모드 함수를 캔버스 묘사 `drawGoScene` 방식으로 환원(git 이력 참조), `js/sfx.js`의 stir/stir_bg 항목 제거, 신규 mp4·mp3 삭제
- **날짜:** 2026-06-07

### [추가] 처방 조제 게임 효과음 — 산(散) 모드 단계별 사운드
- **대상 경로:** `asset/sound/`(신규: `crunch.mp3`·`sweep.mp3`·`falling_powder.mp3`), `js/sfx.js`, `js/hand-herb-game.js`
- **변경 내용:**
  - `js/sfx.js` SOUND_MAP에 `crunch`(절구 찧기)·`sweep`(절구 기울여 옮기기)·`falling_powder`(한지에 가루) 추가
  - `js/hand-herb-game.js` `updateSanMode`: 스윙마다 `sfx('crunch')`, 붓기 시작(pourStarted)에 `sfx('sweep')`, 붓기 완료(pourProgress≥0.95)에 `sfx('falling_powder')`
  - `consumeHerbAt`: `currentType === 'san'` 일 때 공통음(`collect`) 억제 — 산은 위 3종으로 별도 처리
- **이유:** 사용자 요청 — 산 제형 단계별 효과음(절구질·옮기기·종이에 떨어뜨리기)
- **원복 방법:** `js/sfx.js` SOUND_MAP의 crunch/sweep/falling_powder 항목 제거, `js/hand-herb-game.js`의 해당 `sfx()` 3곳 제거 및 `consumeHerbAt`의 san 분기 `sfx('collect')`로 환원, `asset/sound/`의 3개 mp3 삭제
- **날짜:** 2026-06-07

### [추가] 처방 조제 게임 효과음 — 사운드 매니저 + 배경 루프
- **대상 경로:** `js/sfx.js`(신규), `asset/sound/`(신규: `grab.mp3`·`water_splash.mp3`·`boiling_water.mp3`(실제 음원), `collect.wav`·`complete.wav`(placeholder)), `scripts/gen-placeholder-sfx.py`(신규), `js/hand-herb-game.js`, `index.html`
- **변경 내용:**
  - `js/sfx.js`: 효과음 매니저(`window.Sfx.play/startLoop/stopLoop/unlock/toggleMute`). 프리로드·폴리포니(cloneNode)·배경 루프 재생·음소거 localStorage 기억(루프도 멈춤/복귀)·자동재생 잠금해제·파일 부재 시 무음 처리
  - `asset/sound/`: `grab.mp3`(약재 잡기), `water_splash.mp3`(탕 약탕기 투입), `boiling_water.mp3`(탕 배경 루프) — 실제 mp3 음원. `collect.wav`(탕 외 제형 투입), `complete.wav`(완성) — `scripts/gen-placeholder-sfx.py` 합성 placeholder(추후 실제 녹음 교체)
  - `js/hand-herb-game.js`: 헬퍼 `sfx(name)` 추가 후 연결 — 잡기(`grab`: 탕 양손/마우스 폴백), 탕 투입(`splash`: `collectHerb`), 탕 외 투입(`collect`: `consumeHerbAt`), 완성(`complete`: `showComplete`). `startGame`에서 `Sfx.unlock()` + 탕이면 `startLoop('boil')`/그 외 `stopLoop('boil')`, `stopGame`에서 `stopLoop('boil')`
  - `index.html`: `js/hand-herb-game.js` 앞에 `js/sfx.js` 로드 추가
- **이유:** 사용자 요청 — 처방탭 약재 인터랙티브 화면 효과음(핵심부터, 실제 오디오 파일). 탕 배경음 boiling_water·투입음 water_splash·잡기음 grab.mp3 지정
- **원복 방법:** `js/sfx.js`·`asset/sound/`·`scripts/gen-placeholder-sfx.py` 삭제, `index.html`의 `<script src="js/sfx.js">` 라인 제거, `js/hand-herb-game.js`의 `sfx(`/`Sfx.` 호출·헬퍼 정의 제거
- **날짜:** 2026-06-07

### [수정] 효능 매핑 — 고아 태그·불일치 태그 정리 (태그 체계 50→46 정합화)
- **대상 경로:** `data/effect-map.js`, `scripts/herb-efficacy-supplement.js` / 재생성 산출물: `data/herb-data.js`, `data/herb-efficacy-mapping.json(.csv)`, `data/herb-body-category-summary.json`, `data/efficacy-universe.json(.js)`
- **배경(문제):** ① 정식 태그 목록(`DONGUIBOGAM_EFFICACY_TAGS`)엔 있으나 약재 0~2개뿐인 고아 태그 다수(혈압조절·피로회복·간보호·살균·윤활·상처치유·뼈강화 등). ② 키워드는 약재에 부여되는데 정식 목록엔 없어 약재 탭 노드로 안 잡히는 불일치 태그 9개(불안완화·피부해독·허리통증완화·습기개선·정신맑음·숙면유도·비염완화·변비완화·배변원활).
- **변경 내용:**
  - **고아 태그 제거+동의어 병합:** `혈압조절` 제거(동의보감에 혈압 개념 없음, 현대어 키워드 死). `피로회복`→`기력보강`(원문이 피로를 보기·보로와 구분 안 함), `간보호`→`간해독`, `살균`→`구충`, `윤활`→`진액보충`, `상처치유`→`상처회복`(金瘡 키워드), `뼈강화`→`뼈근육강화`(골절 키워드).
  - **불일치 태그 — 선별 승격/병합:**
    - 정식 노드로 **승격**(약재 다수·독립 개념): `불안완화`(28)·`피부해독`(22)·`허리통증완화`(13)·`습기개선`(6, 기존 고아 '습기제거'와 통합).
    - 인접 태그로 **병합**(약재 1~2개): `정신맑음`→`기억력개선`(開心益智·開竅), `숙면유도`→`심신안정`(失眠·不眠), `비염완화`→`감기완화`(鼻窒·鼻塞).
    - `변비완화`·`배변원활`→`소화력강화`: 변비를 1차 효능으로 기술한 코퍼스 표현이 사실상 없어(大便難 1건뿐) 독립 노드 대신 위·소화로 흡수(*최초 승인안의 '변비완화 복구'를 데이터 근거로 조정*).
  - **TAGS 목록:** 50개 → **46개** (제거 8 + 승격 4). `EFFICACY_TO_BODY_CATEGORY`도 46개 태그와 1:1 정합되도록 유령 항목(수면진정 등 포함) 정리.
  - **supplement:** 팔초어·소팔초어의 수동 `피로회복` 제거(기력보강 유지), 몰식자 `변비완화`→`소화력강화`.
- **결과:** 비정식 태그 0, 약재 0~2개 고아 태그 0, 전 산출물에서 옛/병합 태그명 완전 제거. **모든 태그가 최소 6약재 이상** 보유(최소 6 ~ 최대 167). body-category 키 46개 = 정식 태그 46개 1:1 일치.
- **참고:** 빌드 스크립트 2종(`build-herb-efficacy-mapping.js`·`build-efficacy-universe.js`)의 `BODY_CATEGORY_OF_TAG`는 "누락 태그 방어용" 여분 키를 의도적으로 포함하는 구조라(주석 명시) 비활성 키가 남아도 무해 → 미정리.
- **재빌드 절차:** `build-herb-efficacy-mapping` → `sync-herb-tags` → `build-efficacy-universe`
- **원복 방법:** `backup/2026-06-07_효능매핑-수정전/` 스냅샷에서 `data/effect-map.js`·`scripts/herb-efficacy-supplement.js` 복원 후 재빌드 3종 실행.
- **날짜:** 2026-06-07

### [수정] 효능 매핑 — '생리조절' 과다·'생리통완화' 과소 매핑 정상화 + 월경 의미 명확화
- **대상 경로:** `data/effect-map.js`(원본 사전), `scripts/build-herb-efficacy-mapping.js`, `scripts/build-efficacy-universe.js`, `scripts/herb-efficacy-supplement.js` / 재생성 산출물: `data/herb-data.js`, `data/herb-efficacy-mapping.json(.csv)`, `data/herb-body-category-summary.json`, `data/efficacy-universe.json(.js)`
- **배경(문제):** '생리조절'(112약재)이 낙태(墮胎·낙태시 ~57)·출산/난산(産後·催生·難産 등 ~48)·대하(帶下 ~29) 키워드까지 끌어와 과다 매핑됨. 반대로 '생리통완화'는 키워드 6개 중 5개가 코퍼스에 없는 죽은 키워드라 약재 1개(택란)만 매핑되는 과소 매핑 상태였음.
- **변경 내용:**
  - **태그 통합/신설/명칭(`DONGUIBOGAM_EFFICACY_TAGS`):** `생리조절`+`생리통완화` → 단일 태그 **`월경`**으로 통합(명칭 모호성 제거). 신규 태그 **`출산보조`** 추가. (태그 총수 50 유지)
  - **키워드 재태깅(`DONGUIBOGAM_EFFICACY_KOREAN_MAP`):**
    - 월경 본래 의미(調經·通月水·血閉·通月經·血氣不調·婦人血·"월경을 통하게/통하지/고르게"·월경통·經痛 등) → `월경`
    - 帶下·主帶下·主赤白 → 기존 `대하완화`로 이관
    - 産後·催生·難産·落胞·産難·主産難·産後淋瀝·산후통·産後腹痛 → 신규 `출산보조`
    - **유산/낙태(墮胎, "낙태시") → 사전에서 삭제**(태그화하지 않음)
    - 죽은 키워드 보강: 실제 코퍼스 표현 `"월경"`(한글, 33약재 발화)·`月經`·`月水`·`行經` → `월경`, `"산후"`·`"난산"`·`胞衣` → `출산보조`
  - **body-category 매핑 동기화:** 3개 파일의 `여성·부인` 항목을 `생리조절/생리통완화` → `월경/출산보조`로 교체(`EFFICACY_TO_BODY_CATEGORY` + 두 빌드 스크립트 `BODY_CATEGORY_OF_TAG`).
  - **보조 매핑(`herb-efficacy-supplement.js`):** 수동 지정 `생리조절` 5건(인곤당·백합·발합·봉선화·작맥) → `월경`.
- **결과(재빌드 후 herb-data.js 기준):** `월경` 52약재(생리통 핵심 9종 도핵인·우슬·단삼·작약·목단·현호색·향부자·삼릉·봉출 모두 포함), `출산보조` 44, `대하완화` 9→34, `생리조절`·`생리통완화` 0. 옛 태그는 전 산출물에서 완전 제거 확인.
- **참고:** 사용자 지침 "월경이 아닌 일반 생리현상은 '생리현상'으로" 검토 결과, 사전 내 '생리' 키워드는 전부 월경(menstruation) 의미였고 일반 생리현상 콘텐츠는 없어 `생리현상` 태그는 생성하지 않음. / `scripts/donguibogam-efficacy-map.js`는 활성 빌드 파이프라인이 아닌 일회성 머지 스크립트(parse-donguibogam-and-merge.js) 전용이라 미수정(레거시).
- **재빌드 절차:** `node scripts/build-herb-efficacy-mapping.js` → `node scripts/sync-herb-tags.js` → `node scripts/build-efficacy-universe.js`
- **원복 방법:** 위 [백업] 스냅샷에서 해당 파일 복원 — `cp "backup/2026-06-07_효능매핑-수정전/data/effect-map.js" data/effect-map.js` 등으로 4개 소스 파일 복원 후 재빌드 3종 실행(또는 산출물도 백업본으로 직접 복원).
- **날짜:** 2026-06-07

### [백업] 효능 매핑 수정 전 전체 스냅샷 생성
- **대상 경로:** `backup/2026-06-07_효능매핑-수정전/`
- **변경 내용:**
  - 효능 탭 키워드 매핑 수정 작업에 앞서, 코드·데이터·문서 전체를 스냅샷으로 백업
  - 백업 범위: 루트 파일 + `data/`, `scripts/`, `js/`, `css/` (총 6.0M)
  - 제외 대상: `node_modules/`(15M), `asset/`(554M, 미변경 바이너리), `backup/`, `.DS_Store`
  - 생성 명령: `rsync -a --exclude 'node_modules' --exclude 'asset' --exclude 'backup' --exclude '.DS_Store' ./ "backup/2026-06-07_효능매핑-수정전/"`
  - 무결성 검증: `data/`, `script.js`, `index.html` 원본과 백업 `diff` 일치 확인 완료
- **이유:** 효능 매핑(`data/effect-map.js` 키워드 사전 등) 수정 과정에서 문제 발생 시 즉시 이전 버전으로 원복할 수 있도록 복원 지점 확보
- **원복 방법:** 변경된 파일을 백업본으로 덮어쓰기.
  - 전체 원복: `rsync -a "backup/2026-06-07_효능매핑-수정전/" ./` (asset/node_modules 미포함이므로 안전)
  - 개별 원복(예): `cp "backup/2026-06-07_효능매핑-수정전/data/effect-map.js" data/effect-map.js`
- **날짜:** 2026-06-07


### [수정] 처방탭 호버 프리뷰 카드 — position: fixed 전환 (가려짐 해결)
- **대상 경로:** `css/presc.css`, `script.js`
- **변경 내용:**
  - `css/presc.css`:
    - `.presc-type-preview` 의 `position: absolute` → `position: fixed`
    - `z-index: 200` → `z-index: 9999` (모달 500 위로, 사실상 최상단)
    - 직전 추가했던 `.presc-right-col { position: relative; isolation: isolate; }` 블록 제거 — fixed 라 앵커가 필요 없음
  - `script.js` (`#presc-type-row` hover 위임 핸들러):
    - 부모 기준 상대좌표 (`cardRect.left - parentRect.left ...`) 제거
    - viewport 절대좌표 (`cardRect.left + cardRect.width/2`, `cardRect.bottom + 8`) 로 단순화
- **이유:** `.presc-right-col` 가 `overflow-y: auto` 라서 `absolute` 자식이 컬럼 박스에 클리핑되고, 인접 카드들의 transform-stacking-context 와 경계 케이스에서 충돌. `position: fixed` 는 어떤 부모의 overflow / transform / stacking context 영향도 받지 않으므로 항상 최상단에 떠 있음
- **원복 방법:** CSS의 `position: fixed` / `z-index: 9999` 를 `position: absolute` / `z-index: 50` 으로 되돌리고 `.presc-right-col { position: relative; isolation: isolate; }` 재추가, script.js 의 좌표 계산을 부모 상대좌표로 복원
- **날짜:** 2026-05-12

### [수정] 처방탭 호버 프리뷰 카드 — 가로 레이아웃 + 프로젝트 톤 적용
- **대상 경로:** `css/presc.css`
- **변경 내용:**
  - `.presc-type-preview`를 `flex-direction: column` → `row`로 전환 (이미지 좌 / 설명 우 배치)
  - 이미지 크기 180×180 → 96×96, 이미지에 `1px solid #e0ddd8` 테두리 추가
  - 캡션 `text-align: center` → `left`, max-width 200px → 220px
  - 배경 `rgba(255, 252, 245, 0.98)` → `var(--bg-hanji, rgb(255, 251, 243))` (디자인 토큰 적용)
  - 보더 `1px solid rgba(140, 110, 60, 0.45)` → `1px solid #c8c0b4` (`.presc-type-card`와 동일 톤)
  - 그림자 `0 14px 36px rgba(60, 40, 10, 0.22)` → `0 10px 28px rgba(0, 0, 0, 0.14)` (좀 더 부드럽게)
  - 말풍선 꼬리(::before)의 색상도 새 배경/보더 색으로 동기화
- **이유:** 사용자 요청 — 프리뷰 카드 안의 이미지·설명을 좌우 레이아웃으로 바꾸고, 배경/보더 색을 기존 UI 스타일시트(특히 `.presc-type-card` 톤 및 `--bg-hanji`)와 맞춤
- **원복 방법:** `.presc-type-preview` 의 flex-direction/gap/padding, 이미지 width·height·border, 캡션 align/max-width, 배경/보더/그림자, `::before` border-bottom-color·filter 값을 직전 커밋 상태로 되돌림
- **날짜:** 2026-05-12

### [추가] 처방탭 본 화면 — 제형 카드(.presc-type-card) 설명 + 호버 이미지 프리뷰
- **대상 경로:** `index.html`, `css/presc.css`, `script.js`
- **변경 내용:**
  - `index.html` (`#presc-type-row`):
    - 각 카드에 `data-img="asset/prescription/herbal_*.png"` (전체 제외) + `title` 속성 추가
    - "전체" 카드에도 `<span class="ptc-desc">모든 제형</span>` 추가 (다른 카드는 이미 존재)
    - `.presc-type-row` 다음에 `<div id="presc-type-preview">` (호버 프리뷰 카드 컨테이너) 신규
  - `css/presc.css`:
    - 기존 "`.ptc-hanja, .ptc-desc { display: none }`" 제거 → 카드에 한자 첨자(.ptc-hanja)와 한 줄 설명(.ptc-desc)이 보이도록 함
    - `.presc-type-card`를 `flex-direction: column` 카드 형태로 재스타일 (이름·설명 두 줄)
    - sticky 압축 상태(`.presc-type-row.is-sticky`)에서는 desc 숨김 + chip 형태로 복귀
    - `.presc-type-preview` / `.presc-type-preview img` / `.presc-type-preview-cap` / `::before` (말풍선 꼬리) 신규 — 카드 아래에 180×180 이미지 카드가 페이드인
    - `.presc-right-col { position: relative }` 추가 (프리뷰 앵커)
    - `@media (hover: none)`에서는 프리뷰 숨김
  - `script.js`: `#presc-type-row` 클릭 핸들러 직후에 `mouseover` / `mouseout` / `focusin` / `focusout` 위임 핸들러 추가 — `data-img` 속성이 있는 카드에 한해 `#presc-type-preview` 의 이미지/캡션/좌표를 업데이트하고 `aria-hidden`을 토글
- **이유:** 사용자 요청 — 본 화면의 제형 카드 위에 마우스를 올리면 이전처럼 이미지가 뜨고, 글자 아래 짧은 설명도 함께 보이도록. (직전 작업은 처방 게임 피커의 `.picker-type-btn` 만 건드렸기 때문에 본 화면에는 적용되지 않았음)
- **원복 방법:**
  - `index.html`에서 `data-img` 속성 / "전체"의 `.ptc-desc` / `<div id="presc-type-preview">` 라인 제거
  - `css/presc.css`에서 `.presc-type-card` 재스타일, `.ptc-hanja` / `.ptc-desc` / `.ptc-name` 자식 셀렉터, sticky 분기, `.presc-type-preview*`, `.presc-right-col { position: relative }` 추가분 제거하고 원래 chip 스타일 + `.ptc-hanja, .ptc-desc { display: none }` 복원
  - `script.js`의 `#presc-type-row` 호버 위임 블록(`previewEl ...`) 전체 제거
- **날짜:** 2026-05-12

### [추가] 처방 피커 — 제형(탕·환·산·고·단) 간략 설명 표시 + 호버 이미지 프리뷰
- **대상 경로:** `index.html`, `js/hand-herb-game.js`, `css/features.css`
- **변경 내용:**
  - `index.html`: 각 `.picker-type-btn` 을 `<span class="picker-type-name">이름</span> + <span class="picker-type-mini">짧은 설명</span>` 두 줄 구조로 변경, `data-img` 속성에 `asset/prescription/herbal_*.png` 매핑 (탕→tang, 환→whan, 산→san, 고→go, 단→dan). `title` 속성 유지 (호버 툴팁). 필터 행 끝에 `<div id="picker-type-preview">` (호버 시 표시되는 이미지 카드) 추가. 필터 행 직후 `<p id="picker-type-desc">` 한 줄도 유지
  - `js/hand-herb-game.js`: `TYPE_DESCRIPTIONS` 맵 + `setTypeDescription(type)` + `showTypePreview(btn)` / `hideTypePreview()` 추가. `bindTypeFilters`에서 클릭 핸들러 외에 `mouseenter/leave` / `focus/blur` 로 프리뷰 토글
  - `css/features.css`:
    - `.picker-type-btn` 을 `inline-flex` column 방향으로 변경, `.picker-type-name` / `.picker-type-mini` 자식 폰트 사이즈 분리
    - `.picker-type-filters` 에 `position: relative` 추가 (프리뷰 앵커)
    - `.picker-type-preview` / `.picker-type-preview img` / `.picker-type-preview-cap` / `::after` (말풍선 꼬리) 신규 — 버튼 위로 168×168 이미지 카드가 페이드인
    - `.herb-game-overlay.mobile-mode .picker-type-preview { display:none }` + `@media (hover: none)` 에서도 숨김
- **이유:** 사용자 요청 — 제형이 무엇인지 짧게 알 수 있어야 하고, PC에서 호버 시 이미지로도 확인 가능해야 함
- **원복 방법:**
  - `index.html`에서 버튼 내부 두 span 구조 → 텍스트 한 줄로 환원, `data-img` 속성 제거, `<div id="picker-type-preview">` 라인 제거, `<p id="picker-type-desc">` 제거
  - `js/hand-herb-game.js`의 `TYPE_DESCRIPTIONS` / `setTypeDescription` / `showTypePreview` / `hideTypePreview` 및 `bindTypeFilters` 의 hover 바인딩 / `showPicker` 초기화 호출 제거
  - `css/features.css`의 `.picker-type-btn` 자식 셀렉터, `.picker-type-preview*`, `.picker-type-desc`, `.picker-type-filters { position: relative }` 추가분 제거
- **날짜:** 2026-05-12

### [수정] 처방 게임 — 모바일 터치 모드 추가
- **대상 경로:** `js/hand-herb-game.js`, `css/features.css`
- **변경 내용:** 모바일/터치 기기에서 웹캠·MediaPipe를 우회하고 터치 입력을 1급 입력으로 제공
  - `js/hand-herb-game.js`
    - `isMobileDevice()` 헬퍼 추가 — `ontouchstart` + `innerWidth < 768` 또는 `(pointer: coarse) + innerWidth < 768` 기준
    - `applyPanelWidthsForViewport()` 추가 — 모바일이면 `LEFT_PANEL_W` / `RIGHT_PANEL_W` 를 12로 축소 (PC: 265 / 235)
    - `startGame()`에서 모바일 감지 시 `setupMediaPipe()` 호출하지 않고 즉시 `enableFallbackInput()` + `gameLoop()` 진입 (카메라 권한 요청 / 모델 로드 생략)
    - `resizeCanvas()`에 `applyPanelWidthsForViewport()` + `mobile-mode` 클래스 토글 호출 (회전/뷰포트 변화 대응)
    - 모드별 터치 입력 튜닝:
      - 탕: `GRAB_DIST`를 모바일에서 +28px 확대해 손가락 그랩 용이
      - 산: `onPointerDown`에서 절구 영역 탭 시 `registerSanHit()` 1회 호출 (스윕 방식과 병행)
      - 단: 빈 캔버스 클릭 puff 제거 → 전용 좌/우 풀무 버튼만 사용
    - `onPointerUp` 끝에서 `pointerType === 'touch'`면 `mouseFallbackPos` / `handLandmarks` 정리해 잔류 커서 제거
    - `setupDanTouchButtons(enable)` 함수 추가 — 단 모드 + 모바일에서 좌/오른손 풀무 버튼(`.dan-bellows-btn`) 동적 생성, `pointerdown`에 `registerDanPuff()` 바인딩
    - `stopGame()`에서 풀무 버튼 정리 + `mobile-mode` / `dan-mode` 클래스 제거
    - `setCoachContentForType()`에 모바일 분기 추가 — 카메라/손동작 안내문구를 터치 안내로 교체
  - `css/features.css` 말미에 "처방 게임 — 모바일 터치 모드" 블록 추가
    - `.herb-game-overlay.mobile-mode .herb-game-video { display: none }`
    - 환자/처방 패널을 상단에 50vw씩 두 칼럼으로 압축, 말풍선·설명문 등 보조 정보 숨김
    - `.dan-bellows-controls` + `.dan-bellows-btn` (좌/우 풀무) — 화면 하단 고정, 빨강 그라디언트, active 시 눌림 피드백
    - 단 모드일 때 수집 태그를 풀무 버튼 위로 이동 (`bottom: 110px`)
- **이유:** 모바일은 처방 탭의 손 추적 웹캠 게임을 사용할 수 없음 (좁은 화면 + 전면 카메라 어색함 + MediaPipe 발열). 터치 입력 모드로 대체해 모바일에서도 5제형(탕·환·산·고·단) 모두 플레이 가능하게 함
- **원복 방법:**
  - `js/hand-herb-game.js`에서 `isMobileDevice` / `applyPanelWidthsForViewport` / `setupDanTouchButtons` 함수 제거
  - `startGame()` 내부의 `if (mobile) { enableFallbackInput(); gameLoop(); return; }` 분기와 그 직전 `applyPanelWidthsForViewport()` / `classList.toggle('mobile-mode' / 'dan-mode')` / `setupDanTouchButtons(...)` 호출 제거
  - `resizeCanvas`에 추가된 `applyPanelWidthsForViewport()` / `classList.toggle('mobile-mode', ...)` 제거
  - `onPointerDown`에서 산 모드 탭 분기 제거 + 단 모드 puff 로직 복원, `onPointerUp`의 touch cleanup 블록 제거
  - `setCoachContentForType` 의 mobile 분기 제거
  - `stopGame`의 `setupDanTouchButtons(false)` / `classList.remove('mobile-mode','dan-mode')` 제거
  - `LEFT_PANEL_W = 265`, `RIGHT_PANEL_W = 235` 상수로 환원
  - `css/features.css` 말미의 "처방 게임 — 모바일 터치 모드" 섹션 전체 삭제
- **날짜:** 2026-05-12

---

## 2026-05-11

### [추가] 약재 게임 환자 패널 — 2D SVG → 3D 인체로 교체
- **대상 경로:**
  - `js/patient-3d.js` (신규) — 좌측 환자 패널용 Three.js 뷰어. body_male.glb 재사용, 회전 애니메이션 없음, body_part_id 기반 통증 부위 빨간 하이라이트 shader
  - `index.html` (수정) — `.patient-body-wrap` 내부 SVG(`<svg class="patient-body-svg">` ~ `#patient-pain-glow`)를 `<canvas id="patient3d-canvas">`로 교체, 모듈 스크립트 추가
  - `js/hand-herb-game.js` (수정) — `updatePatientPanel()`이 SVG attribute 대신 `window.Patient3D.setPainPart(bodyMap.part)` 호출
  - `css/features.css` (수정) — `.patient-body-svg` / `.patient-pain-effect` / `@keyframes painPulse` 삭제, `.patient-body-3d` 추가
- **변경 내용:** 약재 조제 게임(웹캠 좌측)에 표시되던 한복 입은 환자 SVG 도형을 3D 인체(GLB)로 대체. 질병의 `BODY_KEYWORD_MAP.part` → body3d part id(0=skull, 1=head, 3=chest, 4=abdomen, 5=legs) 매핑으로 아픈 부위만 빨갛게 하이라이트. `torso`(피부/전신)는 mode=3로 전체 옅게.
- **이유:** 사용자 요청 — 웹캠 영역 좌측 사람 도형을 3D 인물로 변경. 회전 애니메이션은 제외, 부위 하이라이트는 유지.
- **원복 방법:** 위 4개 파일을 직전 커밋으로 되돌리고 `js/patient-3d.js` 삭제
- **참고:** 기존 `js/body-viewer-3d.js`(처방 탭)와 GLB는 공유하나 상태/모듈은 완전 분리. 거리장 precompute는 생략(부위 경계가 face set boundary로 직접 끊김).
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 여성 모델 가슴 위쪽(face set 20·21) 흉부로 이동 (실효 fix)
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (face set 20·21 일부 → 1)
  - `asset/prescription/body_female.glb` (재생성)
  - `asset/prescription/body_female.glb.bak5`, `human_base_meshes.blend.bak5` (세이브포인트)
  - `scripts/diag_female_chest_all.py` (진단 신규 — 가슴 영역 전체 face set 분포)
  - `scripts/fix_female_breast_top.py` (수정 신규)
- **변경 내용:** 여성 모델 face set 20·21 폴리곤 중 1.05<cz<1.20 AND cy<0.02 AND |x|<0.27 영역 137개(20→1: 67, 21→1: 70)를 흉부로 이동
- **이유:** 직전의 `fix_female_nipple_arm.py`(11·12 처리)를 적용했음에도 가슴 위쪽이 여전히 팔로 보임. 진단 결과 실제 원인은 fs=11/12가 아니라 fs=20/21 — 여성 메시는 fs=20/21에 가슴 상단 표면(cy -0.135까지 = 앞쪽 돌출, cz 1.05~1.20)이 포함되어 있고 bake_final.py에서 PID 2(팔)에 매핑됨. expand_chest_region.py가 cylindrical radius xy<0.22로 일부만 흡수했고 trim_chest_female.py가 둘레를 다시 되돌리면서 가슴 상단 둘레가 fs=20/21에 잔류했었음
- **원복 방법:**
  1. `cp asset/prescription/human-base-meshes-bundle/human_base_meshes.blend.bak5 asset/prescription/human-base-meshes-bundle/human_base_meshes.blend`
  2. `cp asset/prescription/body_female.glb.bak5 asset/prescription/body_female.glb`
- **참고:**
  - 어깨 캡(cz>1.20), 후방(cy>0.02), 외측(|x|>0.27)은 그대로 팔 유지
  - 남성 모델은 fs=20/21 분포가 다르고 가슴 돌출이 없어 동일 조건에서 영향 없음 — 여성 한정 수정
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 여성 모델 유두 옆 측면 가슴(face set 11·12) 흉부로 추가 이동
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (face set 11·12 일부 → 1)
  - `asset/prescription/body_female.glb` (재생성)
  - `asset/prescription/body_female.glb.bak4`, `human_base_meshes.blend.bak4` (세이브포인트)
  - `scripts/diag_female_nipple_arm.py` (진단 신규)
  - `scripts/fix_female_nipple_arm.py` (수정 신규)
- **변경 내용:** 여성 모델 face set 11·12 폴리곤 중 cz 0.95~1.15(가슴 높이) AND cy<0.02(앞쪽) AND xy<0.27(측면 가슴까지) 71개(11→1: 35, 12→1: 36)를 흉부로 이동
- **이유:** 사용자 보고 — 팔 클릭 시 여성 유두 옆 측면 가슴에 갈색 사각형 패치가 보임. 이전 `fix_female_chest_holes.py`는 xy<0.22, cz>1.00 조건이라 측면 가슴(xy 0.22~0.27)이 그대로 팔에 남아있었음
- **원복 방법:**
  1. `cp asset/prescription/human-base-meshes-bundle/human_base_meshes.blend.bak4 asset/prescription/human-base-meshes-bundle/human_base_meshes.blend`
  2. `cp asset/prescription/body_female.glb.bak4 asset/prescription/body_female.glb`
- **참고:** 후방(cy>0.02) 어깨 폴리곤은 그대로 팔에 유지 — 시각적으로 팔 위쪽에 해당
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 부위 하이라이트 경계를 수묵화 잉크 번짐 효과로 변경 (per-vertex 거리장 + 노이즈 wobble)
- **대상 경로:**
  - `js/body-viewer-3d.js` (VERTEX/FRAGMENT 셰이더 교체 + 거리장 precompute/갱신 함수 추가)
  - `js/body-viewer-3d.js.bak-pre-ink` (세이브포인트 — 변경 직전 원본)
- **변경 내용:**
  - **1차 시도(부분 실패):** 셰이더 단독으로 `dPart = |vBodyPart*10 - uSelectedPart|`에 노이즈를 더해 경계를 깨려 했으나, 이전 작업의 face set 경계 vertex split 때문에 face 내부에서 `vBodyPart`가 상수 → 경계 흔들림이 face strip 한 칸 폭으로 제한되어 시각적 변화 거의 없음
  - **2차(현재):** CPU에서 vertex별 거리장을 precompute하고 attribute로 전달
    - `precomputeDistFields(geometry)`: 모든 vertex에 대해 6개 part별 최소거리(`distFields[6]`)를 계산해 `geometry.userData`에 저장 (O(N²), 인체 12k vertex에서 약 1~2초)
    - `applySignedDist(geometry, selectedPid)`: 선택 부위가 바뀔 때마다 `signedDist` attribute(Float32) 갱신 — 안쪽 vertex는 음수(다른부위까지 최소거리), 바깥쪽은 양수(선택부위까지 최소거리). 즉 경계에서 0을 지나는 부드러운 부호거리장
  - 셰이더에 `attribute float signedDist` + varying 추가
  - 프래그먼트에서 `field = vSignedDist + wobble`로 잉크 농도 계산. world-space fbm(8.0/22.0)로 wobble을 작은 폭(0.07/0.025 world-unit)만큼 더해 잉크 끝선이 들쭉날쭉해짐
  - 두 단계 falloff: core(`-0.045~0.005`) 짙은 안쪽, wash(`-0.020~0.045`) 바깥으로 새는 옅은 번짐
  - 한지 흡수 농담용 큰스케일 fbm(3.2) + INK(0.18,0.14,0.10) 색 추가 (HL→INK 그라데이션)
- **이유:** 사용자 보고 — 부위 클릭 시 face set 경계 폴리곤이 그대로 사각형 절단면처럼 노출. 셰이더 단독 접근으로는 vertex split 구조상 한계가 있어 CPU 거리장으로 보강
- **원복 방법:** `cp js/body-viewer-3d.js.bak-pre-ink js/body-viewer-3d.js`
- **참고:**
  - 튜닝 포인트:
    - `wobble` 계수 `coarse * 0.07 + fine * 0.025` — 경계 흔들림 폭(world-unit)
    - core/wash smoothstep 임계값 — 잉크 두께/번짐 범위
    - precompute 단가가 부담되면 partVerts를 stride 샘플링 또는 spatial grid로 가속 가능
  - 거리장은 mesh local 좌표라서 model 위치/회전 변경에 영향 없음 (비균일 스케일이 들어오면 재계산 필요)
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 여성 모델 가슴 옆 face set 11·12 침범 폴리곤 흉부로 이동
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (여성 모델 face set 11·12 일부 → 1)
  - `asset/prescription/body_female.glb` (재생성)
  - `scripts/fix_female_chest_holes.py` (신규)
- **변경 내용:**
  - 여성 모델 face set 11·12(현재 팔) 폴리곤 중 Z>1.00 AND XY<0.22 폴리곤 16개(좌 8, 우 8) → face set 1(흉부) 이동
- **이유:** 사용자 보고 — 여성 흉부 영역(가슴 옆, 유두 부근)에 작은 사각형이 팔 매핑으로 보임. 진단 결과 face set 11·12의 Z 1.02~1.05, XY 0.206~0.217 폴리곤들이 가슴 옆까지 침범. 이전 `expand_chest_region.py`는 face set 20·21만 대상으로 했기 때문에 face set 11·12는 처리되지 않았음
- **원복 방법:** `git checkout scripts/fix_female_chest_holes.py` 후 face set 11·12로 되돌리는 역방향 작업 (또는 `.blend` 백업 복원)
- **참고:** 남성 모델은 동일 영역(face set 11·12 Z 1.05 부근)이 가슴 안쪽으로 충분히 침범하지 않아 같은 조건이 0개 폴리곤만 잡혀 영향 없음 — 여성 한정 수정
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 여성 모델 흉부의 어깨/상완 침범 폴리곤 되돌림
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (여성 모델 face set 1 일부 → 20/21)
  - `asset/prescription/body_female.glb` (재생성)
  - `scripts/trim_chest_female.py` (신규)
- **변경 내용:**
  - 여성 모델에서 face set 1(흉부) 폴리곤 중 XY≥0.18 폴리곤을 X 부호에 따라 face set 20(X<0) 또는 21(X>0)로 되돌림: 좌 103개, 우 106개
  - GLB 재생성 (body_female.glb)
- **이유:** 사용자 보고 — 여성 모델에서 흉부 클릭 시 어깨/상완 외측까지 갈색으로 표시됨. 원인은 이전 작업의 `expand_chest_region.py` XY<0.22 조건이 여성 메시의 좁은 어깨 폭에 비해 너무 넓었기 때문 (face set 20/21의 XY 0.12~0.27 중 0.18~0.22 영역이 어깨 외측이지만 흉부로 잘못 편입됨)
- **원복 방법:** `human_base_meshes.blend.bak3`이 직전 백업이지만, expand_chest_region.py 결과도 함께 포함하므로 동일 적용. 더 보수적으로는 `git checkout` 후 `bake_final.py` 재실행
- **참고:** 남성은 face set 20/21의 XY 분포가 다르고 어깨가 더 외측이라 동일 조건이 적절히 작동, 추가 조정 불필요
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 흉부 영역을 가슴 전체로 확장 (사용자 빨간선 기준)
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (face set 재할당)
  - `asset/prescription/body_male.glb`, `asset/prescription/body_female.glb` (재생성)
  - `scripts/expand_chest_region.py` (신규 — 빨간선 기준 face set 확장)
- **변경 내용:**
  - face set 재할당 조건:
    - face set 200(머리 정중앙 띠) 중 Z<1.30 폴리곤 → face set 1(흉부): 남 94개, 여 183개
    - face set 20·21(어깨/가슴 옆) 중 Z<1.30 AND XY<0.22 폴리곤 → face set 1: 남 52+51, 여 158+158
  - 사용자가 스크린샷에 빨간선으로 표시한 가슴 전체 영역(Z 1.00~1.35, XY<0.25)이 모두 흉부 PID로 통합됨
  - `.blend` 백업: `human_base_meshes.blend.bak3` (이 작업 직전 상태)
- **이유:** 사용자 보고 — 흉부 클릭 시 가슴 영역이 가운데 들쭉날쭉한 좁은 띠로만 표시됨. 원인은 face set 200(머리 정중앙선)이 가슴 위쪽 정중앙까지 닿고, face set 20·21(팔)이 가슴 좌·우 안쪽까지 닿아 있었기 때문. 사용자가 그린 빨간선이 가슴 전체를 흉부로 지정하라는 의도
- **원복 방법:**
  1. `cp asset/prescription/human-base-meshes-bundle/human_base_meshes.blend.bak3 asset/prescription/human-base-meshes-bundle/human_base_meshes.blend`
  2. `/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/bake_final.py`
- **참고:**
  - face set 19(복부)는 그대로 유지 — Z 0.96~1.07 범위로 명치 아래 복부의 일부
  - face set 11/12(어깨, XY 0.26~0.40)는 빨간선 밖이라 그대로 팔
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — face set 경계 vertex split으로 셰이더 보간 아티팩트 근본 해결
- **대상 경로:**
  - `scripts/bake_final.py` (`assign_from_facesets` 함수 재작성)
  - `asset/prescription/body_male.glb`, `asset/prescription/body_female.glb` (재생성)
- **변경 내용:**
  - `assign_from_facesets`에 BMesh 기반 face set 경계 edge split 추가:
    1. 원본 face의 face_set id를 BMesh int layer로 보존
    2. 다른 face_set에 속한 face들이 공유하는 edge 식별 (남 1416개, 여 1438개)
    3. `bmesh.ops.split_edges`로 해당 edge에서 vertex 분리 → 각 vertex는 단일 face_set에만 속함
    4. split된 mesh에 POINT 단위 color attribute로 part_id 인코딩
  - 기존의 lower-id-wins 규칙(`part_per_vert[vi] > part_id >= 0`) 제거 — 더 이상 필요 없음
  - `.blend` 파일은 건드리지 않음 (bake 단계에서만 메모리 내 split 수행)
  - GLB 크기 변화: 608KB → 645KB (남), 동일 수준 (여) — 경계 vertex만 추가되어 약 6% 증가
- **이유:** 사용자 보고 — '팔' 클릭 시 명치 부근에 가로 띠가 갈색으로 표시됨. 원인은 셰이더가 `R = part_id/SCALE`을 vertex attribute로 받아 보간한 뒤 `pid = floor(R*10+0.5)`로 round하는 구조: 한 vertex가 다른 face_set의 face에 공유되면 면 내부 보간 R이 중간값으로 떨어져 다른 PID로 round됨. PID 매핑 재배열만으로는 3개 이상의 face_set이 인접한 영역에서 여전히 발생. face set 경계에서 vertex를 split하면 같은 면의 모든 vertex가 같은 R 값을 갖게 되어 보간 결과도 단일 값 → 아티팩트 완전 제거
- **원복 방법:** `git checkout scripts/bake_final.py` 후 `/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/bake_final.py`
- **참고:**
  - vertex 수: 남 ~10600 → 12002, 여 ~10600 → 12026 (face set 경계의 양쪽에 vertex 사본 발생)
  - PID 매핑 재배열(직전 항목)은 더 이상 보간 아티팩트와 무관해졌으나, 그대로 인체 위→아래 순서 유지 (직관적)
  - `.blend`는 변경 없음 → sculpting/face set 편집 작업은 영향 없이 가능
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 머리 영역 어깨 안쪽 정리 + PID 매핑 인체순서 재배열 (보간 아티팩트 해결)
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (face set 200 일부 → face set 1로 이동)
  - `asset/prescription/body_male.glb`, `asset/prescription/body_female.glb` (재생성)
  - `scripts/trim_face_set_200.py` (신규 — face set 200의 어깨 안쪽 폴리곤 정리)
  - `scripts/bake_final.py` (FS_TO_PART의 PID 값 재배열)
  - `js/body-viewer-3d.js` (PART_NAMES 순서·PART_ZONE partId 값 갱신)
- **변경 내용:**
  - face set 200 정리: Z중심<1.30 AND XY중심>0.15 폴리곤(어깨/가슴 안쪽까지 닿던 부분)을 face set 1(흉부)로 되돌림. 남 130개, 여 54개 폴리곤 이동
  - PID 매핑을 인체 위→아래 순서로 재배열:
    - 이전: `0=흉부, 1=복부, 2=신장, 3=팔, 4=다리, 5=머리`
    - 이후: `0=머리, 1=흉부, 2=팔, 3=복부, 4=신장·생식, 5=다리`
  - `body-viewer-3d.js`의 `PART_NAMES` 배열 순서 및 `PART_ZONE`의 `partId` 값을 새 매핑에 맞춰 갱신 (HTML data-part 키와 PART_LABELS는 변경 없음)
- **이유:** 사용자 보고 — (a) '머리' 클릭 시 가슴 윗부분(어깨 안쪽)까지 하이라이트됨, (b) '팔' 클릭 시 가슴·사타구니에 가로 띠가 잘못 표시됨.
  - (a)의 원인은 분할된 face set 200이 어깨 안쪽까지 닿는 폴리곤을 포함했기 때문 → Z·XY 임계값으로 트림
  - (b)의 근본 원인은 셰이더가 vertex attribute R(=PID/10)을 보간한 뒤 `pid = floor(R*10 + 0.5)`로 round하는 구조: 인접하지 않은 PID(예: 흉부 0과 머리 5)가 한 면에 함께 있으면 보간값 R=0.25 → pid=3(팔)로 잘못 인식. PID를 인체 위→아래 순서로 재배열하면 face set 경계의 보간 round 결과가 인접 두 부위 중 하나로만 떨어지므로 중간값 아티팩트가 사라짐
  - 매핑 재배열 후 가슴 가로 띠(머리-흉부 경계): R≈0.05 → pid=1=흉부 ✓
  - 사타구니 가로 띠(신장-다리 경계): R≈0.45 → pid=5=다리 ✓
- **원복 방법:**
  1. `.blend` 백업 복원: `cp asset/prescription/human-base-meshes-bundle/human_base_meshes.blend.bak2 asset/prescription/human-base-meshes-bundle/human_base_meshes.blend`
  2. `git checkout scripts/bake_final.py js/body-viewer-3d.js` (이전 매핑으로 되돌리기)
  3. `/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/bake_final.py`
- **참고:**
  - 매핑 재배열은 GLB와 JS 상수 양쪽이 동기화되어야 동작 — 두 파일을 따로 수정하지 말 것
  - face set 1(흉부)이 목·명치만 포함하므로 어깨 V자(쇄골 부근)는 face set 11/12(팔)에 속함. 어깨를 흉부에 포함시키려면 별도 face set 재할당 필요
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 입·턱 영역을 '흉부'에서 '머리'로 재분류 (face set 1 Z기준 분할 + 재매핑)
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (face set 1 분할 후 저장)
  - `asset/prescription/body_male.glb`, `asset/prescription/body_female.glb` (재생성)
  - `scripts/split_face_set_1_by_z.py` (신규 — face set 1을 Z=1.18 기준 분할하는 일회용 스크립트)
  - `scripts/bake_final.py` (FS_TO_PART 매핑 갱신)
- **변경 내용:**
  - face set 1(폴리곤 704개, Z 1.06~1.55: 얼굴 76% + 목 22%)을 Z중심 1.18 기준으로 분할
    - Z > 1.18 폴리곤(얼굴·입·턱) → 새 face set ID 200 (남 544개, 여 506개)
    - Z ≤ 1.18 폴리곤(목·명치) → face set 1 유지 (남 160개, 여 200개)
  - `bake_final.py` 매핑 갱신 (이전 → 이후):
    - 머리(PID=5): `[17]` → `[2,3,4,5,7,8,17,22,200]` (두개골 face set + 분할된 얼굴/입/턱)
    - 흉부(PID=0): `[1,2,3,4,5,6,7,8,22]` → `[1]` (분할된 face set 1 잔여 = 목·명치)
    - 존재하지 않는 face set 6 제거
  - `.blend` 백업: `human_base_meshes.blend.bak2` (이번 작업 이전 상태)
- **이유:** 사용자 보고 — 3D 뷰어에서 '흉부' 클릭 시 입·턱·이어가 함께 하이라이트됨. 원인은 `bake_final.py`가 얼굴·두개골 face set(1,2,3,4,5,7,8,22)을 일괄적으로 PID=0(흉부)에 매핑한 것. 특히 face set 1이 얼굴 하반부(눈코입턱) 76% + 목 22%를 모두 포함하는 단일 face set이라, Z기준 폴리곤 분할로 얼굴 부분만 분리해 머리로 옮김
- **원복 방법:**
  1. `cp asset/prescription/human-base-meshes-bundle/human_base_meshes.blend.bak2 asset/prescription/human-base-meshes-bundle/human_base_meshes.blend`
  2. `git checkout scripts/bake_final.py` (또는 라인 17~25 매핑을 이전 상태로 되돌리기)
  3. `/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/bake_final.py`
- **참고:**
  - 분할 후 흉부(PID=0)에는 face set 1의 목·명치 영역만 남음. 어깨 V자 부분은 face set 11/12(현재 팔에 매핑)에 포함되어 있어 흉부 클릭 시 표시되지 않음 — 후속 이슈로 어깨를 흉부에 포함할지 별도 결정 필요
  - 분할 임계값 Z=1.18은 `face_set_info.py`의 영역 분류(머리/목 경계 ≈ Z 70%)를 기준으로 선정
- **날짜:** 2026-05-11

### [수정] 처방 3D 뷰어 — 신장(face set 18) 골반 외측 폴리곤을 다리 face set으로 재할당
- **대상 경로:**
  - `asset/prescription/human-base-meshes-bundle/human_base_meshes.blend` (face set 재할당)
  - `asset/prescription/body_male.glb`, `asset/prescription/body_female.glb` (재생성)
  - `scripts/inspect_joints.py` (신규 — 의심 폴리곤 분석)
  - `scripts/reassign_joint_boundaries.py` (신규 — 재할당 스크립트, `--apply`로 저장)
- **변경 내용:**
  - 남·여 모델에서 face set 18(신장·생식) 외곽 폴리곤 중 다리 face set(23·24)과 에지 인접한 것을 골라 23/24로 이동 (각 모델 10개, xy_radius ≥ 0.160 임계값)
  - `bake_final.py` 재실행으로 `body_male.glb`·`body_female.glb` 재생성
  - `.blend` 백업: `human_base_meshes.blend.bak`
- **이유:** 사용자 보고 — 3D 뷰어에서 신장(또는 복부) 영역 클릭 시 골반 관절 일부가 함께 하이라이트됨. `bake_final.py`의 lower-id-wins 규칙으로 인해 face set 경계의 공유 버텍스가 신장(part_id=2)으로 끌려갔던 게 원인
- **원복 방법:**
  1. `cp asset/prescription/human-base-meshes-bundle/human_base_meshes.blend.bak asset/prescription/human-base-meshes-bundle/human_base_meshes.blend`
  2. `/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/bake_final.py`
- **참고:** 복부(face set 19)는 어깨 뿌리 폴리곤이 팔 face set과 에지 인접하지 않아 이 스크립트로는 자동 재할당 불가 — 추가 이슈 발생 시 별도 처리
- **날짜:** 2026-05-11

---

## 2026-05-07

### [수정] 전역 배경 패턴 추가 + 솔리드 배경 투명/반투명화
- **대상 경로:** `css/base.css`, `css/hero.css`, `css/presc.css`, `css/efficacy.css`, `css/data.css`, `css/features.css`, `css/filters.css`, `css/list.css`, `css/header.css`, `css/modal.css`
- **변경 내용:**
  - `body::before`로 `asset/main/background.png`을 `repeat` 패턴, `opacity: 0.1`로 전역 배경 적용 (`position: fixed; inset: 0; pointer-events: none`)
  - 흰색 배경(`#fff`, `#ffffff`)을 `transparent`로 일괄 치환 → 패턴이 그대로 비침
  - 크림계 배경(`#f8f6f0`, `#faf9f7`, `#faf9f5`, `#f0ede8`, `#f7f5f2`, `#fffdf5`, `#faf8f4`, `#f0ede6`, `#f5f0e8`, `#fffbf0`, `#f0ece3`, `#f0eeea`, `#f0f0f0`, `#f5f5f5`, `var(--bg-paper)`)을 `rgba(..., 0.5)`로 치환 → 패턴이 살짝 비침
  - `.hero`(약재탭 헤더), `.presc-view`(처방탭), `.efficacy-universe-wrap`(효능탭) 패널 배경도 `transparent` 처리
- **이유:** 한지 텍스처 패턴을 전역적으로 노출해 디자인 시스템의 한지 아카이브 톤을 강화. 사용자 요청
- **원복 방법:** git 이전 커밋 참조 (각 파일의 색상 정의를 솔리드로 되돌리고 `body::before` 블록 제거)
- **참고:** 모달·팝업·카드 등 가독성에 영향이 있을 수 있으니 후속 조정 가능
- **날짜:** 2026-05-07

### [삭제] `body.universe-mode` 죽은 CSS 코드 제거
- **대상 경로:** `css/base.css`
- **변경 내용:**
  - `:root`에서 `--universe-bg`, `--universe-node`, `--universe-select`, `--universe-label` 변수 선언 제거
  - `body.universe-mode { ... }`, `body.universe-mode::before { ... }`, `body.universe-mode .header-glass { ... }` 블록 전체 제거
- **이유:** `universe-mode` 클래스를 어떤 JS에서도 `body`에 적용하지 않아 활성화되지 않는 죽은 코드. 사용자 요청
- **원복 방법:** git 이전 커밋의 `css/base.css` 참조
- **참고:** `js/efficacy-universe-3d.js`와 `.efficacy-universe-3d` 클래스(3D 시각화 본체)는 그대로 유지
- **날짜:** 2026-05-07

---

## 2026-05-06

### [삭제] 처방 탭 3D 인체 뷰어 제거

- **삭제 파일:**
  - `js/presc-body-3d-viewer.js` — Three.js 기반 3D 인체 뷰어 핵심 로직
  - `js/presc-body-3d-init.js` — 뷰어 초기화 및 성별 토글 와이어링
- **연동 변경:**
  - `index.html` — `presc-body-3d-col` div, `presc-two-col` 래퍼, `presc-body-3d-init.js` `<script>` 태그 제거
  - `css/presc.css` — `.presc-two-col`, `.presc-body-3d-col`, `.presc-3d-*` 규칙 전체 제거; `.presc-right-col`을 전폭 독립 컨테이너로 전환
  - `script.js` — `_prescActiveBodyKw`, `_prescActiveBodyLabel` 변수, `matchesBody()` 함수, `window.__prescSetBodyKw` 브리지, 부위 필터 로직 제거
- **이유:** 3D 인체 뷰어를 처방 탭에서 삭제 요청
- **원복 방법:** 삭제된 두 JS 파일을 git 이력에서 복원 후 위 변경 역순 적용
- **날짜:** 2026-05-06

---

### [수정] 처방 3D 뷰어 — arms/legs 메시 분리 수정 + 남녀 GLB 재분리

#### arms 메시에서 허벅지 폴리곤 제거
- **원인:** `arms` 메시에 Z<0.85, |X|<0.22 범위의 폴리곤 157개가 포함 → 웹 뷰어에서 허벅지 클릭 시 "팔·어깨" 영역으로 표시되던 문제
- **수정:** Blender Python으로 해당 폴리곤을 `arms`에서 분리 → `legs`에 병합
  - `arms`: 2803 → 2646 폴리곤
  - `legs`: 3187 → 3344 폴리곤

#### 남녀 GLB 재생성 (성별 구분 복구)
- **원인:** 위 작업 중 남녀 GLB를 동일 메시로 덮어써 두 성별이 같은 체형으로 표시됨
- **수정:**
  - `body_male.glb`: `body.glb`에서 임포트한 고폴리 region 메시(.001) 사용 (arms 11716, legs 7422 폴리곤)
  - `body_female.glb`: `GEO-body_female_realistic`를 Z+X 좌표 기반 우선순위 분류로 14개 region에 파티셔닝하여 생성
- **결과:** `body_male.glb` 2.0MB / `body_female.glb` 1.4MB (체형 구분 복구)
- **원복 방법:** `body.glb` → `body_male.glb`로 복사 (남성), 여성은 위 Blender 파티셔닝 재실행
- **날짜:** 2026-05-06

---

## 2026-05-04 (파일 정리)

### [삭제] donguibogam-texts.js → script.js 흡수
- **대상 경로:** `donguibogam-texts.js` (루트)
- **변경 내용:**
  - `donguibogam-texts.js` 삭제 (내용: `window.DONGUIBOGAM_TEXTS = {};` 4줄짜리 빈 껍데기)
  - `index.html:557` — `<script src="donguibogam-texts.js">` 태그 제거
  - `script.js:3` — `window.DONGUIBOGAM_TEXTS = window.DONGUIBOGAM_TEXTS || {};` 초기화 추가 (IIFE 진입 직후)
- **이유:** 실제 데이터가 없는 빈 파일이었으며, 초기화 한 줄로 충분히 대체 가능. 나중에 원문 데이터가 생기면 `data/` 아래 별도 파일로 분리 후 재로드 권장
- **원복 방법:** `donguibogam-texts.js` 재생성 후 `index.html`에 `<script src="donguibogam-texts.js">` 태그 추가, `script.js` 3번째 줄 초기화 제거
- **날짜:** 2026-05-04

### [이동] protected_species_korea_2023.json — 루트 → data/
- **대상 경로:** `protected_species_korea_2023.json` → `data/protected_species_korea_2023.json`
- **변경 내용:**
  - 파일 이동: 프로젝트 루트 → `data/` 폴더
  - `script.js:1636` 주석 경로 업데이트: `protected_species_korea_2023.json` → `data/protected_species_korea_2023.json`
  - 런타임 fetch 없음 (데이터는 `script.js` 내 `ENDANGERED_HERBS` 배열에 하드코딩됨)
- **이유:** 다른 JSON 데이터 파일(`effect.json`, `efficacy-universe.json` 등)과 동일 위치로 통일
- **원복 방법:** `data/protected_species_korea_2023.json` → 루트로 이동, `script.js` 주석 경로 되돌리기
- **날짜:** 2026-05-04

---

## 2026-05-04

### [버그수정] 처방탭 3D 뷰어 — 인물 미표시 문제 원인 및 해결

#### 원인 1: `herb-effect-mapper.js:84` 파일 손상 (SyntaxError)
- **증상:** 콘솔에 `Uncaught SyntaxError: Invalid regular expression: missing /` 출력
- **원인:** 편집 도중 `var pk = pkVariants[pi];` 뒤에 `/clea` 문자열이 삽입됨 → JS 엔진이 정규식 리터럴 시작으로 해석해 파싱 실패
- **수정:** `/clea` 제거 (`js/herb-effect-mapper.js:84`)
- **재발 방지:** replace_all 편집 시 sed/awk 계열 치환 대신 Edit 도구를 사용하고, 편집 후 반드시 콘솔 에러 확인

#### 원인 2: `presc-body-3d-viewer.js` — ResizeObserver의 캔버스 높이 캡 누락 (실제 root cause)
- **증상:** `[3D viewer] GLB loaded OK` 로그는 찍히고 draw calls도 정상(3 calls, 3878 triangles)인데 화면에 모델 미표시
- **진단 로그:** `canvas: 678 x 20208` — 캔버스 drawing buffer가 20208 픽셀로 폭주
- **원인:**
  1. `.presc-body-3d-col`은 `.presc-two-col` 내부 flex 컬럼 (`align-items: stretch`, `min-height: 100vh`)
  2. 우측 컬럼의 처방 카드 누적으로 컨테이너 높이가 10000+px까지 늘어남 → 좌측 3D 컬럼도 stretch로 같이 길어짐
  3. `.presc-3d-canvas-wrap`의 `flex: 1`이 그 길이를 그대로 받음
  4. 초기 setup에는 `Math.min(container.clientHeight, 680)` 캡이 있지만 ResizeObserver 콜백에는 캡이 없어, 리사이즈 후 `renderer.setSize(w, 10104)` 호출 → drawing buffer는 pixelRatio 2배 = 20208px
  5. aspect ratio가 0.0336으로 극단적으로 좁고 길어져, 카메라가 렌더하는 vertical span 12.3 units 중 모델(Y=0~6.19, target Y=3.1)은 캔버스의 중앙쯤에 그려지지만 화면에 보이는 것은 캔버스 상단 ~3.4%뿐 → 모델은 화면 밖
- **수정:** `js/presc-body-3d-viewer.js:319-327` — ResizeObserver 콜백에도 동일한 `Math.min(h, 680)` 캡 적용 + `if (!w || !h) return` 가드 추가
- **재발 방지:**
  - **flex 컬럼 안에 three.js 캔버스를 둘 때는 ResizeObserver/초기 setup 양쪽 모두에 명시적 max-height 캡 필수.** flex 부모가 커지면 자식도 함께 커지면서 setSize에 그대로 전달됨
  - 디버깅 시 가장 먼저 확인할 것: `renderer.domElement.width/height` 출력. 대부분의 "GLB는 로드되는데 안 보임" 사례는 캔버스 dimension 문제
  - draw call이 0이 아닌데 안 보이면 카메라/scene 연결이 아니라 거의 항상 캔버스 dimension 또는 CSS 가시성 문제

#### 3D 뷰어 카메라 기준값 (body.glb 기준, Y-up, 높이 ≈ 6.2)
| 항목 | 값 |
|---|---|
| FOV | 42 |
| camera.position | (0, 3.1, 16) |
| controls.target | (0, 3.1, 0) |
| minDistance | 6 |
| maxDistance | 24 |
| near / far | 0.1 / 60 |
| canvas height cap | 680px (setup·ResizeObserver 양쪽) |

---

## 2026-04-30

### [보류] 폴더명 변경 시도 — cursor → DonguiBogam
- **시도 내용:** 프로젝트 루트 폴더명을 `cursor`에서 `DonguiBogam`으로 변경
- **결과:** 되돌림 (`mv` 명령 실행 순서 오류로 `cursor/DonguiBogam/` 서브폴더 생성됨)
- **현재 상태:** 원복 완료, 폴더명은 `cursor` 유지 중

### [대기] 서브폴더 삭제 예정 — cursor/DonguiBogam/
- **대상:** `/Users/hanacardux/Desktop/cursor/DonguiBogam/`
- **내용:** 폴더명 변경 시도 중 생성된 프로젝트 전체 복사본
- **원본과 차이점:**
  - `.claude/settings.json` — 폴더명 변경 작업 중간 상태
  - `.claude/settings.local.json` — 동일
  - `data/effect-map.js` — 효능 변수 추가 전 구버전
  - `js/efficacy-universe-2d.js` — force 파라미터 수정 전 구버전
- **삭제 전 원복 필요 항목:** 없음 (최신본은 상위 `cursor/` 폴더에 있음)
- **삭제 예정일:** 확인 후 삭제

### [삭제] README.md
- **대상 경로:** `README.md`
- **변경 내용:** 삭제
- **이유:** 내용(데이터 빌드 명령어)을 `CLAUDE.md`로 이전. Claude Code가 자동 로드하는 파일로 통합
- **원복 방법:** 불필요
- **날짜:** 2026-04-30

### [삭제] .cursor/rules/herb-thumbnail-mapping.mdc 및 .cursor/ 디렉토리
- **대상 경로:** `.cursor/rules/herb-thumbnail-mapping.mdc`, `.cursor/rules/`, `.cursor/`
- **변경 내용:** Cursor IDE용 규칙 파일 및 빈 디렉토리 삭제
- **이유:** 해당 규칙이 `/map-images` 스킬 전용이므로 `.claude/commands/map-images.md`에 통합 후 삭제
- **원복 방법:** `.cursor/rules/herb-thumbnail-mapping.mdc` 재생성 (내용은 `map-images.md`의 "매핑 원칙" 및 "확인 필수 사항" 섹션 참조)
- **날짜:** 2026-04-30

---

## 2026-05-02

### [버그수정] 처방 게임 — 제형 분기가 항상 탕(湯)으로 폴백되던 문제
- **대상 경로:** `js/hand-herb-game.js` (`startFromPicker`)
- **변경 내용:** `startGame()`에 넘기는 `disease` 객체에 `type: p.type` 필드 추가. 기존에는 `id/name/hanja/description`만 전달하여 `startGame` 내부의 `currentType = (disease && disease.type) ? disease.type : 'tang'` 분기가 항상 폴백되어 모든 처방이 탕 모드로 시작됨
- **이유:** 같은 날 추가한 제형별 인터랙션(`updateHwanMode/Sa nMode/GoMode/DanMode`)이 실제 처방 카드 클릭 시 호출되지 않던 문제. `prescriptions-data.js`의 각 처방에는 `type: 'tang'|'hwan'|'san'|'go'|'dan'`가 이미 존재함
- **원복 방법:** `startFromPicker`의 disease 객체에서 `type: p.type || 'tang'` 라인 제거
- **날짜:** 2026-05-02

### [수정] 처방 게임 — 제형(탕·환·산·고·단)별 웹캠 인터랙션 분기
- **대상 경로:** `js/hand-herb-game.js`
- **변경 내용:**
  - 메인 루프(`gameLoop`)를 공통 렌더링 + 모드별 디스패처 구조로 리팩터링
  - 기존 단일 인터랙션을 `updateTangMode`로 분리(동작 동일)
  - 신규 모드 추가: `updateHwanMode`(원형 회전 → 환), `updateSanMode`(상→하 절구질), `updateGoMode`(시계 방향 휘젓기), `updateDanMode`(양손 풀무질)
  - `startGame()`에 `disease.type` 기반 모드 셋업 + 약탕기 DOM(`#herb-game-pot`) 조건부 표시
  - 단(丹) 모드를 위해 `maxNumHands: 2`로 동적 변경, `allHands` 배열 추가
  - 코치마크 두 번째 버블을 모드별 텍스트로 교체하는 `setCoachContentForType()` 추가
  - 마우스/터치 폴백 확장: pointermove로 가짜 랜드마크 생성하여 비-탕 모드도 데스크톱에서 동작
- **이유:** 사용자가 처방 제형별로 다른 학습 경험을 요청 — 모든 처방이 동일한 "약재 끌어서 약탕기" 인터랙션을 공유하던 것을 제형별 제조 행위(빚기·빻기·졸이기·연단)로 차별화
- **원복 방법:** 게임 루프를 단일 흐름으로 되돌리고 `updateTangMode` 본문을 `gameLoop`에 인라인. 신규 모드 함수와 `setCoachContentForType`, `mouseFallbackPos`/`pushFallbackToHand` 제거. `startGame`에서 `currentType` 분기와 `potDom.style.display` 토글 제거
- **날짜:** 2026-05-02

### [원복] 디자인 시스템 → 이전 디자인으로 환원 + 탭 변경
- **대상 경로:** `css/base.css`, `css/header.css`, `css/filters.css`, `css/list.css`, `css/modal.css`, `index.html`
- **변경 내용:**
  - 디자인 시스템 적용 이전 상태로 환원 (아래 "디자인 시스템 구현" 항목의 "원복 방법" 적용)
    - `base.css`: body `#fff`/`#333`/Malgun Gothic 복귀, `body::before` 한지 텍스처 제거, 토큰 `--header-bg` `rgba(248,246,240,0.95)`, `--card-radius` `0`, `--modal-radius` `12px`로 환원
    - `index.html`: Google Fonts → `Zhi+Mang+Xing`만 로드
    - `header.css`: `.header-glass` `rgba(248,246,240,0.95)` + `blur(12px)`, 탭 active `#000`/`#000`/`#fff`
    - `filters.css`: 칩 border `#bbb`, bg `#fff`/`#f5f5f5`, active `#e8e6e0`, `.sticky-tabs-bar` 배경/blur 환원
    - `list.css`: `.herb-card` border `#e0e0e0`, bg `#fff`, border-radius `0`, 이미지 radius `0`
    - `modal.css`: `.herb-ingredient-popup` `12px`, `.herb-detail-popup` `8px`, 배경 `#fff`
  - 탭 변경:
    - 라벨: `목록` → `약재`
    - 순서: 약재 · 효능 · 처방 · 프로젝트 개요
    - 폰트 크기: `var(--text-sm)` (≈13px) → `1rem` (16px), 모바일 `0.85rem` → `1.05rem`
  - 헤더-필터 영역 연결: `main` 상단 패딩 제거(`1rem` → `0`), `.sticky-tabs-bar` `margin-top: 0`
- **이유:** 사용자 요청 — 이전 디자인으로 환원 및 탭 UX 정리
- **원복 방법:** 아래 "디자인 시스템 구현" 항목 본문 참조 (재적용 시 동일 변경 사항 역순 적용)
- **날짜:** 2026-05-02

### [수정] 디자인 시스템 구현 — CSS 토큰 + 한지 텍스처 + 폰트 교체
- **대상 경로:** `css/base.css`, `css/header.css`, `css/filters.css`, `css/list.css`, `css/modal.css`, `index.html`
- **변경 내용:** A(한지 아카이브) × C(현대 한의원) × 디자인 파일 합성 디자인 시스템 적용
  - `base.css`: CSS Custom Properties `:root` 토큰 블록 + 한지 텍스처 3레이어(body) 추가
  - `index.html`: Google Fonts 웹폰트 추가 (Crimson Text, DM Sans, Noto Serif KR, Noto Sans KR)
  - `header.css`: 배경색 `rgba(248,246,240,0.95)` → `rgba(237,244,241,0.72)` + blur 강화 + 탭 pill 스타일 + clay-deep 액센트
  - `filters.css`: 필터 칩 → pill 형태 (`border-radius: 1000px`) + clay 액센트
  - `list.css`: 카드 border-radius 0 → 30px, 이미지 radius 20px, 폰트 토큰화
  - `modal.css`: 모달 radius 8/12px → 30px, 배경 토큰화
- **이유:** 에이전트 1–3 분석 결과 합성. 디자인 파일 `donguibogam-design-system` 기준 적용
- **원복 방법:**
  - `css/base.css` 원본: `* { box-sizing: border-box; }` + body font-family `"Malgun Gothic", "Apple SD Gothic Neo", sans-serif`, background `#fff`, color `#333`
  - `index.html` 원본: Google Fonts `Zhi+Mang+Xing`만 로드
  - `header.css` 원본: `.header-glass` background `rgba(248,246,240,0.95)`, backdrop-filter `blur(12px)`, 탭 active background `#000` border-color `#000` color `#fff`
  - `filters.css` 원본: `.category-chips button`, `.function-filter` border `1px solid #bbb`, background `#fff`/`#f5f5f5`, active `background: #e8e6e0`
  - `list.css` 원본: `.herb-card` border `1px solid #e0e0e0`, background `#fff`, border-radius 없음
  - `modal.css` 원본: `.herb-ingredient-popup` border-radius `12px`, `.herb-detail-popup` border-radius `8px`
- **날짜:** 2026-05-02

### [수정] 약재 영어학문명 오역 3건 수정 + 이미지 파일 개명·재매핑
- **대상 경로:** `data/herb-data.js`, `js/herb-viewer.js`, `asset/Img/`
- **변경 내용:** 전수검사에서 영어학문명이 다른 식물로 잘못 매핑된 3건을 수정. 이미지는 국문 기준으로 제작되어 내용은 정확하므로 파일명만 새 영어명에 맞춰 개명하고 `THUMBNAIL_BY_ID` 경로를 갱신.
  - PLANT_233 낭아(狼牙, 짚신나물): `HERB_ENGLISH_SUPPLEMENT` `Cumin seed` -> `Agrimony`, 이미지 `Cumin-seed.png` -> `Agrimony.png`
  - PLANT_330 백극(白棘, 멧대추 가시): `Siberian elm` -> `Jujube thorn`, 이미지 `Siberian-elm.png` -> `Jujube-thorn.png`
  - PLANT_345 연실(練實, 멀구슬나무 열매): `Chinese soapberry` -> `Chinaberry`, 이미지 `Chinese-soapberry.png` -> `Chinaberry.png`
  - `js/herb-viewer.js`의 `THUMBNAIL_BY_ID` 해당 3개 ID 경로를 새 파일명으로 in-place 교체 (옛 줄 삭제+추가 아님 -> 중복 키 미발생)
  - 정합성 검사 통과: 깨진 경로 0, 경로/ID 중복 0, 전체 498 엔트리 유지
- **이유:** 사용자 요청 — 약재↔영어학문명 매핑 전수검사 결과 명백한 오역 수정. soapberry는 PLANT_355 무환자피와 충돌하던 문제도 해소
- **원복 방법:** 위 3개 항목의 영어명·파일명·`THUMBNAIL_BY_ID` 경로를 각각 변경 전 값(`Cumin seed`/`Cumin-seed.png`, `Siberian elm`/`Siberian-elm.png`, `Chinese soapberry`/`Chinese-soapberry.png`)으로 되돌림
- **날짜:** 2026-06-12

### [수정] 약재 영어학문명 동의보감 검증 기반 정정 6건
- **대상 경로:** `data/herb-data.js` (`HERB_ENGLISH_SUPPLEMENT`)
- **변경 내용:** effect.json(동의보감 원문 효능 설명) 대조로 동정 오류·중복을 정정. 6건 모두 이미지 매핑(ID 기준) 영향 없음.
  - PLANT_182 택란(澤蘭): `Eupatorium` -> `Lycopus` — 원문 "연못 서식, 줄기 모남, 잎 박하 유사" = Lycopus lucidus(쉽싸리). PLANT_124 난초(Eupatorium)와의 중복 해소
  - PLANT_258 여여(䕡茹): `Lithospermum` -> `Ebracteolate euphorbia root` — 원문 "독 있음, 군살 제거·배농·파혈, 뿌리 겉 누렇고 속 흼" = Euphorbia ebracteolata(閭茹). 기존 PLANT_231 대극(大戟, Euphorbia root)과 구분되도록 종 특정명 사용
  - PLANT_278 초두구(草豆蔲): `Galangal seed` -> `Katsumada galangal seed` — Alpinia katsumadai. PLANT_207 홍두구(紅豆蔲, 원문 "고량강의 종자"이므로 Galangal seed 유지)와의 중복 해소
  - PLANT_102 적전(赤箭): `Gastrodia rhizome` -> `Gastrodia sprout` — 원문 "천마의 싹". 뿌리인 PLANT_184 천마(Gastrodia rhizome)와 부위 구분
  - MINERAL_035 아관석(鵝管石): `Stalactite` -> `Soda straw` — 원문 "거위 깃처럼 생김" = 관상 종유석. 이미지 `Soda_straw.png`와 영어명도 일치하게 됨. PLANT/MINERAL_007 석종유(Stalactite)와의 중복 해소
- **이유:** 사용자 요청 — 동의보감 원문 근거로 영어학문명 재검증. 뻐꾸기 2건(포곡/두견, PNG 개명 필요)은 이번 범위에서 제외
- **원복 방법:** 위 5개 ID의 `HERB_ENGLISH_SUPPLEMENT` 값을 각각 변경 전(`Eupatorium`, `Lithospermum`, `Galangal seed`, `Gastrodia rhizome`, `Stalactite`)으로 되돌림
- **날짜:** 2026-06-12

### [수정] 뻐꾸기 쌍 영어명 중복 해소 (두견만 수정)
- **대상 경로:** `data/herb-data.js` (`HERB_ENGLISH_SUPPLEMENT`)
- **변경 내용:** ANIMAL_125 포곡(布穀)·ANIMAL_126 두견(杜鵑)이 둘 다 `Cuckoo`이던 중복을, 대표종인 포곡은 `Cuckoo`로 유지하고 두견만 변경해 해소.
  - ANIMAL_126 두견(杜鵑): `Cuckoo` -> `Lesser cuckoo` (Cuculus poliocephalus, 원문 "자규·두견제혈")
  - ANIMAL_125 포곡(布穀): `Cuckoo` 유지 (Cuculus canorus, 대표 뻐꾸기)
- **이미지 영향 없음:** 이미지는 ID 매핑(포곡->Cuckoo2.png, 두견->Cuckoo.png)이라 영어명 변경과 무관. PNG 개명 불필요
- **이유:** 사용자 요청 — 둘 중 하나만 구분명을 두면 중복이 풀리므로 "Common" 접두 없이 최소 변경. 이로써 전체 영어명 중복 0건 달성
- **원복 방법:** ANIMAL_126 값을 `Cuckoo`로 되돌림
- **날짜:** 2026-06-12

### [추가] 가치탭 동의보감 영역 — 프로필 사진 배경/파티클 모드
- **대상 경로:** `js/dgbg-photo-particles.js` (신규), `index.html`, `css/data.css`
- **변경 내용:**
  - `js/dgbg-photo-particles.js` 신규 생성 — `asset/main/profile.jpg`를 동의보감 카드 배경으로 깔고, "모드변경" 토글(사진↔파티클)로 전환. 파티클 모드에서는 배경 사진을 미노출 처리하고 이미지를 픽셀 격자로 샘플링해 캔버스 파티클로 재구성·조립 애니메이션
  - `index.html`: `.dgbg-intro-dashboard`에 `data-photo-mode` 속성, `.dgbg-photo-layer`(배경 사진 + 캔버스), 헤더에 `.dgbg-mode-toggle` 버튼 추가. `<script defer src="js/dgbg-photo-particles.js">` 로드
  - `css/data.css`: `.dgbg-photo-layer/.dgbg-photo-bg/.dgbg-photo-canvas/.dgbg-mode-toggle/.dgbg-mode-btn` 스타일 및 `[data-photo-mode="particle"]` 전환 규칙 추가
- **이유:** 사용자 요청 — 동의보감 영역 배경 사진을 모드변경 시 파티클로 처리
- **원복 방법:** `js/dgbg-photo-particles.js` 삭제, index.html의 `.dgbg-photo-layer`·`.dgbg-mode-toggle`·script 태그·`data-photo-mode` 속성 제거, css/data.css의 위 블록(`/* ── 동의보감 카드 배경 사진 / 파티클 모드 ── */` ~ reduced-motion 블록) 제거
- **날짜:** 2026-06-21

### [삭제] 가치탭 동의보감 배경 사진/파티클 기능 원복
- **대상 경로:** `js/dgbg-photo-particles.js` (삭제), `index.html`, `css/data.css`
- **변경 내용:** 위 [추가] 항목(배경 사진/파티클)을 전부 원복. 배경 이미지 때문에 본문 가독성이 떨어진다는 피드백으로 제거. `js/dgbg-photo-particles.js` 파일 삭제, index.html의 `.dgbg-photo-layer`·`.dgbg-mode-toggle`·`data-photo-mode`·script 태그 제거, css/data.css의 관련 블록 제거. `.dgbg-intro-dashboard`는 배경 없는 원래 상태로 복귀
- **이유:** 사용자 요청 — 배경 이미지로 글자가 안 읽혀 우선 제거
- **원복 방법:** 직전 [추가] 항목의 변경 내용을 재적용
- **날짜:** 2026-06-21

### [삭제] 편찬 연혁 '일본·중국 전파'(17세기) 노드 제거
- **대상 경로:** `index.html` (`.dgbg-htl-track` 노드 + `.dgbg-htl-details` 상세)
- **변경 내용:** 연혁 타임라인에서 `data-htl-idx="4"`였던 '일본·중국 전파'(17세기) 노드와 해당 상세 패널(`.dgbg-tl-branches` 일본/중국 분기 포함)을 삭제. script.js의 타임라인 로직이 노드 배열 위치(i)와 상세의 `data-htl-idx` 값을 일치시켜 매칭하므로, 이후 노드·상세의 `data-htl-idx`를 5~10 → 4~9로 재번호하여 정합성 유지. 노드 11개 → 10개
- **이유:** 사용자 요청 — 일본·중국 전파 항목 제거
- **원복 방법:** 노드/상세 `data-htl-idx`를 다시 5~10으로 되돌리고, 삭제한 '일본·중국 전파' 노드(`dgbg-htl-node--branch`, 17세기)와 상세 패널(분기 콘텐츠 포함)을 idx=4 위치에 복원
- **날짜:** 2026-06-21

### [추가] 처방탭 '단(丹)' 인터렉션 — 영상 기반 2단계 + 전용 효과음
- **대상 경로:** `index.html`, `js/hand-herb-game.js`, `js/sfx.js`, `asset/sound/drop.mp3`·`asset/sound/rustle.mp3` (신규)
- **변경 내용:**
  - `index.html`: `asset/prescription/dan_background.mp4` 프레임 추출용 숨김 비디오 `#herb-game-dan-source` 추가
  - `js/hand-herb-game.js`: 기존 캔버스 드로잉 단(丹) 모드를 영상 프레임 기반 2단계로 교체. 영상 1~3초=「단 들기」, 5초 이후=「금박 두르기」 프레임으로 분리(3~5초 구간 미사용). `preloadDanFrames`/`scrubDanFrames`/`drawDanBgFrame`/`drawDanSparkles` 추가, `setupDanMode`/`updateDanMode` 재작성. 웹캠 배경 제외·손 골격 렌더 목록에 `dan` 추가. 코치마크 문구 갱신
  - `js/sfx.js`: 단 전용 효과음 `dan_place`(drop.mp3, 내려놓기 one-shot)·`dan_foil`(rustle.mp3, 금박 싸기 loop) 등록. 집기는 기존 `grab` 재사용. `stopGame`에 `dan_foil` 루프 정지 추가
  - `asset/sound/`: 사용자 제공 실음원 `drop.mp3`·`rustle.mp3` 추가
- **이유:** 사용자 요청 — dan_background.mp4 기반 단 인터렉션(단 들기/금박 두르기) + 집기·내려놓기·금박 싸기 효과음
- **원복 방법:** index.html `#herb-game-dan-source` 제거, `js/hand-herb-game.js`의 단 모드 신규 함수·2단계 로직 제거 후 이전 캔버스 드로잉 단 모드 복원(웹캠 제외/골격 목록의 `dan` 환원), `js/sfx.js`의 `dan_place`·`dan_foil` 항목과 `stopGame`의 `dan_foil` 정지 제거, `drop.mp3`·`rustle.mp3` 삭제
- **날짜:** 2026-06-21

### [추가] 처방탭 모바일뷰 — PC 최적화 안내 + 3D 캐릭터 배경
- **대상 경로:** `js/presc-mobile-char-3d.js` (신규), `index.html`, `css/presc.css`, `js/body-viewer-3d.js`
- **변경 내용:**
  - `index.html`: `#body-view` 내부에 모바일 전용 안내 블록 `.presc-mobile-block`(3D 캐릭터 캔버스 `#presc-mobile-char` + "PC 환경에서 최적화 되어 있습니다" 문구) 추가, `js/presc-mobile-char-3d.js` 모듈 스크립트 태그 추가
  - `css/presc.css`: `.presc-mobile-block` 기본 숨김, `@media (max-width: 700px)`에서 처방 탭 활성 시 필터 헤더(`.presc-filter-header`)·인터랙티브 레이아웃(`.presc-split-layout`)을 숨기고 안내 블록만 노출하는 스타일 추가
  - `js/presc-mobile-char-3d.js`: `body_male.glb`를 매트한 단색 머티리얼로 재사용해 느리게 자동 회전하는 장식용 3D 캐릭터 렌더(인터랙션 없음). 모바일(≤700px) + 처방 탭 활성 시에만 지연 초기화
  - `js/body-viewer-3d.js`: 모바일(≤700px)에서는 무거운 인터랙티브 인체 뷰어 `init()`을 건너뛰도록 `_isMobile()` 가드 추가
- **이유:** 사용자 요청 — 처방 탭은 PC 환경 최적화. 모바일에서는 인터랙션 차단하고 안내 문구 + 3D 모델링 캐릭터 배경 표시
- **원복 방법:** `js/presc-mobile-char-3d.js` 삭제, index.html의 `.presc-mobile-block` 블록·해당 script 태그 제거, css/presc.css의 `.presc-mobile-block` 관련 블록 제거, `js/body-viewer-3d.js`의 `_isMobile()` 가드 제거
- **날짜:** 2026-06-22

### [삭제] 처방탭 모바일 안내 3D 캐릭터 제거
- **대상 경로:** `js/presc-mobile-char-3d.js` (삭제), `index.html`, `css/presc.css`
- **변경 내용:** 처방 탭 모바일 안내 화면에서 3D 인물(배경 캐릭터)을 제거. `js/presc-mobile-char-3d.js` 파일 삭제, index.html의 `<canvas id="presc-mobile-char">`·해당 module script 태그 제거, css/presc.css의 `.presc-mobile-char` 규칙 제거. 안내 문구(`.presc-mobile-block-inner`)는 flex로 화면 정중앙 정렬, 떠오르는 등장 인터랙션(`prescMobileRise`)을 opacity+translateY 페이드업으로 다듬음
- **이유:** 사용자 요청 — 처방 탭에 3D 인물 노출하지 않고 문구만 중앙 배치
- **원복 방법:** `js/presc-mobile-char-3d.js` 복원, index.html에 `<canvas id="presc-mobile-char" class="presc-mobile-char">`와 module script 태그 추가, css/presc.css에 `.presc-mobile-char`(absolute/inset:0) 규칙 추가, `.presc-mobile-block`를 다시 position:relative 기반으로 환원
- **날짜:** 2026-06-22

### [수정] 분류(메인 카테고리) 필터 3단계 토글 동작 + 작업 전 백업
- **대상 경로:** `script.js`, 백업 폴더 `backup/2026-06-27_약재정렬-랜덤화-전/`(신규: `script.js`·`index.html`·`css/filters.css` 편집 직전 원본)
- **변경 내용:** `bindFilters()`의 `[data-filter-main]` 클릭 핸들러를 3단계 토글로 변경. ① 비활성 카테고리 클릭 → 활성화 + 하위 팝업 열기(목록은 해당 카테고리 전체) ② 같은 카테고리 재클릭(팝업 열림 또는 하위 선택 상태) → 팝업 닫고 하위 해제 → 카테고리 전체 약재 표시 ③ 같은 카테고리 재클릭(팝업 닫힘·하위 없음) → 필터 해제. 기존에는 같은 카테고리 재클릭 시 곧바로 전체 해제되어 "카테고리 전체 보기"가 불가능했음. ※ 본래 함께 요청됐던 "랜덤 정렬 + 충부 상단 제외" 기능은 사용자 재요청으로 추가했다가 모두 철회(가나다순 유지) — 백업 폴더 이름의 '랜덤화'는 그 흔적이며 현재 코드에는 랜덤 정렬 없음.
- **이유:** 사용자 요청 — 동물 등 메인 카테고리를 한 번 더 클릭하면 하위 선택 없이 해당 카테고리 약재 전체를 볼 수 있도록
- **원복 방법:** `backup/2026-06-27_약재정렬-랜덤화-전/script.js`로 `script.js`를 덮어쓰거나, `bindFilters()`의 `[data-filter-main]` 핸들러를 `if (state.mainCategory === main) { 전체 해제 } else { 활성화 }` 2단계 토글로 되돌림
- **날짜:** 2026-06-27

---

## 기록 양식

```
### [유형] 변경 내용 요약
- **대상 경로:**
- **변경 내용:**
- **이유:**
- **원복 방법:**
- **날짜:**
```
