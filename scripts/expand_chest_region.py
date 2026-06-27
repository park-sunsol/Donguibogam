"""
사용자가 빨간선으로 표시한 흉부 영역으로 face set을 확장.

조건:
- face set 200(머리 정중앙 띠) 중 Z<1.30 폴리곤 → face set 1(흉부)
  · 가슴 위쪽 정중앙 부분. Z>=1.30은 머리·얼굴에 유지.
- face set 20·21(어깨/가슴 옆 띠) 중 Z<1.30 AND XY<0.22 폴리곤 → face set 1
  · 가슴 좌·우 안쪽. XY>=0.22는 어깨/팔에 유지.
- face set 19(복부)는 그대로 유지 (명치 아래는 복부).

배경: 빨간선 영역 = Z 1.00~1.35, XY<0.25 (가슴 전체). 사용자 첨부1 지침("머리는
목까지만, 목 아래 가슴은 흉부, 어깨는 팔")과 일치.
"""
import bpy, math, os

BLEND = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "asset", "prescription",
    "human-base-meshes-bundle", "human_base_meshes.blend"))

Z_MAX = 1.30          # 쇄골 라인 (빨간선 위쪽 경계)
XY_MAX_20_21 = 0.22   # 어깨 안쪽 (빨간선 좌·우 경계)

bpy.ops.wm.open_mainfile(filepath=BLEND)

for obj_name in ["GEO-body_male_realistic", "GEO-body_female_realistic"]:
    obj = bpy.data.objects.get(obj_name)
    if not obj: continue
    me = obj.data
    fs = me.attributes.get(".sculpt_face_set")
    if not fs: continue
    verts = me.vertices

    moved_200 = 0
    moved_20 = 0
    moved_21 = 0

    for poly in me.polygons:
        fid = fs.data[poly.index].value
        if fid not in (200, 20, 21): continue
        cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
        cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
        cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
        xy = math.sqrt(cx**2 + cy**2)

        if fid == 200 and cz < Z_MAX:
            fs.data[poly.index].value = 1
            moved_200 += 1
        elif fid in (20, 21) and cz < Z_MAX and xy < XY_MAX_20_21:
            fs.data[poly.index].value = 1
            if fid == 20: moved_20 += 1
            else: moved_21 += 1

    print(f"[OK] {obj_name}: 200→1 {moved_200}, 20→1 {moved_20}, 21→1 {moved_21}")

bpy.ops.wm.save_mainfile(filepath=BLEND)
print(f"[DONE] 저장: {BLEND}")
