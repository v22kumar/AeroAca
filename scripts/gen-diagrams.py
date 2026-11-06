#!/usr/bin/env python3
"""Generate the teaching diagrams under public/diagrams as clean, mobile-readable SVG.

Run: python3 scripts/gen-diagrams.py
Every diagram is drawn from data in this file so it can be corrected and regenerated; the SVGs are
committed because the app serves them statically. Colours follow the app's tokens and switch for dark
mode through a media query inside each file. docs/DIAGRAM_INDEX.md lists each diagram and where it is used.
"""
from pathlib import Path
import html

OUT = Path(__file__).resolve().parent.parent / "public" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

STYLE = """
<style>
  .bg{fill:#ffffff}.ink{fill:#1f2430}.ink2{fill:#4b5160}.ink3{fill:#6b7280}
  .ln{stroke:#4b5160;fill:none;stroke-width:1.6}.ln2{stroke:#9aa0ad;fill:none;stroke-width:1.2;stroke-dasharray:4 3}
  .box{fill:#f3f4f7;stroke:#9aa0ad;stroke-width:1.2}.boxa{fill:#f9e4ec;stroke:#a63a66;stroke-width:1.4}
  .boxb{fill:#fdf1d8;stroke:#b7791f;stroke-width:1.4}.boxg{fill:#e3f3e8;stroke:#2f8f5b;stroke-width:1.4}
  .acc{fill:#a63a66}.amb{fill:#b7791f}.grn{fill:#2f8f5b}.sig{stroke:#1f2430;fill:none;stroke-width:2}
  .siga{stroke:#a63a66;fill:none;stroke-width:2}.sigb{stroke:#b7791f;fill:none;stroke-width:2}
  text{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px}
  .t{font-size:13px;font-weight:600}.s{font-size:11px}.m{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
  .ttl{font-size:14px;font-weight:700}
  @media (prefers-color-scheme: dark){
    .bg{fill:#171a21}.ink{fill:#e8e6ea}.ink2{fill:#c3c6cf}.ink3{fill:#9aa0ad}
    .ln{stroke:#c3c6cf}.ln2{stroke:#6b7280}.box{fill:#242a35;stroke:#6b7280}.boxa{fill:#3b1f2d;stroke:#f08cb3}
    .boxb{fill:#3a2e14;stroke:#e0a83a}.boxg{fill:#16301f;stroke:#5fcf8a}.acc{fill:#f08cb3}.amb{fill:#e0a83a}.grn{fill:#5fcf8a}
    .sig{stroke:#e8e6ea}.siga{stroke:#f08cb3}.sigb{stroke:#e0a83a}
  }
</style>
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#4b5160"/></marker></defs>
"""

def esc(s): return html.escape(str(s), quote=True)

def svg(name, w, h, body, title):
    h = h + 44
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t">'
           f'<title id="t">{esc(title)}</title>{STYLE}<rect class="bg" x="0" y="0" width="{w}" height="{h}" rx="12"/>{body}</svg>')
    (OUT / f"{name}.svg").write_text(doc.strip() + "\n")

def wrap(s, n):
    words, lines, cur = s.split(" "), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > n:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w) if cur else w
    if cur: lines.append(cur)
    return lines

def text(x, y, s, cls="ink", anchor="start", extra=""):
    """Single-line text; long centred small captions wrap into tspans so nothing runs past the edge."""
    limit = 82 if (" m" in f" {cls} " or cls == "m") else (100 if (" s" in f" {cls} " or cls.endswith(" s") or cls == "s") else 78)
    if anchor == "middle" and len(s) > limit:
        lines = wrap(s, limit)
        spans = "".join(f'<tspan x="{x}" dy="{0 if i == 0 else 14}">{esc(l)}</tspan>' for i, l in enumerate(lines))
        return f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}" {extra}>{spans}</text>'
    return f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}" {extra}>{esc(s)}</text>'

def notes(x, y, items, limit=100):
    """Stack several caption sentences, each wrapped, so lines never overlap. items: list of (text, cls)."""
    out, yy = "", y
    for t, cls in items:
        lines = wrap(t, 82 if (" m" in f" {cls} " or cls == "m") else (limit if (" s" in f" {cls} " or cls == "s") else 78))
        spans = "".join(f'<tspan x="{x}" dy="{0 if i == 0 else 14}">{esc(l)}</tspan>' for i, l in enumerate(lines))
        out += f'<text class="{cls}" x="{x}" y="{yy}" text-anchor="middle">{spans}</text>'
        yy += 14 * len(lines) + 6
    return out

def box(x, y, w, h, label, cls="box", sub=None, tcls="ink t"):
    out = f'<rect class="{cls}" x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/>'
    if sub is None:
        out += text(x + w / 2, y + h / 2 + 5, label, tcls, "middle")
    else:
        out += text(x + w / 2, y + h / 2 - 3, label, tcls, "middle") + text(x + w / 2, y + h / 2 + 13, sub, "ink2 s", "middle")
    return out

def arrow(x1, y1, x2, y2, label=None, cls="ln", lx=None, ly=None):
    out = f'<line class="{cls}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" marker-end="url(#ar)"/>'
    if label:
        out += text(lx if lx is not None else (x1 + x2) / 2, ly if ly is not None else (y1 + y2) / 2 - 6, label, "ink2 s", "middle")
    return out

def line(x1, y1, x2, y2, cls="ln"):
    return f'<line class="{cls}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'

def path(d, cls="sig"):
    return f'<path class="{cls}" d="{d}"/>'

def waveform(bits, x0, y_hi, y_lo, bw, cls="sig"):
    """Digital waveform from a string of 0/1 per bit cell."""
    d = ""
    prev = None
    for i, b in enumerate(bits):
        y = y_hi if b == "1" else y_lo
        x = x0 + i * bw
        if prev is None:
            d += f"M{x},{y} "
        elif y != prev:
            d += f"L{x},{prev} L{x},{y} "
        d += f"L{x + bw},{y} "
        prev = y
    return path(d, cls)

def bitfield(fields, x0, y0, total_w, h, bit_h=14):
    """fields: list of (label, nbits, cls, sublabel). Draws proportional cells with bit numbers."""
    n = sum(f[1] for f in fields)
    cw = total_w / n
    out = ""
    pos = 0
    for label, nb, cls, sub in fields:
        x = x0 + pos * cw
        w = nb * cw
        out += f'<rect class="{cls}' + f'" x="{x:.1f}" y="{y0}" width="{w:.1f}" height="{h}" rx="4"/>'
        out += text(x + w / 2, y0 + h / 2 + 4, label, "ink t" if w > 60 else "ink s", "middle")
        if sub:
            row = 0 if (len([f for f in fields[: fields.index((label, nb, cls, sub))]]) % 2 == 0) else 1
            out += text(x + w / 2, y0 + h + 14 + row * 14, sub, "ink2 s", "middle")
        pos += nb
    return out

def flow_v(steps, x, y0, w, h, gap, cls_list=None):
    out = ""
    for i, s in enumerate(steps):
        cls = cls_list[i] if cls_list else "box"
        if isinstance(s, tuple):
            out += box(x, y0 + i * (h + gap), w, h, s[0], cls, s[1])
        else:
            out += box(x, y0 + i * (h + gap), w, h, s, cls)
        if i < len(steps) - 1:
            yy = y0 + i * (h + gap) + h
            out += arrow(x + w / 2, yy, x + w / 2, yy + gap - 2)
    return out

