"""Lesson: From an FMEA to fault injection.
Run: python3 faultinject.py

A SYNTHETIC telemetry link (the same frame idea as the previous lessons) and a MONITOR that must
detect faults: bad CRC, sequence gap, late frame (timeout), stuck value, out-of-range value.
A fault injector sits between the sender and the monitor. For each failure mode in a small FMEA-style
table it injects exactly one fault and asserts that the monitor detects it within its budget.
A mode the monitor cannot detect is reported as a FINDING, not hidden."""

def crc8(data, crc=0x00):
    for b in data:
        crc ^= b
        for _ in range(8):
            crc = ((crc << 1) ^ 0x07) & 0xFF if crc & 0x80 else (crc << 1) & 0xFF
    return crc

def frame(seq, value):
    body = bytes([seq & 0xFF, value >> 8, value & 0xFF])
    return body + bytes([crc8(body)])

PERIOD_MS = 10
TIMEOUT_MS = 25            # a frame later than this after the previous one counts as lost
RANGE = (0, 1000)          # plausible values
STUCK_FRAMES = 4           # the same value this many times in a row is suspicious

class Monitor:
    def __init__(self):
        self.last_seq = None; self.last_t = None; self.last_val = None; self.same = 0; self.events = []
    def on_frame(self, t, raw, i):
        if crc8(raw[:3]) != raw[3]:
            self.events.append((i, "BAD_CRC")); return
        seq, value = raw[0], (raw[1] << 8) | raw[2]
        if self.last_seq is not None and seq != (self.last_seq + 1) & 0xFF:
            self.events.append((i, "SEQ_GAP"))
        if self.last_t is not None and t - self.last_t > TIMEOUT_MS:
            self.events.append((i, "LATE"))
        if not RANGE[0] <= value <= RANGE[1]:
            self.events.append((i, "RANGE"))
        self.same = self.same + 1 if value == self.last_val else 0
        if self.same + 1 >= STUCK_FRAMES:
            self.events.append((i, "STUCK"))
        self.last_seq, self.last_t, self.last_val = seq, t, value

def run(fault=None, at=10, frames=30):
    """Send `frames` frames; the signal is a ramp. fault: None | corrupt | drop | delay | stuck | spike | stale_ok"""
    mon, frozen = Monitor(), None
    for i in range(frames):
        t = i * PERIOD_MS
        value = 100 + 5 * i
        raw = bytearray(frame(i, value))
        if fault and i >= at:
            if fault == "corrupt" and i == at:
                raw[2] ^= 0x04
            elif fault == "drop" and i == at:
                continue
            elif fault == "delay" and i == at:
                t += 40
            elif fault == "stuck":
                frozen = frozen if frozen is not None else value
                raw = bytearray(frame(i, frozen))
            elif fault == "spike" and i == at:
                raw = bytearray(frame(i, 5000))
            elif fault == "drift":
                raw = bytearray(frame(i, value + 3 * (i - at + 1)))     # a growing bias, always inside the valid range
            elif fault == "stale_replay" and i >= at:
                raw = bytearray(frame(at - 1, 100 + 5 * (at - 1)))      # the sender replays an old, VALID frame forever
        mon.on_frame(t, bytes(raw), i)
    return mon.events

# FMEA-style table: failure mode, how it is injected, which monitor event must catch it, and within how many frames
TABLE = [
    ("bit flip in transit",           "corrupt",      "BAD_CRC", 1),
    ("a frame is lost",               "drop",         "SEQ_GAP", 1),
    ("a frame arrives 40 ms late",    "delay",        "LATE",    1),
    ("sensor value frozen",           "stuck",        "STUCK",   4),
    ("out-of-range value, CRC valid", "spike",        "RANGE",   1),
    ("sender replays an old frame",   "stale_replay", "SEQ_GAP", 1),
    ("slow drift, still in range",    "drift",        "DRIFT",   5),
]

def main():
    print(f"{'failure mode':32s} {'expected event':15s} {'detected at':12s} verdict")
    findings = 0
    for mode, fault, expect, budget in TABLE:
        events = run(fault, at=10)
        first = next(((i, e) for i, e in events if e == expect), None)
        frames_late = None if first is None else first[0] - 10
        if first is not None and frames_late <= budget:
            print(f"{mode:32s} {expect:15s} frame {first[0]:2d} (+{frames_late})  PASS")
        else:
            findings += 1
            seen = sorted({e for _, e in events}) or ["nothing"]
            print(f"{mode:32s} {expect:15s} {'not detected':12s} FINDING (monitor reported: {', '.join(seen)})")
    clean = run(None)
    print(f"\nbaseline with no fault injected: {len(clean)} events (must be 0)")
    assert not clean
    print(f"{len(TABLE) - findings} of {len(TABLE)} failure modes detected within budget; {findings} finding(s)")

main()
