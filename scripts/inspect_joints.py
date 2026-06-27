"""
face set 18(신장·생식)·19(복부) 폴리곤 분포 분석.
관절 경계로 의심되는 폴리곤(몸통 중심에서 멀리 떨어진 것)을 식별한다.
"""
import bpy, math, os

BLEND = os.path.normpath(os.path.join(os.path.dirname(__file__), "..",
    "asset", "prescription", "human-base-meshes-bundle", "human_base_meshes.blend"))
bpy.ops.wm.open_mainfile(filepath=BLEND)

TARGETS = ["GEO-body_male_realistic", "GEO-body_female_realistic"]
SUSPECT_FSETS = [18, 19]  # 신장, 복부

for tname in TARGETS:
    obj = bpy.data.objects.get(tname)
    if not obj:
        print(f"[SKIP] {tname}")
        continue
    me = obj.data
    fs = me.attributes.get(".sculpt_face_set")
    if not fs:
        print(f"[SKIP no fset] {tname}")
        continue
    verts = me.vertices

    # 모델 전체 범위 (z=높이 가정)
    all_z = [v.co.z for v in verts]
    all_x = [v.co.x for v in verts]
    all_y = [v.co.y for v in verts]
    zmin, zmax = min(all_z), max(all_z)
    xmax = max(abs(x) for x in all_x)
    ymax = max(abs(y) for y in all_y)

    print(f"\n=== {tname} ===")
    print(f"z범위 {zmin:.3f}~{zmax:.3f}  |x|max {xmax:.3f}  |y|max {ymax:.3f}")

    for fid in SUSPECT_FSETS:
        polys = [p for p in me.polygons if fs.data[p.index].value == fid]
        if not polys:
            print(f"  fset {fid}: (없음)")
            continue

        # 각 폴리곤의 중심 좌표 계산
        rows = []
        for p in polys:
            cx = sum(verts[vi].co.x for vi in p.vertices) / len(p.vertices)
            cy = sum(verts[vi].co.y for vi in p.vertices) / len(p.vertices)
            cz = sum(verts[vi].co.z for vi in p.vertices) / len(p.vertices)
            xy_radius = math.sqrt(cx*cx + cy*cy)  # 척추 중심선에서의 수평거리
            rows.append((p.index, cx, cy, cz, xy_radius))

        z_vals = [r[3] for r in rows]
        r_vals = [r[4] for r in rows]
        print(f"  fset {fid}: {len(polys)}개 폴리곤")
        print(f"    z: {min(z_vals):.3f}~{max(z_vals):.3f}  xy_radius: {min(r_vals):.3f}~{max(r_vals):.3f}")

        # 외곽(관절 의심) 폴리곤: xy_radius 상위 15%
        rows.sort(key=lambda r: r[4], reverse=True)
        threshold = sorted(r_vals)[int(len(r_vals) * 0.85)]
        outer = [r for r in rows if r[4] >= threshold]
        print(f"    외곽 의심(xy_radius ≥ {threshold:.3f}): {len(outer)}개")
        # 상위 10개 샘플 출력
        for r in outer[:10]:
            print(f"      poly#{r[0]}  x={r[1]:+.3f} y={r[2]:+.3f} z={r[3]:.3f} r={r[4]:.3f}")
