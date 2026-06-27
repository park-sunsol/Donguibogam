"""
body_male.glb / body_female.glb 처리 스크립트
- 여성 모델 Shade Smooth 적용
- 두 모델 모두 .sculpt_face_set 기반으로 body_part_id float attribute 굽기
- GLB 재출력 (custom attribute 포함)

실행: /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/process_body_glb.py
"""
import bpy
import sys
import os

ASSET_DIR = os.path.join(os.path.dirname(__file__), "..", "asset", "prescription")

# Face Set ID → body_part_id 매핑
# Blender sculpt face set은 1부터 시작, 0은 "기본값/미설정"
# 실제 GLB에서 어떤 face set 번호가 어느 부위인지 확인 후 매핑해야 하므로
# 먼저 face set 값을 출력하고 수동 매핑 또는 자동 정렬 적용.
# 자동화: face set 번호 오름차순으로 body_part_id 0~N 할당 (사용자가 Blender에서
# 얼굴/가슴/배/하복부/팔/다리 순서로 face set을 그린 경우에만 정확).
# → 여기서는 직접 매핑 딕셔너리를 노출하여 사용자가 확인할 수 있게 출력한다.

def get_face_set_to_part_id(obj):
    """
    .sculpt_face_set attribute에 있는 고유 값들을 출력하고
    오름차순 정렬 후 0, 1, 2, ... 로 매핑한다.
    (얼굴셋 번호가 해부학적 순서를 보장하지 않으므로 사용자가 로그를 보고 확인해야 함)
    """
    me = obj.data
    if ".sculpt_face_set" not in me.attributes:
        print(f"  [WARN] .sculpt_face_set attribute 없음: {obj.name}")
        return None

    attr = me.attributes[".sculpt_face_set"]
    face_set_ids = set()
    for face_set in attr.data:
        face_set_ids.add(face_set.value)

    sorted_ids = sorted(face_set_ids)
    print(f"  [INFO] {obj.name} face set IDs (sorted): {sorted_ids}")

    mapping = {fid: idx for idx, fid in enumerate(sorted_ids)}
    print(f"  [INFO] face_set → body_part_id mapping: {mapping}")
    return mapping


def bake_body_part_id(obj, mapping):
    """
    .sculpt_face_set 기반으로 body_part_id (float, vertex attribute) 생성.
    face → vertex 전파: 삼각형의 각 꼭짓점에 해당 face의 body_part_id 할당.
    """
    me = obj.data
    if ".sculpt_face_set" not in me.attributes:
        return False

    face_set_attr = me.attributes[".sculpt_face_set"]

    # 기존 body_part_id attribute 제거 후 재생성
    if "body_part_id" in me.attributes:
        me.attributes.remove(me.attributes["body_part_id"])

    # Vertex attribute (FLOAT, POINT domain)
    bp_attr = me.attributes.new(name="body_part_id", type='FLOAT', domain='POINT')

    # 초기화: -1 (미매핑)
    for v in bp_attr.data:
        v.value = -1.0

    # face → vertex 전파
    for poly in me.polygons:
        fid = face_set_attr.data[poly.index].value
        part_id = float(mapping.get(fid, -1))
        for vi in poly.vertices:
            bp_attr.data[vi].value = part_id

    print(f"  [OK] body_part_id attribute 생성 완료: {obj.name}")
    return True


def process_glb(filename, apply_shade_smooth):
    filepath = os.path.join(ASSET_DIR, filename)
    out_path  = filepath  # 원본 덮어쓰기

    print(f"\n{'='*60}")
    print(f"처리 중: {filename}")

    # 기존 씬 초기화
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # GLB 임포트
    bpy.ops.import_scene.gltf(filepath=filepath)
    print(f"  [OK] 임포트 완료")

    # 메시 오브젝트 목록
    mesh_objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    print(f"  [INFO] 메시 오브젝트 수: {len(mesh_objs)}")

    for obj in mesh_objs:
        bpy.context.view_layer.objects.active = obj

        # Shade Smooth
        if apply_shade_smooth:
            bpy.ops.object.shade_smooth()
            print(f"  [OK] Shade Smooth 적용: {obj.name}")

        # body_part_id 굽기
        mapping = get_face_set_to_part_id(obj)
        if mapping is not None:
            bake_body_part_id(obj, mapping)
        else:
            print(f"  [SKIP] face set 없음, body_part_id 굽기 생략: {obj.name}")

    # GLB 내보내기 (custom attribute 포함)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_attributes=True,      # custom attribute 포함
        use_selection=False,
        export_apply=False,
    )
    print(f"  [OK] GLB 내보내기 완료: {out_path}")


# ── 실행 ──────────────────────────────────────────────────
print("\n[body GLB 처리 시작]")
process_glb("body_male.glb",   apply_shade_smooth=True)
process_glb("body_female.glb", apply_shade_smooth=True)
print("\n[모든 처리 완료]")
