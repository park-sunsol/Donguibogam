"""
face set ID별로 색상 입혀서 PNG 렌더 → 사용자가 매핑 확인
/tmp/face_sets_male.png 에 저장
"""
import bpy, os, math

TARGET = "GEO-body_male_realistic"
OUT    = "/tmp/face_sets_male.png"

obj = bpy.data.objects.get(TARGET)
if not obj:
    print(f"[ERR] {TARGET} not found"); raise SystemExit(1)

me = obj.data
fs_attr = me.attributes.get(".sculpt_face_set")
if not fs_attr:
    print("[ERR] .sculpt_face_set not found"); raise SystemExit(1)

ids = sorted(set(d.value for d in fs_attr.data))
print(f"face_set IDs: {ids}")

# ── 버텍스 컬러로 face set 시각화 ──
import colorsys
if "fs_color" in me.attributes:
    me.attributes.remove(me.attributes["fs_color"])
col_attr = me.attributes.new("fs_color", 'FLOAT_COLOR', 'CORNER')

n = len(ids)
id_to_hue = {fid: i / n for i, fid in enumerate(ids)}

for poly in me.polygons:
    fid  = fs_attr.data[poly.index].value
    h    = id_to_hue.get(fid, 0.0)
    r, g, b = colorsys.hsv_to_rgb(h, 0.85, 0.95)
    for li in poly.loop_indices:
        col_attr.data[li].color = (r, g, b, 1.0)

# ── マテリアル: vertex color 표시 ──
mat = bpy.data.materials.new("fs_vis")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
for n2 in nodes:
    nodes.remove(n2)
output = nodes.new("ShaderNodeOutputMaterial")
emit   = nodes.new("ShaderNodeEmission")
vc     = nodes.new("ShaderNodeVertexColor")
vc.layer_name = "fs_color"
links.new(vc.outputs["Color"],  emit.inputs["Color"])
links.new(emit.outputs["Emission"], output.inputs["Surface"])

obj.data.materials.clear()
obj.data.materials.append(mat)

# ── 렌더 설정 ──
scene = bpy.context.scene
scene.render.engine         = 'CYCLES'
scene.cycles.samples        = 1
scene.render.resolution_x   = 800
scene.render.resolution_y   = 1400
scene.render.filepath       = OUT
scene.render.image_settings.file_format = 'PNG'

# ── 카메라 ──
box = obj.bound_box
cy  = sum(v[1] for v in obj.bound_box) / 8
cz  = sum(v[2] for v in obj.bound_box) / 8
dist = 3.5
cam_data = bpy.data.cameras.new("Cam")
cam_obj  = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location = (0, -dist, cz)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam_obj

# ── すべてのライトを削除し、新しいライトを追加 ──
for o in list(scene.objects):
    if o.type == 'LIGHT':
        bpy.data.objects.remove(o)
sun_data = bpy.data.lights.new("Sun", 'SUN')
sun_data.energy = 3
sun_obj  = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.location = (2, -3, 4)

bpy.ops.render.render(write_still=True)
print(f"[OK] 렌더 완료: {OUT}")
