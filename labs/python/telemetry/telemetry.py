"""Lesson: Telemetry packets and parsing with struct.
Run: python3 telemetry.py

A SYNTHETIC telemetry stream: framed records from a made-up sensor node. Frame layout (all multi-byte
fields big-endian, which is how struct writes them with the '>' prefix):

    offset  size  field
    0       1     sync        0xA5
    1       1     version     1
    2       2     sequence    16-bit, wraps at 65535
    4       4     timestamp   milliseconds since start
    8       2     temp        signed, hundredths of a degree C
    10      2     volt        unsigned, millivolts
    12      2     crc         CRC-16/CCITT-FALSE over bytes 0..11 (poly 0x1021, init 0xFFFF)

The parser reports gaps in the sequence numbers, bad CRCs and resynchronisation after garbage."""
import struct

HEADER = struct.Struct(">BBHIhH")        # sync, version, sequence, timestamp, temp, volt = 12 bytes
FRAME_LEN = HEADER.size + 2
SYNC = 0xA5

def crc16(data, crc=0xFFFF):
    for b in data:
        crc ^= b << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return crc

def make_frame(seq, ts, temp_c100, volt_mv):
    body = HEADER.pack(SYNC, 1, seq & 0xFFFF, ts, temp_c100, volt_mv)
    return body + struct.pack(">H", crc16(body))

def build_stream():
    frames = [make_frame(s, 1000 * s, 2150 + 3 * s, 3300 - s) for s in (0, 1, 2, 3, 5, 6)]   # sequence 4 never sent
    damaged = bytearray(frames[2]); damaged[9] ^= 0x10                                       # one bit flipped in transit
    frames[2] = bytes(damaged)
    return b"\x00\x13" + b"".join(frames[:4]) + b"\xFF\xA5\x00" + b"".join(frames[4:])

def parse(stream):
    out, i, expected, skipped = [], 0, None, 0
    while i + FRAME_LEN <= len(stream):
        if stream[i] != SYNC:
            i += 1; skipped += 1
            continue
        chunk = stream[i:i + FRAME_LEN]
        sync, ver, seq, ts, temp, volt = HEADER.unpack(chunk[:HEADER.size])
        (crc,) = struct.unpack(">H", chunk[HEADER.size:])
        if crc16(chunk[:HEADER.size]) != crc:
            out.append(("BAD CRC", f"at byte {i}: frame discarded, resync one byte on"))
            i += 1; skipped += 1                    # do not trust the length of a frame that failed its CRC
            continue
        if expected is not None and seq != expected:
            lost = (seq - expected) & 0xFFFF
            out.append(("GAP", f"expected {expected}, got {seq}: {lost} frame(s) lost"))
        out.append(("OK", f"seq {seq:5d}  t={ts / 1000:5.1f} s  temp {temp / 100:6.2f} C  volt {volt / 1000:5.3f} V"))
        expected = (seq + 1) & 0xFFFF
        i += FRAME_LEN
    return out, skipped

if __name__ == "__main__":
    stream = build_stream()
    print(f"stream of {len(stream)} bytes; one frame is {FRAME_LEN} bytes (struct format {HEADER.format!r} plus a 2-byte CRC)")
    print("check: CRC-16/CCITT-FALSE of b'123456789' =", f"0x{crc16(b'123456789'):04X}", "(standard says 0x29B1)")
    records, skipped = parse(stream)
    for tag, text in records:
        print(f"  {tag:7s} {text}")
    ok = sum(1 for t, _ in records if t == "OK")
    print(f"{ok} good frames, {sum(1 for t, _ in records if t == 'GAP')} gap(s), {sum(1 for t, _ in records if t == 'BAD CRC')} bad CRC, {skipped} byte(s) skipped while resynchronising")
    print("(two BAD CRC lines: the first is the frame with a flipped bit; the second is a false sync on the 0xA5 inside the garbage bytes)")
    # the 16-bit sequence number wraps: 65534, 65535, 0, 1 is a perfectly consecutive run
    wrap = b"".join(make_frame(n, 100 * i, 2200, 3300) for i, n in enumerate((65534, 65535, 0, 1)))
    records, _ = parse(wrap)
    print("wrap check, sequence 65534 65535 0 1:", "no gaps" if not any(t == "GAP" for t, _ in records) else "GAP reported (bug)")
