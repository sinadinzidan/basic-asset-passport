"""
Cuts the Asset Passport agent mascot out of its reference pictures and writes the app's sprites.

The mascot is the ADNOC robot in `adnoc-mascot-reference.png`, a picture on a white background. The sprites
are that picture itself, not a redrawing, so they match it exactly:

    mascot.png             the robot without its eyes, on a transparent background, faded out at the waist
    mascot-wave.png        the same robot with its arm raised, up to the wrist
    mascot-hand.png        the raised hand alone, on the same canvas, for the app to turn at the wrist
    mascot-eyes.png        the glowing eyes alone, on the same canvas, for the app to blink
    mascot-eyes-think.png  round eyes in the same glow, drawn here, shown while the agent works

The waving picture (`adnoc-mascot-wave-reference.webp`) is a separate picture of the robot, so the rest of
it is not quite where it is in the reference. Only the raised arm is taken from it and joined to the robot of
`mascot.png`; everything else is the same in both, so nothing but the arm changes between them.

The script prints where the eyes sit on the canvas ("eyes-origin"), which `src/styles.css` uses as the point
the blink squashes towards, and where the wrist sits ("wrist-origin"), the point the hand turns about.

Run from the project root, on macOS (the outline comes from the Vision framework, through
`subject_mask.swift`; Blender is used only for its Python with numpy and image files):

    blender -b -P design/mascot/cut_sprites.py -- src/assets/agent
"""

import os
import subprocess
import sys
import tempfile

import bpy
import numpy

HERE = os.path.dirname(os.path.abspath(__file__))
REFERENCE = os.path.join(HERE, 'adnoc-mascot-reference.png')
WAVE_REFERENCE = os.path.join(HERE, 'adnoc-mascot-wave-reference.webp')
ARGUMENTS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUTPUT_DIRECTORY = os.path.abspath(ARGUMENTS[0]) if ARGUMENTS else os.path.join(HERE, 'out')

BACKGROUND = 254.0
# The background's own noise stays above this; the robot's white parts are darker at their edges.
NEAR_WHITE = 247.0
# How far into the Vision outline the background may reach, and how far outside it the robot may.
OUTLINE_INSIDE = 200.0
OUTLINE_REACH_PIXELS = 12
# The sprites are the reference shrunk by a whole number, so every pixel is an exact average.
SHRINK = 3
FADE_FRACTION = 0.12
# Left, top, right, bottom of the visor's glass in the reference, clear of the glowing ear rings.
VISOR_BOX = (360, 300, 800, 612)
GLOW_TINT = 22.0
GLOW_REACH_PIXELS = 16
GLOW_CORE = 150.0
VISOR_BLUR_PIXELS = 26.0
THINK_EYE_RADII = (27.0, 35.0)
THINK_EYE_SHIFT = (9.0, -7.0)
THINK_HALO_PIXELS = 13.0
THINK_HALO_STRENGTH = 0.55
# The part of the waving picture that is used, as the corners (x, y) of a closed outline in the reference:
# from the top edge down between the head and the raised hand, under the head to the collar, down the chest
# beside the shoulder panel, and out to the right below the resting arm.
ARM_OUTLINE = ((888, 0), (888, 540), (875, 560), (835, 600), (790, 645), (740, 652), (690, 668),
               (685, 690), (755, 800), (775, 840), (778, 930), (1312, 930), (1312, 0))
ARM_SEAM_PIXELS = 3.0
# Left, top, right, bottom of a patch of chest beside the arm, which lines the waving picture up with the
# reference, and how far the search for the best fit goes.
CHEST_BOX = (620, 760, 760, 900)
ALIGN_REACH_PIXELS = 6
# The wrist of the raised hand: the two ends (x, y) of the line where the glove leaves the cuff. The hand is
# what lies past that line and right of HAND_LEFT, a column of empty picture between the head and the hand.
WRIST = ((917, 615), (1017, 675))
HAND_LEFT = 892
WRIST_SEAM_PIXELS = 3.0
# The arm keeps this much of the glove under the hand, so no gap opens at the cuff when the hand turns.
WRIST_OVERLAP_PIXELS = 12.0


