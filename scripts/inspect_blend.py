"""
blend 파일에서 GEO-body_*_realistic 오브젝트의 attribute 목록 확인
"""
import bpy

targets = ['GEO-body_male_realistic', 'GEO-body_female_realistic']

for name in targets:
    obj = bpy.data.objects.get(name)
    if not obj:
        print(f"[NOT FOUND] {name}")
        continue
    me = obj.data
    print(f"\n[{name}]  vertices={len(me.vertices)}  polygons={len(me.polygons)}")
    for attr in me.attributes:
        print(f"  attr: {attr.name!r:40s}  domain={attr.domain}  type={attr.data_type}")
    # face set 있으면 샘플 출력
    if ".sculpt_face_set" in me.attributes:
        fs_attr = me.attributes[".sculpt_face_set"]
        ids = sorted(set(d.value for d in fs_attr.data))
        print(f"  face_set IDs: {ids}")
