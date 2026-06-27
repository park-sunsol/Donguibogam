// 동의보감 탕액편 - 처방 데이터 (탕·환·산·고·단 100방)
// 제형별 처방 → 약재 ID 목록 + 용량(herb_doses)
// herb_doses: herb_ids와 1:1 대응, 동의보감 기록 기준 환산 (1전 ≈ 3.75g, 1냥 ≈ 37.5g)
// type: tang(탕), hwan(환), san(산), go(고), dan(단)
window.DONGUIBOGAM_PRESCRIPTIONS = [

  // ═══════════════════════════════════════
  //  탕 (湯) — 달인 약
  // ═══════════════════════════════════════
  {
    id: 'TANG_001',
    type: 'tang',
    type_label: '탕(湯)',
    name: '기혈 보충·피로',
    hanja: '氣血補充',
    formula: '쌍화탕 雙和湯',
    herb_ids: ['PLANT_152', 'PLANT_083', 'PLANT_112', 'PLANT_149', 'PLANT_108', 'PLANT_287'],
    herb_doses: ['4g', '6g', '6g', '4g', '4g', '3g'],
    description: '기혈 보충, 피로 회복'
  },
  {
    id: 'TANG_002',
    type: 'tang',
    type_label: '탕(湯)',
    name: '혈허·부인병·월경불순',
    hanja: '血虛',
    formula: '사물탕 四物湯',
    herb_ids: ['PLANT_083', 'PLANT_152', 'PLANT_149', 'PLANT_108'],
    herb_doses: ['6g', '4g', '4g', '4g'],
    description: '혈 보충, 월경불순·부인병 개선'
  },
  {
    id: 'TANG_003',
    type: 'tang',
    type_label: '탕(湯)',
    name: '소화기 허약',
    hanja: '脾胃虛弱',
    formula: '사군자탕 四君子湯',
    herb_ids: ['PLANT_080', 'PLANT_084', 'PLANT_292', 'PLANT_082'],
    herb_doses: ['4g', '4g', '4g', '2g'],
    description: '기 보충, 소화기 강화'
  },
  {
    id: 'TANG_004',
    type: 'tang',
    type_label: '탕(湯)',
    name: '기혈 양허·전신 허약',
    hanja: '氣血兩虛',
    formula: '십전대보탕 十全大補湯',
    herb_ids: ['PLANT_083', 'PLANT_152', 'PLANT_149', 'PLANT_108', 'PLANT_080', 'PLANT_084', 'PLANT_292', 'PLANT_082', 'PLANT_112', 'PLANT_287'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g', '4g', '4g', '2g', '6g', '3g'],
    description: '기혈 전체 보강'
  },
  {
    id: 'TANG_005',
    type: 'tang',
    type_label: '탕(湯)',
    name: '기력 저하·소화불량',
    hanja: '中氣不足',
    formula: '보중익기탕 補中益氣湯',
    herb_ids: ['PLANT_112', 'PLANT_080', 'PLANT_084', 'PLANT_149', 'PLANT_088', 'PLANT_092'],
    herb_doses: ['8g', '4g', '4g', '4g', '3g', '3g'],
    description: '기력 저하, 소화불량 개선'
  },
  {
    id: 'TANG_006',
    type: 'tang',
    type_label: '탕(湯)',
    name: '신장·간 음허',
    hanja: '腎陰虛',
    formula: '육미지황탕 六味地黃湯',
    herb_ids: ['PLANT_083', 'PLANT_370', 'PLANT_095', 'PLANT_096', 'PLANT_292', 'PLANT_191'],
    herb_doses: ['8g', '4g', '4g', '3g', '3g', '3g'],
    description: '신장·간 음기 보충'
  },
  {
    id: 'TANG_007',
    type: 'tang',
    type_label: '탕(湯)',
    name: '기침·천식·콧물',
    hanja: '咳嗽喘息',
    formula: '소청룡탕 小靑龍湯',
    herb_ids: ['PLANT_150', 'PLANT_287', 'PLANT_152', 'PLANT_218', 'PLANT_099', 'PLANT_122'],
    herb_doses: ['6g', '3g', '4g', '6g', '2g', '3g'],
    description: '기침, 천식, 콧물 완화'
  },
  {
    id: 'TANG_008',
    type: 'tang',
    type_label: '탕(湯)',
    name: '고열·오한·무한',
    hanja: '高熱惡寒',
    formula: '대청룡탕 大靑龍湯',
    herb_ids: ['PLANT_150', 'PLANT_287', 'MINERAL_017', 'PLANT_022', 'PLANT_082', 'PLANT_037', 'PLANT_006'],
    herb_doses: ['6g', '3g', '8g', '4g', '2g', '3g', '3g'],
    description: '고열, 오한, 무한 해소'
  },
  {
    id: 'TANG_009',
    type: 'tang',
    type_label: '탕(湯)',
    name: '감기 초기·목 뻣뻣함',
    hanja: '感冒初期',
    formula: '갈근탕 葛根湯',
    herb_ids: ['PLANT_146', 'PLANT_150', 'PLANT_287', 'PLANT_152', 'PLANT_082', 'PLANT_037', 'PLANT_006'],
    herb_doses: ['8g', '4g', '3g', '4g', '2g', '3g', '3g'],
    description: '감기 초기, 목 뻣뻣함 완화'
  },
  {
    id: 'TANG_010',
    type: 'tang',
    type_label: '탕(湯)',
    name: '오한·발열 (유한)',
    hanja: '惡寒發熱',
    formula: '계지탕 桂枝湯',
    herb_ids: ['PLANT_287', 'PLANT_152', 'PLANT_082', 'PLANT_037', 'PLANT_006'],
    herb_doses: ['4g', '4g', '2g', '3g', '3g'],
    description: '오한·발열, 땀 있는 감기'
  },
  {
    id: 'TANG_011',
    type: 'tang',
    type_label: '탕(湯)',
    name: '오한·발열 (무한)',
    hanja: '惡寒無汗',
    formula: '마황탕 麻黃湯',
    herb_ids: ['PLANT_150', 'PLANT_287', 'PLANT_022', 'PLANT_082'],
    herb_doses: ['6g', '3g', '4g', '2g'],
    description: '오한·발열, 땀 없는 감기'
  },
  {
    id: 'TANG_012',
    type: 'tang',
    type_label: '탕(湯)',
    name: '왕래한열·흉협 불편',
    hanja: '少陽病',
    formula: '소시호탕 小柴胡湯',
    herb_ids: ['PLANT_088', 'PLANT_162', 'PLANT_080', 'PLANT_218', 'PLANT_082', 'PLANT_037', 'PLANT_006'],
    herb_doses: ['8g', '4g', '4g', '6g', '2g', '3g', '3g'],
    description: '오한·발열 반복, 흉협부 불편'
  },
  {
    id: 'TANG_013',
    type: 'tang',
    type_label: '탕(湯)',
    name: '변비 동반 고열·복부 팽만',
    hanja: '陽明少陽合病',
    formula: '대시호탕 大柴胡湯',
    herb_ids: ['PLANT_088', 'PLANT_162', 'PLANT_152', 'PLANT_218', 'PLANT_320', 'PLANT_219', 'PLANT_037', 'PLANT_006'],
    herb_doses: ['8g', '4g', '4g', '6g', '3g', '3g', '3g', '3g'],
    description: '변비 동반 고열, 복부 팽만'
  },
  {
    id: 'TANG_014',
    type: 'tang',
    type_label: '탕(湯)',
    name: '부종·소변불리·구토',
    hanja: '水腫',
    formula: '오령산 五苓散',
    herb_ids: ['PLANT_096', 'PLANT_292', 'PLANT_329', 'PLANT_084', 'PLANT_287'],
    herb_doses: ['6g', '4g', '4g', '4g', '3g'],
    description: '부종, 소변 불리, 구토 개선'
  },
  {
    id: 'TANG_015',
    type: 'tang',
    type_label: '탕(湯)',
    name: '열독·염증·불면',
    hanja: '熱毒',
    formula: '황련해독탕 黃連解毒湯',
    herb_ids: ['PLANT_109', 'PLANT_162', 'PLANT_296', 'PLANT_317'],
    herb_doses: ['4g', '4g', '4g', '4g'],
    description: '열독, 염증, 불면 해소'
  },
  {
    id: 'TANG_016',
    type: 'tang',
    type_label: '탕(湯)',
    name: '기혈 쌍보',
    hanja: '氣血雙補',
    formula: '팔물탕 八物湯',
    herb_ids: ['PLANT_083', 'PLANT_152', 'PLANT_149', 'PLANT_108', 'PLANT_080', 'PLANT_084', 'PLANT_292', 'PLANT_082'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g', '4g', '4g', '2g'],
    description: '기혈 쌍보'
  },
  {
    id: 'TANG_017',
    type: 'tang',
    type_label: '탕(湯)',
    name: '월경불순·갱년기·울화',
    hanja: '肝鬱',
    formula: '가미소요탕 加味逍遙湯',
    herb_ids: ['PLANT_088', 'PLANT_149', 'PLANT_152', 'PLANT_084', 'PLANT_292', 'PLANT_191', 'PLANT_317'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g', '3g', '3g'],
    description: '월경불순, 갱년기, 스트레스·울화 해소'
  },
  {
    id: 'TANG_018',
    type: 'tang',
    type_label: '탕(湯)',
    name: '심비 허약·불면·건망',
    hanja: '心脾兩虛',
    formula: '귀비탕 歸脾湯',
    herb_ids: ['PLANT_080', 'PLANT_112', 'PLANT_084', 'PLANT_292', 'PLANT_149', 'PLANT_019', 'PLANT_295', 'PLANT_097'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g', '3g', '3g', '3g'],
    description: '심비 허약, 불면, 건망 개선'
  },
  {
    id: 'TANG_019',
    type: 'tang',
    type_label: '탕(湯)',
    name: '담음·불안·불면',
    hanja: '痰飮',
    formula: '온담탕 溫膽湯',
    herb_ids: ['PLANT_218', 'PLANT_002', 'PLANT_292', 'PLANT_320', 'PLANT_372', 'PLANT_082', 'PLANT_037', 'PLANT_006'],
    herb_doses: ['6g', '4g', '4g', '3g', '3g', '2g', '3g', '3g'],
    description: '담(痰), 불안, 불면 개선'
  },
  {
    id: 'TANG_020',
    type: 'tang',
    type_label: '탕(湯)',
    name: '관절통·요통·풍습',
    hanja: '風濕痺痛',
    formula: '독활기생탕 獨活寄生湯',
    herb_ids: ['PLANT_090', 'PLANT_302', 'PLANT_371', 'PLANT_086', 'PLANT_114', 'PLANT_099', 'PLANT_149', 'PLANT_083'],
    herb_doses: ['6g', '4g', '4g', '4g', '4g', '2g', '4g', '4g'],
    description: '관절통, 요통, 풍습 완화'
  },
  {
    id: 'TANG_021',
    type: 'tang',
    type_label: '탕(湯)',
    name: '자궁 한증·월경불순',
    hanja: '胞宮虛寒',
    formula: '온경탕 溫經湯',
    herb_ids: ['PLANT_149', 'PLANT_152', 'PLANT_108', 'PLANT_080', 'PLANT_287', 'PLANT_305', 'PLANT_191', 'PLANT_218', 'PLANT_082', 'PLANT_037'],
    herb_doses: ['6g', '4g', '4g', '4g', '3g', '2g', '3g', '4g', '2g', '3g'],
    description: '자궁 한증, 생리불순·월경통 개선'
  },
  {
    id: 'TANG_022',
    type: 'tang',
    type_label: '탕(湯)',
    name: '산전·산후 보혈',
    hanja: '産前産後',
    formula: '궁귀탕 芎歸湯',
    herb_ids: ['PLANT_108', 'PLANT_149'],
    herb_doses: ['8g', '8g'],
    description: '산전·산후 보혈, 부인 통용 기본방'
  },
  {
    id: 'TANG_023',
    type: 'tang',
    type_label: '탕(湯)',
    name: '임신 안태·태동불안',
    hanja: '安胎',
    formula: '안태음 安胎飮',
    herb_ids: ['PLANT_084', 'PLANT_149', 'PLANT_152', 'PLANT_162', 'PLANT_108', 'PLANT_002', 'PLANT_202', 'PLANT_067', 'PLANT_082'],
    herb_doses: ['6g', '4g', '4g', '4g', '3g', '3g', '2g', '3g', '2g'],
    description: '임신 안태, 태동불안 진정'
  },
  {
    id: 'TANG_024',
    type: 'tang',
    type_label: '탕(湯)',
    name: '어혈성 월경통·생리통',
    hanja: '血瘀經痛',
    formula: '도홍사물탕 桃紅四物湯',
    herb_ids: ['PLANT_083', 'PLANT_152', 'PLANT_149', 'PLANT_108', 'PLANT_021', 'PLANT_190'],
    herb_doses: ['6g', '4g', '4g', '4g', '3g', '3g'],
    description: '어혈성 월경통, 생리통 완화'
  },
  {
    id: 'TANG_025',
    type: 'tang',
    type_label: '탕(湯)',
    name: '폐경·무월경 통경',
    hanja: '經閉',
    formula: '통경탕 通經湯',
    herb_ids: ['PLANT_149', 'PLANT_108', 'PLANT_152', 'PLANT_021', 'PLANT_190', 'PLANT_205', 'PLANT_287'],
    herb_doses: ['6g', '4g', '4g', '3g', '3g', '3g', '2g'],
    description: '폐경, 무월경 통경(通經) 개선'
  },

  // ═══════════════════════════════════════
  //  환 (丸) — 알약
  // ═══════════════════════════════════════
  {
    id: 'HWAN_001',
    type: 'hwan',
    type_label: '환(丸)',
    name: '원기 강화·최고 보약',
    hanja: '元氣大補',
    formula: '공진단 拱辰丹',
    herb_ids: ['ANIMAL_169', 'ANIMAL_134', 'PLANT_149', 'PLANT_370'],
    herb_doses: ['1g', '6g', '4g', '4g'],
    description: '최고급 보약, 원기 강화'
  },
  {
    id: 'HWAN_002',
    type: 'hwan',
    type_label: '환(丸)',
    name: '신장·간 음허',
    hanja: '腎陰虛',
    formula: '육미지황환 六味地黃丸',
    herb_ids: ['PLANT_083', 'PLANT_370', 'PLANT_095', 'PLANT_096', 'PLANT_292', 'PLANT_191'],
    herb_doses: ['8g', '4g', '4g', '3g', '3g', '3g'],
    description: '신장·간 음허 보충'
  },
  {
    id: 'HWAN_003',
    type: 'hwan',
    type_label: '환(丸)',
    name: '신양 허약·냉증',
    hanja: '腎陽虛',
    formula: '팔미지황환 八味地黃丸',
    herb_ids: ['PLANT_083', 'PLANT_370', 'PLANT_095', 'PLANT_096', 'PLANT_292', 'PLANT_191', 'PLANT_287', 'PLANT_215'],
    herb_doses: ['8g', '4g', '4g', '3g', '3g', '3g', '2g', '2g'],
    description: '신양 허약, 냉증 개선'
  },
  {
    id: 'HWAN_004',
    type: 'hwan',
    type_label: '환(丸)',
    name: '중풍·심신 불안·고혈압',
    hanja: '中風',
    formula: '우황청심환 牛黃淸心丸',
    herb_ids: ['ANIMAL_147', 'ANIMAL_169', 'PLANT_080', 'PLANT_095', 'PLANT_082'],
    herb_doses: ['1g', '0.5g', '4g', '4g', '2g'],
    description: '중풍, 심신 불안, 고혈압'
  },
  {
    id: 'HWAN_005',
    type: 'hwan',
    type_label: '환(丸)',
    name: '졸도·기절·흉통 응급',
    hanja: '厥證',
    formula: '소합향환 蘇合香丸',
    herb_ids: ['PLANT_314', 'ANIMAL_169', 'PLANT_333', 'PLANT_307'],
    herb_doses: ['2g', '0.5g', '2g', '2g'],
    description: '졸도, 기절, 흉통 응급 처치'
  },
  {
    id: 'HWAN_006',
    type: 'hwan',
    type_label: '환(丸)',
    name: '심열·소변불리',
    hanja: '心熱',
    formula: '청심연자환 淸心蓮子丸',
    herb_ids: ['PLANT_001', 'PLANT_089', 'PLANT_292', 'PLANT_162', 'PLANT_080'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g'],
    description: '심열, 소변 불리 개선'
  },
  {
    id: 'HWAN_007',
    type: 'hwan',
    type_label: '환(丸)',
    name: '담음·구역·기침',
    hanja: '痰飮',
    formula: '이진환 二陳丸',
    herb_ids: ['PLANT_218', 'PLANT_002', 'PLANT_292', 'PLANT_082'],
    herb_doses: ['6g', '4g', '4g', '2g'],
    description: '담음(痰飮), 구역, 기침 완화'
  },
  {
    id: 'HWAN_008',
    type: 'hwan',
    type_label: '환(丸)',
    name: '신허·요통·이명',
    hanja: '腎虛',
    formula: '지황환 地黃丸',
    herb_ids: ['PLANT_083', 'PLANT_370', 'PLANT_095'],
    herb_doses: ['8g', '4g', '4g'],
    description: '신허, 요통, 이명 개선'
  },
  {
    id: 'HWAN_009',
    type: 'hwan',
    type_label: '환(丸)',
    name: '음허 화왕·도한',
    hanja: '陰虛火旺',
    formula: '귀령환 龜笭丸',
    herb_ids: ['ANIMAL_170', 'PLANT_296', 'PLANT_158', 'PLANT_083'],
    herb_doses: ['6g', '4g', '4g', '6g'],
    description: '음허 화왕, 도한(식은땀) 개선'
  },
  {
    id: 'HWAN_010',
    type: 'hwan',
    type_label: '환(丸)',
    name: '변비·적체',
    hanja: '便秘積滯',
    formula: '대황환 大黃丸',
    herb_ids: ['PLANT_219', 'MINERAL_022', 'PLANT_320', 'PLANT_322'],
    herb_doses: ['6g', '4g', '3g', '4g'],
    description: '변비, 적체 해소'
  },
  {
    id: 'HWAN_011',
    type: 'hwan',
    type_label: '환(丸)',
    name: '비위 허약·소화불량',
    hanja: '脾胃虛弱',
    formula: '건중환 健中丸',
    herb_ids: ['PLANT_080', 'PLANT_084', 'PLANT_152', 'PLANT_037', 'PLANT_082'],
    herb_doses: ['4g', '4g', '4g', '3g', '2g'],
    description: '비위 허약, 소화불량 개선'
  },
  {
    id: 'HWAN_012',
    type: 'hwan',
    type_label: '환(丸)',
    name: '심신 허약·불면·두근거림',
    hanja: '心虛',
    formula: '천왕보심단 天王補心丹',
    herb_ids: ['PLANT_083', 'PLANT_080', 'PLANT_149', 'PLANT_089', 'PLANT_081', 'PLANT_295', 'PLANT_097'],
    herb_doses: ['6g', '4g', '4g', '4g', '4g', '3g', '3g'],
    description: '심신 허약, 불면, 두근거림 개선'
  },
  {
    id: 'HWAN_013',
    type: 'hwan',
    type_label: '환(丸)',
    name: '음허 발열·결핵성 기침',
    hanja: '陰虛發熱',
    formula: '자음강화환 滋陰降火丸',
    herb_ids: ['PLANT_083', 'ANIMAL_170', 'PLANT_296', 'PLANT_158', 'PLANT_081', 'PLANT_089'],
    herb_doses: ['6g', '4g', '4g', '4g', '4g', '4g'],
    description: '음허 발열, 결핵성 기침 개선'
  },
  {
    id: 'HWAN_014',
    type: 'hwan',
    type_label: '환(丸)',
    name: '장조 변비',
    hanja: '腸燥便秘',
    formula: '윤장환 潤腸丸',
    herb_ids: ['PLANT_219', 'PLANT_149', 'PLANT_131', 'PLANT_021', 'PLANT_321'],
    herb_doses: ['4g', '4g', '4g', '4g', '3g'],
    description: '장조 변비 완화'
  },
  {
    id: 'HWAN_015',
    type: 'hwan',
    type_label: '환(丸)',
    name: '심화·구내염·설사',
    hanja: '心火',
    formula: '황련환 黃連丸',
    herb_ids: ['PLANT_109', 'PLANT_162', 'PLANT_317'],
    herb_doses: ['4g', '4g', '4g'],
    description: '심화, 구내염, 설사 개선'
  },
  {
    id: 'HWAN_016',
    type: 'hwan',
    type_label: '환(丸)',
    name: '소화기 전반 보강',
    hanja: '脾虛',
    formula: '삼출건비환 蔘朮健脾丸',
    herb_ids: ['PLANT_080', 'PLANT_084', 'PLANT_292', 'PLANT_095', 'PLANT_001', 'PLANT_002'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g', '3g'],
    description: '소화기 전반 보강'
  },
  {
    id: 'HWAN_017',
    type: 'hwan',
    type_label: '환(丸)',
    name: '신허 요통·유정',
    hanja: '腎虛腰痛',
    formula: '보신환 補腎丸',
    herb_ids: ['PLANT_083', 'PLANT_095', 'PLANT_290', 'PLANT_085', 'PLANT_371'],
    herb_doses: ['6g', '4g', '4g', '4g', '4g'],
    description: '신허 요통, 유정 개선'
  },
  {
    id: 'HWAN_018',
    type: 'hwan',
    type_label: '환(丸)',
    name: '구역·임신 오조',
    hanja: '嘔逆',
    formula: '반하환 半夏丸',
    herb_ids: ['PLANT_218', 'PLANT_037'],
    herb_doses: ['8g', '적량'],
    description: '구역, 임신 오조 완화'
  },
  {
    id: 'HWAN_019',
    type: 'hwan',
    type_label: '환(丸)',
    name: '코막힘·두통',
    hanja: '鼻塞頭痛',
    formula: '통규환 通竅丸',
    herb_ids: ['ANIMAL_169', 'PLANT_318', 'PLANT_342', 'PLANT_099'],
    herb_doses: ['0.3g', '1g', '3g', '2g'],
    description: '코막힘, 두통, 규(竅) 통함'
  },
  {
    id: 'HWAN_020',
    type: 'hwan',
    type_label: '환(丸)',
    name: '눈 피로·시력 저하',
    hanja: '目昏',
    formula: '명목지황환 明目地黃丸',
    herb_ids: ['PLANT_083', 'PLANT_370', 'PLANT_095', 'PLANT_096', 'PLANT_292', 'PLANT_191', 'PLANT_290', 'PLANT_079', 'PLANT_149', 'PLANT_152'],
    herb_doses: ['8g', '4g', '4g', '3g', '3g', '3g', '4g', '3g', '4g', '4g'],
    description: '눈 피로, 시력 저하 개선'
  },
  {
    id: 'HWAN_021',
    type: 'hwan',
    type_label: '환(丸)',
    name: '산후 어혈·월경불순',
    hanja: '産後血瘀',
    formula: '익모환 益母丸',
    herb_ids: ['PLANT_087', 'PLANT_149', 'PLANT_205'],
    herb_doses: ['8g', '4g', '4g'],
    description: '산후 어혈, 월경불순 개선'
  },

  // ═══════════════════════════════════════
  //  산 (散) — 가루약
  // ═══════════════════════════════════════
  {
    id: 'SAN_001',
    type: 'san',
    type_label: '산(散)',
    name: '소화불량·위장 습체',
    hanja: '食滯',
    formula: '평위산 平胃散',
    herb_ids: ['PLANT_373', 'PLANT_322', 'PLANT_002', 'PLANT_082', 'PLANT_037', 'PLANT_006'],
    herb_doses: ['6g', '4g', '4g', '2g', '3g', '3g'],
    description: '소화불량, 위장 습체 해소'
  },
  {
    id: 'SAN_002',
    type: 'san',
    type_label: '산(散)',
    name: '냉증·감기·소화불량 복합',
    hanja: '寒濕感冒',
    formula: '오적산 五積散',
    herb_ids: ['PLANT_373', 'PLANT_150', 'PLANT_002', 'PLANT_322', 'PLANT_149', 'PLANT_037'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g', '3g'],
    description: '냉증, 감기, 소화불량 복합 개선'
  },
  {
    id: 'SAN_003',
    type: 'san',
    type_label: '산(散)',
    name: '비위 허약·설사',
    hanja: '脾虛泄瀉',
    formula: '삼령산 蔘笭散',
    herb_ids: ['PLANT_080', 'PLANT_084', 'PLANT_292', 'PLANT_082', 'PLANT_095', 'PLANT_001', 'PLANT_374'],
    herb_doses: ['4g', '4g', '4g', '2g', '4g', '4g', '4g'],
    description: '비위 허약, 설사 개선'
  },
  {
    id: 'SAN_004',
    type: 'san',
    type_label: '산(散)',
    name: '피부 가려움·두드러기',
    hanja: '風疹瘙癢',
    formula: '소풍산 消風散',
    herb_ids: ['PLANT_066', 'PLANT_114', 'PLANT_177', 'ANIMAL_033', 'PLANT_149', 'PLANT_083', 'PLANT_148'],
    herb_doses: ['4g', '4g', '4g', '3g', '4g', '4g', '3g'],
    description: '피부 가려움, 두드러기 완화'
  },
  {
    id: 'SAN_005',
    type: 'san',
    type_label: '산(散)',
    name: '두통·편두통',
    hanja: '頭痛',
    formula: '천궁다조산 川芎茶調散',
    herb_ids: ['PLANT_108', 'PLANT_066', 'PLANT_114', 'PLANT_160', 'PLANT_091', 'PLANT_099', 'PLANT_069', 'PLANT_082'],
    herb_doses: ['4g', '4g', '4g', '3g', '3g', '2g', '3g', '2g'],
    description: '두통, 편두통 완화'
  },
  {
    id: 'SAN_006',
    type: 'san',
    type_label: '산(散)',
    name: '소변 열통·구내염',
    hanja: '心火下移',
    formula: '도적산 導赤散',
    herb_ids: ['PLANT_083', 'PLANT_151', 'PLANT_082', 'PLANT_304'],
    herb_doses: ['6g', '4g', '2g', '3g'],
    description: '소변 열통, 구내염 개선'
  },
  {
    id: 'SAN_007',
    type: 'san',
    type_label: '산(散)',
    name: '간담 열증·음부 소양증',
    hanja: '肝膽濕熱',
    formula: '용담사간산 龍膽瀉肝散',
    herb_ids: ['PLANT_098', 'PLANT_162', 'PLANT_317', 'PLANT_096', 'PLANT_151', 'PLANT_149', 'PLANT_083'],
    herb_doses: ['4g', '4g', '4g', '3g', '3g', '4g', '4g'],
    description: '간담 열증, 음부 소양증 개선'
  },
  {
    id: 'SAN_008',
    type: 'san',
    type_label: '산(散)',
    name: '표리 열증·비만·변비',
    hanja: '表裏俱實',
    formula: '방풍통성산 防風通聖散',
    herb_ids: ['PLANT_114', 'PLANT_066', 'PLANT_150', 'PLANT_219', 'MINERAL_022', 'MINERAL_017', 'PLANT_162'],
    herb_doses: ['4g', '4g', '3g', '3g', '3g', '6g', '4g'],
    description: '표리 열증, 비만, 변비 개선'
  },
  {
    id: 'SAN_009',
    type: 'san',
    type_label: '산(散)',
    name: '비위 냉증·구토·설사',
    hanja: '脾胃虛寒',
    formula: '이중산 理中散',
    herb_ids: ['PLANT_080', 'PLANT_084', 'PLANT_037', 'PLANT_082'],
    herb_doses: ['4g', '4g', '4g', '2g'],
    description: '비위 냉증, 구토, 설사 개선'
  },
  {
    id: 'SAN_010',
    type: 'san',
    type_label: '산(散)',
    name: '기 울체·소화불량·구역',
    hanja: '氣滯',
    formula: '향사산 香砂散',
    herb_ids: ['PLANT_094', 'PLANT_202', 'PLANT_080', 'PLANT_084', 'PLANT_292', 'PLANT_218'],
    herb_doses: ['3g', '3g', '4g', '4g', '4g', '6g'],
    description: '기 울체, 소화불량, 구역 완화'
  },
  {
    id: 'SAN_011',
    type: 'san',
    type_label: '산(散)',
    name: '더위 먹음·기력 저하',
    hanja: '暑傷',
    formula: '청서익기산 淸暑益氣散',
    herb_ids: ['PLANT_112', 'PLANT_080', 'PLANT_084', 'PLANT_089', 'PLANT_122', 'PLANT_296'],
    herb_doses: ['6g', '4g', '4g', '4g', '3g', '3g'],
    description: '더위 먹음, 기력 저하 개선'
  },
  {
    id: 'SAN_012',
    type: 'san',
    type_label: '산(散)',
    name: '서열·소변불리',
    hanja: '暑熱',
    formula: '익원산 益元散',
    herb_ids: ['MINERAL_012', 'PLANT_082', 'MINERAL_005'],
    herb_doses: ['6g', '1g', '1g'],
    description: '서열, 소변 불리 개선'
  },
  {
    id: 'SAN_013',
    type: 'san',
    type_label: '산(散)',
    name: '감기·발열·두통·근육통',
    hanja: '外感風寒',
    formula: '패독산 敗毒散',
    herb_ids: ['PLANT_091', 'PLANT_090', 'PLANT_088', 'PLANT_167', 'PLANT_321', 'PLANT_292', 'PLANT_108', 'PLANT_080'],
    herb_doses: ['4g', '4g', '4g', '4g', '3g', '4g', '4g', '4g'],
    description: '감기, 발열, 두통, 근육통 완화'
  },
  {
    id: 'SAN_014',
    type: 'san',
    type_label: '산(散)',
    name: '가을 기침·묽은 가래',
    hanja: '涼燥咳嗽',
    formula: '행소산 杏蘇散',
    herb_ids: ['PLANT_022', 'PLANT_067', 'PLANT_218', 'PLANT_292', 'PLANT_167', 'PLANT_002', 'PLANT_061'],
    herb_doses: ['4g', '4g', '6g', '4g', '4g', '3g', '3g'],
    description: '가을 기침, 묽은 가래 완화'
  },
  {
    id: 'SAN_015',
    type: 'san',
    type_label: '산(散)',
    name: '열 제거·갈증',
    hanja: '實熱',
    formula: '청열산 淸熱散',
    herb_ids: ['PLANT_109', 'PLANT_162', 'MINERAL_017', 'PLANT_158', 'PLANT_082'],
    herb_doses: ['4g', '4g', '8g', '4g', '2g'],
    description: '열 제거, 갈증 해소'
  },
  {
    id: 'SAN_016',
    type: 'san',
    type_label: '산(散)',
    name: '부종·관절통·습증',
    hanja: '濕痺',
    formula: '의이인산 薏苡仁散',
    herb_ids: ['PLANT_374', 'PLANT_183', 'PLANT_133', 'PLANT_082'],
    herb_doses: ['8g', '4g', '4g', '2g'],
    description: '부종, 관절통, 습증 완화'
  },
  {
    id: 'SAN_017',
    type: 'san',
    type_label: '산(散)',
    name: '어지럼증·심하 진수음',
    hanja: '痰飮眩暈',
    formula: '영계출감산 苓桂朮甘散',
    herb_ids: ['PLANT_292', 'PLANT_287', 'PLANT_084', 'PLANT_082'],
    herb_doses: ['6g', '3g', '4g', '2g'],
    description: '어지럼증, 심하 진수음 개선'
  },
  {
    id: 'SAN_018',
    type: 'san',
    type_label: '산(散)',
    name: '심화·변비·두면부 열',
    hanja: '心火上炎',
    formula: '세심산 洗心散',
    herb_ids: ['PLANT_066', 'PLANT_114', 'PLANT_149', 'PLANT_160', 'PLANT_219', 'PLANT_150', 'PLANT_082'],
    herb_doses: ['4g', '4g', '4g', '3g', '3g', '3g', '2g'],
    description: '심화, 변비, 두면부 열 개선'
  },
  {
    id: 'SAN_019',
    type: 'san',
    type_label: '산(散)',
    name: '만성 소화불량·설사',
    hanja: '脾虛泄瀉',
    formula: '삼령백출산 蔘笭白朮散',
    herb_ids: ['PLANT_080', 'PLANT_292', 'PLANT_084', 'PLANT_082', 'PLANT_095', 'PLANT_001', 'PLANT_202'],
    herb_doses: ['4g', '4g', '4g', '2g', '4g', '4g', '3g'],
    description: '만성 소화불량, 설사 개선'
  },
  {
    id: 'SAN_020',
    type: 'san',
    type_label: '산(散)',
    name: '산후 어혈·복통',
    hanja: '産後瘀血',
    formula: '생화산 生化散',
    herb_ids: ['PLANT_149', 'PLANT_108', 'PLANT_021', 'PLANT_037', 'PLANT_082'],
    herb_doses: ['8g', '4g', '3g', '3g', '2g'],
    description: '산후 어혈, 복통 완화'
  },
  {
    id: 'SAN_021',
    type: 'san',
    type_label: '산(散)',
    name: '임신 부종·복통·월경통',
    hanja: '妊娠腹痛',
    formula: '당귀작약산 當歸芍藥散',
    herb_ids: ['PLANT_149', 'PLANT_152', 'PLANT_108', 'PLANT_084', 'PLANT_292', 'PLANT_096'],
    herb_doses: ['4g', '6g', '3g', '4g', '4g', '4g'],
    description: '임신 부종·복통, 월경통 완화'
  },

  // ═══════════════════════════════════════
  //  고 (膏) — 고약·연고·엿
  // ═══════════════════════════════════════
  {
    id: 'GO_001',
    type: 'go',
    type_label: '고(膏)',
    name: '노화 방지·최고 보약',
    hanja: '延年益壽',
    formula: '경옥고 瓊玉膏',
    herb_ids: ['PLANT_083', 'PLANT_080', 'PLANT_292', 'ANIMAL_031'],
    herb_doses: ['16g', '4g', '4g', '적량'],
    description: '최고 보약, 노화 방지'
  },
  {
    id: 'GO_002',
    type: 'go',
    type_label: '고(膏)',
    name: '장수·노화 방지',
    hanja: '益壽',
    formula: '익수고 益壽膏',
    herb_ids: ['PLANT_083', 'PLANT_290', 'PLANT_081', 'ANIMAL_031'],
    herb_doses: ['8g', '4g', '4g', '적량'],
    description: '장수, 노화 방지'
  },
  {
    id: 'GO_003',
    type: 'go',
    type_label: '고(膏)',
    name: '음기 보충·건조증',
    hanja: '陰虛燥證',
    formula: '자음고 滋陰膏',
    herb_ids: ['PLANT_083', 'PLANT_089', 'PLANT_081', 'ANIMAL_031'],
    herb_doses: ['8g', '4g', '4g', '적량'],
    description: '음기 보충, 건조증 개선'
  },
  {
    id: 'GO_004',
    type: 'go',
    type_label: '고(膏)',
    name: '폐 열증·만성 기침',
    hanja: '肺熱咳嗽',
    formula: '청폐고 淸肺膏',
    herb_ids: ['PLANT_089', 'PLANT_081', 'PLANT_022', 'PLANT_159', 'ANIMAL_031'],
    herb_doses: ['6g', '4g', '4g', '4g', '적량'],
    description: '폐 열증, 만성 기침 개선'
  },
  {
    id: 'GO_005',
    type: 'go',
    type_label: '고(膏)',
    name: '심신 안정·불면',
    hanja: '心神不安',
    formula: '복령고 茯笭膏',
    herb_ids: ['PLANT_292', 'PLANT_080', 'ANIMAL_031'],
    herb_doses: ['8g', '4g', '적량'],
    description: '심신 안정, 불면 개선'
  },
  {
    id: 'GO_006',
    type: 'go',
    type_label: '고(膏)',
    name: '음허 화왕·식은땀',
    hanja: '陰虛盜汗',
    formula: '귀판고 龜板膏',
    herb_ids: ['ANIMAL_170', 'PLANT_296', 'PLANT_158', 'ANIMAL_031'],
    herb_doses: ['8g', '4g', '4g', '적량'],
    description: '음허 화왕, 식은땀 개선'
  },
  {
    id: 'GO_007',
    type: 'go',
    type_label: '고(膏)',
    name: '근골 강화·관절통',
    hanja: '筋骨痠痛',
    formula: '오가피고 五加皮膏',
    herb_ids: ['PLANT_299', 'PLANT_086', 'PLANT_371', 'ANIMAL_031'],
    herb_doses: ['6g', '4g', '4g', '적량'],
    description: '근골 강화, 관절통 완화'
  },
  {
    id: 'GO_008',
    type: 'go',
    type_label: '고(膏)',
    name: '기 보충·상처 회복',
    hanja: '氣虛',
    formula: '황기고 黃芪膏',
    herb_ids: ['PLANT_112', 'PLANT_080', 'ANIMAL_031'],
    herb_doses: ['8g', '4g', '적량'],
    description: '기 보충, 상처 회복 촉진'
  },
  {
    id: 'GO_009',
    type: 'go',
    type_label: '고(膏)',
    name: '종기·피부 염증',
    hanja: '瘡癰',
    formula: '연교고 連翹膏',
    herb_ids: ['PLANT_256', 'PLANT_109', 'PLANT_219'],
    herb_doses: ['6g', '4g', '3g'],
    description: '종기, 피부 염증 개선'
  },
  {
    id: 'GO_010',
    type: 'go',
    type_label: '고(膏)',
    name: '화상·피부 염증',
    hanja: '燒傷',
    formula: '황련고 黃連膏',
    herb_ids: ['PLANT_109', 'PLANT_149', 'PLANT_083', 'PLANT_296'],
    herb_doses: ['4g', '4g', '4g', '4g'],
    description: '화상, 피부 염증 치료'
  },
  {
    id: 'GO_011',
    type: 'go',
    type_label: '고(膏)',
    name: '상처 치유·새살 촉진',
    hanja: '生肌',
    formula: '생기고 生肌膏',
    herb_ids: ['PLANT_149', 'PLANT_160', 'PLANT_166', 'ANIMAL_171'],
    herb_doses: ['4g', '3g', '3g', '적량'],
    description: '상처 치유, 새살 촉진'
  },
  {
    id: 'GO_012',
    type: 'go',
    type_label: '고(膏)',
    name: '피부 건조·습진',
    hanja: '皮膚燥癢',
    formula: '윤기고 潤肌膏',
    herb_ids: ['PLANT_166', 'PLANT_149', 'ANIMAL_171'],
    herb_doses: ['3g', '4g', '적량'],
    description: '피부 건조, 습진 개선'
  },
  {
    id: 'GO_013',
    type: 'go',
    type_label: '고(膏)',
    name: '종기·타박상·화농',
    hanja: '瘡瘍',
    formula: '태을고 太乙膏',
    herb_ids: ['PLANT_155', 'PLANT_160', 'PLANT_149', 'PLANT_287', 'PLANT_219', 'PLANT_152'],
    herb_doses: ['4g', '3g', '4g', '3g', '3g', '4g'],
    description: '종기, 타박상, 화농 치료'
  },
  {
    id: 'GO_014',
    type: 'go',
    type_label: '고(膏)',
    name: '악창·화농성 피부질환',
    hanja: '惡瘡',
    formula: '천금고 千金膏',
    herb_ids: ['MINERAL_049', 'PLANT_149', 'PLANT_083'],
    herb_doses: ['4g', '4g', '4g'],
    description: '악창, 화농성 피부질환 치료'
  },
  {
    id: 'GO_015',
    type: 'go',
    type_label: '고(膏)',
    name: '타박상·근육통·관절통',
    hanja: '跌打損傷',
    formula: '만응고 萬應膏',
    herb_ids: ['PLANT_338', 'PLANT_332', 'PLANT_309', 'PLANT_368'],
    herb_doses: ['4g', '3g', '3g', '3g'],
    description: '타박상, 근육통, 관절통 완화'
  },
  {
    id: 'GO_016',
    type: 'go',
    type_label: '고(膏)',
    name: '피부 독소·종창',
    hanja: '毒瘡',
    formula: '해독고 解毒膏',
    herb_ids: ['PLANT_109', 'PLANT_296', 'MINERAL_016', 'MINERAL_053'],
    herb_doses: ['4g', '4g', '2g', '1g'],
    description: '피부 독소, 종창 해소'
  },
  {
    id: 'GO_017',
    type: 'go',
    type_label: '고(膏)',
    name: '피부 열감·소양감',
    hanja: '皮膚熱癢',
    formula: '청량고 淸凉膏',
    herb_ids: ['PLANT_318', 'PLANT_069', 'PLANT_109'],
    herb_doses: ['1g', '3g', '4g'],
    description: '피부 열감, 소양감 완화'
  },
  {
    id: 'GO_018',
    type: 'go',
    type_label: '고(膏)',
    name: '골절·타박 통증',
    hanja: '骨折',
    formula: '신효고 神效膏',
    herb_ids: ['PLANT_309', 'PLANT_332', 'PLANT_368'],
    herb_doses: ['3g', '3g', '3g'],
    description: '골절, 타박 통증 완화'
  },
  {
    id: 'GO_019',
    type: 'go',
    type_label: '고(膏)',
    name: '비위 보강·허약 체질',
    hanja: '脾胃虛弱',
    formula: '팔선고 八仙膏',
    herb_ids: ['PLANT_080', 'PLANT_292', 'PLANT_374', 'PLANT_001', 'PLANT_095', 'PLANT_089', 'ANIMAL_031'],
    herb_doses: ['4g', '4g', '4g', '4g', '4g', '4g', '적량'],
    description: '비위 보강, 허약 체질 개선'
  },
  {
    id: 'GO_020',
    type: 'go',
    type_label: '고(膏)',
    name: '급성 피부 염증·부종',
    hanja: '皮膚腫痛',
    formula: '소독고 消毒膏',
    herb_ids: ['PLANT_219', 'PLANT_296', 'PLANT_317', 'PLANT_069'],
    herb_doses: ['4g', '4g', '4g', '3g'],
    description: '급성 피부 염증, 부종 완화'
  },

  // ═══════════════════════════════════════
  //  단 (丹) — 정제 환약 (광물·동물 약재 포함)
  // ═══════════════════════════════════════
  {
    id: 'DAN_001',
    type: 'dan',
    type_label: '단(丹)',
    name: '원기 극강 보충',
    hanja: '元氣大補',
    formula: '공진단 拱辰丹',
    herb_ids: ['ANIMAL_169', 'ANIMAL_134', 'PLANT_149', 'PLANT_370'],
    herb_doses: ['1g', '6g', '4g', '4g'],
    description: '원기 극강 보충, 최고 보약'
  },
  {
    id: 'DAN_002',
    type: 'dan',
    type_label: '단(丹)',
    name: '중풍·심신 불안·고혈압',
    hanja: '中風',
    formula: '우황청심단 牛黃淸心丹',
    herb_ids: ['ANIMAL_147', 'ANIMAL_169', 'PLANT_080', 'PLANT_095'],
    herb_doses: ['1g', '0.5g', '4g', '4g'],
    description: '중풍, 심신 불안, 고혈압 개선'
  },
  {
    id: 'DAN_003',
    type: 'dan',
    type_label: '단(丹)',
    name: '졸도·기절 응급',
    hanja: '厥證',
    formula: '소합향단 蘇合香丹',
    herb_ids: ['PLANT_314', 'ANIMAL_169', 'PLANT_333', 'PLANT_307'],
    herb_doses: ['2g', '0.5g', '2g', '2g'],
    description: '졸도, 기절 응급 처치'
  },
  {
    id: 'DAN_004',
    type: 'dan',
    type_label: '단(丹)',
    name: '심화 불면·두근거림',
    hanja: '心火不眠',
    formula: '주사안신단 朱砂安神丹',
    herb_ids: ['MINERAL_005', 'PLANT_109', 'PLANT_083', 'PLANT_149', 'PLANT_082'],
    herb_doses: ['1g', '4g', '6g', '4g', '2g'],
    description: '심화 불면, 두근거림 완화'
  },
  {
    id: 'DAN_005',
    type: 'dan',
    type_label: '단(丹)',
    name: '고열·경련·의식 혼미',
    hanja: '高熱驚厥',
    formula: '자설단 紫雪丹',
    herb_ids: ['MINERAL_017', 'MINERAL_020', 'MINERAL_012', 'MINERAL_018', 'ANIMAL_139', 'ANIMAL_169'],
    herb_doses: ['8g', '4g', '4g', '4g', '2g', '0.3g'],
    description: '고열, 경련, 신지 혼미 개선'
  },
  {
    id: 'DAN_006',
    type: 'dan',
    type_label: '단(丹)',
    name: '열병 혼수·중풍',
    hanja: '熱病昏迷',
    formula: '지보단 至寶丹',
    herb_ids: ['ANIMAL_147', 'ANIMAL_169', 'PLANT_318', 'PLANT_333', 'MINERAL_005', 'PLANT_293'],
    herb_doses: ['1g', '0.5g', '1g', '2g', '1g', '2g'],
    description: '열병 혼수, 중풍 응급'
  },
  {
    id: 'DAN_007',
    type: 'dan',
    type_label: '단(丹)',
    name: '고열 혼수·뇌졸중',
    hanja: '高熱昏迷',
    formula: '안궁우황단 安宮牛黃丹',
    herb_ids: ['ANIMAL_147', 'ANIMAL_169', 'PLANT_109', 'PLANT_162', 'PLANT_317', 'PLANT_318'],
    herb_doses: ['1g', '0.5g', '4g', '4g', '4g', '1g'],
    description: '고열 혼수, 뇌졸중 응급'
  },
  {
    id: 'DAN_008',
    type: 'dan',
    type_label: '단(丹)',
    name: '냉기·복통·구토',
    hanja: '寒氣腹痛',
    formula: '정기단 正氣丹',
    herb_ids: ['ANIMAL_169', 'PLANT_094', 'PLANT_307', 'PLANT_287', 'PLANT_305'],
    herb_doses: ['0.5g', '3g', '3g', '3g', '3g'],
    description: '냉기, 복통, 구토 개선'
  },
  {
    id: 'DAN_009',
    type: 'dan',
    type_label: '단(丹)',
    name: '심신 허약·몽정·건망',
    hanja: '心腎虛損',
    formula: '묘향단 妙香丹',
    herb_ids: ['ANIMAL_169', 'PLANT_095', 'PLANT_080', 'PLANT_292', 'PLANT_112', 'PLANT_097'],
    herb_doses: ['0.5g', '4g', '4g', '4g', '4g', '3g'],
    description: '심신 허약, 몽정, 건망 개선'
  },
  {
    id: 'DAN_010',
    type: 'dan',
    type_label: '단(丹)',
    name: '경기·열성 경련',
    hanja: '驚風',
    formula: '진주단 眞珠丹',
    herb_ids: ['MINERAL_004', 'ANIMAL_147', 'ANIMAL_169', 'PLANT_318'],
    herb_doses: ['2g', '1g', '0.3g', '1g'],
    description: '경기, 열성 경련 완화'
  },
  {
    id: 'DAN_011',
    type: 'dan',
    type_label: '단(丹)',
    name: '심신 불안·공황',
    hanja: '心悸恐慌',
    formula: '금박진심단 金箔鎭心丹',
    herb_ids: ['MINERAL_045', 'MINERAL_005', 'ANIMAL_147', 'ANIMAL_169', 'PLANT_080'],
    herb_doses: ['적량', '1g', '1g', '0.3g', '4g'],
    description: '심신 불안, 공황 진정'
  },
  {
    id: 'DAN_012',
    type: 'dan',
    type_label: '단(丹)',
    name: '신양 허약·불임·유정',
    hanja: '腎陽虛',
    formula: '반룡단 盤龍丹',
    herb_ids: ['ANIMAL_134', 'PLANT_085', 'PLANT_200', 'PLANT_101', 'PLANT_116'],
    herb_doses: ['6g', '4g', '4g', '4g', '4g'],
    description: '신양 허약, 불임, 유정 개선'
  },
  {
    id: 'DAN_013',
    type: 'dan',
    type_label: '단(丹)',
    name: '냉적·만성 복통',
    hanja: '冷積',
    formula: '태을단 太乙丹',
    herb_ids: ['MINERAL_016', 'PLANT_037', 'PLANT_287'],
    herb_doses: ['3g', '3g', '3g'],
    description: '냉적, 만성 복통 개선'
  },
  {
    id: 'DAN_014',
    type: 'dan',
    type_label: '단(丹)',
    name: '노화 방지·장수',
    hanja: '延壽',
    formula: '연수단 延壽丹',
    herb_ids: ['PLANT_249', 'PLANT_292', 'PLANT_086', 'PLANT_085', 'PLANT_290'],
    herb_doses: ['6g', '4g', '4g', '4g', '4g'],
    description: '노화 방지, 장수 촉진'
  },
  {
    id: 'DAN_015',
    type: 'dan',
    type_label: '단(丹)',
    name: '심신 안정·불안',
    hanja: '心神不安',
    formula: '영사단 靈砂丹',
    herb_ids: ['MINERAL_005', 'MINERAL_018'],
    herb_doses: ['2g', '3g'],
    description: '심신 안정, 불안 완화'
  },
  {
    id: 'DAN_016',
    type: 'dan',
    type_label: '단(丹)',
    name: '기절·코막힘·의식 회복',
    hanja: '閉證',
    formula: '통관단 通關丹',
    herb_ids: ['PLANT_342', 'PLANT_099', 'PLANT_069', 'PLANT_318'],
    herb_doses: ['3g', '2g', '3g', '1g'],
    description: '기절, 코막힘, 의식 회복'
  },
  {
    id: 'DAN_017',
    type: 'dan',
    type_label: '단(丹)',
    name: '소아 급성 천식',
    hanja: '小兒喘息',
    formula: '오호단 五虎丹',
    herb_ids: ['PLANT_150', 'MINERAL_017', 'PLANT_022', 'PLANT_082'],
    herb_doses: ['4g', '6g', '4g', '2g'],
    description: '소아 급성 천식 완화'
  },
  {
    id: 'DAN_018',
    type: 'dan',
    type_label: '단(丹)',
    name: '불면·심계항진',
    hanja: '不眠心悸',
    formula: '경면주사단 鏡面朱砂丹',
    herb_ids: ['MINERAL_005', 'PLANT_292', 'PLANT_080', 'PLANT_295'],
    herb_doses: ['1g', '4g', '4g', '3g'],
    description: '불면, 심계항진 개선'
  },
  {
    id: 'DAN_019',
    type: 'dan',
    type_label: '단(丹)',
    name: '유산 방지·안태',
    hanja: '胎動不安',
    formula: '보태단 保胎丹',
    herb_ids: ['PLANT_149', 'PLANT_108', 'PLANT_152', 'PLANT_202', 'PLANT_162', 'PLANT_371'],
    herb_doses: ['4g', '4g', '4g', '3g', '4g', '4g'],
    description: '유산 방지, 안태 도움'
  },
  {
    id: 'DAN_020',
    type: 'dan',
    type_label: '단(丹)',
    name: '만병 통치·원기 회복',
    hanja: '萬病回春',
    formula: '만병회춘단 萬病回春丹',
    herb_ids: ['ANIMAL_147', 'ANIMAL_169', 'MINERAL_005', 'MINERAL_011'],
    herb_doses: ['1g', '0.5g', '1g', '1g'],
    description: '만병 통치, 원기 회복'
  }
];