def load(path):
    """An image as rows from the top, channels 0 to 255."""
    image = bpy.data.images.load(path)
    image.colorspace_settings.name = 'Non-Color'
    width, height = image.size
    pixels = numpy.empty(width * height * 4, dtype=numpy.float32)
    image.pixels.foreach_get(pixels)
    bpy.data.images.remove(image)
    return pixels.reshape(height, width, 4)[::-1] * 255.0


def save(path, pixels):
    height, width, _ = pixels.shape
    image = bpy.data.images.new(os.path.basename(path), width, height, alpha=True)
    image.colorspace_settings.name = 'Non-Color'
    image.pixels.foreach_set((numpy.clip(pixels[::-1], 0.0, 255.0) / 255.0).astype(numpy.float32).ravel())
    image.filepath_raw = path
    image.file_format = 'PNG'
    image.save()
    bpy.data.images.remove(image)
    print(f'wrote {os.path.relpath(path)} {width}x{height}')


def subject_mask(picture, directory):
    path = os.path.join(directory, 'mask.png')
    subprocess.run(['xcrun', 'swift', os.path.join(HERE, 'subject_mask.swift'), picture, path], check=True)
    return load(path)[..., 0]


def neighbours(values, fill):
    """The value itself and its eight neighbours, as nine arrays."""
    padded = numpy.pad(values, 1, constant_values=fill)
    height, width = values.shape
    return [padded[row:row + height, column:column + width] for row in range(3) for column in range(3)]


def dilate(mask, steps):
    for _ in range(steps):
        mask = numpy.logical_or.reduce(neighbours(mask, False))
    return mask


def flood(seed, allowed):
    """Grows the seed through the allowed pixels until it stops spreading."""
    while True:
        grown = dilate(seed, 1) & allowed
        if (grown == seed).all():
            return seed
        seed = grown


def blur(values, sigma):
    reach = max(1, int(sigma * 3))
    kernel = numpy.exp(-0.5 * (numpy.arange(-reach, reach + 1) / sigma) ** 2)
    kernel /= kernel.sum()
    for axis in (0, 1):
        padding = [(reach, reach) if index == axis else (0, 0) for index in range(values.ndim)]
        padded = numpy.pad(values, padding, mode='edge')
        length = values.shape[axis]
        values = sum(weight * numpy.take(padded, range(offset, offset + length), axis=axis)
                     for offset, weight in enumerate(kernel))
    return values


def cut_out(color, subject):
    """The robot's opacity, and its colours with the white background taken out of its edge."""
    lightest = color.min(axis=2)
    is_near_white = lightest >= NEAR_WHITE
    outside = flood((subject < 2) & is_near_white, is_near_white & (subject < OUTLINE_INSIDE))
    solid = ~outside & dilate(subject > 128, OUTLINE_REACH_PIXELS)

    # An edge pixel is part robot, part background: how much is read off the darkest robot pixel beside it.
    darkest_beside = numpy.minimum.reduce(neighbours(numpy.where(solid, lightest, 255.0), 255.0))
    contrast = BACKGROUND - darkest_beside
    is_edge = solid & dilate(~solid, 1) & (contrast >= 12)
    cover = numpy.clip((BACKGROUND - lightest) / numpy.maximum(contrast, 1.0), 0.0, 1.0)
    alpha = numpy.where(is_edge, cover, solid.astype(numpy.float32))
    alpha[alpha < 0.05] = 0.0
    cover = numpy.maximum(alpha, 0.05)[..., None]
    clean = numpy.where(is_edge[..., None], (color - (1.0 - cover) * BACKGROUND) / cover, color)
    return alpha, numpy.clip(clean, 0.0, 255.0)


