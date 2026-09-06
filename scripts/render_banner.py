#!/usr/bin/env python3
"""Generate the profile banner in light and dark variants.

The waveform decays from left to right: speech resolving into a written
line, which is what WELE (dictation practice) actually does.
"""
import math
import pathlib

W, H = 1200, 292
PAD = 72
BAR_W, GAP = 5.0, 7.0
CY = 214.0          # waveform centre line, clear of the tagline descenders
MAX_A = 52.0        # max amplitude (half-height)

THEMES = {
    "dark": {
        "bg_top": "#151B38", "bg_bot": "#0D1122",
        "name": "#F2F4FC", "muted": "#9AA4C7", "handle": "#7C88B0",
        "wave_a": "#FFC94D", "wave_b": "#E89F12",
        "rule": "#2A3157",
    },
    "light": {
        "bg_top": "#F7F8FC", "bg_bot": "#E9EDF7",
        "name": "#131832", "muted": "#525C7E", "handle": "#6B7699",
        "wave_a": "#E5A310", "wave_b": "#B87A04",
        "rule": "#D3DAEA",
    },
}

SANS = ("Inter,'Segoe UI',Roboto,'Helvetica Neue',"
        "Arial,'Noto Sans','Liberation Sans',sans-serif")
MONO = ("ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,"
        "'DejaVu Sans Mono',monospace")


def amplitudes(n):
    """Envelope decays to a flat line; noise is deterministic, not random."""
    out = []
    for i in range(n):
        t = i / (n - 1)
        envelope = (1.0 - t) ** 1.7
        # Layered sines stand in for speech texture, stable across runs.
        noise = (0.55
                 + 0.30 * math.sin(i * 0.9)
                 + 0.22 * math.sin(i * 2.3 + 1.1)
                 + 0.14 * math.sin(i * 0.37 + 0.4))
        noise = max(0.12, min(1.0, noise))
        a = MAX_A * envelope * noise
        out.append(max(2.0, a))
    return out


def build(theme_name):
    c = THEMES[theme_name]
    span = W - 2 * PAD
    n = int((span + GAP) // (BAR_W + GAP))
    amps = amplitudes(n)

    bars = []
    for i, a in enumerate(amps):
        x = PAD + i * (BAR_W + GAP)
        bars.append(
            f'<rect x="{x:.1f}" y="{CY - a:.1f}" width="{BAR_W}" '
            f'height="{2 * a:.1f}" rx="{BAR_W / 2:.1f}" fill="url(#wave)"/>'
        )
    bars = "\n    ".join(bars)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" \
width="{W}" height="{H}" role="img" \
aria-label="Nguyen Van Cao, @caobo171 - still trying to become a real engineer">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="{c['bg_top']}"/>
      <stop offset="1" stop-color="{c['bg_bot']}"/>
    </linearGradient>
    <linearGradient id="wave" x1="{PAD}" y1="0" x2="{W - PAD}" y2="0" \
gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{c['wave_a']}"/>
      <stop offset="0.62" stop-color="{c['wave_b']}"/>
      <stop offset="1" stop-color="{c['wave_b']}"/>
    </linearGradient>
  </defs>

  <rect width="{W}" height="{H}" fill="url(#bg)"/>

  <text x="{PAD}" y="98" font-family="{SANS}" font-size="52" font-weight="700"
        letter-spacing="-1.1" fill="{c['name']}">Nguy&#x1EC5;n V&#x103;n Cao</text>

  <text x="{PAD}" y="136" font-family="{SANS}" font-size="19" font-weight="400"
        fill="{c['muted']}">still trying to become a real engineer</text>

  <text x="{W - PAD}" y="98" font-family="{MONO}" font-size="18"
        text-anchor="end" fill="{c['handle']}">@caobo171</text>

  <line x1="{PAD}" y1="{CY}" x2="{W - PAD}" y2="{CY}" stroke="{c['rule']}"
        stroke-width="1"/>

  <g>
    {bars}
  </g>
</svg>
'''


out_dir = pathlib.Path(__file__).resolve().parent.parent / "assets"
out_dir.mkdir(parents=True, exist_ok=True)
for name in THEMES:
    path = out_dir / f"banner-{name}.svg"
    path.write_text(build(name), encoding="utf-8")
    print(f"wrote {path} ({path.stat().st_size} bytes)")
