"""
여성 모델 한정 — face set 11·12(현재 팔)의 가슴 침범 폴리곤을 face set 1(흉부)로 이동.

배경: 여성 메시는 face set 11·12(원래 어깨~팔 시작)의 Z 1.02~1.05 부분이
가슴 옆(유두 부근)까지 살짝 침범해 있음. XY 0.21 부근이라 expand_chest_region.py의
XY<0.22 조건 안에 들어가지만, face set 11·12는 expand 대상이 아니어서 그대로 팔에 남음.
결과적으로 가슴 영역에 팔 매핑 사각형 16개가 보이는 문제.
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

moved_11 = moved_12 = 0
for poly in me.polygons:
    fid = fs.data[poly.index].value
    if fid not in (11, 12): continue
    cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    xy = math.sqrt(cx**2 + cy**2)
    if cz > 1.00 and xy < 0.22:
        fs.data[poly.index].value = 1
        if fid == 11: moved_11 += 1
        else: moved_12 += 1

print(f"[OK] 여성: 11→1 {moved_11}, 12→1 {moved_12}")

bpy.ops.wm.save_mainfile(filepath=BLEND)
print(f"[DONE] 저장: {BLEND}")
