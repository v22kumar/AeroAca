"""Lesson: ARINC 429 words, labels and the sign/status matrix.
Run: python3 a429.py

An ARINC 429 word is 32 bits. Bits are numbered 1 to 32 in the order they are transmitted:
    bits 1-8   label (an octal number, transmitted most significant bit LAST, i.e. bit-reversed)
    bits 9-10  SDI  (source/destination identifier)
    bits 11-29 data (here: BNR, a two's-complement binary number, 19 bits including the sign bit)
    bits 30-31 SSM  (sign/status matrix; for BNR: 00 failure warning, 01 no computed data, 10 functional test, 11 normal)
    bit  32    parity (odd over the whole 32 bits)
The label and field values below are SYNTHETIC examples, not taken from any real equipment's ICD."""

def reverse8(x):
    return int(f"{x:08b}"[::-1], 2)

def encode_bnr(label_octal, sdi, value, resolution, ssm=0b11, data_bits=19):
    """Value in engineering units; resolution = value of one least-significant bit."""
    raw = round(value / resolution)
    limit = 1 << (data_bits - 1)
    if not -limit <= raw < limit:
        raise ValueError("value out of range for this field")
    data = raw & ((1 << data_bits) - 1)
    word = reverse8(int(str(label_octal), 8))          # the label goes into bits 1-8 bit-reversed (it is sent MSB first)
    word |= (sdi & 3) << 8
    word |= data << 10
    word |= (ssm & 3) << 29
    ones = bin(word).count("1")
    word |= (1 if ones % 2 == 0 else 0) << 31          # odd parity
    return word

def decode(word, resolution, data_bits=19):
    label = reverse8(word & 0xFF)
    sdi = (word >> 8) & 3
    data = (word >> 10) & ((1 << data_bits) - 1)
    if data >= 1 << (data_bits - 1):
        data -= 1 << data_bits
    ssm = (word >> 29) & 3
    parity_ok = bin(word).count("1") % 2 == 1
    return {"label": f"{label:03o}", "sdi": sdi, "raw": data, "value": data * resolution, "ssm": ssm, "parity_ok": parity_ok}

SSM_BNR = {0b00: "failure warning", 0b01: "no computed data", 0b10: "functional test", 0b11: "normal operation"}

def show(title, word, resolution):
    d = decode(word, resolution)
    print(f"{title}")
    print(f"  word = 0x{word:08X}")
    print(f"  label {d['label']} (octal)  SDI {d['sdi']}  data {d['raw']} counts = {d['value']:.2f}  SSM {d['ssm']:02b} ({SSM_BNR[d['ssm']]})  parity {'ok' if d['parity_ok'] else 'BAD'}")

if __name__ == "__main__":
    # A synthetic altitude word: label 203 (octal), resolution 1 ft per count for this example field.
    w = encode_bnr("203", sdi=0, value=35000, resolution=1.0)
    show("Altitude 35000 ft, normal operation", w, 1.0)
    w2 = encode_bnr("203", sdi=0, value=-250, resolution=1.0)
    show("Altitude -250 ft (below sea level), normal operation", w2, 1.0)
    w3 = encode_bnr("203", sdi=0, value=35000, resolution=1.0, ssm=0b00)
    show("Same value, but the source reports FAILURE WARNING", w3, 1.0)
    bad = w ^ (1 << 14)
    show("Altitude word with one bit flipped in transit", bad, 1.0)
    print("\nlabel byte checks")
    for oct_label in ("203", "310", "377"):
        v = int(oct_label, 8)
        print(f"  label {oct_label} octal = 0b{v:08b}; transmitted order (bit-reversed) = 0b{reverse8(v):08b}")
    # an out-of-range value is refused rather than wrapped
    try:
        encode_bnr("203", 0, 300000, 1.0)
    except ValueError as e:
        print("  encode refused 300000 ft:", e)
