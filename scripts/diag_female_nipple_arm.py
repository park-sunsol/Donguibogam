"""여성 모델 face set 11·12 중 가슴/유두 영역(앞쪽 흉곽)에 남은 폴리곤 진단"""
import bpy, math, os
BLEND = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "asset", "prescription", "human-base-meshes-bundle", "human_base_meshes.blend"))
bpy.ops.wm.open_mainfile(filepath=BLEND)
obj = bpy.data.objects.get("GEO-body_female_realistic")
me = obj.data
fs = me.attributes.get(".sculpt_face_set")
verts = me.vertices

candidates = []
for poly in me.polygons:
    fid = fs.data[poly.index].value
    if fid not in (11, 12): continue
    cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    xy = math.sqrt(cx**2 + cy**2)
    # 흉부 영역 후보: Z 0.95~1.30 (가슴 높이), 앞쪽(Y<0), XY<0.30
    if 0.95 < cz < 1.32 and cy < 0.05 and xy < 0.32:
        candidates.append((fid, cx, cy, cz, xy, poly.index))

candidates.sort(key=lambda r: (r[0], -r[3]))
print(f"[total candidates] {len(candidates)}")
print("fid  cx       cy       cz       xy       pidx")
for r in candidates:
    print(f"{r[0]:3d}  {r[1]:+.4f}  {r[2]:+.4f}  {r[3]:.4f}  {r[4]:.4f}  {r[5]}")

# Z 분포 요약
from collections import Counter
zbin = Counter(round(r[3],2) for r in candidates)
print("\n[Z 분포]")
for z in sorted(zbin): print(f"  z={z}: {zbin[z]} polys")

xbin = Counter(round(abs(r[1]),2) for r in candidates)
print("\n[|X| 분포]")
for x in sorted(xbin): print(f"  |x|={x}: {xbin[x]} polys")
