/* Host harness: reads "t_ms,acked,temp_centi" lines on stdin (from sensor_model.py),
 * runs the detection function and prints the ICD log line for every sample. Build: make sim */
#include <stdio.h>
#include "detect.h"

int main(void) {
    const detect_cfg_t cfg = { .min_centi = -4000, .max_centi = 12500, .max_jump_centi = 500, .stuck_ms = 5000 };
    history_t h = {0};
    if (!detect_config_ok(&cfg)) { puts("AA,0,32767,0,CONFIG"); return 2; }
    unsigned t; int acked; long centi; int alarm = 0;
    fault_t first_fault = FAULT_NONE; unsigned first_fault_at = 0;
    while (scanf("%u,%d,%ld", &t, &acked, &centi) == 3) {
        sample_t s = { .t_ms = t, .acked = acked != 0, .temp_centi = (int32_t)centi };
        fault_t f = detect(&s, &h, &cfg);
        if (f != FAULT_NONE && !alarm) { alarm = 1; first_fault = f; first_fault_at = t; }
        /* ICD: AA,<ms>,<temp_centi>,<alarm>,<fault>  (32767 = invalid reading) */
        printf("AA,%u,%ld,%d,%s\n", t, s.acked ? centi : 32767L, alarm, fault_name(f));
    }
    if (alarm) printf("# first fault %s at t=%u ms\n", fault_name(first_fault), first_fault_at);
    return 0;
}
