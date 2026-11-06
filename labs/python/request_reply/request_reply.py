"""Lesson: Serial communication in Python. Run: python3 request_reply.py

A request-reply helper that cannot drift: flush stale input, tag each request,
read until the terminator or a deadline, and accept only the reply with our tag.
The port is a fake so the lesson runs on any PC; replace FakePort with
serial.Serial(port, 115200, timeout=0.05) on the bench.
"""
from collections import deque


class FakePort:
    """A device that answers 'N:CMD' with 'N:VALUE', but one reply arrives late."""

    def __init__(self):
        self.inbox = deque()

    def write(self, data: bytes) -> None:
        tag, cmd = data.decode("ascii").strip().split(":")
        if cmd == "SLOW":
            # The reply to this request shows up only after the *next* write.
            self.pending = f"{tag}:slow-value\r\n".encode("ascii")
            return
        if getattr(self, "pending", None):
            self.inbox.append(self.pending)
            self.pending = None
        self.inbox.append(f"{tag}:{cmd.lower()}-value\r\n".encode("ascii"))

    def read_until(self, terminator: bytes = b"\r\n") -> bytes:
        return self.inbox.popleft() if self.inbox else b""  # b"" means timeout

    def reset_input_buffer(self) -> None:
        self.inbox.clear()


def ask(port, seq: int, cmd: str, retries: int = 3) -> str:
    """Send 'seq:cmd' and return the value from the reply that carries *this* seq."""
    port.reset_input_buffer()          # stale replies from earlier requests are discarded
    port.write(f"{seq}:{cmd}\n".encode("ascii"))
    for attempt in range(retries):
        raw = port.read_until(b"\r\n")
        if not raw:
            print(f"  seq {seq}: timeout on attempt {attempt + 1}")
            continue
        tag, _, value = raw.decode("ascii").strip().partition(":")
        if tag == str(seq):
            return value
        print(f"  seq {seq}: ignored stale reply tagged {tag}")
    raise TimeoutError(f"seq {seq}: no tagged reply for {cmd}")


port = FakePort()
print("TEMP ->", ask(port, 1, "TEMP"))
try:
    print("SLOW ->", ask(port, 2, "SLOW"))
except TimeoutError as e:
    print("SLOW ->", e)
print("VOLT ->", ask(port, 3, "VOLT"))
print("done: every value matched its own request")
