"""여성 모델 한정 — face set 20·21(팔)의 앞쪽 가슴 상단 표면을 face set 1(흉부)로 이동.

배경: bake_final.py에서 fs=20/21이 PID 2(팔)에 매핑되어 있으나
여성 메시는 fs=20/21에 가슴 상단(cy -0.135까지 앞쪽 돌출, cz 1.05~1.20) 표면이 포함됨.
expand_chest_region.py가 cylindrical radius xy<0.22로 흡수했지만 측면 둘레가 남았고,
trim_chest_female.py가 일부를 다시 되돌리면서 가슴 위쪽 둘레가 fs=20/21에 잔류.
결과: 팔 클릭 시 유두/가슴 위쪽이 갈색으로 표시되는 문제.

이 스크립트는 fs=20/21 폴리곤 중 앞쪽(cy<0.02) + 가슴 높이(1.05<cz<1.20) +
|x|<0.27 영역을 흉부(fs=1)로 이동. 어깨 캡(cz>1.20)·후방(cy>0.02)·외측(|x|>0.27)은 유지.
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

moved_20 = moved_21 = 0
for poly in me.polygons:
    fid = fs.data[poly.index].value
    if fid not in (20, 21): continue
    cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    if (1.05 < cz < 1.20) and (cy < 0.02) and (abs(cx) < 0.27):
        fs.data[poly.index].value = 1
        if fid == 20: moved_20 += 1
        else: moved_21 += 1

print(f"[OK] 추가 이동: 20→1 {moved_20}, 21→1 {moved_21}")
bpy.ops.wm.save_mainfile(filepath=BLEND)
print(f"[DONE] 저장: {BLEND}")
