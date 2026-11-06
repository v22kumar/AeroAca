"""Portfolio project: Python sensor model with fault injection.

Emits one line per 10 Hz sample as "t_ms,acked,temp_centi" so the C harness (make sim)
can run the real detection function against it. Deterministic: the noise is a fixed
sequence, not random, so the expected output is reproducible on any PC.

  python3 sensor_model.py --fault stuck --at 3.0 --seconds 10
  python3 sensor_model.py --fault nack --at 2.0 | ./sim

Faults: none, nack, range, jump, stuck, drift.
"""
import argparse

NOISE = [0, 6, -6, 12, 0, -12, 6, 0, -6, 6]   # centi-degC, repeats every second


def samples(fault: str, at_s: float, seconds: float, base_centi: int = 2500):
    n = int(seconds * 10)
    at_ms = int(at_s * 1000)
    for i in range(n):
        t_ms = i * 100
        acked = 1
        temp = base_centi + NOISE[i % len(NOISE)]
        if t_ms >= at_ms:
            if fault == "nack":
                acked = 0
            elif fault == "range":
                temp = 13000                      # above +125.00 degC
            elif fault == "jump":
                temp = base_centi + 800 + NOISE[i % len(NOISE)]   # +8 degC step
            elif fault == "stuck":
                temp = base_centi                 # value frozen, noise gone
            elif fault == "drift":
                temp = base_centi + (t_ms - at_ms) // 100 * 2 + NOISE[i % len(NOISE)]  # +0.2 degC/s
        yield t_ms, acked, temp


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--fault", default="none", choices=["none", "nack", "range", "jump", "stuck", "drift"])
    p.add_argument("--at", type=float, default=3.0, help="fault onset, seconds")
    p.add_argument("--seconds", type=float, default=10.0)
    a = p.parse_args()
    for t_ms, acked, temp in samples(a.fault, a.at, a.seconds):
        print(f"{t_ms},{acked},{temp}")


if __name__ == "__main__":
    main()
