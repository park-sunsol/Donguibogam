"""
face set 18(신장)·19(복부)의 관절 경계 폴리곤을 인접한 팔/다리 face set으로 재할당.

전략:
- 각 의심 폴리곤에 대해 에지 이웃 폴리곤을 검사
- 이웃 중 팔(part_id=3) 또는 다리(part_id=4) face set이 있으면 그쪽으로 이동
- 없으면 그대로 둠

저장 후 bake_final.py를 다시 돌려야 GLB에 반영됨.
"""
import bpy, math, os, sys
from collections import defaultdict

SCRIPTS = os.path.dirname(__file__)
BLEND   = os.path.normpath(os.path.join(SCRIPTS, "..", "asset", "prescription",
            "human-base-meshes-bundle", "human_base_meshes.blend"))

# bake_final.py와 동일
FS_TO_PART = {}
for fid in [1,2,3,4,5,6,7,8,22]:                    FS_TO_PART[fid] = 0  # 흉부
for fid in [19]:                                     FS_TO_PART[fid] = 1  # 복부
for fid in [18]:                                     FS_TO_PART[fid] = 2  # 신장
for fid in [9,10,11,12,20,21]+list(range(64,104)):   FS_TO_PART[fid] = 3  # 팔
for fid in [13,14,15,16,23,24]+list(range(25,64)):   FS_TO_PART[fid] = 4  # 다리
for fid in [17]:                                     FS_TO_PART[fid] = 5  # 머리

# 재할당 대상: 복부(19)→팔(3), 신장(18)→다리(4)
TRUNK_TO_LIMB = {19: 3, 18: 4}

# 관절 의심 임계값 — fset별 외곽 폴리곤 (상위 ~16%)
THRESHOLDS = {
    19: 0.150,  # 복부 — 어깨 뿌리
    18: 0.160,  # 신장 — 골반 외측
}

DRY_RUN = ('--apply' not in sys.argv)


def build_edge_adjacency(me):
    """edge_index → [polygon_index, ...] 매핑."""
    adj = defaultdict(list)
    for p in me.polygons:
        for ek in p.edge_keys:
            adj[ek].append(p.index)
    return adj


def polygon_neighbors(poly, adj):
    """폴리곤과 에지를 공유하는 이웃 폴리곤 인덱스 리스트."""
    out = set()
    for ek in poly.edge_keys:
        for other in adj[ek]:
            if other != poly.index:
                out.add(other)
    return out


def process_mesh(obj_name):
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        print(f"[SKIP] {obj_name} 없음")
        return
    me = obj.data
    fs = me.attributes.get(".sculpt_face_set")
    if not fs:
        print(f"[SKIP] {obj_name}: face_set 없음")
        return
    verts = me.vertices
    adj = build_edge_adjacency(me)

    print(f"\n=== {obj_name} ===")

    moves = []  # (poly_idx, src_fid, dst_fid, reason)
    for trunk_fid, target_part in TRUNK_TO_LIMB.items():
        thresh = THRESHOLDS[trunk_fid]
        candidates = [p for p in me.polygons if fs.data[p.index].value == trunk_fid]

        for p in candidates:
            # 폴리곤 중심의 xy_radius
            cx = sum(verts[vi].co.x for vi in p.vertices) / len(p.vertices)
            cy = sum(verts[vi].co.y for vi in p.vertices) / len(p.vertices)
            r  = math.sqrt(cx*cx + cy*cy)
            if r < thresh:
                continue

            # 이웃 face set 중 target_part(3=팔, 4=다리)에 매핑되는 게 있나
            neighbor_fids = [fs.data[n].value for n in polygon_neighbors(p, adj)]
            neighbor_limb = [nfid for nfid in neighbor_fids
                             if FS_TO_PART.get(nfid) == target_part]
            if not neighbor_limb:
                continue

            # 가장 빈번한 인접 limb face set으로 이동
            from collections import Counter
            dst_fid = Counter(neighbor_limb).most_common(1)[0][0]
            moves.append((p.index, trunk_fid, dst_fid, f"r={r:.3f}"))

    # 통계
    by_src = defaultdict(int)
    by_pair = defaultdict(int)
    for poly_idx, src, dst, _ in moves:
        by_src[src] += 1
        by_pair[(src, dst)] += 1

    print(f"  재할당 후보: {len(moves)}개")
    for src, cnt in sorted(by_src.items()):
        print(f"    fset {src} → 이동 {cnt}개")
    for (src, dst), cnt in sorted(by_pair.items()):
        print(f"      {src} → {dst}: {cnt}개")

    if DRY_RUN:
        print("  [DRY RUN] --apply 플래그 없음, 변경 안 함")
        return

    # 실제 적용
    for poly_idx, src, dst, _ in moves:
        fs.data[poly_idx].value = dst
    print(f"  [OK] {len(moves)}개 폴리곤 face_set 재할당 완료")


bpy.ops.wm.open_mainfile(filepath=BLEND)
print(f"[OK] blend 로드: {BLEND}")
print(f"모드: {'APPLY (저장 수행)' if not DRY_RUN else 'DRY RUN (변경 없음)'}")

process_mesh("GEO-body_male_realistic")
process_mesh("GEO-body_female_realistic")

if not DRY_RUN:
    bpy.ops.wm.save_mainfile(filepath=BLEND)
    print(f"\n[OK] blend 저장: {BLEND}")
    print("이제 'npm을 사용하지 않으면' 직접: blender --background --python scripts/bake_final.py")
