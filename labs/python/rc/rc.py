"""Lesson: Capacitors, inductors, RC and filters. Run: python3 rc.py

Time constants, threshold crossing times, filter cutoff and attenuation for a few RC pairs.
"""
import math

cases = [("button debounce", 10e3, 100e-9), ("anti-alias", 3.3e3, 1e-6), ("exercise", 4.7e3, 33e-9)]
for name, r, c in cases:
    tau = r * c
    fc = 1 / (2 * math.pi * r * c)
    print(f"{name}: R={r/1e3:g} kOhm C={c*1e9:g} nF  tau={tau*1e3:.3f} ms  f_c={fc:.1f} Hz")
    print("  charge: " + "  ".join(f"{k}tau={100*(1-math.exp(-k)):.1f}%" for k in (1, 3, 5)))
    print(f"  time to 50%={-tau*math.log(0.5)*1e3:.3f} ms  to 70%={-tau*math.log(0.3)*1e3:.3f} ms")
    atten = "  ".join(f"{f:g}Hz:{20*math.log10(1/math.sqrt(1+(f/fc)**2)):.1f}dB" for f in (10, 50, 1000, 20000))
    print("  attenuation: " + atten)
