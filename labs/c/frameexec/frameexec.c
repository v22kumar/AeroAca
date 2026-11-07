/* Lesson: Frame-based executives and overruns. Build: gcc -std=c11 -Wall -Wextra -o frameexec frameexec.c && ./frameexec
 *
 * A cyclic executive: a 40 ms MAJOR frame made of four 10 ms MINOR frames. Each task runs in a fixed set
 * of minor frames; nothing is preempted and nothing is created at run time. Each task has a budget (its
 * worst-case execution time). If the work in a minor frame needs more than 10 ms the frame OVERRUNS; the
 * executive notices at the frame boundary and the unfinished work carries into the next frame, which
 * then has less time. With no policy that can cascade; with a "shed low-rate work" policy the next frame
 * drops its low-rate tasks so the overrun is absorbed and the high-rate control task keeps its slot. */
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#define MINOR_MS 10
#define MINORS 4
#define MAJORS 3

typedef struct { const char *name; unsigned frames; int wcet; bool low_rate; } task_t;   /* frames: bit i = runs in minor frame i */
typedef struct { int major, minor, task, extra_ms; } injection_t;                          /* one task runs long, once */

static void run(const char *title, const task_t *tasks, int n, const injection_t *inj, bool shed) {
    printf("%s\n", title);
    int carry = 0, overruns = 0, shed_count = 0;
    for (int major = 0; major < MAJORS; major++) {
        for (int minor = 0; minor < MINORS; minor++) {
            int need = carry, carry_in = carry;
            char list[64] = "", note[80] = "";
            for (int i = 0; i < n; i++) {
                if (!((tasks[i].frames >> minor) & 1u)) continue;
                if (shed && carry_in > 0 && tasks[i].low_rate) { snprintf(note, sizeof note, "  (%s shed: frame starts %d ms late)", tasks[i].name, carry_in); shed_count++; continue; }
                need += tasks[i].wcet;
                if (inj && inj->major == major && inj->minor == minor && inj->task == i) need += inj->extra_ms;
                if (list[0]) strncat(list, "+", sizeof list - strlen(list) - 1);
                strncat(list, tasks[i].name, sizeof list - strlen(list) - 1);
            }
            carry = need > MINOR_MS ? need - MINOR_MS : 0;
            if (carry > 0) overruns++;
            char flag[40] = "";
            if (carry > 0) snprintf(flag, sizeof flag, "  OVERRUN, carries %d ms", carry);
            printf("  major %d minor %d: %-20s need %2d of %d ms%s%s\n", major, minor, list, need, MINOR_MS, flag, note);
        }
    }
    printf("  overrun frames: %d, tasks shed: %d\n\n", overruns, shed_count);
}

int main(void) {
    /* Control every minor frame (100 Hz); Nav in frames 0 and 2 (50 Hz); Log once per major frame (25 Hz), in frame 1 */
    const task_t tasks[] = { {"Control", 0xF, 5, false}, {"Nav", 0x5, 3, false}, {"Log", 0x2, 4, true} };
    run("Case 1: every task within its budget", tasks, 3, NULL, false);
    const injection_t slow_nav = { 1, 0, 1, 4 };   /* in major 1, minor 0, Nav takes 4 ms longer than its budget */
    run("Case 2: Nav runs 4 ms long in major 1, minor 0; no policy", tasks, 3, &slow_nav, false);
    run("Case 3: the same overrun with the shed-low-rate-work policy", tasks, 3, &slow_nav, true);
    return 0;
}
