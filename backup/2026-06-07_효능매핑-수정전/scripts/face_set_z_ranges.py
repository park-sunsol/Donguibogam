"""
각 face set ID의 Z축(높이) 범위(정규화) 출력 + XZ 방사거리로 팔 판별
"""
import bpy, math

TARGET = "GEO-body_male_realistic"
obj = bpy.data.objects.get(TARGET)
me  = obj.data
fs  = me.attributes[".sculpt_face_set"]
verts = me.vertices

fset_data = {}   # fid → {z:[], xz:[]}
for poly in me.polygons:
    fid = fs.data[poly.index].value
    d = fset_data.setdefault(fid, {'z': [], 'xz': []})
    for vi in poly.vertices:
        co = verts[vi].co
        d['z'].append(co.z)
        d['xz'].append(math.sqrt(co.x**2 + co.y**2))  # radial distance from Z-axis

all_z = [v.co.z for v in verts]
zmin, zmx = min(all_z), max(all_z)
def norm(z): return (z - zmin) / (zmx - zmin)

print("\nface_set_id  z_lo  z_hi  z_ctr  xz_max  xz_mean")
rows = []
for fid, d in fset_data.items():
    lo, hi = min(d['z']), max(d['z'])
    ctr  = (lo + hi) / 2
    xzm  = max(d['xz'])
    xzmn = sum(d['xz']) / len(d['xz'])
    rows.append((fid, norm(lo), norm(hi), norm(ctr), xzm, xzmn))

rows.sort(key=lambda r: r[3], reverse=True)
for fid, lo, hi, ctr, xzm, xzmn in rows:
    print(f"  {fid:4d}   {lo:.3f} {hi:.3f} {ctr:.3f}  xz={xzm:.3f}  xzmn={xzmn:.3f}")
