"""ID 1의 Z/X/Y 좌표 분포 확인 → 눈·코·입 분리 가능 여부 판단"""
import bpy, math

obj = bpy.data.objects.get("GEO-body_male_realistic")
me  = obj.data
fs  = me.attributes[".sculpt_face_set"]
verts = me.vertices

zs, xs, ys = [], [], []
for poly in me.polygons:
    if fs.data[poly.index].value != 1: continue
    for vi in poly.vertices:
        co = verts[vi].co
        zs.append(co.z); xs.append(co.x); ys.append(co.y)

print(f"ID 1 vertex 수: {len(set())}")
print(f"Z범위: {min(zs):.3f} ~ {max(zs):.3f}  (높이차 {max(zs)-min(zs):.3f}m)")
print(f"X범위: {min(xs):.3f} ~ {max(xs):.3f}")
print(f"Y범위: {min(ys):.3f} ~ {max(ys):.3f}")
print(f"폴리곤 수: {sum(1 for p in me.polygons if fs.data[p.index].value==1)}")

# Z 구간별 폴리곤 분포 (눈·코·입 영역 분리 가능한지 확인)
zmin_id1, zmax_id1 = min(zs), max(zs)
buckets = {i: 0 for i in range(10)}
for poly in me.polygons:
    if fs.data[poly.index].value != 1: continue
    avg_z = sum(verts[vi].co.z for vi in poly.vertices) / len(poly.vertices)
    bucket = int((avg_z - zmin_id1) / (zmax_id1 - zmin_id1) * 9.99)
    buckets[bucket] += 1

print("\nZ 구간별 폴리곤 분포 (아래→위):")
for i, cnt in sorted(buckets.items()):
    bar = '█' * (cnt // 2)
    z_lo = zmin_id1 + i*(zmax_id1-zmin_id1)/10
    z_hi = z_lo + (zmax_id1-zmin_id1)/10
    print(f"  {z_lo:.3f}-{z_hi:.3f}: {cnt:3d}  {bar}")
