import math
from pathlib import Path

import bpy
from mathutils import Vector


OUT = Path(__file__).resolve().parent
BLEND_PATH = OUT / "spatial_continuity_demo.blend"

MAT = {}


def mat(name, color):
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    MAT[name] = material
    return material


def cube(name, loc, scale, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return obj


def cyl(name, loc, radius, depth, material, rot=(0, 0, 0), vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def sphere(name, loc, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def line_between(name, a, b, radius, material):
    a = Vector(a)
    b = Vector(b)
    mid = (a + b) / 2
    direction = b - a
    obj = cyl(name, mid, radius, direction.length, material, vertices=12)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera(name, loc, target, lens):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.name = name
    cam.data.lens = lens
    cam.data.dof.use_dof = True
    cam.data.dof.focus_distance = (Vector(target) - Vector(loc)).length
    cam.data.dof.aperture_fstop = 5.6
    look_at(cam, target)
    return cam


def label(name, text, loc, size=0.22):
    bpy.ops.object.text_add(location=loc, rotation=(math.radians(68), 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = text
    obj.data.align_x = "CENTER"
    obj.data.size = size
    obj.data.materials.append(MAT["label"])
    return obj


def character(name, loc, body_mat, heading_deg):
    x, y, z = loc
    body = cyl(f"{name}_body", (x, y, z + 0.9), 0.22, 0.8, body_mat)
    head = sphere(f"{name}_head", (x, y, z + 1.45), 0.18, MAT["skin"])
    hair = sphere(f"{name}_hair", (x, y - 0.03, z + 1.58), 0.19, MAT["hair"])
    chair = cube(f"{name}_seat_anchor_chair", (x, y, z + 0.28), (0.34, 0.34, 0.08), MAT["chair"])

    rot = math.radians(heading_deg)
    for obj in (body, head, hair, chair):
        obj.rotation_euler[2] = rot

    # ponytail: block hands/cards are enough here; use rigged characters only if animation is required.
    card_offset = Vector((math.sin(rot) * 0.24, -math.cos(rot) * 0.24, 1.06))
    cube(f"{name}_hand_card", Vector(loc) + card_offset, (0.12, 0.015, 0.08), MAT["card"], rot=(0, 0, rot))
    return body


def setup_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    mat("floor", (0.22, 0.17, 0.12, 1))
    mat("wall", (0.58, 0.48, 0.41, 1))
    mat("wood", (0.36, 0.14, 0.06, 1))
    mat("darkwood", (0.13, 0.06, 0.035, 1))
    mat("screen", (0.18, 0.55, 0.72, 1))
    mat("screen_green", (0.08, 0.45, 0.22, 1))
    mat("glass", (0.34, 0.52, 0.72, 0.65))
    mat("skin", (0.77, 0.55, 0.42, 1))
    mat("hair", (0.035, 0.025, 0.02, 1))
    mat("main_blue", (0.03, 0.08, 0.18, 1))
    mat("zhou_tan", (0.62, 0.39, 0.2, 1))
    mat("yin_gray", (0.72, 0.72, 0.72, 1))
    mat("gao_white", (0.84, 0.82, 0.78, 1))
    mat("chair", (0.19, 0.11, 0.07, 1))
    mat("card", (0.95, 0.92, 0.84, 1))
    mat("anchor_red", (1.0, 0.06, 0.04, 1))
    mat("anchor_blue", (0.1, 0.45, 1.0, 1))
    mat("label", (1.0, 0.92, 0.55, 1))

    # Fixed world layout. Cameras change; these coordinates do not.
    table = cube("Table_FIXED_world_origin", (0, 0, 0.42), (1.25, 0.82, 0.12), MAT["wood"])
    cube("Table_leg_NW", (-1.08, 0.65, 0.18), (0.06, 0.06, 0.36), MAT["darkwood"])
    cube("Table_leg_NE", (1.08, 0.65, 0.18), (0.06, 0.06, 0.36), MAT["darkwood"])
    cube("Table_leg_SW", (-1.08, -0.65, 0.18), (0.06, 0.06, 0.36), MAT["darkwood"])
    cube("Table_leg_SE", (1.08, -0.65, 0.18), (0.06, 0.06, 0.36), MAT["darkwood"])

    cube("Room_floor_FIXED", (0, 0, -0.03), (3.4, 2.7, 0.03), MAT["floor"])
    cube("North_wall_FIXED", (0, 2.52, 1.35), (3.4, 0.06, 1.35), MAT["wall"])
    cube("West_wall_FIXED", (-3.4, 0, 1.35), (0.06, 2.7, 1.35), MAT["wall"])
    cube("East_wall_FIXED", (3.4, 0, 1.35), (0.06, 2.7, 1.35), MAT["wall"])

    cube("Window_FIXED_north_west_glass", (-1.55, 2.47, 1.55), (0.72, 0.025, 0.48), MAT["glass"])
    for dx in (-2.15, -1.55, -0.95):
        cube("Window_lattice_vertical", (dx, 2.43, 1.55), (0.025, 0.035, 0.52), MAT["darkwood"])
    for dz in (1.24, 1.55, 1.86):
        cube("Window_lattice_horizontal", (-1.55, 2.42, dz), (0.74, 0.035, 0.025), MAT["darkwood"])

    cube("Sofa_FIXED_against_north_wall", (-0.15, 1.82, 0.42), (1.8, 0.28, 0.32), MAT["wall"])
    cube("Sofa_back_FIXED", (-0.15, 2.08, 0.86), (1.8, 0.12, 0.42), MAT["wall"])

    tv_anchor = Vector((1.58, 2.18, 1.25))
    cube("TV_cabinet_FIXED_under_tv", (1.58, 2.0, 0.52), (0.68, 0.28, 0.32), MAT["darkwood"])
    cube("TV_FIXED_north_east_body", tv_anchor, (0.52, 0.18, 0.38), MAT["darkwood"])
    cube("TV_FIXED_north_east_screen", (1.58, 1.8, 1.27), (0.38, 0.025, 0.25), MAT["screen"])
    cube("TV_screen_mountain_left", (1.46, 1.77, 1.22), (0.11, 0.018, 0.07), MAT["screen_green"], rot=(0, 0, math.radians(28)))
    cube("TV_screen_mountain_right", (1.68, 1.77, 1.23), (0.14, 0.018, 0.08), MAT["screen_green"], rot=(0, 0, math.radians(-24)))
    line_between("TV_anchor_vertical_FIXED", (1.58, 2.18, 0.02), (1.58, 2.18, 1.72), 0.018, MAT["anchor_red"])
    line_between("Table_to_TV_floor_relation_FIXED", (0, 0, 0.03), (1.58, 2.18, 0.03), 0.012, MAT["anchor_blue"])
    label("TV_anchor_label", "TV fixed on north-east wall", (1.58, 1.72, 1.86), 0.16)

    main = character("Main_8oclock_FIXED", (-1.55, -0.55, 0), MAT["main_blue"], -62)
    character("Zhou_12oclock_FIXED", (0.0, 1.12, 0), MAT["zhou_tan"], 180)
    character("Yin_3oclock_FIXED", (1.55, 0.18, 0), MAT["yin_gray"], 88)
    character("Gao_4oclock_FIXED", (1.36, -0.78, 0), MAT["gao_white"], 118)
    line_between("Main_anchor_vertical_FIXED", (-1.55, -0.55, 0.02), (-1.55, -0.55, 1.7), 0.018, MAT["anchor_blue"])
    label("Main_anchor_label", "main seat fixed", (-1.58, -1.0, 1.82), 0.16)

    for i, (x, y, rz) in enumerate(
        [
            (-0.5, -0.1, 10),
            (-0.25, 0.2, -15),
            (0.18, -0.22, 7),
            (0.52, 0.18, -11),
            (0.02, 0.0, 22),
            (-0.72, 0.36, -5),
            (0.68, -0.36, 14),
        ],
        start=1,
    ):
        cube(f"Bridge_card_FIXED_on_table_{i}", (x, y, 0.58), (0.13, 0.008, 0.09), MAT["card"], rot=(0, 0, math.radians(rz)))

    # Tea cups, also fixed in world coordinates.
    for i, (x, y) in enumerate([(-0.65, -0.42), (0.52, -0.5), (-0.22, 0.5), (0.72, 0.42)], start=1):
        cyl(f"Tea_cup_FIXED_{i}", (x, y, 0.68), 0.08, 0.09, MAT["card"])

    add_camera("Camera_01_Wide_same_scene", (0.0, -4.25, 2.15), (0.1, 0.35, 0.92), 28)
    add_camera("Camera_02_Close_main_same_scene", (-2.65, -2.15, 1.48), (-0.85, 0.25, 1.1), 45)

    bpy.ops.object.light_add(type="AREA", location=(0, -1.3, 3.2))
    light = bpy.context.object
    light.name = "Large_softbox"
    light.data.energy = 650
    light.data.size = 4.5

    bpy.ops.object.light_add(type="POINT", location=(1.8, 1.75, 2.15))
    lamp = bpy.context.object
    lamp.name = "Warm_lamp_near_tv"
    lamp.data.energy = 120
    lamp.data.color = (1.0, 0.72, 0.45)

    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.world.color = (0.035, 0.035, 0.04)

    assert main.name == "Main_8oclock_FIXED_body"
    assert bpy.data.objects["TV_FIXED_north_east_body"].location == tv_anchor
    assert table.location == Vector((0, 0, 0.42))


def render(camera_name, filename):
    scene = bpy.context.scene
    scene.camera = bpy.data.objects[camera_name]
    scene.render.filepath = str(OUT / filename)
    bpy.ops.render.render(write_still=True)


setup_scene()
render("Camera_01_Wide_same_scene", "shot_01_wide_same_scene.png")
render("Camera_02_Close_main_same_scene", "shot_02_close_same_scene.png")
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
print(f"saved {BLEND_PATH}")