def split_eyes(color):
    """
    Lifts the glowing eyes off the visor. Returns the colours without the eyes, the eyes as their own
    layer, and the centre of each eye.
    """
    left, top, right, bottom = VISOR_BOX
    box = color[top:bottom, left:right]
    red, green, blue = box[..., 0], box[..., 1], box[..., 2]
    is_lit = (green - red > GLOW_TINT) & (blue > 50)
    is_covered = dilate(is_lit, GLOW_REACH_PIXELS)

    # The glass under the glow, guessed from the glass around it.
    known = (~is_covered).astype(numpy.float32)
    guessed = blur(box * known[..., None], VISOR_BLUR_PIXELS) / numpy.maximum(
        blur(known, VISOR_BLUR_PIXELS), 1e-4)[..., None]
    glass = numpy.where(is_covered[..., None], guessed, box)
    glass_peak = glass.max(axis=2)
    strength = numpy.clip((box.max(axis=2) - glass_peak) / numpy.maximum(255.0 - glass_peak, 1.0), 0.0, 1.0)
    strength[~is_covered | (strength < 0.02)] = 0.0
    glow = numpy.clip(glass + (box - glass) / numpy.maximum(strength, 0.02)[..., None], 0.0, 255.0)

    # The eyes are the glow above the gap that separates them from the smile.
    lit_rows = numpy.flatnonzero((green > GLOW_CORE).any(axis=1))
    gaps = numpy.diff(lit_rows)
    if gaps.max() < 8:
        raise RuntimeError('Could not tell the eyes from the smile')
    gap_start = lit_rows[gaps.argmax()]
    gap_end = lit_rows[gaps.argmax() + 1]
    rows = numpy.arange(box.shape[0], dtype=numpy.float32)
    eye_share = numpy.clip((gap_end - rows) / (gap_end - gap_start), 0.0, 1.0)[:, None]

    without_eyes = color.copy()
    without_eyes[top:bottom, left:right] = glass + (box - glass) * (1.0 - eye_share[..., None])
    eyes = numpy.zeros((*color.shape[:2], 4), dtype=numpy.float32)
    eyes[top:bottom, left:right, :3] = glow
    eyes[top:bottom, left:right, 3] = strength * eye_share * 255.0

    weight = eyes[..., 3]
    middle = left + int(numpy.average(numpy.arange(box.shape[1]), weights=weight[top:bottom, left:right].sum(axis=0)))
    centres = []
    for start, end in ((left, middle), (middle, right)):
        part = weight[:, start:end]
        centres.append((start + numpy.average(numpy.arange(end - start), weights=part.sum(axis=0)),
                        numpy.average(numpy.arange(part.shape[0]), weights=part.sum(axis=1))))
    core_color = numpy.median(glow[(strength * eye_share) > 0.9], axis=0)
    halo_color = numpy.median(glow[(strength * eye_share > 0.15) & (strength < 0.4)], axis=0)
    return without_eyes, eyes, centres, (core_color, halo_color)


def draw_think_eyes(shape, centres, colors):
    """Round eyes looking up and aside, in the glow of the real ones."""
    core_color, halo_color = colors
    rows, columns = numpy.mgrid[0:shape[0], 0:shape[1]].astype(numpy.float32)
    radius_x, radius_y = THINK_EYE_RADII
    layer = numpy.zeros((*shape, 4), dtype=numpy.float32)
    for centre_x, centre_y in centres:
        x = (columns - centre_x - THINK_EYE_SHIFT[0]) / radius_x
        y = (rows - centre_y - THINK_EYE_SHIFT[1]) / radius_y
        outside = (numpy.sqrt(x * x + y * y) - 1.0) * radius_x
        core = numpy.clip(0.5 - outside / 2.0, 0.0, 1.0)
        halo = numpy.exp(-0.5 * (numpy.maximum(outside, 0.0) / THINK_HALO_PIXELS) ** 2) * THINK_HALO_STRENGTH
        alpha = numpy.maximum(core, halo)
        is_nearer = alpha * 255.0 > layer[..., 3]
        tint = halo_color + (core_color - halo_color) * core[..., None]
        layer[..., :3] = numpy.where(is_nearer[..., None], tint, layer[..., :3])
        layer[..., 3] = numpy.where(is_nearer, alpha * 255.0, layer[..., 3])
    layer[layer[..., 3] < 2.0] = 0.0
    return layer


