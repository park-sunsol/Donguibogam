"""여성 모델 한정 — face set 11·12(팔)의 앞쪽 가슴/유두 측면 영역을 face set 1(흉부)로 이동.

이전 fix_female_chest_holes.py는 xy<0.22, cz>1.00 조건이라
유두 옆 측면 가슴(xy 0.22~0.27, cz 0.95~1.10) 폴리곤이 그대로 팔에 남음.
앞면(cy<0.02)에 한해 cz 0.95~1.15, xy<0.27 영역을 추가로 흉부에 흡수한다.
"""
import bpy, math, os
BLEND = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "asset", "prescription", "human-base-meshes-bundle", "human_base_meshes.blend"))
bpy.ops.wm.open_mainfile(filepath=BLEND)

obj = bpy.data.objects.get("GEO-body_female_realistic")
if not obj: raise SystemExit("[ERR] 여성 모델 없음")
me = obj.data
fs = me.attributes.get(".sculpt_face_set")
if not fs: raise SystemExit("[ERR] face set 없음")
verts = me.vertices

moved_11 = moved_12 = 0
for poly in me.polygons:
    fid = fs.data[poly.index].value
    if fid not in (11, 12): continue
    cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    xy = math.sqrt(cx*cx + cy*cy)
    # 앞쪽(cy<0.02) + 가슴 높이 + 측면 가슴까지
    if (0.95 < cz < 1.15) and (cy < 0.02) and (xy < 0.27):
        fs.data[poly.index].value = 1
        if fid == 11: moved_11 += 1
        else: moved_12 += 1

print(f"[OK] 추가 이동: 11→1 {moved_11}, 12→1 {moved_12}")
bpy.ops.wm.save_mainfile(filepath=BLEND)
print(f"[DONE] 저장: {BLEND}")
