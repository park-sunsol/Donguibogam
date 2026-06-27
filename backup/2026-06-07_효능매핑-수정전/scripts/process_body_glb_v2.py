"""
human_base_meshes.blend에서 남/여 메시를 찾아:
1. Shade Smooth 적용
2. .sculpt_face_set → body_part_id (float vertex attribute) 굽기
3. body_male.glb / body_female.glb 로 각각 GLB 내보내기

실행:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
      /Users/hanacardux/Desktop/Donguibogam/asset/prescription/human-base-meshes-bundle/human_base_meshes.blend \
      --python scripts/process_body_glb_v2.py
"""
import bpy
import os

ASSET_DIR = os.path.join(os.path.dirname(__file__), "..", "asset", "prescription")
BLEND_PATH = os.path.join(ASSET_DIR, "human-base-meshes-bundle", "human_base_meshes.blend")


def list_all_objects():
    print("\n[씬 오브젝트 목록]")
    for obj in bpy.data.objects:
        print(f"  {obj.type:8s}  {obj.name}")


def inspect_mesh_attributes(obj):
    me = obj.data
    print(f"\n  [Attributes in {obj.name}]")
    for attr in me.attributes:
        print(f"    {attr.name}  domain={attr.domain}  type={attr.data_type}")


def get_face_set_mapping(obj):
    me = obj.data
    if ".sculpt_face_set" not in me.attributes:
        print(f"  [WARN] .sculpt_face_set 없음: {obj.name}")
        return None

    attr = me.attributes[".sculpt_face_set"]
    ids = sorted(set(d.value for d in attr.data))
    print(f"  [INFO] face_set IDs: {ids}")
    mapping = {fid: float(i) for i, fid in enumerate(ids)}
    print(f"  [INFO] mapping: {mapping}")
    return mapping


def bake_body_part_id(obj, mapping):
    me = obj.data
    face_set_attr = me.attributes[".sculpt_face_set"]

    if "body_part_id" in me.attributes:
        me.attributes.remove(me.attributes["body_part_id"])

    bp_attr = me.attributes.new(name="body_part_id", type='FLOAT', domain='POINT')
    for v in bp_attr.data:
        v.value = -1.0

    for poly in me.polygons:
        fid = face_set_attr.data[poly.index].value
        part_id = mapping.get(fid, -1.0)
        for vi in poly.vertices:
            bp_attr.data[vi].value = part_id

    print(f"  [OK] body_part_id 굽기 완료: {obj.name}")


def apply_shade_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    print(f"  [OK] Shade Smooth: {obj.name}")


def export_single_obj(obj, out_path):
    """오브젝트 하나만 선택 후 GLB 내보내기."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_attributes=True,
        use_selection=True,
        export_apply=False,
    )
    print(f"  [OK] 내보내기: {out_path}")


# ── 메인 ─────────────────────────────────────────────────
print("\n" + "="*60)
print("human_base_meshes.blend 처리 시작")

list_all_objects()

# 메시 오브젝트 전체 조회
mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
print(f"\n메시 오브젝트 {len(mesh_objs)}개:")
for o in mesh_objs:
    print(f"  {o.name}")

# 남/여 메시 식별 (이름에 male/female 포함 여부로 판단)
male_candidates   = [o for o in mesh_objs if 'male'   in o.name.lower() and 'female' not in o.name.lower()]
female_candidates = [o for o in mesh_objs if 'female' in o.name.lower()]

# 매칭 안 되면 face set 보유 여부로 재시도
if not male_candidates or not female_candidates:
    print("\n[INFO] 이름 기반 매칭 실패, face set 보유 오브젝트로 재시도")
    candidates = []
    for o in mesh_objs:
        if ".sculpt_face_set" in o.data.attributes:
            candidates.append(o)
            inspect_mesh_attributes(o)
    if len(candidates) >= 2:
        male_candidates   = [candidates[0]]
        female_candidates = [candidates[1]]
    elif len(candidates) == 1:
        male_candidates   = [candidates[0]]
        female_candidates = []
    else:
        print("\n[WARN] face set 오브젝트 없음 — 모든 메시 속성 출력:")
        for o in mesh_objs:
            inspect_mesh_attributes(o)

print(f"\n남성 메시 후보: {[o.name for o in male_candidates]}")
print(f"여성 메시 후보: {[o.name for o in female_candidates]}")

pairs = []
if male_candidates:
    pairs.append((male_candidates[0],   "body_male.glb"))
if female_candidates:
    pairs.append((female_candidates[0], "body_female.glb"))

for obj, out_name in pairs:
    print(f"\n{'─'*50}")
    print(f"처리: {obj.name} → {out_name}")
    inspect_mesh_attributes(obj)

    apply_shade_smooth(obj)

    mapping = get_face_set_mapping(obj)
    if mapping is not None:
        bake_body_part_id(obj, mapping)

    out_path = os.path.join(ASSET_DIR, out_name)
    export_single_obj(obj, out_path)

print("\n[완료]")