def inside_outline(shape, outline):
    """Which pixels lie inside a closed outline, given as its corners (x, y)."""
    rows, columns = numpy.mgrid[0:shape[0], 0:shape[1]].astype(numpy.float32)
    inside = numpy.zeros(shape, dtype=bool)
    for (start_x, start_y), (end_x, end_y) in zip(outline, outline[1:] + outline[:1]):
        if start_y == end_y:
            continue
        crossing = start_x + (rows - start_y) * (end_x - start_x) / (end_y - start_y)
        inside ^= (rows >= min(start_y, end_y)) & (rows < max(start_y, end_y)) & (columns < crossing)
    return inside


def moved(values, shift):
    """Shifted right and down by whole pixels; the pictures have a plain margin, so the wrap is harmless."""
    return numpy.roll(values, (shift[1], shift[0]), axis=(0, 1))


def chest_shift(color, reference):
    """How far to move the waving picture so that its chest lies on the reference's."""
    left, top, right, bottom = CHEST_BOX
    patch = reference[top:bottom, left:right]
    reach = range(-ALIGN_REACH_PIXELS, ALIGN_REACH_PIXELS + 1)
    return min(((x, y) for y in reach for x in reach),
               key=lambda shift: numpy.abs(moved(color, shift)[top:bottom, left:right] - patch).mean())


def wave_body(picture, reference, rest, directory):
    """The robot at rest with its arm swapped for the raised one of the waving picture."""
    color = load(picture)[..., :3]
    if color.shape != reference.shape:
        raise RuntimeError(f'{os.path.basename(picture)} is not the size of the reference')
    alpha, clean = cut_out(color, subject_mask(picture, directory))
    shift = chest_shift(color, reference)
    print(f'{os.path.basename(picture)}: moved {shift[0]}, {shift[1]} to fit the reference')

    share = blur(inside_outline(alpha.shape, ARM_OUTLINE).astype(numpy.float32), ARM_SEAM_PIXELS)
    arm_weight = moved(alpha, shift) * share
    rest_weight = rest[..., 3] / 255.0 * (1.0 - share)
    opacity = arm_weight + rest_weight
    mixed = (moved(clean, shift) * arm_weight[..., None] + rest[..., :3] * rest_weight[..., None]
             ) / numpy.maximum(opacity, 1e-4)[..., None]
    return numpy.concatenate([mixed, opacity[..., None] * 255.0], axis=2)


def past_wrist(shape, lift):
    """How much of each pixel is hand: past the wrist line by `lift` pixels towards the fingers."""
    (start_x, start_y), (end_x, end_y) = WRIST
    rows, columns = numpy.mgrid[0:shape[0], 0:shape[1]].astype(numpy.float32)
    distance = ((end_y - start_y) * (columns - start_x) - (end_x - start_x) * (rows - start_y)
                ) / numpy.hypot(end_x - start_x, end_y - start_y)
    is_hand = (distance > lift) & (columns > HAND_LEFT)
    return blur(is_hand.astype(numpy.float32), WRIST_SEAM_PIXELS)


def with_opacity(layer, share):
    """The layer with its opacity multiplied by a share between 0 and 1."""
    faded = layer.copy()
    faded[..., 3] *= share
    return faded


def is_inside_frame(layer, frame):
    left, top, size = frame
    rows = numpy.flatnonzero(layer[..., 3].any(axis=1))
    columns = numpy.flatnonzero(layer[..., 3].any(axis=0))
    return rows[0] >= top and left <= columns[0] and columns[-1] < left + size


