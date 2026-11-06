"""Lesson: From logs to evidence, with regular expressions.
Run: python3 logreport.py

A SYNTHETIC test log (made up for this lesson). The script extracts the measurements with a regular
expression, keeps count of every line it could NOT parse (a report must never silently drop data),
checks each measurement against its limits, and prints a table a reviewer can read, with the raw
numbers behind every verdict."""
import re
import statistics

LOG = """\
2026-03-02T09:00:01 INFO  run=1 case=TC-101 boot_time_ms=812 rail_3v3_mV=3291 current_mA=41.2
2026-03-02T09:00:19 INFO  run=2 case=TC-101 boot_time_ms=805 rail_3v3_mV=3288 current_mA=41.0
2026-03-02T09:00:37 WARN  run=3 case=TC-101 boot_time_ms=1190 rail_3v3_mV=3290 current_mA=41.5
2026-03-02T09:00:55 INFO  run=4 case=TC-101 boot_time_ms=809 rail_3v3_mV=3150 current_mA=40.9
2026-03-02T09:01:13 ERROR run=5 case=TC-101 TIMEOUT waiting for banner after 5000 ms
2026-03-02T09:01:31 INFO  run=6 case=TC-101 boot_time_ms=811 rail_3v3_mV=3292 current_mA=41.1
2026-03-02T09:01:49 INFO  run=7 case=TC-102 boot_time_ms=798 rail_3v3_mV=3295 current_mA=18.3
2026-03-02T09:02:07 INFO  run=8 case=TC-102 boot_time_ms=801 rail_3v3_mV=3293 current_mA=18.1
serial buffer overrun, 14 bytes dropped
2026-03-02T09:02:25 INFO  run=9 case=TC-102 boot_time_ms=799 rail_3v3_mV=3294 current_mA=18.2
2026-03-02T09:02:43 INFO  run=10 case=TC-102 boot_time_ms=803 rail_3v3_mV=3290 current_mA=18.4
"""

LIMITS = {"boot_time_ms": (0, 900), "rail_3v3_mV": (3135, 3465), "current_mA": (0, 60)}   # +/-5 % on 3.3 V
LINE = re.compile(r"^(?P<ts>\S+) (?P<level>INFO|WARN|ERROR)\s+run=(?P<run>\d+) case=(?P<case>[\w-]+) (?P<rest>.*)$")
PAIR = re.compile(r"(\w+)=([\d.]+)")

def parse(text):
    runs, unparsed = [], []
    for n, line in enumerate(text.splitlines(), 1):
        m = LINE.match(line)
        if not m:
            unparsed.append((n, line))
            continue
        values = {k: float(v) for k, v in PAIR.findall(m["rest"])}
        runs.append({"run": int(m["run"]), "case": m["case"], "level": m["level"], "values": values, "text": m["rest"]})
    return runs, unparsed

def verdict(run):
    if not run["values"]:
        return "NO DATA", run["text"]
    bad = [f"{k}={v:g} outside {LIMITS[k]}" for k, v in run["values"].items() if k in LIMITS and not LIMITS[k][0] <= v <= LIMITS[k][1]]
    return ("FAIL", "; ".join(bad)) if bad else ("PASS", "")

def main():
    runs, unparsed = parse(LOG)
    print(f"{len(runs)} runs parsed, {len(unparsed)} line(s) NOT parsed")
    for n, line in unparsed:
        print(f"  unparsed line {n}: {line!r}")
    print("\nrun case    boot_ms rail_mV  mA    verdict  why")
    totals = {"PASS": 0, "FAIL": 0, "NO DATA": 0}
    for r in runs:
        v = r["values"]; res, why = verdict(r)
        totals[res] += 1
        if v:
            print(f"{r['run']:3d} {r['case']} {v['boot_time_ms']:7.0f} {v['rail_3v3_mV']:7.0f} {v['current_mA']:5.1f} {res:8s} {why}")
        else:
            print(f"{r['run']:3d} {r['case']} {'-':>7} {'-':>7} {'-':>5} {res:8s} {why}")
    print(f"\nverdicts: {totals['PASS']} PASS, {totals['FAIL']} FAIL, {totals['NO DATA']} NO DATA (never counted as a pass)")
    for case in sorted({r['case'] for r in runs}):
        boot = [r["values"]["boot_time_ms"] for r in runs if r["case"] == case and r["values"]]
        print(f"{case}: n={len(boot)}  boot_time mean {statistics.mean(boot):.1f} ms, stdev {statistics.stdev(boot):.1f} ms, min {min(boot):.0f}, max {max(boot):.0f}")
    print("\nnote: statistics include every run that produced data, the FAIL run too; the run with no data is excluded here and counted above.")

main()
