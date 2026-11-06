"""Lesson: MIL-STD-1553B buses, controllers, terminals and faults.
Run: python3 mon1553.py

Decodes a SYNTHETIC bus-monitor capture (made up for this lesson, not from any real system) into
messages and judges each one the way an integration engineer would: parity, response time, status
flags, broadcast, and what happened on the second bus.

Log format, one word per line:  t=<start time in us> <bus A|B> <sync C|D> <16 data bits in hex> p=<parity bit>
C = command/status sync, D = data sync. Every word lasts 20 us. 1553 uses ODD parity over the 17 bits."""
import re
from collections import namedtuple

LOG = """\
t=1000 A C 2C64 p=1
t=1028 A C 2800 p=1
t=1048 A D 0100 p=0
t=1068 A D 0102 p=1
t=1088 A D 0104 p=1
t=1108 A D 0106 p=0
t=2000 A C 6022 p=1
t=2020 A D 1234 p=0
t=2040 A D 5678 p=1
t=2068 A C 6000 p=1
t=3000 A C 2C64 p=1
t=3033 A C 2800 p=1
t=3053 A D 0200 p=0
t=3073 A D 0202 p=1
t=3093 A D 0204 p=1
t=3113 A D 0206 p=0
t=4000 A C 2C60 p=0
t=4028 A C 2C00 p=0
t=5000 A C F8E2 p=0
t=5020 A D 0001 p=0
t=5040 A D 0002 p=0
t=6000 A C 4C41 p=0
t=6100 B C 4C41 p=0
t=6127 B C 4800 p=1
t=6147 B D 00AA p=1
t=7000 A C 2C64 p=0
"""

WORD_US = 20
RESPONSE_MIN, RESPONSE_MAX, NO_RESPONSE_US = 4, 12, 14      # microseconds, MIL-STD-1553B
Word = namedtuple("Word", "t bus sync value p")
LINE = re.compile(r"t=(\d+) ([AB]) ([CD]) ([0-9A-F]{4}) p=([01])")

def parse(text):
    return [Word(int(m[1]), m[2], m[3], int(m[4], 16), int(m[5])) for m in map(LINE.fullmatch, text.splitlines()) if m]

def odd_parity_bit(value):
    return 1 if bin(value).count("1") % 2 == 0 else 0

def fields(value):
    return value >> 11, (value >> 10) & 1, (value >> 5) & 0x1F, value & 0x1F        # rt, t/r, subaddress, count

def status_flags(value):
    names = [(0x0400, "MESSAGE ERROR"), (0x0200, "instrumentation"), (0x0100, "service request"),
             (0x0010, "broadcast received"), (0x0008, "BUSY"), (0x0004, "subsystem flag"), (0x0001, "TERMINAL FLAG")]
    return [n for bit, n in names if value & bit]

def decode(words):
    """Group words into messages. A command is a C word seen while idle; the next C word within the
    no-response window is the terminal's status; a C word later than that starts a new message."""
    messages, i = [], 0
    while i < len(words):
        cmd = words[i]; i += 1
        rt, tr, sa, wc = fields(cmd.value)
        count = 32 if wc == 0 else wc
        m = {"cmd": cmd, "rt": rt, "tr": tr, "sa": sa, "count": count, "status": None, "data": [], "gap": None, "bad_parity": odd_parity_bit(cmd.value) != cmd.p}
        end = cmd.t + WORD_US
        if tr == 0:                                              # BC sends data first (receive command)
            while i < len(words) and words[i].sync == "D" and words[i].bus == cmd.bus:
                m["data"].append(words[i]); end = words[i].t + WORD_US; i += 1
        if i < len(words) and words[i].sync == "C" and words[i].bus == cmd.bus and words[i].t - end <= NO_RESPONSE_US:
            m["status"] = words[i]; m["gap"] = words[i].t - end; end = words[i].t + WORD_US; i += 1
            if tr == 1:                                          # terminal sends its data after the status
                while i < len(words) and words[i].sync == "D" and words[i].bus == cmd.bus:
                    m["data"].append(words[i]); i += 1
        messages.append(m)
    return messages

def verdict(m):
    if m["bad_parity"]:
        return "PARITY ERROR in the command: a terminal must reject it, so silence is CORRECT"
    if m["rt"] == 31:
        return "broadcast: no status word is sent by design (not a fault)"
    if m["status"] is None:
        return "NO RESPONSE within 14 us"
    flags = status_flags(m["status"].value)
    if "MESSAGE ERROR" in flags and not m["data"]:
        return "terminal set MESSAGE ERROR and sent no data: the command was illegal for it (check subaddress and word count against its ICD)"
    if m["gap"] > RESPONSE_MAX:
        return f"LATE: response {m['gap']} us is outside the {RESPONSE_MIN}-{RESPONSE_MAX} us window but inside the {NO_RESPONSE_US} us timeout"
    return "OK"

def main():
    msgs = decode(parse(LOG))
    prev = None
    for m in msgs:
        c = m["cmd"]
        kind = "TRANSMIT" if m["tr"] else "RECEIVE "
        where = "broadcast" if m["rt"] == 31 else f"RT {m['rt']:2d}"
        st = f"status 0x{m['status'].value:04X} gap {m['gap']:2d} us" if m["status"] else "no status"
        print(f"t={c.t:5d} bus {c.bus} {where} {kind} SA {m['sa']:2d} x{m['count']:2d} data {len(m['data'])}  {st}")
        note = verdict(m)
        if prev and prev["status"] is None and not prev["bad_parity"] and prev["rt"] == m["rt"] and prev["sa"] == m["sa"] and prev["cmd"].bus != c.bus and m["status"]:
            note += f"  | retry of the t={prev['cmd'].t} command on bus {c.bus} was answered: suspect bus {prev['cmd'].bus} for RT {m['rt']}"
        print("     ->", note)
        prev = m
    ok = sum(1 for m in msgs if verdict(m) == "OK")
    print(f"\n{len(msgs)} messages, {ok} clean, {len(msgs) - ok} to explain")

main()
