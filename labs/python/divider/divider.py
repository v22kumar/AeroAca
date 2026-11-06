"""Lesson: Circuit laws on the bench. Run: python3 divider.py

Unloaded output, Thevenin resistance, loaded output and error for a voltage divider.
"""


def divider(v_in, r1, r2, load=None):
    v_open = v_in * r2 / (r1 + r2)          # unloaded output
    r_th = r1 * r2 / (r1 + r2)              # Thevenin resistance: R1 in parallel with R2
    if load is None:
        return v_open, r_th, v_open, 0.0
    v_loaded = v_open * load / (r_th + load)  # the load forms a second divider against R_th
    return v_open, r_th, v_loaded, (v_open - v_loaded) / v_open * 100


cases = [
    ("scenario, 10k/10k, 100k load", 3.3, 10e3, 10e3, 100e3),
    ("scenario, 100k/100k, 100k load", 3.3, 100e3, 100e3, 100e3),
    ("worked example, 4.7k/2.2k, 1M meter", 5.0, 4.7e3, 2.2e3, 1e6),
    ("exercise, 22k/22k, 47k load", 3.3, 22e3, 22e3, 47e3),
]
print(f"{'case':38} {'V_open':>7} {'R_th':>9} {'V_loaded':>9} {'error':>7}")
for name, v, r1, r2, load in cases:
    v_open, r_th, v_loaded, err = divider(v, r1, r2, load)
    print(f"{name:38} {v_open:7.3f} {r_th/1e3:7.2f}k {v_loaded:9.3f} {err:6.1f}%")
# power in a sense resistor: I^2 R
i, r = 3.0, 0.050
print(f"shunt {r*1e3:.0f} mOhm at {i:.1f} A: {i*r*1e3:.0f} mV across it, {i*i*r:.2f} W dissipated")
