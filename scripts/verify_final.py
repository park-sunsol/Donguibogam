import bpy, os
ASSET = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "asset", "prescription"))

for fname in ['body_male.glb', 'body_female.glb']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ASSET, fname))
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH': continue
        me = obj.data
        attrs = [a.name for a in me.attributes]
        print(f"\n{fname} / {obj.name}")
        print(f"  attributes: {attrs}")
        # body_part 컬러 속성 확인
        for aname in attrs:
            if 'body' in aname.lower() or 'color' in aname.lower() or aname.startswith('_'):
                a = me.attributes[aname]
                vals = sorted(set(round(d.color[0]*10) for d in a.data)) if hasattr(a.data[0], 'color') else []
                print(f"  [{aname}] domain={a.domain} type={a.data_type} vals={vals[:10]}")
