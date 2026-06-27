"""
attribute 생성 후 존재 여부 확인하고 GLTF로 내보내기 테스트
"""
import bpy, os

ASSET = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "asset", "prescription"))
obj = bpy.data.objects.get("GEO-body_male_realistic")
me = obj.data

# 기존 body_part_id 제거
if "body_part_id" in me.attributes:
    me.attributes.remove(me.attributes["body_part_id"])

# 새로 생성
attr = me.attributes.new("body_part_id", 'FLOAT', 'POINT')
for i, d in enumerate(attr.data):
    d.value = float(i % 6)  # 0~5 반복 테스트값

print(f"속성 생성 후 목록: {[a.name for a in me.attributes]}")
print(f"body_part_id 존재: {'body_part_id' in me.attributes}")
print(f"body_part_id 샘플값: {[me.attributes['body_part_id'].data[i].value for i in range(6)]}")

# 오브젝트 선택
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

# GLTF (텍스트) 먼저 내보내서 attribute 포함 확인
out_gltf = "/tmp/test_body.gltf"
bpy.ops.export_scene.gltf(
    filepath=out_gltf,
    export_format='GLTF_SEPARATE',
    export_attributes=True,
    use_selection=True,
    export_apply=False,
)
print(f"GLTF 내보내기 완료: {out_gltf}")

# GLTF 파일에서 body_part_id 포함 여부 확인
import json
with open(out_gltf) as f:
    gltf_data = json.load(f)

accessors = gltf_data.get('accessors', [])
meshes    = gltf_data.get('meshes', [])
print(f"\naccessors 수: {len(accessors)}")
for mesh in meshes:
    for prim in mesh.get('primitives', []):
        attrs = prim.get('attributes', {})
        print(f"primitive attributes: {list(attrs.keys())}")
