"""
여성 모델 한정 — face set 1(흉부)의 어깨/상완 침범 폴리곤을 face set 20/21로 되돌림.

배경: 여성 메시는 어깨 폭이 남성보다 좁아서 expand_chest_region.py의 XY<0.22 조건이
너무 넓게 잡혔다. face set 20/21의 XY 0.18~0.22 부분(어깨 외측)이 흉부로 잘못 편입됨.

조건: face set 1 폴리곤 중 XY≥0.18인 폴리곤을 X 부호에 따라 face set 20(X<0)
또는 face set 21(X>0)로 되돌림.
"""
import bpy, math, os

BLEND = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "asset", "prescription",
    "human-base-meshes-bundle", "human_base_meshes.blend"))

XY_MIN_REVERT = 0.18

bpy.ops.wm.open_mainfile(filepath=BLEND)

obj = bpy.data.objects.get("GEO-body_female_realistic")
if not obj:
    print("[ERR] 여성 모델 없음"); raise SystemExit(1)
me = obj.data
fs = me.attributes.get(".sculpt_face_set")
if not fs:
    print("[ERR] face set 없음"); raise SystemExit(1)
verts = me.vertices

moved_left = 0   # face set 20 (X<0)
moved_right = 0  # face set 21 (X>0)

for poly in me.polygons:
    if fs.data[poly.index].value != 1: continue
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    xy = math.sqrt(cx**2 + cy**2)
    if xy >= XY_MIN_REVERT:
        if cx < 0:
            fs.data[poly.index].value = 20
            moved_left += 1
        else:
            fs.data[poly.index].value = 21
            moved_right += 1

print(f"[OK] 여성: 1→20(X<0) {moved_left}, 1→21(X>0) {moved_right}")

bpy.ops.wm.save_mainfile(filepath=BLEND)
print(f"[DONE] 저장: {BLEND}")
