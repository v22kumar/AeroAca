/* Unit tests for the detection function. Build and run: make test
 * A tiny assertion harness: no framework to install, and it can fail (make known-failure). */
#include <stdio.h>
#include <string.h>
#include "detect.h"

static int passed = 0, failed = 0;
#define CHECK(name, cond) do { if (cond) { passed++; printf("PASS %s\n", name); } else { failed++; printf("FAIL %s  (%s:%d)\n", name, __FILE__, __LINE__); } } while (0)

static const detect_cfg_t cfg = { .min_centi = -4000, .max_centi = 12500, .max_jump_centi = 500, .stuck_ms = 5000 };

static fault_t feed(history_t *h, uint32_t t_ms, bool acked, int32_t centi) {
    sample_t s = { .t_ms = t_ms, .acked = acked, .temp_centi = centi };
    return detect(&s, h, &cfg);
}

int main(int argc, char **argv) {
    const bool demonstrate_failure = (argc > 1 && strcmp(argv[1], "--known-failure") == 0);

    /* ICD golden pairs */
    CHECK("golden +25.00 degC", tmp102_to_centi(0x19, 0x00) == 2500);
    CHECK("golden -25.00 degC", tmp102_to_centi(0xE7, 0x00) == -2500);
    CHECK("golden +0.0625 degC is 6 centi (truncated)", tmp102_to_centi(0x00, 0x10) == 6);

    /* configuration range check (R7) */
    detect_cfg_t bad = cfg; bad.stuck_ms = 100;
    CHECK("config ok", detect_config_ok(&cfg));
    CHECK("config rejects 100 ms stuck window", !detect_config_ok(&bad));

    /* steady operation */
    history_t h = {0};
    CHECK("first sample is NONE", feed(&h, 0, true, 2500) == FAULT_NONE);
    CHECK("small change is NONE", feed(&h, 100, true, 2512) == FAULT_NONE);

    /* boundaries, one per fault type */
    CHECK("NACK", feed(&h, 200, false, 0) == FAULT_NACK);
    CHECK("range: -40.01 degC", feed(&h, 300, true, -4001) == FAULT_RANGE);
    CHECK("range: -40.00 degC is a jump, not a range fault", feed(&h, 400, true, -4000) == FAULT_JUMP);
    CHECK("jump: +5.01 degC", feed(&h, 500, true, 2512 + 501) == FAULT_JUMP);
    CHECK("jump: +5.00 degC is NONE", feed(&h, 600, true, 2512 + 500) == FAULT_NONE);

    /* stuck: exactly 5.0 s of no change */
    history_t s = {0};
    feed(&s, 0, true, 2500);
    fault_t f = FAULT_NONE;
    for (uint32_t t = 100; t <= 4900; t += 100) f = feed(&s, t, true, 2500);
    CHECK("stuck: 4.9 s unchanged is still NONE", f == FAULT_NONE);
    CHECK("stuck: 5.0 s unchanged is STUCK", feed(&s, 5000, true, 2500) == FAULT_STUCK);
    CHECK("stuck clears when the value moves", feed(&s, 5100, true, 2506) == FAULT_NONE);

    /* a timestamp wrap must not break the stuck timer */
    history_t w = {0};
    feed(&w, 0xFFFFF000u, true, 2500);
    CHECK("stuck across the 32-bit wrap", feed(&w, 0x00000400u, true, 2500) == FAULT_STUCK);

    if (demonstrate_failure) {
        /* Deliberately wrong expectation: proves the harness can fail. */
        CHECK("KNOWN FAILURE: a 4.99 degC jump reported as JUMP", feed(&h, 700, true, 2512 + 500 + 499) == FAULT_JUMP);
    }

    printf("%d passed, %d failed\n", passed, failed);
    return failed == 0 ? 0 : 1;
}
