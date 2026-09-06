#!/usr/bin/env python3
"""Render the profile stats card (light + dark) from live GitHub data.

Written because the public github-readme-stats instance returns 503 often
enough that it would leave a broken image on the profile. This commits a
real SVG instead, refreshed by .github/workflows/refresh-stats.yml.

Requires the `gh` CLI to be authenticated.
"""
import datetime
import json
import pathlib
import subprocess
import sys

USER = "caobo171"
W, H = 1200, 232
PAD = 72
BAR_Y, BAR_H = 168.0, 10.0

THEMES = {
    "dark": {
        "bg_top": "#151B38", "bg_bot": "#0D1122",
        "value": "#F2F4FC", "label": "#9AA4C7", "note": "#7C88B0",
        "accent": "#F0B429", "track": "#2A3157",
    },
    "light": {
        "bg_top": "#F7F8FC", "bg_bot": "#E9EDF7",
        "value": "#131832", "label": "#525C7E", "note": "#6B7699",
        "accent": "#B87A04", "track": "#D3DAEA",
    },
}

SANS = ("Inter,'Segoe UI',Roboto,'Helvetica Neue',"
        "Arial,'Noto Sans','Liberation Sans',sans-serif")


def gh(*args):
    out = subprocess.run(("gh",) + args, capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f"gh {' '.join(args)} failed: {out.stderr.strip()}")
    return out.stdout


def collect():
    year = datetime.date.today().year
    repos = json.loads(gh("api", f"users/{USER}/repos", "--paginate",
                          "--slurp"))
    flat = [r for page in repos for r in page] if repos and isinstance(
        repos[0], list) else repos
    owned = [r for r in flat if not r["fork"]]

    user = json.loads(gh("api", f"users/{USER}"))
    q = ('{ user(login:"%s"){ contributionsCollection'
         '(from:"%d-01-01T00:00:00Z"){ restrictedContributionsCount '
         'contributionCalendar{totalContributions} } } }') % (USER, year)
    contrib = json.loads(gh("api", "graphql", "-f", f"query={q}"))
    cc = contrib["data"]["user"]["contributionsCollection"]

    total = cc["contributionCalendar"]["totalContributions"]
    private = cc["restrictedContributionsCount"]
    return {
        "year": year,
        "total": total,
        "private": private,
        "public": max(0, total - private),
        "repos": len(owned),
        "stars": sum(r["stargazers_count"] for r in owned),
        "followers": user["followers"],
    }


def build(theme_name, d):
    c = THEMES[theme_name]
    stats = [
        (f"Contributions in {d['year']}", f"{d['total']:,}"),
        ("Public repositories", f"{d['repos']:,}"),
        ("Stars earned", f"{d['stars']:,}"),
        ("Followers", f"{d['followers']:,}"),
    ]

    span = W - 2 * PAD
    col = span / len(stats)
    cells = []
    for i, (label, value) in enumerate(stats):
        x = PAD + i * col
        cells.append(
            f'<text x="{x:.0f}" y="52" font-family="{SANS}" font-size="14" '
            f'fill="{c["label"]}">{label}</text>\n  '
            f'<text x="{x:.0f}" y="100" font-family="{SANS}" font-size="38" '
            f'font-weight="700" letter-spacing="-0.8" '
            f'fill="{c["value"]}">{value}</text>'
        )
    cells = "\n  ".join(cells)

    share = d["public"] / d["total"] if d["total"] else 0
    pub_w = max(BAR_H, span * share)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" \
width="{W}" height="{H}" role="img" \
aria-label="{d['total']} contributions in {d['year']}, {d['public']} in \
public repositories and {d['private']} in private ones. {d['repos']} public \
repositories, {d['stars']} stars earned, {d['followers']} followers.">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="{c['bg_top']}"/>
      <stop offset="1" stop-color="{c['bg_bot']}"/>
    </linearGradient>
  </defs>

  <rect width="{W}" height="{H}" fill="url(#bg)"/>

  {cells}

  <rect x="{PAD}" y="{BAR_Y}" width="{span}" height="{BAR_H}" \
rx="{BAR_H / 2}" fill="{c['track']}"/>
  <rect x="{PAD}" y="{BAR_Y}" width="{pub_w:.1f}" height="{BAR_H}" \
rx="{BAR_H / 2}" fill="{c['accent']}"/>

  <text x="{PAD}" y="208" font-family="{SANS}" font-size="14" \
fill="{c['note']}">{d['public']:,} in public repositories, \
{d['private']:,} in private ones</text>
</svg>
'''


def main():
    d = collect()
    out_dir = pathlib.Path(__file__).resolve().parent.parent / "assets"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in THEMES:
        path = out_dir / f"stats-{name}.svg"
        path.write_text(build(name, d), encoding="utf-8")
        print(f"wrote {path.name}")
    print(json.dumps(d, indent=2))


if __name__ == "__main__":
    main()
