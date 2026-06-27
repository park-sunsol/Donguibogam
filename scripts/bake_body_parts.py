"""
GEO-body_male/female_realistic 메시에서
.sculpt_face_set → body_part_id (0-5) 굽고 GLB 내보내기

Face Set → body_part_id 매핑 (Z높이 + XZ반경 분석 기반):
  head    (0): 1,2,3,4,5,7,8,17,22
  chest   (1): 19
  abdomen (2): 18
  lower   (3): 23,24
  arms    (4): 9,10,11,12,20,21 + 64-103
  legs    (5): 13,14,15,16 + 25-63
"""
import bpy
import os

ASSET_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "asset", "prescription")
)

# ── face_set_id → body_part_id 매핑 ──────────────────────
FS_TO_PART = {}

for fid in [1, 2, 3, 4, 5, 7, 8, 17, 22]:          FS_TO_PART[fid] = 0  # head
for fid in [19]:                                     FS_TO_PART[fid] = 1  # chest
for fid in [18]:                                     FS_TO_PART[fid] = 2  # abdomen
for fid in [23, 24]:                                 FS_TO_PART[fid] = 3  # lower
for fid in [9,10,11,12,20,21]+list(range(64,104)):   FS_TO_PART[fid] = 4  # arms
for fid in [13,14,15,16]+list(range(25,64)):         FS_TO_PART[fid] = 5  # legs

print(f"매핑 항목 수: {len(FS_TO_PART)}")


def bake_and_export(obj_name, out_filename):
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        print(f"[ERR] {obj_name} 없음"); return

    me = obj.data
    fs_attr = me.attributes.get(".sculpt_face_set")
    if not fs_attr:
        print(f"[ERR] .sculpt_face_set 없음: {obj_name}"); return

    # ── Shade Smooth ──────────────────────────────────────
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    print(f"[OK] Shade Smooth: {obj_name}")

    # ── body_part_id 굽기 ─────────────────────────────────
    if "body_part_id" in me.attributes:
        me.attributes.remove(me.attributes["body_part_id"])

    bp_attr = me.attributes.new("body_part_id", 'FLOAT', 'POINT')
    for v in bp_attr.data:
        v.value = -1.0

    unmapped = set()
    for poly in me.polygons:
        fid     = fs_attr.data[poly.index].value
        part_id = FS_TO_PART.get(fid, -1.0)
        if part_id < 0:
            unmapped.add(fid)
        for vi in poly.vertices:
            bp_attr.data[vi].value = float(part_id)

    if unmapped:
        print(f"[WARN] 매핑 안 된 face set IDs: {sorted(unmapped)}")
    print(f"[OK] body_part_id 굽기 완료: {obj_name}")

    # ── GLB 내보내기 ──────────────────────────────────────
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    out_path = os.path.join(ASSET_DIR, out_filename)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_attributes=True,
        use_selection=True,
        export_apply=False,
    )
    print(f"[OK] 내보내기: {out_path}")


# ── 실행 ─────────────────────────────────────────────────
print("\n[남성 모델]")
bake_and_export("GEO-body_male_realistic",   "body_male.glb")

print("\n[여성 모델]")
bake_and_export("GEO-body_female_realistic", "body_female.glb")

print("\n[완료]")
