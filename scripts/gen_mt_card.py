import json
import os
import urllib.request

API_URL = "https://api.monkeytype.com/users/011sam110/profile"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "monkeytype-card.svg")


def fetch():
    req = urllib.request.Request(API_URL, headers={"User-Agent": "MonkeyType-README-Card/1.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read()).get("data", {})


def best(pb, category, key):
    entries = pb.get(category, {}).get(str(key), [])
    if not entries:
        return "—", "—"
    b = max(entries, key=lambda x: x.get("wpm", 0))
    return f"{b['wpm']:.0f}", f"{b['acc']:.0f}%"


def col_svg(x, wpm, acc, label):
    return f"""
  <text x="{x}" y="98" text-anchor="middle" font-family="'Courier New',Courier,monospace" font-size="30" font-weight="700" fill="#FF6B35">{wpm}</text>
  <text x="{x}" y="116" text-anchor="middle" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="#888888">wpm</text>
  <text x="{x}" y="133" text-anchor="middle" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="12" fill="#AAAAAA">{label}</text>
  <text x="{x}" y="150" text-anchor="middle" font-family="'Courier New',Courier,monospace" font-size="11" fill="#666666">{acc} acc</text>"""


def generate(stats):
    pb = stats.get("personalBests", {})
    tests = stats.get("typingStats", {}).get("completedTests", 0)

    wpm_15,  acc_15  = best(pb, "time",  15)
    wpm_30,  acc_30  = best(pb, "time",  30)
    wpm_25,  acc_25  = best(pb, "words", 25)
    wpm_100, acc_100 = best(pb, "words", 100)

    cols = (
        col_svg(80,  wpm_15,  acc_15,  "15 sec") +
        col_svg(195, wpm_30,  acc_30,  "30 sec") +
        col_svg(310, wpm_25,  acc_25,  "25 words") +
        col_svg(420, wpm_100, acc_100, "100 words")
    )

    svg = f"""<svg width="495" height="175" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="175" rx="8" fill="#161616" stroke="#2A2A2A" stroke-width="1"/>

  <!-- keyboard icon -->
  <g transform="translate(22,16)" fill="none" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="3" width="20" height="14" rx="2"/>
    <path d="M5 7h.01M9 7h.01M13 7h.01M17 7h.01M7 11h.01M11 11h.01M15 11h.01M6 15h10"/>
  </g>

  <!-- header -->
  <text x="50" y="30" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="14" font-weight="600" fill="#F5F5F5">MonkeyType</text>
  <text x="144" y="30" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="14" fill="#444444"> · </text>
  <text x="158" y="30" font-family="'Courier New',Courier,monospace" font-size="13" fill="#FF6B35">011sam110</text>

  <!-- separator -->
  <line x1="22" y1="42" x2="473" y2="42" stroke="#2A2A2A" stroke-width="1"/>

  <!-- column dividers -->
  <line x1="138" y1="55" x2="138" y2="158" stroke="#2A2A2A" stroke-width="1"/>
  <line x1="253" y1="55" x2="253" y2="158" stroke="#2A2A2A" stroke-width="1"/>
  <line x1="368" y1="55" x2="368" y2="158" stroke="#2A2A2A" stroke-width="1"/>

  <!-- stats -->
  {cols}

  <!-- footer separator -->
  <line x1="22" y1="160" x2="473" y2="160" stroke="#2A2A2A" stroke-width="1"/>

  <!-- footer -->
  <text x="247" y="171" text-anchor="middle" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="10" fill="#555555">{tests} tests completed · auto-updated daily</text>
</svg>"""
    return svg


if __name__ == "__main__":
    stats = fetch()
    svg = generate(stats)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"Card written to {OUT_PATH}")
