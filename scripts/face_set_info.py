"""
사용 중인 face set ID의 해부학적 위치 출력
"""
import bpy, math

TARGET = "GEO-body_male_realistic"
USED_IDS = [1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]

obj = bpy.data.objects.get(TARGET)
me  = obj.data
fs  = me.attributes[".sculpt_face_set"]
verts = me.vertices

fset_data = {}
for poly in me.polygons:
    fid = fs.data[poly.index].value
    if fid not in USED_IDS: continue
    d = fset_data.setdefault(fid, {'z':[], 'x':[], 'y':[]})
    for vi in poly.vertices:
        co = verts[vi].co
        d['z'].append(co.z)
        d['x'].append(co.x)
        d['y'].append(co.y)

all_z = [v.co.z for v in verts]
zmin, zmx = min(all_z), max(all_z)
total_h = zmx - zmin

print(f"\n모델 전체 높이: {total_h:.3f}m  (z {zmin:.3f} ~ {zmx:.3f})")
print(f"\n{'ID':>4}  {'중심Z':>6}  {'높이%':>6}  {'XZ반경':>7}  추정 부위")
print("-" * 55)

rows = []
for fid, d in fset_data.items():
    cz   = sum(d['z'])/len(d['z'])
    cx   = sum(d['x'])/len(d['x'])
    cy   = sum(d['y'])/len(d['y'])
    xzr  = math.sqrt(cx**2 + cy**2)
    pct  = (cz - zmin) / total_h * 100
    rows.append((fid, cz, pct, xzr))

rows.sort(key=lambda r: r[2], reverse=True)
for fid, cz, pct, xzr in rows:
    # 부위 추정
    if pct > 85:        region = "머리 상단 (두개골/이마)"
    elif pct > 75:      region = "머리 (얼굴/눈/코)"
    elif pct > 65:      region = "머리 하단 (턱/귀)"
    elif pct > 58:      region = "목"
    elif xzr > 0.28:    region = "팔 (어깨~손목)"
    elif pct > 50:      region = "흉부 상단"
    elif pct > 42:      region = "흉부 하단 / 복부"
    elif pct > 30:      region = "하복부 / 골반"
    elif pct > 18:      region = "허벅지 상단"
    elif pct > 8:       region = "허벅지 하단 / 종아리"
    else:               region = "발목 / 발"
    print(f"  {fid:>3}   {cz:>6.3f}   {pct:>5.1f}%   {xzr:>6.3f}   {region}")
