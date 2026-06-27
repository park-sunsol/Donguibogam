# 프로젝트 구조 변경 이력

폴더 삭제·이동·이름 변경 등 구조적 변경사항을 기록합니다.
원복이 필요할 때 이 파일을 참조하세요.

---

## 2026-05-12

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
