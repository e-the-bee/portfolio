import random, math, os, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
COL = {'r': '#e60012', 'b': '#f2f0e6', 'k': '#0b0b0b', 'g': '#2a2a28'}


def P(pts):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)


def poly(pts, fill):
    return f'<polygon points="{P(pts)}" fill="{fill}"/>'


def svg(w, h, body, par='none'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="{par}">{body}</svg>'


def save(name, w, h, body, par='none'):
    with open(f'{OUT}/{name}.svg', 'w') as f:
        f.write(svg(w, h, body, par))


# ---------- button hover slabs (cut-paper parallelograms with detached chips) ----------
def slab(rnd, x0, y0, w, h, skew, amp, n=7, m=3):
    pts = []
    for i in range(n + 1):
        pts.append((x0 + skew + (w - skew) * i / n + rnd.uniform(-8, 8), y0 + rnd.uniform(0, amp)))
    for j in range(1, m + 1):
        t = j / (m + 1)
        pts.append((x0 + w - skew * t + rnd.uniform(-amp, 0), y0 + h * t + rnd.uniform(-6, 6)))
    for i in range(n, -1, -1):
        pts.append((x0 + (w - skew) * i / n + rnd.uniform(-8, 8), y0 + h - rnd.uniform(0, amp)))
    for j in range(m, 0, -1):
        t = j / (m + 1)
        pts.append((x0 + skew * (1 - t) + rnd.uniform(0, amp), y0 + h * t + rnd.uniform(-6, 6)))
    return pts


def hv(name, seed, color, skew, flip):
    rnd = random.Random(seed)
    W, H = 440, 150
    pts = slab(rnd, 20, 18, 400, 114, skew, 16)
    body = poly(pts, COL[color])
    for k in range(4):
        cx = rnd.choice([rnd.uniform(4, 36), rnd.uniform(404, 436)])
        cy = rnd.uniform(8, 142)
        s = rnd.uniform(5, 12)
        body += poly([(cx, cy - s), (cx + s, cy + s * .6), (cx - s * .8, cy + s * .8)], COL[color])
    if flip:
        body = f'<g transform="translate({W},0) scale(-1,1)">{body}</g>'
    save(name, W, H, body)


for i, (sr, sk, fl) in enumerate([(11, 26, False), (12, 14, True), (13, 36, False)], 1):
    hv(f'hv{i}-r', sr, 'r', sk, fl)
for i, (sr, sk, fl) in enumerate([(21, 18, True), (22, 32, False), (23, 10, True)], 1):
    hv(f'hv{i}-b', sr, 'b', sk, fl)
for i, (sr, sk, fl) in enumerate([(14, 20, False), (15, 30, True), (16, 12, False)], 1):
    hv(f'hv{i}-k', sr, 'k', sk, fl)


# ---------- torn strip ----------
def torn(name, seed, color, W=600, H=90):
    rnd = random.Random(seed)
    top = []
    x = 0
    while x < W:
        top.append((x, rnd.uniform(4, 16) + (rnd.uniform(0, 16) if rnd.random() < .12 else 0)))
        x += rnd.uniform(8, 26)
    top.append((W, rnd.uniform(4, 16)))
    bot = []
    x = W
    while x > 0:
        bot.append((x, H - rnd.uniform(4, 16) - (rnd.uniform(0, 16) if rnd.random() < .12 else 0)))
        x -= rnd.uniform(8, 26)
    bot.append((0, H - rnd.uniform(4, 16)))
    save(name, W, H, poly(top + bot, COL[color]))


torn('torn-g', 31, 'g')
torn('torn-b', 32, 'b')
torn('torn-r', 33, 'r')


# ---------- brush stroke ----------
def brush(name, seed, color, W=640, H=130):
    rnd = random.Random(seed)
    n = 26
    top, bot = [], []
    for i in range(n + 1):
        t = i / n
        x = 14 + (W - 130) * t
        prof = math.sin(math.pi * min(1, t * 1.12)) ** .6
        half = 32 * prof + 8
        cy = H / 2 + 8 * math.sin(t * 3) + rnd.uniform(-3, 3)
        top.append((x, cy - half - rnd.uniform(0, 6)))
        bot.append((x, cy + half + rnd.uniform(0, 6)))
    body = poly(top + bot[::-1], COL[color])
    for k in range(6):
        y = H / 2 - 32 + k * 12.5 + rnd.uniform(-3, 3)
        x1 = W - 135 + rnd.uniform(0, 24)
        x2 = x1 + rnd.uniform(50, 110)
        h = rnd.uniform(4, 7)
        body += poly([(x1, y), (x2, y + rnd.uniform(-2, 2)), (x2, y + h), (x1, y + h)], COL[color])
    save(name, W, H, body)


brush('brush-r', 41, 'r')
brush('brush-b', 42, 'b')


# ---------- ink splat ----------
def splat(name, seed, color):
    rnd = random.Random(seed)
    cx = cy = 200
    N = 30
    pts = []
    for i in range(N):
        a = 2 * math.pi * i / N
        r = 92 + rnd.uniform(-18, 26)
        if i % 7 == 0:
            r += rnd.uniform(35, 60)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    body = poly(pts, COL[color])
    for k in range(10):
        a = rnd.uniform(0, 2 * math.pi)
        d = rnd.uniform(140, 186)
        r = rnd.uniform(5, 17)
        body += f'<circle cx="{cx + d * math.cos(a):.1f}" cy="{cy + d * math.sin(a):.1f}" r="{r:.1f}" fill="{COL[color]}"/>'
    save(name, 400, 400, body, 'xMidYMid meet')


splat('splat-r', 51, 'r')
splat('splat-b', 52, 'b')
splat('splat-g', 53, 'g')


# ---------- broken-glass shards ----------
def shard(name, seed, color):
    rnd = random.Random(seed)
    cx = cy = 150
    body = ''
    for k in range(5):
        a = -math.pi / 2 + rnd.uniform(-.5, .5) + k * 1.25
        L = rnd.uniform(95, 140)
        w = rnd.uniform(14, 34)
        tip = (cx + L * math.cos(a), cy + L * math.sin(a))
        b1 = (cx + w * math.cos(a + math.pi / 2) + rnd.uniform(-8, 8), cy + w * math.sin(a + math.pi / 2) + rnd.uniform(-8, 8))
        b2 = (cx + w * math.cos(a - math.pi / 2) + rnd.uniform(-8, 8), cy + w * math.sin(a - math.pi / 2) + rnd.uniform(-8, 8))
        mid = (cx + L * .55 * math.cos(a) + rnd.uniform(-14, 14), cy + L * .55 * math.sin(a) + rnd.uniform(-14, 14))
        body += poly([b1, mid, tip, b2], COL[color])
    save(name, 300, 300, body, 'xMidYMid meet')


shard('shard-b', 61, 'b')
shard('shard-r', 62, 'r')
shard('shard-g', 63, 'g')


# ---------- speed-line burst ----------
def burst(name, seed, color):
    rnd = random.Random(seed)
    N = 22
    pts = []
    for i in range(2 * N):
        a = math.pi * i / N + rnd.uniform(-.03, .03)
        r = rnd.uniform(160, 198) if i % 2 == 0 else rnd.uniform(66, 98)
        pts.append((200 + r * math.cos(a), 200 + r * math.sin(a)))
    save(name, 400, 400, poly(pts, COL[color]), 'xMidYMid meet')


burst('burst-r', 71, 'r')
burst('burst-b', 72, 'b')
burst('burst-k', 73, 'k')


# ---------- wedges ----------
def wedge(name, seed, color):
    rnd = random.Random(seed)
    j = lambda v: v + rnd.uniform(-10, 10)
    body = poly([(j(20), j(280)), (j(205), j(256)), (j(130), j(36))], COL[color])
    body += poly([(j(150), j(292)), (j(288), j(252)), (j(246), j(110))], COL[color])
    save(name, 300, 300, body, 'xMidYMid meet')


wedge('wedge-b', 81, 'b')
wedge('wedge-r', 82, 'r')


# ---------- halftone patch ----------
def dots(name, color):
    W, H = 300, 200
    body = ''
    step = 16
    for gy in range(0, H // step + 1):
        for gx in range(0, W // step + 1):
            x = gx * step + (step / 2 if gy % 2 else 0)
            y = gy * step
            d = math.hypot((x - 70) / 1.25, (y - 70)) / 190
            r = 6.5 * (1 - d)
            if r > 1.2:
                body += f'<circle cx="{x}" cy="{y}" r="{r:.1f}" fill="{COL[color]}"/>'
    save(name, W, H, body)


dots('dots-r', 'r')


# ---------- scratch lines ----------
def scratch(name, seed, color):
    rnd = random.Random(seed)
    body = ''
    for i in range(16):
        x = 10 + i * 14 + rnd.uniform(-3, 3)
        y1 = rnd.uniform(0, 70)
        y2 = rnd.uniform(130, 200)
        body += f'<line x1="{x + 60:.1f}" y1="{y1:.1f}" x2="{x:.1f}" y2="{y2:.1f}" stroke="{COL[color]}" stroke-width="{rnd.uniform(2, 4):.1f}"/>'
    save(name, 260, 200, body)


scratch('scratch-b', 91, 'b')


# ---------- tape ----------
def tape(name, color):
    pts = [(14, 8), (286, 8)]
    for k, y in enumerate([20, 32, 44, 56, 68]):
        pts.append((296 if k % 2 == 0 else 284, y))
    pts += [(286, 72)]
    pts += [(14, 72)]
    for k, y in enumerate([60, 48, 36, 24, 12]):
        pts.append((4 if k % 2 == 0 else 16, y))
    save(name, 300, 80, poly(pts, COL[color]))


tape('tape-b', 'b')


# ---------- crack / lightning ----------
def crack(name, color):
    pts = [(118, 0), (62, 150), (112, 158), (28, 300), (92, 306), (44, 420), (156, 252), (104, 244), (172, 124), (126, 116), (176, 0)]
    save(name, 200, 420, poly(pts, COL[color]))


crack('crack-b', 'b')


# ---------- scribble underline ----------
def scribble(name, color):
    rnd = random.Random(101)
    pts = []
    x = 8
    up = True
    while x < 314:
        pts.append((x, (9 if up else 35) + rnd.uniform(-3, 3)))
        up = not up
        x += 21
    body = f'<polyline points="{P(pts)}" fill="none" stroke="{COL[color]}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>'
    save(name, 320, 44, body)


scribble('scribble-r', 'r')


# ---------- rough stamp ring ----------
def stamp(name, color):
    rnd = random.Random(111)
    N = 56
    outer, inner = [], []
    for i in range(N):
        a = 2 * math.pi * i / N
        ro = 134 + rnd.uniform(-6, 6)
        ri = 104 + rnd.uniform(-6, 6)
        outer.append((150 + ro * math.cos(a), 150 + ro * math.sin(a)))
        inner.append((150 + ri * math.cos(a), 150 + ri * math.sin(a)))
    body = f'<path fill-rule="evenodd" fill="{COL[color]}" d="M{P(outer)}Z M{P(inner)}Z"/>'
    save(name, 300, 300, body, 'xMidYMid meet')


stamp('stamp-b', 'b')

print(len(os.listdir(OUT)), 'files')
