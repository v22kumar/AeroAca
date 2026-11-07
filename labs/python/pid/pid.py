"""Lesson: The control loop and PID without mystery.
Run: python3 pid.py

A first-order plant (think: a motor speed or a heater) closed with a discrete PID controller, simulated
with a fixed time step so every number is reproducible:

    plant:  dx/dt = (u - x) / TAU        (x settles to u; TAU is its time constant, seconds)
    PID:    u = Kp*e + Ki*integral(e) + Kd*de/dt,   e = setpoint - x

Four experiments show what each term does and what an actuator limit does to the integral term."""

TAU, DT, T_END = 1.0, 0.02, 10.0

def lcg(seed=12345):
    """A tiny deterministic pseudo-random generator, so 'noise' is the same on every machine."""
    state = seed
    while True:
        state = (1103515245 * state + 12345) % (2 ** 31)
        yield state / 2 ** 31 - 0.5                      # uniform in [-0.5, 0.5)

def simulate(kp, ki, kd, setpoint=1.0, u_limit=None, anti_windup=False, noise=0.0):
    x, integral, prev_e, t = 0.0, 0.0, setpoint, 0.0
    trace, rnd = [], lcg()
    while t < T_END - 1e-9:
        e = setpoint - (x + noise * next(rnd))           # the controller sees a noisy measurement
        deriv = (e - prev_e) / DT
        u_unsat = kp * e + ki * integral + kd * deriv
        u = u_unsat if u_limit is None else max(-u_limit, min(u_limit, u_unsat))
        saturated = u != u_unsat
        if not (anti_windup and saturated):            # anti-windup: stop integrating while the actuator is saturated
            integral += e * DT
        x += DT * (u - x) / TAU
        prev_e, t = e, t + DT
        trace.append((t, x, u))
    return trace

def metrics(trace, setpoint=1.0):
    peak = max(x for _, x, _ in trace)
    overshoot = max(0.0, (peak - setpoint) / setpoint * 100)
    band = 0.02 * setpoint
    final = trace[-1][1]
    if abs(final - setpoint) > band:
        settle = None                                   # never settles inside the band
    else:
        settle = next((t for t, x, _ in reversed(trace) if abs(x - setpoint) > band), 0.0) + DT
    return peak, overshoot, settle, final

def show(title, trace):
    peak, over, settle, final = metrics(trace)
    print(f"{title}")
    samples = [trace[int(s / DT) - 1] for s in (0.5, 1.0, 2.0, 4.0, 8.0)]
    print("   t(s):  " + "  ".join(f"{t:5.1f}" for t, _, _ in samples))
    print("   x:     " + "  ".join(f"{x:5.3f}" for _, x, _ in samples))
    print("   u:     " + "  ".join(f"{u:5.2f}" for _, _, u in samples))
    when = "never" if settle is None else f"after {settle:4.1f} s"
    print(f"   peak {peak:.3f}  overshoot {over:4.1f} %  settled (within 2 %) {when}  final x {final:.3f}\n")

show("1. P only, Kp = 2: steady-state error remains (x settles below the setpoint)", simulate(2.0, 0.0, 0.0))
show("2. PI, Kp = 1, Ki = 4: the integral removes the error, at the cost of overshoot", simulate(1.0, 4.0, 0.0))
show("3. PI, Kp = 3, Ki = 3: more proportional gain damps the overshoot away", simulate(3.0, 3.0, 0.0))
def jitter(trace):
    return sum(abs(trace[i][2] - trace[i - 1][2]) for i in range(1, len(trace))) / (len(trace) - 1)
print("Measurement noise of +/- 0.01 on x: what the derivative term does to the controller output")
for kd in (0.0, 0.2, 0.5):
    tr = simulate(3.0, 3.0, kd, noise=0.02)
    print(f"   Kd = {kd}: mean step-to-step change in u = {jitter(tr):.3f}   (final x {tr[-1][1]:.3f})")
print()
print("Actuator limited to +/- 1.2 and a large Kp, Ki (the controller asks for more than it can get):")
show("4a. PI, Kp = 4, Ki = 4, no anti-windup: the integral keeps growing while u is clamped", simulate(4.0, 4.0, 0.0, u_limit=1.2))
show("4b. same gains with anti-windup (integrate only while not saturated)", simulate(4.0, 4.0, 0.0, u_limit=1.2, anti_windup=True))
