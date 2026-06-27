import bpy, os
ASSET = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "asset", "prescription"))

for fname in ['body_male.glb', 'body_female.glb']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ASSET, fname))
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH': continue
        attrs = list(obj.data.attributes.keys())
        print(f"\n{fname} / {obj.name}: {attrs}")
        for aname in ['body_part_id', '_BODY_PART_ID', '_body_part_id', 'BODY_PART_ID']:
            bp = obj.data.attributes.get(aname)
            if bp:
                vals = sorted(set(round(d.value) for d in bp.data))
                print(f"  [{aname}] 값: {vals}")
                break
        else:
            print(f"  body_part_id 없음")
