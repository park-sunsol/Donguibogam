"""
face_set → body_part_id를 FLOAT_COLOR vertex attribute로 인코딩해 GLB 내보내기.
 R 채널 = body_part_id / 10.0  (0-5 범위 → 0.0-0.5, Three.js에서 *10 해서 읽음)

GLB 표준(GLTF 2.0)은 COLOR_0 속성을 공식 지원 → 별도 플래그 없이도 내보내짐.
"""
import bpy, bmesh, os

SCRIPTS = os.path.dirname(__file__)
ASSET   = os.path.normpath(os.path.join(SCRIPTS, "..", "asset", "prescription"))
BLEND   = os.path.normpath(os.path.join(SCRIPTS, "..", "asset", "prescription",
                           "human-base-meshes-bundle", "human_base_meshes.blend"))

bpy.ops.wm.open_mainfile(filepath=BLEND)
print(f"[OK] blend 로드: {BLEND}")

FS_TO_PART = {}
# PID를 인체 위→아래 순서로 배치 (인접 부위가 인접 PID를 갖도록):
#   0=머리, 1=흉부, 2=팔, 3=복부, 4=신장, 5=다리
# 이유: 셰이더에서 R = part_id/10 보간 후 round되므로,
#       face set 경계 면에서 vBodyPart 보간값이 인접 부위 PID로 떨어지게 해야
#       팔(중간값) 등으로 잘못 round되는 아티팩트가 사라진다.
# face set 1은 split_face_set_1_by_z.py + trim_face_set_200.py로
#   Z>1.18 AND (Z>=1.30 OR XY<=0.15) → face set 200 → 머리
#   외에는 face set 1 → 흉부
for fid in [2,3,4,5,7,8,17,22,200]:                  FS_TO_PART[fid] = 0  # 머리
for fid in [1]:                                      FS_TO_PART[fid] = 1  # 흉부 (목·가슴)
for fid in [9,10,11,12,20,21]+list(range(64,104)):   FS_TO_PART[fid] = 2  # 팔
for fid in [19]:                                     FS_TO_PART[fid] = 3  # 복부
for fid in [18]:                                     FS_TO_PART[fid] = 4  # 신장·생식
for fid in [13,14,15,16,23,24]+list(range(25,64)):   FS_TO_PART[fid] = 5  # 다리

SCALE = 10.0   # R = part_id / SCALE → Three.js 에서 R * SCALE → int


def assign_from_facesets(obj_name):
    """face set 경계 edge를 split해 vertex 공유를 제거한 뒤
    각 vertex에 단일 part_id를 인코딩한다.
    이유: vertex attribute가 face set 간에 공유되면 셰이더 보간 결과
    R = (R_a + R_b)/2 가 다른 PID로 round되어 가짜 띠가 생긴다.
    경계에서 vertex를 분리하면 면 내부에서 R이 단일 값이 되어 사라짐.
    """
    obj = bpy.data.objects.get(obj_name)
    if not obj: print(f"[ERR] {obj_name}"); return False

    me = obj.data
    fs_attr = me.attributes.get(".sculpt_face_set")
    if not fs_attr: print(f"[ERR] no face_set: {obj_name}"); return False

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    for aname in ['sharp_face', 'sharp_edge']:
        if aname in me.attributes:
            me.attributes.remove(me.attributes[aname])
            print(f"  [OK] {aname} 제거: {obj_name}")

    # 원본 face index → fid 매핑 (bmesh.from_mesh 직후 face.index가 poly index와 동일)
    fid_per_face_orig = [fs_attr.data[i].value for i in range(len(me.polygons))]

    bm = bmesh.new()
    bm.from_mesh(me)
    bm.faces.ensure_lookup_table()
    bm.edges.ensure_lookup_table()

    # face별 fid를 BMesh int layer로 보존 (split 후에도 link_faces로 참조)
    fid_layer = bm.faces.layers.int.new("__body_fid_tmp")
    for f in bm.faces:
        f[fid_layer] = fid_per_face_orig[f.index]

    # 다른 face_set에 속한 face가 공유하는 edge만 split
    boundary_edges = [e for e in bm.edges
                      if len(set(f[fid_layer] for f in e.link_faces)) > 1]
    bmesh.ops.split_edges(bm, edges=boundary_edges)
    bm.verts.ensure_lookup_table()

    # split 후 각 vertex는 단일 face_set의 face들에 속함
    n_verts_after = len(bm.verts)
    vert_part_id = [-1] * n_verts_after
    for v in bm.verts:
        if v.link_faces:
            fid = v.link_faces[0][fid_layer]
            vert_part_id[v.index] = FS_TO_PART.get(fid, -1)

    # 임시 layer 정리 후 mesh로 다시 적용
    bm.faces.layers.int.remove(fid_layer)
    bm.to_mesh(me)
    bm.free()

    # vertex color attribute (POINT) 작성
    aname = "body_part"
    if aname in me.attributes:
        me.attributes.remove(me.attributes[aname])
    col_attr = me.attributes.new(aname, 'FLOAT_COLOR', 'POINT')
    for vi in range(n_verts_after):
        pid = vert_part_id[vi]
        r = pid / SCALE if pid >= 0 else 0.0
        col_attr.data[vi].color = (r, 0.0, 0.0, 1.0)

    found = sorted(set(p for p in vert_part_id if p >= 0))
    print(f"[OK] {obj_name}: split 후 vertex {n_verts_after}, boundary edge {len(boundary_edges)}개, body_part values={found}")
    return True



def export_glb(obj_names, out_fname):
    """지정 오브젝트들을 하나의 GLB로 내보내기."""
    bpy.ops.object.select_all(action='DESELECT')
    active = None
    for name in obj_names:
        obj = bpy.data.objects.get(name)
        if obj:
            obj.select_set(True)
            active = obj
    if active:
        bpy.context.view_layer.objects.active = active

    out = os.path.join(ASSET, out_fname)
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        export_vertex_color='ACTIVE',
        export_all_vertex_colors=True,
        use_selection=True,
        export_apply=False,
    )
    print(f"[OK] 내보내기: {out}")


print("[남성]")
assign_from_facesets("GEO-body_male_realistic")
export_glb(["GEO-body_male_realistic"], "body_male.glb")

print("[여성]")
assign_from_facesets("GEO-body_female_realistic")
export_glb(["GEO-body_female_realistic"], "body_female.glb")

print("[완료]")
