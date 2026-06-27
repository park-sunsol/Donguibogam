"""
blend 파일에서 body_male/female realistic 메시와
실제 GLB에서 불러온 메시 둘 다 face set 개수 확인
"""
import bpy

print("\n=== GEO-body_*_realistic face set 개수 ===")
for name in ['GEO-body_male_realistic', 'GEO-body_female_realistic']:
    obj = bpy.data.objects.get(name)
    if not obj: continue
    me = obj.data
    fs = me.attributes.get('.sculpt_face_set')
    if fs:
        ids = sorted(set(d.value for d in fs.data))
        print(f"{name}: {len(ids)}개 face set IDs → {ids[:20]}{'...' if len(ids)>20 else ''}")
    else:
        print(f"{name}: face set 없음")

print("\n=== blend 내 모든 메시의 face set 개수 (있는 것만) ===")
for obj in bpy.data.objects:
    if obj.type != 'MESH': continue
    me = obj.data
    fs = me.attributes.get('.sculpt_face_set')
    if fs:
        ids = set(d.value for d in fs.data)
        if 1 < len(ids) < 20:  # 2~19개인 것만 (의미있는 구분)
            print(f"  {obj.name}: {len(ids)}개 → {sorted(ids)}")
