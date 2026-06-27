"""
face set 1을 Z=1.18 기준으로 분할.
- Z중심 > 1.18 폴리곤(얼굴/입/턱) → 새 face set ID 200 (머리로 매핑 예정)
- Z중심 ≤ 1.18 폴리곤(목/명치) → face set 1 유지 (흉부로 매핑 예정)

남·여 두 모델 모두에 적용 후 저장.

배경: face set 1은 얼굴(눈코입턱) + 목 + 명치 영역을 하나로 묶어
'흉부' PID에 매핑되었기 때문에, 흉부 클릭 시 입·턱까지 함께 하이라이트됨.
얼굴 영역만 분리해서 머리 PID로 옮긴다.
"""
import bpy, os

BLEND_PATH = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "asset", "prescription",
    "human-base-meshes-bundle", "human_base_meshes.blend"))

Z_THRESHOLD = 1.18
NEW_FS_ID = 200

bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

for obj_name in ["GEO-body_male_realistic", "GEO-body_female_realistic"]:
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        print(f"[SKIP] {obj_name} 없음")
        continue

    me = obj.data
    fs = me.attributes.get(".sculpt_face_set")
    if not fs:
        print(f"[SKIP] {obj_name}: face set 없음")
        continue

    verts = me.vertices
    moved = 0
    kept = 0
    for poly in me.polygons:
        if fs.data[poly.index].value != 1:
            continue
        # 폴리곤 중심 Z
        cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
        if cz > Z_THRESHOLD:
            fs.data[poly.index].value = NEW_FS_ID
            moved += 1
        else:
            kept += 1

    print(f"[OK] {obj_name}: face set 1 → 200 이동 {moved}개 / 유지 {kept}개")

bpy.ops.wm.save_mainfile(filepath=BLEND_PATH)
print(f"[DONE] 저장: {BLEND_PATH}")
