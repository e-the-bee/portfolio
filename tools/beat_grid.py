"""Beat and downbeat grid for every song in public/audio, using the Beat This! neural tracker (MIT).

Writes tools/beat-grid.json, which tools/analyze-beats.mjs reads. Dev-only, not part of the site.

Setup (Python 3.10-3.13; torch has no 3.14 wheels yet), from the repo root:
    uv venv --python 3.12 .venv-beats
    uv pip install --python .venv-beats/bin/python -r tools/requirements.txt
Run:
    .venv-beats/bin/python tools/beat_grid.py
Then:
    npm run analyze
"""
import json
from pathlib import Path

from beat_this.inference import File2Beats

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'public' / 'audio'
OUT = ROOT / 'tools' / 'beat-grid.json'

try:
    import torch
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
except ImportError:
    device = 'cpu'

# Plain peak picking, no DBN: the paper finds the DBN does not improve beat F1 and it needs madmom.
f2b = File2Beats(device=device, dbn=False)
out = {}
for mp3 in sorted(AUDIO.glob('*.mp3')):
    beats, downbeats = f2b(str(mp3))
    out[f'/audio/{mp3.name}'] = {
        'beats': [round(float(t), 3) for t in beats],
        'downbeats': [round(float(t), 3) for t in downbeats],
    }
    print(mp3.name, len(beats), 'beats', len(downbeats), 'downbeats')

OUT.write_text(json.dumps(out))
