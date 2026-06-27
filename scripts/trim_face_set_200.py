"""
face set 200(머리 상부) 폴리곤 중 어깨/가슴 안쪽까지 닿는 부분을
face set 1(흉부)로 되돌린다.

조건: Z중심 < 1.30 AND XY중심 > 0.15
- Z>=1.30 폴리곤(얼굴 위쪽)은 그대로 머리에 유지
- Z<1.30 + XY<=0.15 폴리곤(목·얼굴 정중앙)은 그대로 머리에 유지
- Z<1.30 + XY>0.15 폴리곤(어깨/가슴 안쪽)만 흉부로 이동
"""
import bpy, math, os

BLEND_PATH = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "asset", "prescription",
    "human-base-meshes-bundle", "human_base_meshes.blend"))

Z_MAX = 1.30
XY_MIN = 0.15

bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

for obj_name in ["GEO-body_male_realistic", "GEO-body_female_realistic"]:
    obj = bpy.data.objects.get(obj_name)
    if not obj: continue
    me = obj.data
    fs = me.attributes.get(".sculpt_face_set")
    if not fs: continue
    verts = me.vertices

    moved = 0
    kept = 0
    for poly in me.polygons:
        if fs.data[poly.index].value != 200: continue
        cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
        cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
        cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
        xy = math.sqrt(cx**2 + cy**2)
        if cz < Z_MAX and xy > XY_MIN:
            fs.data[poly.index].value = 1
            moved += 1
        else:
            kept += 1

    print(f"[OK] {obj_name}: 200→1 이동 {moved}개 / 머리 유지 {kept}개")

bpy.ops.wm.save_mainfile(filepath=BLEND_PATH)
print(f"[DONE] 저장: {BLEND_PATH}")
