"""
여성 모델 한정 — face set 20·21의 쇄골 라인 안쪽(XY<0.18) 폴리곤을 face set 1(흉부)로 이동.

배경: 이전 expand_chest_region.py는 Z<1.30 조건으로만 face set 20·21을 흉부로
흡수했기 때문에 Z 1.30~1.36 영역(쇄골 라인)의 폴리곤이 처리되지 않았다.
여성 모델에서 그 영역의 XY<0.18 폴리곤이 가슴 안쪽까지 닿아 흉부 영역
가운데 작은 사각형으로 잘못 보임.
"""
import bpy, math, os

BLEND = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "asset", "prescription",
    "human-base-meshes-bundle", "human_base_meshes.blend"))

bpy.ops.wm.open_mainfile(filepath=BLEND)

obj = bpy.data.objects.get("GEO-body_female_realistic")
if not obj:
    print("[ERR] 여성 모델 없음"); raise SystemExit(1)
me = obj.data
fs = me.attributes.get(".sculpt_face_set")
if not fs:
    print("[ERR] face set 없음"); raise SystemExit(1)
verts = me.vertices

moved_20 = moved_21 = 0
for poly in me.polygons:
    fid = fs.data[poly.index].value
    if fid not in (20, 21): continue
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    xy = math.sqrt(cx**2 + cy**2)
    if xy < 0.18:
        fs.data[poly.index].value = 1
        if fid == 20: moved_20 += 1
        else: moved_21 += 1

print(f"[OK] 여성: 20→1 {moved_20}, 21→1 {moved_21}")

bpy.ops.wm.save_mainfile(filepath=BLEND)
print(f"[DONE] 저장: {BLEND}")