def timeline(rows, x0, y0, scale, segs, total, row_h=30, label_w=60, ticks=None, unit="ms"):
    """rows: list of names; segs: list of (row, from, to, cls, label)."""
    out = ""
    for i, r in enumerate(rows):
        y = y0 + i * row_h
        out += text(x0 + label_w - 8, y + row_h / 2 + 4, r, "ink t", "end")
        out += line(x0 + label_w, y + row_h - 2, x0 + label_w + total * scale, y + row_h - 2, "ln2")
    for row, a, b, cls, lab in segs:
        i = rows.index(row)
        y = y0 + i * row_h + 4
        out += f'<rect class="{cls}" x="{x0 + label_w + a * scale:.1f}" y="{y}" width="{max(1.5, (b - a) * scale):.1f}" height="{row_h - 10}" rx="3"/>'
        if lab:
            out += text(x0 + label_w + (a + b) / 2 * scale, y + (row_h - 10) / 2 + 4, lab, "ink s", "middle")
    yb = y0 + len(rows) * row_h + 6
    out += line(x0 + label_w, yb, x0 + label_w + total * scale, yb)
    for t in (ticks or range(0, int(total) + 1, max(1, int(total // 10)))):
        xx = x0 + label_w + t * scale
        out += line(xx, yb, xx, yb + 4) + text(xx, yb + 16, str(t), "ink3 s", "middle")
    out += text(x0 + label_w + total * scale + 22, yb + 16, unit, "ink3 s", "start")
    return out

# ----------------------------------------------------------------------------- diagrams

def d_pathways_map():
    b = text(320, 26, "Four pathways over shared foundations", "ink ttl", "middle")
    b += f'<rect class="box" x="20" y="250" width="600" height="60" rx="8"/>' + text(320, 272, "Shared foundations: modules 1 to 16", "ink t", "middle") + text(320, 290, "fundamentals · PCB · MCU · interfaces · C · C++ · firmware · RTOS · Linux · instruments · integration · verification · Python · standards · applications · communication", "ink2 s", "middle")
    cols = [
        ("A  Embedded & Electronics R&D", "20, 22, 23 · 18.4–18.7 · 17.3–17.5 · 21.3–21.4 · later 31", "boxa", "principal, long term"),
        ("B  Aerospace & Systems", "17, 18, 19, 20, 21, 24, 25 · 26, 27 · 30 optional", "boxa", "principal, best now"),
        ("C  AI & Intelligent Systems", "28, 27, 26, 29, 30 · 22", "box", "optional, after the core"),
        ("D  Leadership & Ownership", "31 · 17, 19, 21, 25", "box", "long-term extension"),
    ]
    for i, (t, mods, cls, note) in enumerate(cols):
        x = 20 + i * 150
        b += f'<rect class="{cls}" x="{x}" y="50" width="140" height="172" rx="10"/>'
        b += text(x + 70, 72, t.split("  ")[0], "acc ttl", "middle")
        for j, part in enumerate(t.split("  ")[1].split(" & ")):
            b += text(x + 70, 92 + j * 16, part if j == 0 else "& " + part, "ink t", "middle")
        words = mods.split(" · ")
        for j, wds in enumerate(words):
            b += text(x + 70, 134 + j * 14, wds, "ink2 s", "middle")
        b += text(x + 70, 212, note, "ink3 s", "middle")
        b += arrow(x + 70, 248, x + 70, 226)
    b += text(320, 332, "One lesson can serve several pathways. Switching pathway changes order, never progress.", "ink3 s", "middle")
    svg("pathways-map", 640, 344, b, "Four career pathways built on the shared foundation modules 1 to 16")

def d_study_journey():
    b = text(320, 26, "Study journey: refresh and defend, build evidence, go deep", "ink ttl", "middle")
    phases = [
        ("Weeks 1–4", "Refresh & defend", ["25 interviews · 18 buses", "19 voting · 17.1–17.3", "20.1–20.2 timing", "frame parser (5, 23)"], "Claims defensible; one component built, broken, tested", "boxa"),
        ("Weeks 5–8", "Build evidence", ["17.4–17.7 coverage", "19.3–19.4 voter lab", "21.1–21.3 HIL, faults", "22 pytest · 23 GDB"], "Portfolio stages 2–4; automation with a report", "boxb"),
        ("Weeks 9–12", "Depth", ["21.4–21.5 injection", "24 control · 23.4–23.5", "20.5 WCET · 14 one-pagers", "25.4–25.5 negotiation"], "Stages 5–7; Tier-2 mock panels", "boxg"),
    ]
    for i, (wk, name, items, ev, cls) in enumerate(phases):
        x = 20 + i * 205
        b += f'<rect class="{cls}" x="{x}" y="44" width="190" height="212" rx="10"/>'
        b += text(x + 95, 66, wk, "ink3 s", "middle") + text(x + 95, 86, name, "ink ttl", "middle")
        for j, it in enumerate(items):
            b += text(x + 12, 112 + j * 18, "• " + it, "ink2 s")
        b += line(x + 12, 188, x + 178, 188, "ln2")
        b += text(x + 95, 206, "Evidence:", "ink3 s", "middle")
        for j, part in enumerate(wrap(ev, 30)):
            b += text(x + 95, 222 + j * 14, part, "ink s", "middle")
        if i < 2:
            b += arrow(x + 190, 142, x + 205, 142)
    b += text(320, 276, "Apply for roles from week one. The order holds even if the dates slide.", "ink3 s", "middle")
    svg("study-journey", 640, 290, b, "The three phases of the 30, 60 and 90 day study plan with the modules and evidence of each")

def d_power_tree():
    b = text(320, 24, "A power tree, and where the rail actually sags", "ink ttl", "middle")
    b += box(250, 40, 140, 40, "USB input 5 V", "box", "budget 500 mA")
    b += box(60, 120, 170, 44, "Buck 3.3 V digital", "boxa", "min input 4.0 V · 1 A")
    b += box(260, 120, 150, 44, "LDO 3.3 V analogue", "boxa", "min input 3.6 V · 12 mW")
    b += box(440, 120, 150, 44, "Internal 1.2 V core", "box", "inside the MCU")
    b += arrow(300, 80, 145, 118) + arrow(320, 80, 335, 118) + arrow(340, 80, 500, 118)
    b += box(20, 210, 90, 40, "MCU", "box", "60 mA") + box(120, 210, 90, 40, "Flash", "box", "20 mA")
    b += f'<rect class="boxb" x="230" y="200" width="150" height="56" rx="8"/>' + text(305, 222, "Radio", "ink t", "middle") + text(305, 238, "800 mA for 20 ms", "ink2 s", "middle") + text(305, 250, "sees 2.98 V, not 3.30 V", "amb s", "middle")
    b += box(400, 210, 100, 40, "Sensor", "box", "resets < 3.0 V")
    b += arrow(100, 164, 65, 208) + arrow(145, 164, 165, 208)
    b += f'<line class="sigb" x1="190" y1="164" x2="300" y2="198"/>' + text(215, 190, "40 cm trace + connector ≈ 0.4 Ω", "amb s", "middle")
    b += arrow(335, 164, 450, 208)
    b += text(320, 282, "sag = I × R = 0.8 A × 0.4 Ω = 0.32 V. Measure at the load, under load, with a scope.", "ink2 s", "middle")
    svg("power-tree", 640, 300, b, "Power tree from a 5 volt input through a buck and an LDO to loads, with the trace resistance that makes the radio's rail sag")

def d_rc_step():
    b = text(320, 24, "RC step response: one time constant covers 63 %", "ink ttl", "middle")
    x0, y0, w, h = 60, 50, 540, 170
    b += line(x0, y0 + h, x0 + w, y0 + h) + line(x0, y0, x0, y0 + h)
    import math
    pts = []
    for i in range(0, 541, 4):
        t = i / 540 * 6
        v = 1 - math.exp(-t)
        pts.append(f"{x0 + i},{y0 + h - v * h}")
    b += path("M" + " L".join(pts), "siga")
    for n, label in [(1, "63 %"), (3, "95 %"), (5, "99 %")]:
        x = x0 + n / 6 * w
        v = 1 - math.exp(-n)
        y = y0 + h - v * h
        b += line(x, y, x, y0 + h, "ln2") + line(x0, y, x, y, "ln2")
        b += text(x, y0 + h + 16, f"{n}τ", "ink t", "middle") + text(x0 - 6, y + 4, label, "ink2 s", "end")
    b += text(x0 - 6, y0 - 6, "100 %", "ink2 s", "end") + text(x0 + w, y0 + h + 16, "time", "ink3 s", "end")
    b += text(320, 262, "τ = R × C. Time to reach a threshold: t = −τ ln(1 − V/Vfinal). Cutoff of the RC filter: f = 1 / (2πRC).", "ink2 s", "middle")
    svg("rc-step-response", 640, 280, b, "Exponential RC step response with the 63, 95 and 99 percent points at one, three and five time constants")

def d_mosfet_switch():
    b = text(320, 24, "An N-channel MOSFET as a low-side switch", "ink ttl", "middle")
    # V+ rail
    b += line(300, 50, 560, 50) + text(300, 44, "V+ 12 V", "ink t")
    # load between rail and drain
    b += line(400, 50, 400, 70) + f'<rect class="boxa" x="372" y="70" width="56" height="40" rx="6"/>' + text(400, 94, "Load", "ink t", "middle") + line(400, 110, 400, 132)
    # flyback diode in parallel with the load (cathode to V+)
    b += line(400, 60, 480, 60) + line(480, 60, 480, 78) + f'<path class="ln" d="M470,96 L490,96 L480,78 z"/>' + line(470, 78, 490, 78) + line(480, 96, 480, 120) + line(480, 120, 400, 120)
    b += text(496, 92, "flyback diode", "ink2 s")
    # MOSFET symbol: drain at top (400,132), source at bottom, gate at left
    b += line(400, 132, 400, 142) + line(400, 142, 372, 142) + line(372, 136, 372, 170) + line(360, 140, 360, 166)
    b += line(372, 164, 400, 164) + line(400, 164, 400, 186)
    b += text(410, 140, "D", "ink2 s") + text(410, 172, "S", "ink2 s") + text(352, 158, "G", "ink2 s", "end")
    # gate drive
    b += box(40, 130, 120, 46, "MCU GPIO", "box", "3.3 V logic")
    b += line(160, 153, 230, 153) + f'<rect class="box" x="230" y="143" width="64" height="20" rx="3"/>' + text(262, 157, "Rg 100 Ω", "ink s", "middle") + line(294, 153, 360, 153)
    # ground
    b += line(400, 186, 400, 196) + line(386, 196, 414, 196) + line(390, 201, 410, 201) + line(394, 206, 406, 206) + text(400, 222, "GND", "ink3 s", "middle")
    b += notes(320, 246, [("Rules: drive VGS fully on (not just to threshold) · gate charge sets switching loss · a flyback diode for inductive loads · conduction loss P = I² × RDS(on).", "ink2 s"), ("Low-side means the load sits above the switch, so a 3.3 V GPIO can drive the gate directly if the MOSFET is logic-level.", "ink2 s")])
    svg("mosfet-switch", 640, 290, b, "An N-channel MOSFET switching a 12 volt load on the low side, driven from a 3.3 volt GPIO through a gate resistor, with a flyback diode across the load")

def d_logic_levels():
    b = text(320, 24, "Logic levels: driver output versus receiver input (3.3 V LVTTL)", "ink ttl", "middle")
    x0, y0, h = 90, 50, 180
    def ybar(v): return y0 + h - v / 3.3 * h
    for v in [0, 0.4, 0.8, 2.0, 2.4, 3.3]:
        b += line(x0 - 30, ybar(v), x0 + 460, ybar(v), "ln2") + text(x0 - 36, ybar(v) + 4, f"{v} V", "ink2 s", "end")
    # driver column
    b += f'<rect class="boxg" x="{x0+20}" y="{ybar(3.3)}" width="120" height="{ybar(2.4)-ybar(3.3)}" rx="4"/>' + text(x0 + 80, ybar(2.85) + 4, "VOH ≥ 2.4 V", "ink t", "middle")
    b += f'<rect class="boxg" x="{x0+20}" y="{ybar(0.4)}" width="120" height="{ybar(0)-ybar(0.4)}" rx="4"/>' + text(x0 + 80, ybar(0.2) + 4, "VOL ≤ 0.4 V", "ink t", "middle")
    b += text(x0 + 80, y0 + h + 20, "Driver guarantees", "ink t", "middle")
    # receiver column
    b += f'<rect class="boxa" x="{x0+260}" y="{ybar(3.3)}" width="120" height="{ybar(2.0)-ybar(3.3)}" rx="4"/>' + text(x0 + 320, ybar(2.65) + 4, "VIH ≥ 2.0 V reads 1", "ink t", "middle")
    b += f'<rect class="boxa" x="{x0+260}" y="{ybar(0.8)}" width="120" height="{ybar(0)-ybar(0.8)}" rx="4"/>' + text(x0 + 320, ybar(0.4) + 4, "VIL ≤ 0.8 V reads 0", "ink t", "middle")
    b += f'<rect class="boxb" x="{x0+260}" y="{ybar(2.0)}" width="120" height="{ybar(0.8)-ybar(2.0)}" rx="4"/>' + text(x0 + 320, ybar(1.4) + 4, "undefined", "ink t", "middle")
    b += text(x0 + 320, y0 + h + 20, "Receiver requires", "ink t", "middle")
    b += arrow(x0 + 140, ybar(2.4), x0 + 260, ybar(2.0)) + arrow(x0 + 140, ybar(0.4), x0 + 260, ybar(0.8))
    b += notes(320, 272, [("Noise margin high = VOH − VIH = 2.4 − 2.0 = 0.4 V. Noise margin low = VIL − VOL = 0.8 − 0.4 = 0.4 V.", "ink2 s"), ("A negative margin can work on the bench and fail in the field. Open-drain outputs reach VOH only through the pull-up.", "ink2 s")])
    svg("logic-levels", 640, 290, b, "Driver output levels VOH and VOL against receiver input thresholds VIH and VIL, with the noise margins between them")

def d_adc_chain():
    b = text(320, 24, "The ADC signal chain and where noise gets in", "ink ttl", "middle")
    xs = [20, 130, 250, 370, 500]
    labels = [("Sensor", "mV, offset, drift"), ("Amplifier", "gain, offset, CMRR"), ("Anti-alias filter", "fc < fs / 2"), ("ADC", "N bits, ref, sample time"), ("Code → value", "LSB = Vref / 2^N")]
    for (x, (l, s)) in zip(xs, labels):
        b += box(x, 90, 110, 50, l, "box" if l != "ADC" else "boxa", s)
    for i in range(4):
        b += arrow(xs[i] + 110, 115, xs[i + 1], 115)
    b += box(380, 180, 90, 36, "Vref", "boxb", "noise, drift") + arrow(425, 180, 425, 142)
    for x, t in [(75, "cable pickup"), (185, "amplifier noise"), (305, "aliased noise"), (425, "reference noise, quantisation")]:
        b += text(x, 70, t, "amb s", "middle") + arrow(x, 74, x, 88, None, "ln2")
    b += notes(320, 250, [("Effective bits = what the noise leaves. Averaging n samples gains log2(√n) bits only if the noise is random.", "ink2 s"), ("Sample time must suit the source impedance, or the sample capacitor never settles.", "ink2 s")])
    svg("adc-chain", 640, 290, b, "Signal chain from sensor through amplifier and anti-alias filter to the ADC and its reference, annotated with the noise entry points")

def d_mcu_block():
    b = text(320, 24, "Inside a microcontroller (Cortex-M class)", "ink ttl", "middle")
    b += box(40, 60, 130, 60, "Cortex-M core", "boxa", "registers, pipeline") + box(40, 130, 130, 40, "NVIC", "boxa", "interrupt controller")
    b += box(200, 60, 240, 36, "Bus matrix (AHB)", "box")
    b += box(200, 110, 110, 44, "Flash", "box", "code, constants") + box(330, 110, 110, 44, "SRAM", "box", "data, stack, heap")
    b += box(470, 60, 130, 44, "RCC clock tree", "boxb", "enables, PLL, prescalers") + box(470, 114, 130, 40, "Debug port", "box", "SWD / JTAG")
    b += line(170, 90, 200, 78) + line(170, 150, 200, 150) + line(255, 96, 255, 110) + line(385, 96, 385, 110) + line(440, 78, 470, 82) + line(440, 90, 470, 134)
    b += box(200, 170, 400, 30, "APB peripheral buses", "box")
    for i, (p, s) in enumerate([("GPIO", "pins"), ("UART", "serial"), ("SPI / I2C", "buses"), ("Timers", "PWM, capture"), ("ADC", "analogue in"), ("DMA", "no CPU")]):
        x = 40 + i * 95
        b += box(x, 220, 85, 44, p, "box", s) + line(x + 42, 200, x + 42, 220)
    b += text(320, 286, "Every peripheral needs its clock enabled in the RCC and its pins in the right GPIO mode before it does anything.", "ink2 s", "middle")
    svg("mcu-block", 640, 300, b, "Block diagram of a Cortex-M microcontroller: core, NVIC, bus matrix, flash, SRAM, clock tree, debug port and peripherals")

def d_clock_tree():
    b = text(320, 24, "An STM32 clock tree to 84 MHz (F401/F411 class)", "ink ttl", "middle")
    b += box(20, 70, 90, 44, "HSE", "box", "8 MHz crystal") + box(20, 130, 90, 44, "HSI", "box", "16 MHz RC")
    b += box(150, 70, 110, 44, "PLL ÷M", "boxa", "M = 8 → 1 MHz") + box(280, 70, 110, 44, "PLL ×N", "boxa", "N = 336 → 336 MHz") + box(410, 70, 110, 44, "PLL ÷P", "boxa", "P = 4 → 84 MHz")
    b += arrow(110, 92, 150, 92) + arrow(260, 92, 280, 92) + arrow(390, 92, 410, 92)
    b += box(540, 70, 90, 44, "SYSCLK", "boxb", "84 MHz") + arrow(520, 92, 540, 92)
    b += box(150, 160, 120, 44, "AHB prescaler ÷1", "box", "HCLK 84 MHz") + arrow(585, 114, 585, 150) + line(585, 150, 210, 150) + arrow(210, 150, 210, 160)
    b += box(60, 230, 150, 44, "APB1 ÷2", "box", "PCLK1 42 MHz") + box(230, 230, 150, 44, "APB2 ÷1", "box", "PCLK2 84 MHz")
    b += arrow(190, 204, 135, 230) + arrow(230, 204, 305, 230)
    b += box(400, 230, 220, 44, "Timer clock rule", "boxb", "APB prescaler ≠ 1 → timers get 2× PCLK")
    b += text(135, 292, "TIM2..5 on APB1: 2 × 42 = 84 MHz", "ink2 s", "middle") + text(305, 292, "TIM1, 9..11 on APB2: 84 MHz", "ink2 s", "middle")
    b += text(510, 292, "Flash wait states rise with HCLK", "ink3 s", "middle")
    svg("clock-tree", 640, 310, b, "STM32 clock tree from the 8 megahertz crystal through the PLL dividers and multiplier to 84 megahertz and the AHB and APB prescalers, with the timer doubling rule")

def d_interrupt_flow():
    b = text(320, 24, "What happens when an interrupt fires", "ink ttl", "middle")
    steps = [("Peripheral event", "flag set in its status register"), ("Interrupt enabled?", "peripheral enable and NVIC enable"), ("Priority higher than current?", "lower number = more urgent"), ("Save context, fetch vector", "hardware pushes registers"), ("Handler runs", "short; clear the flag; hand off to a task"), ("Return", "restore, or tail-chain into the next pending")]
    b += flow_v(steps, 160, 44, 320, 38, 10, ["box", "boxb", "boxb", "box", "boxa", "box"])
    b += text(492, 109, "no → stays pending", "ink3 s") + text(492, 157, "no → waits its turn", "ink3 s")
    b += text(320, 340, "Shared data between handler and main loop needs a plan: a queue, a flag with an atomic read, or a short critical section.", "ink2 s", "middle")
    svg("interrupt-flow", 640, 356, b, "Flow of an interrupt from the peripheral event through enable and priority checks to the handler and return")

def d_uart_frame():
    b = text(320, 24, "UART frame, 8N1, sending 0x4B (01001011), LSB first", "ink ttl", "middle")
    bits = "1" + "0" + "11010010" + "1" + "1"  # idle, start, data LSB first (0x4B = 0100 1011 → LSB first: 1,1,0,1,0,0,1,0), stop, idle
    bw = 46
    x0 = 50
    b += waveform(bits, x0, 70, 130, bw)
    labels = ["idle", "start", "b0=1", "b1=1", "b2=0", "b3=1", "b4=0", "b5=0", "b6=1", "b7=0", "stop", "idle"]
    for i, l in enumerate(labels):
        x = x0 + i * bw + bw / 2
        b += text(x, 150, l, "ink2 s", "middle") + line(x0 + i * bw, 60, x0 + i * bw, 140, "ln2")
    b += f'<rect class="boxa" x="{x0+bw}" y="160" width="{bw}" height="18" rx="3"/>' + text(x0 + bw * 1.5, 173, "start", "ink s", "middle")
    b += f'<rect class="box" x="{x0+2*bw}" y="160" width="{8*bw}" height="18" rx="3"/>' + text(x0 + 6 * bw, 173, "8 data bits, least significant first", "ink s", "middle")
    b += f'<rect class="boxg" x="{x0+10*bw}" y="160" width="{bw}" height="18" rx="3"/>' + text(x0 + bw * 10.5, 173, "stop", "ink s", "middle")
    b += notes(320, 210, [("One bit time = 1 / baud. At 115 200 baud that is 8.68 µs. Both ends must agree within about 2–3 % or the last bits land in the wrong slot.", "ink2 s"), ("Framing error: a stop bit that is not high. Overrun: the next byte arrived before the previous one was read.", "ink2 s")])
    svg("uart-frame", 640, 250, b, "UART 8N1 frame timing diagram for the byte 0x4B with start bit, eight data bits least significant first, and stop bit")

def d_spi_timing():
    b = text(320, 24, "SPI mode 0 (CPOL = 0, CPHA = 0): sample on the rising edge", "ink ttl", "middle")
    x0, bw = 90, 30
    clk = "0" + "".join("10" for _ in range(8)) + "0"
    b += text(x0 - 8, 72, "CS", "ink t", "end") + waveform("1" + "0" * 17 + "1", x0 - bw, 60, 80, bw / 1)
    b += text(x0 - 8, 122, "SCK", "ink t", "end") + waveform(clk, x0, 110, 130, bw)
    data = "01101001"
    mosi = "0" + "".join(d + d for d in data) + "0"
    b += text(x0 - 8, 172, "MOSI", "ink t", "end") + waveform(mosi, x0, 160, 180, bw, "siga")
    miso = "0" + "".join(d + d for d in "10010110") + "0"
    b += text(x0 - 8, 222, "MISO", "ink t", "end") + waveform(miso, x0, 210, 230, bw, "sigb")
    for i in range(8):
        x = x0 + bw * (1 + 2 * i)
        b += line(x, 105, x, 235, "ln2") + text(x, 250, f"b{7-i}", "ink3 s", "middle")
    b += text(320, 276, "Mode 1 samples on the falling edge; modes 2 and 3 idle the clock high. A first byte shifted by one bit is almost always the wrong mode.", "ink2 s", "middle")
    svg("spi-timing", 640, 292, b, "SPI timing diagram in mode 0 with chip select, clock, MOSI and MISO, data sampled on each rising clock edge, most significant bit first")

def d_i2c_transaction():
    b = text(320, 24, "An I2C write: address, acknowledge, data, acknowledge, stop", "ink ttl", "middle")
    fields = [("S", 1, "boxa", "start"), ("7-bit address", 7, "box", "0x48"), ("W", 1, "box", "R/W=0"), ("A", 1, "boxg", "ACK"), ("Data byte", 8, "box", "register / value"), ("A", 1, "boxg", "ACK"), ("P", 1, "boxa", "stop")]
    b += bitfield(fields, 30, 70, 580, 40)
    b += notes(320, 150, [("SDA changes only while SCL is low; START and STOP are the two exceptions, and that is how they are recognised.", "ink2 s"), ("No ACK after the address: wrong address, device unpowered, pull-ups missing, or the bus held low by a stuck device.", "ink2 s"), ("Pull-up size: small enough to rise within the bit time against the bus capacitance, large enough not to exceed the device's sink current.", "ink2 s")])
    svg("i2c-transaction", 640, 206, b, "I2C write transaction showing start, seven bit address, write bit, acknowledge, data byte, acknowledge and stop")

def d_can_frame():
    b = text(320, 24, "A classic CAN data frame (11-bit identifier)", "ink ttl", "middle")
    fields = [("S", 1, "boxa", "SOF"), ("Identifier", 11, "boxb", "11 bits, lowest wins"), ("RTR IDE r0", 3, "box", "3 control bits"), ("DLC", 4, "box", "length 0–8"), ("Data", 16, "boxg", "0–8 bytes (shortened)"), ("CRC", 15, "box", "15 bits + delimiter"), ("ACK", 2, "boxa", "slot + delim."), ("EOF", 7, "box", "7 recessive")]
    b += bitfield(fields, 20, 70, 600, 40)
    b += notes(320, 150, [("Arbitration: every node sends its identifier bit by bit; a node that sends recessive (1) and reads dominant (0) stops and listens.", "ink2 s"), ("Errors raise counters; at 128 transmit errors the node goes error-passive, at 256 bus-off, and must be recovered by software.", "ink2 s")])
    svg("can-frame", 640, 190, b, "Classic CAN data frame fields from start of frame through identifier, control, data, CRC, acknowledge and end of frame")

def d_memory_map():
    b = text(320, 24, "Where your variables live", "ink ttl", "middle")
    b += text(130, 56, "Flash (non-volatile)", "ink t", "middle") + text(430, 56, "SRAM (volatile)", "ink t", "middle")
    flash = [("Vector table", "reset handler address first", "boxa"), (".text", "your code", "box"), (".rodata", "const data, strings", "box"), (".data initial values", "copied to RAM at startup", "boxb")]
    for i, (l, s, c) in enumerate(flash):
        b += box(40, 70 + i * 50, 180, 44, l, c, s)
    ram = [(".data", "initialised globals", "boxb"), (".bss", "zeroed globals", "box"), ("heap ↑", "malloc, grows up", "box"), ("free", "", "bg"), ("stack ↓", "locals, grows down", "boxa")]
    for i, (l, s, c) in enumerate(ram):
        if c == "bg":
            b += text(430, 70 + i * 44 + 26, "unused: the margin you measure", "ink3 s", "middle")
        else:
            b += box(340, 70 + i * 44, 180, 40, l, c, s)
    b += arrow(220, 240, 340, 92, "startup copies", "ln", 280, 160)
    b += text(320, 306, "Stack overflow eats the heap or .bss silently; the high-water mark tells you how close you are.", "ink2 s", "middle")
    svg("memory-map", 640, 324, b, "Memory map of a microcontroller program: vector table, code and constants in flash; initialised data, zeroed data, heap and stack in RAM")

def d_state_machine_debounce():
    b = text(320, 24, "A debounce state machine (sampled every 5 ms)", "ink ttl", "middle")
    S = {"RELEASED": (90, 100), "MAYBE PRESSED": (320, 60), "PRESSED": (550, 100), "MAYBE RELEASED": (320, 200)}
    for name, (x, y) in S.items():
        cls = "boxa" if name in ("RELEASED", "PRESSED") else "boxb"
        b += f'<rect class="{cls}" x="{x-65}" y="{y-20}" width="130" height="40" rx="20"/>' + text(x, y + 4, name, "ink t", "middle")
    b += arrow(155, 92, 255, 68, "input low", "ln", 200, 70)
    b += arrow(385, 68, 485, 92, "low for 4 samples → press event", "ln", 460, 44)
    b += arrow(290, 80, 150, 108, "input high again (bounce)", "ln", 215, 118)
    b += arrow(485, 112, 385, 190, "input high", "ln", 395, 160)
    b += arrow(255, 192, 150, 118, "high for 4 samples → release event", "ln", 170, 175)
    b += arrow(360, 180, 500, 118, "input low again (bounce)", "ln", 540, 160)
    b += text(320, 262, "No waiting inside: each tick reads the input once and moves at most one arrow. Events are emitted on the two confirmed transitions only.", "ink2 s", "middle")
    svg("state-machine-debounce", 640, 280, b, "Four state debounce machine: released, maybe pressed, pressed, maybe released, with transitions on sampled input and a four sample confirmation")

def d_ring_buffer():
    b = text(320, 24, "A ring buffer with one writer and one reader", "ink ttl", "middle")
    import math
    cx, cy, r = 150, 150, 85
    n = 8
    for i in range(n):
        a0 = -math.pi / 2 + i * 2 * math.pi / n
        a1 = a0 + 2 * math.pi / n
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        filled = i in (2, 3, 4)
        cls = "boxa" if filled else "box"
        b += f'<path class="{cls}" d="M{cx},{cy} L{x0:.1f},{y0:.1f} A{r},{r} 0 0 1 {x1:.1f},{y1:.1f} z"/>'
        am = (a0 + a1) / 2
        b += text(cx + (r - 25) * math.cos(am), cy + (r - 25) * math.sin(am) + 4, str(i), "ink s", "middle")
    b += f'<circle class="bg" cx="{cx}" cy="{cy}" r="38"/>' + text(cx, cy + 4, "size 8", "ink2 s", "middle")
    def ptr(i, label, cls):
        a = -math.pi / 2 + (i + 0.5) * 2 * math.pi / n
        x, y = cx + (r + 22) * math.cos(a), cy + (r + 22) * math.sin(a)
        return text(x, y + 4, label, cls, "middle")
    b += ptr(2, "tail (reader)", "grn t") + ptr(5, "head (writer)", "acc t")
    b += text(335, 80, "write: buf[head] = x; head = (head+1) & 7", "m")
    b += text(335, 100, "read:  x = buf[tail]; tail = (tail+1) & 7", "m")
    b += text(335, 130, "empty: head == tail", "ink2 s") + text(335, 148, "full: (head + 1) & 7 == tail  (one slot kept free)", "ink2 s")
    b += text(335, 180, "Why it is safe with no lock:", "ink t") + text(335, 198, "each index has exactly one writer;", "ink2 s") + text(335, 212, "the other side only ever reads it.", "ink2 s")
    b += text(335, 240, "Breaks if: two writers, a non-atomic index,", "ink2 s") + text(335, 254, "or the compiler reorders the writes.", "ink2 s")
    svg("ring-buffer", 640, 300, b, "Eight slot ring buffer with head and tail pointers, the full and empty rules, and the single writer single reader condition that makes it lock free")

def d_rtos_task_states():
    b = text(320, 24, "RTOS task states and what moves a task between them", "ink ttl", "middle")
    P = {"Ready": (150, 90), "Running": (400, 90), "Blocked": (400, 220), "Suspended": (150, 220)}
    for n, (x, y) in P.items():
        b += f'<rect class="{"boxa" if n == "Running" else "box"}" x="{x-60}" y="{y-20}" width="120" height="40" rx="20"/>' + text(x, y + 4, n, "ink t", "middle")
    b += arrow(210, 80, 340, 80, "scheduler picks it", "ln", 275, 68) + arrow(340, 100, 210, 100, "preempted by a higher task", "ln", 275, 116)
    b += arrow(400, 110, 400, 200, "blocking call: delay, queue, mutex", "ln", 400, 160)
    b += arrow(345, 215, 185, 110, "event or timeout", "ln", 330, 140)
    b += arrow(150, 110, 150, 200, "vTaskSuspend", "ln", 108, 160) + arrow(190, 205, 240, 100, "vTaskResume", "ln", 205, 185)
    b += text(320, 272, "Keep every task Blocked except when it has work. A task that polls is Ready or Running forever and starves everything below it.", "ink2 s", "middle")
    svg("rtos-task-states", 640, 290, b, "RTOS task state diagram with Ready, Running, Blocked and Suspended states and the events that move a task between them")

def d_priority_inversion():
    b = text(320, 22, "Priority inversion: without and with inheritance (L holds the lock 3 ms)", "ink ttl", "middle")
    rows = ["H", "M", "L"]
    segs = [("L", 0, 1.5, "boxb", "lock"), ("H", 1, 16.5, "box", "blocked, waiting for L"), ("M", 1.5, 13.5, "boxa", "M runs 12 ms"), ("L", 13.5, 15, "boxb", "lock"), ("H", 15, 17, "boxg", "H")]
    b += text(20, 48, "Binary semaphore (no inheritance): H finishes at 17 ms", "ink t")
    b += timeline(rows, 20, 56, 30, segs, 19, ticks=[0, 5, 10, 15])
    segs2 = [("L", 0, 3, "boxb", "lock ↑H"), ("H", 1, 3, "box", "blocked"), ("H", 3, 5, "boxg", "H"), ("M", 1.5, 5, "box", "waits"), ("M", 5, 17, "boxa", "M runs 12 ms")]
    b += text(20, 180, "Mutex (priority inheritance): H finishes at 5 ms", "ink t")
    b += timeline(rows, 20, 188, 30, segs2, 19, ticks=[0, 5, 10, 15])
    b += text(320, 318, "Bounded part: L's critical section. Unbounded part: every medium task that preempts L while H waits. Inheritance removes the second.", "ink2 s", "middle")
    svg("priority-inversion-timeline", 640, 334, b, "Two timelines of three tasks: without inheritance the high task waits for the medium task's whole run; with a mutex it waits only for the low task's critical section")

def d_boot_chain():
    b = text(320, 24, "From reset to main (MCU) and from ROM to login (Linux)", "ink ttl", "middle")
    b += text(160, 50, "Microcontroller", "ink t", "middle")
    b += flow_v([("Reset", "SP from vector[0], PC from vector[1]"), ("Reset_Handler", "copy .data, zero .bss"), ("SystemInit", "clocks, flash latency"), ("main()", "your code")], 60, 60, 200, 40, 12, ["boxa", "box", "box", "boxg"])
    b += text(470, 50, "Embedded Linux", "ink t", "middle")
    b += flow_v([("Boot ROM", "fixed in silicon"), ("SPL / U-Boot", "DRAM up, load kernel + DT"), ("Kernel + device tree", "drivers bind to nodes"), ("init / systemd → login", "user space")], 370, 60, 200, 40, 12, ["boxa", "box", "box", "boxg"])
    b += text(320, 290, "Both chains fail the same way: the step that did not run leaves the next one with wrong assumptions. Find the last step that worked.", "ink2 s", "middle")
    svg("boot-chain", 640, 306, b, "Two boot chains side by side: microcontroller from reset vector through startup code to main, and embedded Linux from boot ROM through the bootloader and kernel to login")

def d_bring_up_flow():
    b = text(320, 24, "Board bring-up: one fault at a time, in this order", "ink ttl", "middle")
    steps = [("Current limit set? Then power", "rails at the right value, no hot parts"), ("Reset released?", "NRST high, reset-cause register"), ("Clock running?", "crystal or HSI, measured"), ("Debugger attaches?", "SWD lines, correct part"), ("Boot pins and option bytes", "right memory mapped at 0"), ("First peripheral, then the next", "GPIO toggle before UART before bus")]
    b += flow_v(steps, 140, 44, 360, 38, 9, ["boxb", "box", "box", "box", "box", "boxg"])
    b += text(506, 70, "fail → fix first", "ink3 s") + text(506, 117, "fail → pull-ups, reset IC", "ink3 s") + text(506, 164, "fail → load caps, drive", "ink3 s") + text(506, 211, "fail → wiring, part, power", "ink3 s")
    b += text(320, 336, "Record each step's reading. A board that passes each step and fails together points at timing or thermal margin.", "ink2 s", "middle")
    svg("bring-up-flow", 640, 352, b, "Bring-up decision flow: current limit and power, reset, clock, debugger, boot pins, then peripherals one by one")

def d_rca_flow():
    b = text(320, 24, "Root-cause analysis that ends in a change you can verify", "ink ttl", "middle")
    steps = [("Symptom, stated precisely", "what, when, how often, since when"), ("Evidence", "measurements, logs, traces; no guesses yet"), ("Hypotheses, ranked", "each must explain all the evidence"), ("Discriminating experiment", "one result rules a hypothesis in or out"), ("Cause", "something you can change"), ("Fix, verify, prevent", "the symptom is gone and cannot return")]
    b += flow_v(steps, 140, 44, 360, 38, 9, ["boxb", "box", "box", "boxa", "box", "boxg"])
    b += arrow(500, 210, 545, 210) + line(545, 210, 545, 110) + arrow(545, 110, 502, 110, None) + text(590, 156, "loop until", "ink3 s", "middle") + text(590, 170, "one is left", "ink3 s", "middle")
    b += text(320, 336, "Intermittent faults need a counter and a trigger, not patience. Confirmation bias is the usual failure of this flow.", "ink2 s", "middle")
    svg("rca-flow", 640, 352, b, "Root cause analysis process from precise symptom through evidence, ranked hypotheses, discriminating experiment, cause, fix and prevention")

def d_v_model():
    b = text(320, 24, "Requirements to tests: the V and its traceability", "ink ttl", "middle")
    L = [("System requirements", 40, 60), ("High-level software reqs", 100, 120), ("Low-level reqs / design", 160, 180), ("Code", 250, 240)]
    R = [("System tests", 440, 60), ("Software integration tests", 400, 120), ("Unit / low-level tests", 350, 180)]
    for l, x, y in L:
        b += box(x, y, 170, 36, l, "box" if l != "Code" else "boxg")
    for l, x, y in R:
        b += box(x, y, 180, 36, l, "boxa")
    for i in range(3):
        b += arrow(L[i][1] + 85, L[i][2] + 36, L[i + 1][1] + 85, L[i + 1][2])
    b += arrow(420, 240, 440, 216)
    for i in range(3):
        b += line(L[i][1] + 170, L[i][2] + 18, R[i][1], R[i][2] + 18, "ln2")
        b += text((L[i][1] + 170 + R[i][1]) / 2, L[i][2] - 4, "traces to / verified by", "ink3 s", "middle")
    b += text(320, 300, "Both directions: every requirement has tests (no gaps) and every test has a requirement (no orphans). Coverage of the code comes from these tests, not from extra ones.", "ink2 s", "middle")
    svg("v-model-traceability", 640, 316, b, "V model showing system, high level and low level requirements on the left, code at the bottom, and the corresponding test levels on the right with traceability links")

def d_test_bench():
    b = text(320, 24, "An automated test bench", "ink ttl", "middle")
    b += box(40, 70, 150, 80, "PC", "boxa", "pytest, PyVISA, pyserial") + text(115, 165, "report: CSV / HTML", "ink3 s", "middle")
    b += box(260, 50, 130, 40, "Bench supply", "box", "SCPI over USB/LAN") + box(260, 100, 130, 40, "Oscilloscope", "box", "captures") + box(260, 150, 130, 40, "Multimeter / load", "box", "readings")
    b += box(460, 90, 150, 60, "Device under test", "boxg", "serial console, GPIO")
    for y in (70, 120, 170):
        b += arrow(190, y, 260, y, None, "ln2")
    b += line(115, 150, 115, 212) + line(115, 212, 535, 212) + arrow(535, 212, 535, 152) + text(325, 206, "serial: commands and logs", "ink2 s", "middle")
    b += line(390, 70, 430, 70) + line(430, 70, 430, 95) + arrow(430, 95, 460, 100) + text(435, 62, "power", "ink3 s")
    b += line(390, 120, 435, 120) + arrow(435, 120, 460, 125) + text(425, 134, "probe", "ink3 s")
    b += text(320, 240, "Fixtures open the ports once; tests ask the DUT, read the instruments, and assert. Waiting on a reply beats a sleep every time.", "ink2 s", "middle")
    svg("test-bench-automation", 640, 256, b, "Automated test bench: a PC running pytest controls a bench supply, oscilloscope and multimeter and talks to the device under test over serial")

def d_do178():
    b = text(320, 24, "DO-178C: software level, failure condition, objectives, coverage", "ink ttl", "middle")
    rows = [("A", "Catastrophic", "71", "Statement + decision + MC/DC; data & control coupling", "boxa"), ("B", "Hazardous", "69", "Statement + decision; data & control coupling", "boxa"), ("C", "Major", "62", "Statement; data & control coupling", "boxb"), ("D", "Minor", "26", "No structural coverage objective", "box"), ("E", "No safety effect", "0", "Outside DO-178C objectives", "box")]
    hdr = ["Level", "Failure condition", "Objectives", "Structural coverage required"]
    xs = [20, 90, 250, 330]
    ws = [60, 150, 70, 290]
    for x, w, h in zip(xs, ws, hdr):
        b += text(x + w / 2, 54, h, "ink t", "middle")
    for i, (lv, fc, ob, cov, cls) in enumerate(rows):
        y = 64 + i * 38
        b += f'<rect class="{cls}" x="20" y="{y}" width="600" height="32" rx="6"/>'
        for x, w, v in zip(xs, ws, [lv, fc, ob, cov]):
            b += text(x + w / 2, y + 21, v, "ink s" if w > 100 else "ink t", "middle")
    b += notes(320, 272, [("Objective counts are from DO-178C Annex A (with independence requirements rising with level). Coverage is measured from requirements-based tests only.", "ink2 s"), ("Working under a level is not being certified to it; say which.", "ink3 s")])
    svg("do178-levels", 640, 304, b, "Table of DO-178C software levels A to E with the associated failure condition, number of objectives and required structural coverage")

def d_mil1553_word():
    b = text(320, 24, "A MIL-STD-1553B command word: 20 bit times at 1 Mbit/s", "ink ttl", "middle")
    fields = [("sync", 3, "box", "invalid Manchester"), ("RT address", 5, "boxa", "0–30; 31 = broadcast"), ("T/R", 1, "boxb", "1 = transmit"), ("Subaddress / mode", 5, "boxg", "0 or 31 = mode code"), ("Word count / code", 5, "box", "0 means 32"), ("P", 1, "boxb", "odd")]
    b += bitfield(fields, 20, 70, 600, 44)
    b += notes(320, 150, [("Example 0x2C64: 00101 1 00011 00100 → RT 5, transmit, subaddress 3, 4 words; six ones, so parity = 1.", "m"), ("Status word: RT address then flags (message error, busy, terminal flag ...). Data word: 16 bits defined by the ICD.", "ink2 s"), ("Command and status words use one sync polarity, data words the other: a listener tells them apart without counting.", "ink2 s")])
    svg("mil1553-word", 640, 212, b, "MIL-STD-1553B command word layout: three bit time sync, five bit remote terminal address, transmit receive bit, five bit subaddress or mode, five bit word count or mode code, and odd parity bit")

def d_mil1553_message():
    b = text(320, 22, "1553 messages and the timing that judges them", "ink ttl", "middle")
    rows = ["BC", "RT"]
    s1 = [("BC", 0, 20, "boxa", "cmd T/R=0"), ("BC", 20, 40, "box", "data"), ("BC", 40, 60, "box", "data"), ("RT", 68, 88, "boxg", "status")]
    b += text(20, 46, "Controller → terminal (receive): command, N data, then status", "ink t")
    b += timeline(rows, 20, 54, 4.2, s1, 130, ticks=[0, 20, 40, 60, 80, 100, 120], unit="µs")
    b += text(20 + 60 + 64 * 4.2, 50 + 54, "4–12 µs", "amb s", "middle")
    s2 = [("BC", 0, 20, "boxa", "cmd T/R=1"), ("RT", 28, 48, "boxg", "status"), ("RT", 48, 68, "box", "data"), ("RT", 68, 88, "box", "data"), ("BC", 92, 112, "boxa", "next cmd")]
    b += text(20, 148, "Terminal → controller (transmit): command, then status + N data; ≥ 4 µs gap to the next message", "ink t")
    b += timeline(rows, 20, 156, 4.2, s2, 130, ticks=[0, 20, 40, 60, 80, 100, 120], unit="µs")
    b += text(20 + 60 + 24 * 4.2, 152 + 54, "4–12 µs", "amb s", "middle")
    b += text(320, 250, "No status within 14 µs = no response: corrupted command, illegal command for that terminal, broadcast (by design), wrong bus, late terminal.", "ink2 s", "middle")
    svg("mil1553-message", 640, 268, b, "Two MIL-STD-1553B message formats on a timeline: controller to terminal with data then status, and terminal to controller with status then data, with the response time window and intermessage gap")

def d_arinc429_word():
    b = text(320, 24, "An ARINC 429 word: 32 bits, one talker, up to 20 listeners", "ink ttl", "middle")
    fields = [("Label", 8, "boxa", "bits 1–8, octal, sent first"), ("SDI", 2, "boxb", "9–10"), ("Data", 19, "box", "11–29: BNR, BCD or discretes"), ("SSM", 2, "boxg", "30–31"), ("P", 1, "boxb", "32")]
    b += bitfield(fields, 20, 70, 600, 44)
    b += notes(320, 150, [("Speeds 12.5 or 100 kbit/s; bipolar return-to-zero on a twisted pair; at least four bit times of null between words.", "ink2 s"), ("Unlike 1553 there is no command/response: a transmitter broadcasts its labels on a schedule and receivers pick what they need.", "ink2 s")])
    svg("arinc429-word", 640, 186, b, "ARINC 429 32 bit word layout: label, source destination identifier, data field, sign status matrix and parity")

def d_redundant_channels():
    b = text(320, 24, "A triplex flight-control architecture with cross-channel data links", "ink ttl", "middle")
    for i, ch in enumerate("ABC"):
        x = 40 + i * 190
        b += box(x, 60, 70, 36, f"Sensors {ch}", "box") + arrow(x + 35, 96, x + 35, 118)
        b += box(x, 118, 150, 56, f"Flight computer {ch}", "boxa", "own inputs + the other two")
        b += arrow(x + 75, 174, x + 75, 196) + box(x + 5, 196, 140, 36, "Voter / monitor", "boxb", "mid-value, miscompare")
        b += arrow(x + 75, 232, x + 75, 254) + box(x + 20, 254, 110, 34, f"Actuator {ch}", "boxg")
    b += line(190, 140, 230, 140, "ln2") + line(380, 140, 420, 140, "ln2") + text(210, 132, "CCDL", "ink3 s", "middle") + text(400, 132, "CCDL", "ink3 s", "middle")
    b += path("M115,112 C 200,20 420,20 505,112", "ln2") + text(310, 50, "CCDL (A ↔ C)", "ink3 s", "middle")
    b += text(320, 310, "Each channel computes with all three inputs, votes, and isolates a channel that disagrees persistently. Fail-operational after one fault, fail-safe after two.", "ink2 s", "middle")
    svg("redundant-channels", 640, 326, b, "Three redundant flight control channels each with sensors, computer, voter and actuator, joined by cross channel data links")

def d_frame_executive():
    b = text(320, 22, "A frame-based executive: 100 ms major frame, 10 minor frames of 10 ms", "ink ttl", "middle")
    rows = ["100 Hz", "50 Hz", "10 Hz", "idle"]
    segs = []
    for f in range(10):
        t0 = f * 10
        segs.append(("100 Hz", t0, t0 + 3, "boxa", ""))
        if f % 2 == 0:
            segs.append(("50 Hz", t0 + 3, t0 + 6, "boxb", ""))
        if f == 0:
            segs.append(("10 Hz", t0 + 6, t0 + 9, "boxg", "log"))
        used = 3 + (3 if f % 2 == 0 else 0) + (3 if f == 0 else 0)
        segs.append(("idle", t0 + used, t0 + 10, "box", ""))
    b += timeline(rows, 20, 44, 5.4, segs, 100, ticks=list(range(0, 101, 10)))
    for f in range(10):
        x = 80 + f * 10 * 5.4
        b += line(x, 44, x, 44 + 4 * 30, "ln2")
    b += notes(320, 206, [("Every minor frame runs the 100 Hz group; every second frame adds the 50 Hz group; the 10 Hz group runs once per major frame.", "ink2 s"), ("An overrun is detected at the frame boundary, not hoped away: the executive records it and applies the policy (skip, degrade, reset).", "ink2 s")])
    svg("frame-executive", 640, 242, b, "Timeline of a frame based executive with ten minor frames in a 100 millisecond major frame, showing the 100, 50 and 10 hertz rate groups and idle time")

def d_response_time():
    b = text(320, 22, "Worst-case response time of task C: 14 ms", "ink ttl", "middle")
    rows = ["A", "B", "C", "lock"]
    segs = [("A", 0, 2, "boxa", "A"), ("B", 2, 6, "boxb", "B"), ("lock", 6, 7, "box", "lower task holds lock: B = 1"), ("C", 7, 10, "boxg", "C 3 ms"), ("A", 10, 12, "boxa", "A again"), ("C", 12, 14, "boxg", "C 2 ms")]
    b += timeline(rows, 20, 44, 27, segs, 20, ticks=[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
    b += line(80 + 14 * 27, 44, 80 + 14 * 27, 170, "ln2") + text(80 + 14 * 27, 184, "R = 14", "acc t", "middle")
    b += notes(320, 216, [("Task set: A 2 ms every 10, B 4 ms every 20, C 5 ms with 1 ms of blocking. R = C + B + Σ ⌈R/Tj⌉·Cj over higher-priority tasks, iterated 6 → 12 → 14 → 14.", "ink2 s"), ("Average CPU load says nothing about this picture; the critical instant does.", "ink2 s")])
    svg("response-time", 640, 254, b, "Timeline showing a low priority task's worst case response time of 14 milliseconds under two higher priority periodic tasks and one millisecond of blocking")

def d_hil():
    b = text(320, 24, "Hardware-in-the-loop: what is real and what is simulated", "ink ttl", "middle")
    b += box(40, 70, 170, 120, "Real-time target", "boxb", "plant model: aircraft, sensors")
    b += box(260, 60, 120, 44, "Analogue I/O", "box", "sensor voltages") + box(260, 110, 120, 44, "Digital / bus I/O", "box", "1553, 429, CAN") + box(260, 160, 120, 44, "Fault insertion", "boxa", "opens, shorts, late frames")
    b += box(430, 80, 170, 100, "Device under test", "boxg", "the real flight computer")
    for y in (82, 132, 182):
        b += arrow(210, y, 260, y) + arrow(380, y, 430, min(max(y, 100), 160))
    b += box(40, 220, 560, 40, "Host PC: test automation, scenarios, logging, pass/fail", "box")
    b += arrow(125, 220, 125, 192) + arrow(515, 220, 515, 182)
    b += text(320, 290, "HIL proves the box with real I/O against a model; it does not prove the model. Loop latency and I/O fidelity are the limits to state.", "ink2 s", "middle")
    svg("hil-architecture", 640, 306, b, "Hardware in the loop architecture: a real time target running the plant model drives analogue, bus and fault insertion I/O into the real device under test, orchestrated by a host PC")

def d_fault_injection():
    b = text(320, 24, "From FMEA to a fault-injection test", "ink ttl", "middle")
    steps = [("Failure mode (FMEA row)", "e.g. channel B sends stale data"), ("Injected fault", "repeat last frame on B for 50 frames"), ("Expected detection", "miscompare after N frames; B isolated"), ("Observed", "log: detection at frame 4, isolation at 8"), ("Verdict and record", "pass; detection time within budget")]
    b += flow_v(steps, 140, 44, 360, 38, 9, ["box", "boxa", "box", "boxb", "boxg"])
    b += text(320, 290, "A fault matrix is this flow once per failure mode. Faults you cannot inject safely are a finding, not a gap to hide.", "ink2 s", "middle")
    svg("fault-injection-flow", 640, 306, b, "Process from an FMEA failure mode through the injected fault, expected detection, observation and recorded verdict")

def d_test_framework():
    b = text(320, 24, "Layers of a test automation framework", "ink ttl", "middle")
    layers = [("Reporting", "HTML/CSV, logs, evidence", "boxg"), ("Test cases", "pytest: fixtures, parametrisation, markers", "boxa"), ("Protocol", "frames, CRC, struct, SCPI", "box"), ("Device drivers", "serial, PyVISA, DAQ", "box"), ("Hardware", "DUT, instruments, bench", "boxb")]
    for i, (l, s, c) in enumerate(layers):
        b += box(120, 50 + i * 46, 300, 40, l, c, s)
        if i < 4:
            b += arrow(270, 90 + i * 46, 270, 96 + i * 46)
    b += box(450, 96, 150, 100, "Configuration", "box", "ports, versions, seeds") + line(450, 146, 420, 146, "ln2")
    b += text(320, 300, "Each layer talks only to its neighbours. Measure the time it saves by comparing a manual campaign with an automated one, and say which.", "ink2 s", "middle")
    svg("test-framework-layers", 640, 316, b, "Five layers of a test framework from hardware through drivers, protocol and test cases to reporting, with configuration alongside")

def d_debug_chain():
    b = text(320, 24, "The debug chain from GDB to the core", "ink ttl", "middle")
    xs = [20, 150, 290, 410, 520]
    items = [("PC: GDB + server", "breakpoints, memory", "boxa"), ("Probe", "ST-Link / J-Link", "box"), ("SWD / JTAG", "SWDIO, SWCLK", "box"), ("Debug port", "DAP, AHB-AP", "box"), ("Core + memory", "halt, step, read", "boxg")]
    for x, (l, s, c) in zip(xs, items):
        b += box(x, 90, 110 if x != 20 else 120, 56, l, c, s)
    for i in range(4):
        b += arrow(xs[i] + (120 if i == 0 else 110), 118, xs[i + 1], 118)
    b += notes(320, 190, [("Breakpoint: stop when execution reaches an address. Watchpoint: stop when a data address is read or written (few, in hardware).", "ink2 s"), ("The probe cannot see peripheral state that changes while the core is halted; timers keep running unless configured to stop.", "ink2 s")])
    svg("debug-chain", 640, 228, b, "Debug chain from GDB on the PC through the probe and SWD to the debug access port and the core")

def d_hardfault():
    b = text(320, 24, "From HardFault to the faulting line", "ink ttl", "middle")
    steps = [("HardFault handler runs", "escalated from a usage, bus or memory fault"), ("Read HFSR", "FORCED set → look in CFSR"), ("Read CFSR", "UFSR / BFSR / MMFSR bits name the cause"), ("Read the stacked PC", "exception frame on the active stack (MSP or PSP)"), ("Map address to source", "map file or addr2line"), ("Fix the cause", "stack size, alignment, null pointer, bad address")]
    b += flow_v(steps, 140, 44, 360, 38, 9, ["boxa", "box", "box", "boxb", "box", "boxg"])
    b += text(320, 336, "IMPRECISERR means the write that faulted was buffered; the PC points after it. Stack overflow often shows as a fault far from its cause.", "ink2 s", "middle")
    svg("hardfault-decode", 640, 352, b, "Flow for decoding a Cortex-M HardFault: read HFSR, read CFSR, read the stacked program counter, map to source, fix")

def d_control_loop():
    b = text(320, 24, "A control loop with PID", "ink ttl", "middle")
    b += box(20, 100, 90, 40, "Setpoint", "box") + arrow(110, 120, 150, 120)
    b += f'<circle class="boxb" cx="165" cy="120" r="16"/>' + text(165, 124, "−", "ink t", "middle") + text(165, 92, "error", "ink2 s", "middle")
    b += arrow(181, 120, 220, 120)
    b += f'<rect class="boxa" x="220" y="70" width="130" height="100" rx="8"/>' + text(285, 90, "PID", "ink t", "middle")
    b += text(232, 110, "P: Kp · e  (now)", "ink2 s") + text(232, 128, "I: Ki · ∫e  (past)", "ink2 s") + text(232, 146, "D: Kd · de/dt  (trend)", "ink2 s")
    b += arrow(350, 120, 390, 120) + box(390, 100, 90, 40, "Actuator", "box") + arrow(480, 120, 510, 120) + box(510, 100, 110, 40, "Plant", "boxg", "aircraft, motor")
    b += line(565, 140, 565, 200) + line(565, 200, 165, 200) + arrow(165, 200, 165, 136) + box(300, 180, 110, 40, "Sensor", "box", "noise, delay")
    b += text(320, 254, "I removes steady error but winds up when the actuator saturates; D fights overshoot but amplifies noise; sample time limits all three.", "ink2 s", "middle")
    svg("control-loop-pid", 640, 272, b, "Closed loop control diagram with setpoint, error, PID controller, actuator, plant and sensor feedback")

def d_kalman():
    b = text(320, 24, "The Kalman filter loop: predict, then correct by how much you trust each", "ink ttl", "middle")
    b += box(60, 70, 200, 70, "Predict", "boxa", "x⁻ = F x,  P⁻ = F P Fᵀ + Q")
    b += f'<rect class="boxg" x="380" y="70" width="200" height="70" rx="8"/>' + text(480, 90, "Update", "ink t", "middle") + text(480, 108, "K = P⁻Hᵀ (H P⁻Hᵀ + R)⁻¹", "ink2 s", "middle") + text(480, 124, "x = x⁻ + K (z − H x⁻)", "ink2 s", "middle")
    b += arrow(260, 95, 380, 95, "prediction") + arrow(380, 125, 260, 125, "corrected state", "ln", 320, 140)
    b += box(400, 170, 160, 40, "Measurement z", "boxb", "noise R") + arrow(480, 170, 480, 142)
    b += text(320, 240, "Q says how much the model can be wrong; R says how noisy the sensor is. Residual z − Hx⁻ growing without bound means divergence.", "ink2 s", "middle")
    svg("kalman-loop", 640, 260, b, "Kalman filter as a loop between predict and update steps fed by measurements, with process and measurement noise")

def d_edge_ai():
    b = text(320, 24, "An edge-AI pipeline, with the checks that keep it honest", "ink ttl", "middle")
    xs = [20, 125, 230, 335, 440, 545]
    items = [("Data", "public / synthetic", "box"), ("Baseline", "non-ML threshold", "boxb"), ("Train + split", "no leakage", "box"), ("Quantise", "int8 + loss", "boxa"), ("Deploy", "RAM, latency", "boxg"), ("Monitor", "drift, alarms", "box")]
    for x, (l, s, c) in zip(xs, items):
        b += box(x, 80, 90, 56, l, c, s)
    for i in range(5):
        b += arrow(xs[i] + 90, 108, xs[i + 1], 108)
    b += text(320, 170, "A model that does not beat the baseline on held-out data is not a result. Passing on the bench is not flight safety; DO-178C does not cover learned behaviour.", "ink2 s", "middle")
    svg("edge-ai-pipeline", 640, 190, b, "Edge AI pipeline from data and a non ML baseline through training, quantisation, deployment on a microcontroller and monitoring")

def d_autonomy_stack():
    b = text(320, 24, "An autonomy stack and where the safety monitor sits", "ink ttl", "middle")
    xs = [20, 125, 230, 335, 440, 545]
    items = [("Sensors", "IMU, GNSS, camera", "box"), ("Perception", "detect, classify", "box"), ("Estimation", "state, fusion", "box"), ("Planning", "path, mission", "box"), ("Control", "loops, modes", "box"), ("Actuators", "", "boxg")]
    for x, (l, s, c) in zip(xs, items):
        b += box(x, 90, 90, 56, l, c, s if s else None)
    for i in range(5):
        b += arrow(xs[i] + 90, 118, xs[i + 1], 118)
    b += f'<rect class="boxa" x="125" y="170" width="405" height="40" rx="8"/>' + text(327, 195, "Safety monitor: simple, verified, can override everything above it", "ink t", "middle")
    b += arrow(327, 170, 327, 148) + arrow(500, 170, 500, 148)
    b += text(320, 240, "The clever parts are above the line; the part you can certify is below it. Simulation exercises the stack; it does not prove flight safety.", "ink2 s", "middle")
    svg("autonomy-stack", 640, 258, b, "Autonomy stack from sensors through perception, estimation, planning and control to actuators, with a verified safety monitor able to override")

def d_product_lifecycle():
    b = text(320, 24, "The product lifecycle an owner is responsible for", "ink ttl", "middle")
    import math
    cx, cy, R = 320, 160, 105
    steps = ["Need", "Requirements", "Architecture", "Design", "Build", "Verify", "Release", "Operate", "Change"]
    pts = []
    for i, s in enumerate(steps):
        a = -math.pi / 2 + i * 2 * math.pi / len(steps)
        x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        pts.append((x, y))
        cls = "boxa" if s in ("Need", "Release") else "box"
        b += f'<rect class="{cls}" x="{x-48}" y="{y-14}" width="96" height="28" rx="14"/>' + text(x, y + 4, s, "ink t", "middle")
    for i in range(len(steps)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(steps)]
        dx, dy = x2 - x1, y2 - y1
        d = math.hypot(dx, dy)
        b += arrow(x1 + dx / d * 50, y1 + dy / d * 50, x2 - dx / d * 52, y2 - dy / d * 52)
    b += text(cx, cy - 10, "decision records,", "ink2 s", "middle") + text(cx, cy + 4, "BOM & cost, risk register,", "ink2 s", "middle") + text(cx, cy + 18, "reviews, roadmap", "ink2 s", "middle")
    b += text(320, 296, "Ownership is shown by the artefacts in the middle and by following a change all the way round, more than once.", "ink2 s", "middle")
    svg("product-lifecycle", 640, 312, b, "Product lifecycle loop from need through requirements, architecture, design, build, verify, release, operate and change, with the ownership artefacts at the centre")

def d_system_architecture():
    b = text(320, 24, "Portfolio product: STM32 sensor monitor, block architecture", "ink ttl", "middle")
    b += box(20, 90, 100, 50, "Sensor", "box", "I2C temperature") + arrow(120, 115, 160, 115)
    b += box(160, 90, 110, 50, "Conditioning", "box", "pull-ups, filter") + arrow(270, 115, 310, 115)
    b += box(310, 70, 140, 90, "STM32", "boxa", "acquire · detect · log · watchdog")
    b += arrow(450, 100, 500, 100) + box(500, 80, 120, 40, "UART / RS-422", "box", "telemetry frames")
    b += arrow(450, 140, 500, 140) + box(500, 120, 120, 40, "Host PC", "boxg", "pytest, reports")
    b += box(160, 190, 290, 40, "Power: 5 V in → 3.3 V, decoupling, brown-out reset", "boxb") + arrow(380, 190, 380, 160)
    b += text(320, 262, "Simulation (sensor model, fault injection) and hardware (a real board) are recorded as separate evidence paths in the portfolio.", "ink2 s", "middle")
    svg("system-architecture", 640, 280, b, "Block architecture of the portfolio STM32 sensor monitor: sensor, conditioning, microcontroller, telemetry link, host PC and power")

ALL = [d_pathways_map, d_study_journey, d_power_tree, d_rc_step, d_mosfet_switch, d_logic_levels, d_adc_chain, d_mcu_block, d_clock_tree,
       d_interrupt_flow, d_uart_frame, d_spi_timing, d_i2c_transaction, d_can_frame, d_memory_map, d_state_machine_debounce, d_ring_buffer,
       d_rtos_task_states, d_priority_inversion, d_boot_chain, d_bring_up_flow, d_rca_flow, d_v_model, d_test_bench, d_do178, d_mil1553_word,
       d_mil1553_message, d_arinc429_word, d_redundant_channels, d_frame_executive, d_response_time, d_hil, d_fault_injection, d_test_framework,
       d_debug_chain, d_hardfault, d_control_loop, d_kalman, d_edge_ai, d_autonomy_stack, d_product_lifecycle, d_system_architecture]

if __name__ == "__main__":
    for f in ALL:
        f()
    print(f"wrote {len(ALL)} diagrams to {OUT}")
