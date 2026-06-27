"""여성 모델 가슴 앞면(cy<0.05) 영역의 모든 face set 분포 진단"""
import bpy, math, os
from collections import Counter, defaultdict
BLEND = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "asset", "prescription", "human-base-meshes-bundle", "human_base_meshes.blend"))
bpy.ops.wm.open_mainfile(filepath=BLEND)
obj = bpy.data.objects.get("GEO-body_female_realistic")
me = obj.data
fs = me.attributes.get(".sculpt_face_set")
verts = me.vertices

# 가슴 앞쪽 영역 (Z 0.95~1.20, cy<0.10, |x|<0.35)
buckets = defaultdict(list)  # fid -> list
for poly in me.polygons:
    cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    if not (0.95 < cz < 1.20 and cy < 0.10 and abs(cx) < 0.35): continue
    fid = fs.data[poly.index].value
    buckets[fid].append((cx, cy, cz))

print("\n[가슴 앞면 face set 분포]")
for fid in sorted(buckets):
    rows = buckets[fid]
    xs = [r[0] for r in rows]; ys = [r[1] for r in rows]; zs = [r[2] for r in rows]
    print(f"  fs={fid:3d}: {len(rows):4d} polys | x[{min(xs):+.3f},{max(xs):+.3f}] y[{min(ys):+.3f},{max(ys):+.3f}] z[{min(zs):.3f},{max(zs):.3f}]")

# 유두 추정 위치 — 여성 가슴 돌출 부위(cy 가장 음수 = 가장 앞쪽)
print("\n[가장 앞쪽(cy 최소) 폴리곤 — 유두/가슴 표면 후보]")
all_front = []
for poly in me.polygons:
    cz = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
    cx = sum(verts[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    cy = sum(verts[vi].co.y for vi in poly.vertices) / len(poly.vertices)
    if 1.00 < cz < 1.20 and abs(cx) < 0.25 and cy < -0.10:
        fid = fs.data[poly.index].value
        all_front.append((fid, cx, cy, cz, poly.index))
all_front.sort(key=lambda r: r[2])  # 가장 음수(가장 앞)부터
print("fid  cx       cy       cz       pidx")
for r in all_front[:40]:
    print(f"{r[0]:3d}  {r[1]:+.4f}  {r[2]:+.4f}  {r[3]:.4f}  {r[4]}")