def to_sprite(layer, frame):
    """Places the layer on the square canvas and shrinks it, averaging colours by their opacity."""
    left, top, size = frame
    canvas = numpy.zeros((size, size, 4), dtype=numpy.float32)
    height = min(layer.shape[0] - top, size)
    width = min(layer.shape[1] - left, size)
    canvas[size - height:, :width] = layer[top:top + height, left:left + width]
    alpha = canvas[..., 3:4] / 255.0
    blocks = numpy.concatenate([canvas[..., :3] * alpha, alpha], axis=2).reshape(
        size // SHRINK, SHRINK, size // SHRINK, SHRINK, 4).mean(axis=(1, 3))
    sprite_alpha = blocks[..., 3:4]
    sprite = numpy.concatenate([blocks[..., :3] / numpy.maximum(sprite_alpha, 1e-4), sprite_alpha * 255.0], axis=2)
    return sprite


def frame_around(alpha):
    """A square canvas that centres the robot and stands it on the bottom edge."""
    rows = numpy.flatnonzero(alpha.any(axis=1))
    columns = numpy.flatnonzero(alpha.any(axis=0))
    top, bottom = rows[0], rows[-1] + 1
    left, right = columns[0], columns[-1] + 1
    size = -(-max(bottom - top, right - left) // SHRINK) * SHRINK
    return (left + right - size) // 2, top, size


def main():
    os.makedirs(OUTPUT_DIRECTORY, exist_ok=True)
    color = load(REFERENCE)[..., :3]
    with tempfile.TemporaryDirectory() as directory:
        alpha, clean = cut_out(color, subject_mask(REFERENCE, directory))
        without_eyes, eyes, centres, colors = split_eyes(clean)
        rest = numpy.concatenate([without_eyes, alpha[..., None] * 255.0], axis=2)
        wave = wave_body(WAVE_REFERENCE, color, rest, directory)

    frame = frame_around(alpha)
    left, top, size = frame
    if left < 0:
        raise RuntimeError('The robot is too close to the left edge of the reference to centre')
    if not is_inside_frame(wave, frame):
        raise RuntimeError('The raised arm reaches outside the canvas of mascot.png')
    arm = with_opacity(wave, 1.0 - past_wrist(alpha.shape, WRIST_OVERLAP_PIXELS))
    fade_rows = int(color.shape[0] * FADE_FRACTION)
    for name, body in (('mascot.png', rest), ('mascot-wave.png', arm)):
        body[-fade_rows:, :, 3] *= (numpy.linspace(1.0, 0.0, fade_rows) ** 1.5)[:, None]
        save(os.path.join(OUTPUT_DIRECTORY, name), to_sprite(body, frame))
    save(os.path.join(OUTPUT_DIRECTORY, 'mascot-hand.png'),
         to_sprite(with_opacity(wave, past_wrist(alpha.shape, 0.0)), frame))
    save(os.path.join(OUTPUT_DIRECTORY, 'mascot-eyes.png'), to_sprite(eyes, frame))
    save(os.path.join(OUTPUT_DIRECTORY, 'mascot-eyes-think.png'),
         to_sprite(draw_think_eyes(color.shape[:2], centres, colors), frame))

    offset_y = size - (color.shape[0] - top)
    for name, (x, y) in zip(('left', 'right'), centres):
        print(f'eye {name}: {(x - left) / size * 100:.1f}% {(y - top + offset_y) / size * 100:.1f}%')
    x = sum(centre[0] for centre in centres) / 2
    y = sum(centre[1] for centre in centres) / 2
    print(f'eyes-origin: {(x - left) / size * 100:.1f}% {(y - top + offset_y) / size * 100:.1f}%')
    lean = numpy.degrees(numpy.arctan2(centres[1][1] - centres[0][1], centres[1][0] - centres[0][0]))
    print(f'eyes-lean: {lean:.1f}deg')
    x = (WRIST[0][0] + WRIST[1][0]) / 2
    y = (WRIST[0][1] + WRIST[1][1]) / 2
    print(f'wrist-origin: {(x - left) / size * 100:.1f}% {(y - top + offset_y) / size * 100:.1f}%')


main()
