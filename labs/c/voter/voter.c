/* Lesson: Voting, monitors and failover. Build: gcc -std=c11 -Wall -Wextra -o voter voter.c && ./voter
 *
 * A three-channel voter for one flight-control signal, in integer tenths of a unit so the output is
 * exactly reproducible. Each frame every channel supplies a value (or nothing, if its data is late).
 *   - the voted value is the MID-VALUE of the healthy channels, so one wild channel cannot move it;
 *   - a channel that differs from the voted value by more than MISCOMPARE_LIMIT, or is missing,
 *     is flagged for that frame;
 *   - PERSISTENCE consecutive flagged frames isolate the channel (one glitch must not remove it);
 *   - with two channels left the voter can detect a disagreement but not tell which is right, so it
 *     reports FAIL-PASSIVE and holds the last good value (a real system would command a safe state). */
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define FRAMES 16
#define MISCOMPARE_LIMIT 5
#define PERSISTENCE 3

typedef enum { NONE, STUCK, LATE, CORRUPT } fault_t;
typedef struct { fault_t kind; int start; } injection_t;

typedef struct { bool isolated; int flagged_run; int isolated_at; } channel_t;

static int truth(int frame) { return 100 + 5 * frame; }                 /* the real signal */
static const int bias[3] = { 0, 1, -1 };                                  /* each channel's own small error */

static bool channel_value(int ch, int frame, const injection_t *inj, int *last, int *out) {
    int v = truth(frame) + bias[ch];
    if (inj[ch].kind != NONE && frame >= inj[ch].start) {
        switch (inj[ch].kind) {
        case STUCK:   v = *last; break;                                    /* repeats its last good value */
        case LATE:    return false;                                        /* no fresh data this frame */
        case CORRUPT: v += 80; break;                                      /* e.g. a flipped high bit */
        default: break;
        }
    }
    *out = v; *last = v; return true;
}

static int median3(int a, int b, int c) {
    if ((a >= b && a <= c) || (a <= b && a >= c)) return a;
    if ((b >= a && b <= c) || (b <= a && b >= c)) return b;
    return c;
}

static void scenario(const char *title, const injection_t inj[3]) {
    channel_t ch[3] = {{false, 0, -1}, {false, 0, -1}, {false, 0, -1}};
    int last[3] = { truth(0), truth(0) + 1, truth(0) - 1 };
    int held = truth(0), max_err = 0, first_flag = -1;
    bool failpassive = false;
    printf("%s\n frame  truth    A    B    C  voted  notes\n", title);
    for (int f = 0; f < FRAMES; f++) {
        int val[3]; bool have[3];
        int usable[3], nu = 0;
        for (int c = 0; c < 3; c++) {
            have[c] = channel_value(c, f, inj, &last[c], &val[c]);
            if (!ch[c].isolated && have[c]) usable[nu++] = c;
        }
        int voted = held; char note[96] = "";
        int active = 0; for (int c = 0; c < 3; c++) if (!ch[c].isolated) active++;
        if (nu == 3) voted = median3(val[0], val[1], val[2]);
        else if (nu == 2 && active == 3) voted = median3(val[usable[0]], val[usable[1]], held);   /* one late: hold-vote */
        else if (nu == 2) {
            if (abs(val[usable[0]] - val[usable[1]]) > MISCOMPARE_LIMIT) { failpassive = true; snprintf(note, sizeof note, "FAIL-PASSIVE: two channels disagree, holding"); voted = held; }
            else voted = (val[usable[0]] + val[usable[1]]) / 2;
        } else if (nu == 1) voted = val[usable[0]];
        if (!failpassive) held = voted;
        for (int c = 0; c < 3; c++) {
            if (ch[c].isolated) continue;
            bool flagged = !have[c] || abs(val[c] - voted) > MISCOMPARE_LIMIT;
            if (flagged && !failpassive) {
                ch[c].flagged_run++;
                if (first_flag < 0) first_flag = f;
                if (ch[c].flagged_run >= PERSISTENCE) { ch[c].isolated = true; ch[c].isolated_at = f; snprintf(note, sizeof note, "channel %c ISOLATED after %d flagged frames", 'A' + c, PERSISTENCE); }
                else if (!note[0]) snprintf(note, sizeof note, "channel %c flagged (%d of %d)", 'A' + c, ch[c].flagged_run, PERSISTENCE);
            } else if (!flagged) ch[c].flagged_run = 0;
        }
        int err = abs(voted - truth(f)); if (err > max_err) max_err = err;
        printf("  %2d    %4d ", f, truth(f));
        for (int c = 0; c < 3; c++) { if (have[c]) printf(" %4d", val[c]); else printf("   --"); }
        printf("  %4d  %s\n", voted, note);
    }
    printf("  summary: first flag at frame %d;", first_flag);
    for (int c = 0; c < 3; c++) if (ch[c].isolated) printf(" channel %c isolated at frame %d;", 'A' + c, ch[c].isolated_at);
    printf(" worst voted error %d tenths%s\n\n", max_err, failpassive ? "; ended FAIL-PASSIVE" : "");
}

int main(void) {
    injection_t stuck[3]   = { {NONE,0}, {STUCK,6},   {NONE,0} };
    injection_t late[3]    = { {NONE,0}, {NONE,0},    {LATE,5} };
    injection_t corrupt[3] = { {CORRUPT,4}, {NONE,0}, {NONE,0} };
    injection_t two[3]     = { {NONE,0}, {STUCK,3},   {CORRUPT,11} };
    scenario("Scenario 1: channel B stuck from frame 6", stuck);
    scenario("Scenario 2: channel C late (no data) from frame 5", late);
    scenario("Scenario 3: channel A corrupted (+8.0) from frame 4", corrupt);
    scenario("Scenario 4: B stuck from frame 3, then C corrupted from frame 11", two);
    return 0;
}
