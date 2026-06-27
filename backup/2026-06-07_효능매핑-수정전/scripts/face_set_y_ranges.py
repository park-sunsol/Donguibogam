"""
각 face set ID의 Y축 범위(정규화) 출력
→ 사용자가 face set 시각적 위치 파악 가능
"""
import bpy

TARGET = "GEO-body_male_realistic"
obj = bpy.data.objects.get(TARGET)
me  = obj.data
fs  = me.attributes[".sculpt_face_set"]
verts = me.vertices

# face set별 버텍스 Y 좌표 수집
fset_ys = {}
for poly in me.polygons:
    fid = fs.data[poly.index].value
    for vi in poly.vertices:
        fset_ys.setdefault(fid, []).append(verts[vi].co.y)

# 전체 Y 범위
all_y = [v.co.y for v in verts]
ymin, ymax = min(all_y), max(all_y)

def norm(y): return (y - ymin) / (ymax - ymin)

print("\nface_set_id  y_min_norm  y_max_norm  y_center_norm")
rows = []
for fid, ys in fset_ys.items():
    lo, hi = min(ys), max(ys)
    rows.append((fid, norm(lo), norm(hi), norm((lo+hi)/2)))

rows.sort(key=lambda r: r[3], reverse=True)  # 위에서 아래로
for fid, lo, hi, ctr in rows:
    print(f"  {fid:4d}   {lo:6.3f}     {hi:6.3f}     {ctr:6.3f}")
