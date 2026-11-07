"""Lesson: The architecture of a test framework.
Run: python3 benchframework.py

A tiny framework, standard library only, built in the same layers you would draw on a whiteboard:

    reporting     collects results and writes the table
    test cases    plain functions that ask for what they need (fixtures) and assert
    protocol      encodes commands and decodes replies (frames, checksums)
    driver        the one place that talks to the device: here a SIMULATED serial device
    configuration ports, timeouts and the seed, in one place so a run can be repeated

The device is a simulation written for this lesson (no hardware involved). The same test cases would run
against a real serial port by swapping the driver, which is the point of the layers.
Fixtures, parametrisation and markers mirror what pytest provides; run this file to see them work."""
import random

CONFIG = {"seed": 1234, "timeout_ms": 200, "has_hardware": False, "tool": "benchframework 1"}

# ------------------------------------------------------------------ driver layer (the only code that touches the device)
class SimulatedDevice:
    """A made-up device: replies to 'ID?', 'TEMP?' and 'ECHO <text>'; sometimes answers late."""
    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.buffer = b""
    def write(self, data):
        cmd = data.strip().decode()
        if cmd == "ID?": reply, delay = "ACME-NODE,1.4", 20
        elif cmd == "TEMP?": reply, delay = f"{21.5 + self.rng.random():.2f}", 30
        elif cmd.startswith("ECHO "): reply, delay = cmd[5:], 15
        else: reply, delay = "ERR UNKNOWN", 10
        if cmd == "ECHO slow": delay = 450                      # a reply that arrives after the timeout
        self.buffer = (reply + "\n").encode(); self.delay = delay
    def read(self, timeout_ms):
        if self.delay > timeout_ms: self.buffer = b""; return b""
        data, self.buffer = self.buffer, b""; return data

# ------------------------------------------------------------------ protocol layer
def request(device, text, timeout_ms):
    device.write(text.encode() + b"\n")
    reply = device.read(timeout_ms)
    if not reply: raise TimeoutError(f"no reply to {text!r} within {timeout_ms} ms")
    return reply.decode().strip()

# ------------------------------------------------------------------ framework core: fixtures, parametrisation, markers
FIXTURES, CASES = {}, []
def fixture(fn): FIXTURES[fn.__name__] = fn; return fn
def case(*, params=None, needs_hardware=False):
    def wrap(fn): CASES.append((fn, params, needs_hardware)); return fn
    return wrap

@fixture
def device(): return SimulatedDevice(CONFIG["seed"])
@fixture
def timeout_ms(): return CONFIG["timeout_ms"]

# ------------------------------------------------------------------ test cases
@case()
def test_identifies_itself(device, timeout_ms):
    assert request(device, "ID?", timeout_ms).startswith("ACME-NODE"), "unexpected identity"

@case()
def test_temperature_is_plausible(device, timeout_ms):
    t = float(request(device, "TEMP?", timeout_ms))
    assert 15.0 <= t <= 35.0, f"temperature {t} outside 15..35 C"

@case(params=["hello", "123", "a b c"])
def test_echo_roundtrip(device, timeout_ms, param):
    assert request(device, f"ECHO {param}", timeout_ms) == param

@case(params=["slow"])
def test_reply_within_timeout(device, timeout_ms, param):
    request(device, f"ECHO {param}", timeout_ms)               # this device answers late: expect a TimeoutError

@case(needs_hardware=True)
def test_flash_the_firmware(device):
    raise AssertionError("must not run without hardware")

# ------------------------------------------------------------------ reporting layer
def run_all():
    results = []
    for fn, params, needs_hw in CASES:
        for p in (params if params is not None else [None]):
            name = fn.__name__ + (f"[{p}]" if p is not None else "")
            if needs_hw and not CONFIG["has_hardware"]:
                results.append((name, "SKIP", "needs hardware")); continue
            kwargs = {a: FIXTURES[a]() for a in fn.__code__.co_varnames[:fn.__code__.co_argcount] if a in FIXTURES}
            if p is not None: kwargs["param"] = p
            try:
                fn(**kwargs); results.append((name, "PASS", ""))
            except AssertionError as e: results.append((name, "FAIL", str(e)))
            except TimeoutError as e: results.append((name, "ERROR", str(e)))
    return results

def report(results):
    print(f"{CONFIG['tool']}  seed={CONFIG['seed']}  timeout={CONFIG['timeout_ms']} ms  hardware={CONFIG['has_hardware']}")
    for name, status, why in results:
        print(f"  {status:5s} {name}{'  -- ' + why if why else ''}")
    counts = {s: sum(1 for _, st, _ in results if st == s) for s in ("PASS", "FAIL", "ERROR", "SKIP")}
    print("  " + ", ".join(f"{n} {s}" for s, n in counts.items()))

report(run_all())
