/* Lesson: State machines that survive review. Build: gcc -std=c11 -Wall -Wextra -o debounce debounce.c && ./debounce */
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

/* A button debouncer as an explicit state machine, ticked every 5 ms. */
typedef enum { S_RELEASED, S_MAYBE_PRESSED, S_PRESSED, S_MAYBE_RELEASED } state_t;

typedef struct {
    state_t state;
    uint8_t count;        /* consecutive samples agreeing with the pending change */
} debounce_t;

#define STABLE_SAMPLES 3u

static const char *name(state_t s) {
    static const char *names[] = { "RELEASED", "MAYBE_PRESSED", "PRESSED", "MAYBE_RELEASED" };
    return names[s];
}

/* Returns true exactly once per accepted press. */
static bool debounce_step(debounce_t *d, bool raw_pressed) {
    bool press_event = false;
    switch (d->state) {
        case S_RELEASED:
            if (raw_pressed) { d->state = S_MAYBE_PRESSED; d->count = 1; }
            break;
        case S_MAYBE_PRESSED:
            if (!raw_pressed) { d->state = S_RELEASED; }
            else if (++d->count >= STABLE_SAMPLES) { d->state = S_PRESSED; press_event = true; }
            break;
        case S_PRESSED:
            if (!raw_pressed) { d->state = S_MAYBE_RELEASED; d->count = 1; }
            break;
        case S_MAYBE_RELEASED:
            if (raw_pressed) { d->state = S_PRESSED; }
            else if (++d->count >= STABLE_SAMPLES) { d->state = S_RELEASED; }
            break;
    }
    return press_event;
}

int main(void) {
    /* raw samples every 5 ms: a bouncy press, a hold, a bouncy release */
    const bool raw[] = { 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0 };
    debounce_t d = { S_RELEASED, 0 };
    unsigned presses = 0;
    for (unsigned i = 0; i < sizeof raw / sizeof raw[0]; i++) {
        bool ev = debounce_step(&d, raw[i]);
        presses += ev;
        printf("t=%3u ms raw=%d -> %-14s%s\n", i * 5, raw[i], name(d.state), ev ? "  PRESS" : "");
    }
    printf("presses counted: %u (one bouncy press, one bouncy release)\n", presses);
    return 0;
}
