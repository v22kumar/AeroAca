"""Lesson: Serial communication in Python. Run: python3 bytes_str.py"""

# A serial port moves bytes. Text is an interpretation of bytes under an encoding.
line = b"TEMP? 25.06\r\n"
print("type:", type(line).__name__, "length:", len(line))
print("as text:", repr(line.decode("ascii")))
print("stripped:", repr(line.decode("ascii").strip()))

# Encode before sending; the port will not accept str.
cmd = "*IDN?\n"
print("to send:", cmd.encode("ascii"))

# Non-ASCII bytes from a baud mismatch do not decode as ASCII; say so instead of crashing.
garbage = b"\xff\xff\x82\xe0\x80"
try:
    garbage.decode("ascii")
except UnicodeDecodeError as e:
    print("decode failed:", e.reason, "at byte", e.start)
print("hex view:", garbage.hex(" "))

# Framing: a reply may arrive in pieces. Accumulate until the terminator.
chunks = [b"25.", b"06\r", b"\n27.", b"10\r\n"]
buf = b""
for c in chunks:
    buf += c
    while b"\r\n" in buf:
        frame, buf = buf.split(b"\r\n", 1)
        print("complete line:", frame.decode("ascii"))
print("left in buffer:", buf)
