/* Lesson: Tasks, the scheduler and the tick. Build: gcc -std=c11 -Wall -Wextra -o sched sched.c && ./sched
 * A model of a fixed-priority preemptive scheduler with a 1 ms tick: three periodic tasks, each with a
 * period and a worst-case execution time, run on one core. Prints a timeline and the response time of
 * each task's first job, then shows the lowest-priority task missing its deadline when load goes up. */
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

typedef struct { const char *name; uint32_t period; uint32_t exec; uint32_t remaining; uint32_t released; uint32_t deadline_misses; uint32_t worst_resp; } task_t;

static void run(task_t *tasks, int n, uint32_t ticks, bool print_timeline) {
    for (int i = 0; i < n; i++) { tasks[i].remaining = 0; tasks[i].released = 0; tasks[i].deadline_misses = 0; tasks[i].worst_resp = 0; }
    char line[256]; int len = 0;
    for (uint32_t t = 0; t < ticks; t++) {
        for (int i = 0; i < n; i++) {               /* release jobs at their periods; deadline = next release */
            if (t % tasks[i].period == 0) {
                if (tasks[i].remaining > 0 && t > 0) tasks[i].deadline_misses++;   /* previous job still unfinished */
                tasks[i].remaining = tasks[i].exec;
                tasks[i].released = t;
            }
        }
        int run_idx = -1;                            /* highest priority (lowest index) with work */
        for (int i = 0; i < n; i++) if (tasks[i].remaining > 0) { run_idx = i; break; }
        if (run_idx >= 0) {
            tasks[run_idx].remaining--;
            if (tasks[run_idx].remaining == 0) {
                uint32_t resp = t + 1 - tasks[run_idx].released;
                if (resp > tasks[run_idx].worst_resp) tasks[run_idx].worst_resp = resp;
            }
        }
        if (print_timeline && t < 24) len += snprintf(line + len, sizeof line - (size_t)len, "%c", run_idx >= 0 ? tasks[run_idx].name[0] : '.');
    }
    if (print_timeline) printf("timeline (first 24 ms, one char per ms, '.' = idle): %s\n", line);
    double u = 0;
    for (int i = 0; i < n; i++) u += (double)tasks[i].exec / tasks[i].period;
    printf("utilisation = %.2f\n", u);
    for (int i = 0; i < n; i++)
        printf("  %s: period %2u ms, exec %u ms, worst response %2u ms, deadline misses %u\n", tasks[i].name, tasks[i].period, tasks[i].exec, tasks[i].worst_resp, tasks[i].deadline_misses);
}

int main(void) {
    /* rate-monotonic: shorter period = higher priority; index order is priority order */
    task_t a[] = { {"Sensor", 4, 1, 0,0,0,0}, {"Control", 8, 2, 0,0,0,0}, {"Logger", 12, 3, 0,0,0,0} };
    printf("Case 1: Sensor 1/4, Control 2/8, Logger 3/12\n");
    run(a, 3, 240, true);
    task_t b[] = { {"Sensor", 4, 1, 0,0,0,0}, {"Control", 8, 2, 0,0,0,0}, {"Logger", 12, 7, 0,0,0,0} };
    printf("Case 2: Logger execution grows to 7 ms\n");
    run(b, 3, 240, true);
    return 0;
}
