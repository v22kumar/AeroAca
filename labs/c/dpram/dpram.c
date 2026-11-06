/* Lesson: Shared memory and dual-port RAM handshakes. Build: gcc -std=c11 -Wall -Wextra -o dpram dpram.c && ./dpram
 *
 * Two processors share a small record in dual-port RAM: three words that must always agree (here they
 * all hold the same version number k, so a torn read is easy to see). The processors run independently,
 * so the reader can look at the record in the middle of the writer's update. This program does not use
 * threads: it steps the writer and the reader one memory access at a time, in an order given by a
 * schedule string ('W' = writer takes a step, 'R' = reader takes a step), so every interleaving is
 * exactly reproducible.
 *
 *   NAIVE:   writer stores w0, w1, w2.  reader loads w0, w1, w2 and trusts them.
 *   SEQUENCE: writer bumps seq to ODD, stores w0, w1, w2, bumps seq to EVEN.
 *             reader loads seq, w0, w1, w2, seq again; accepts only if the first seq was even and
 *             both loads of seq agree; otherwise it throws the read away and retries. */
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

typedef struct { uint32_t seq; int32_t w[3]; } dpram_t;

typedef struct {
    bool use_seq; int wstep, rstep; int version;
    int32_t got[3]; uint32_t s1, s2; int attempts; bool accepted;
} sim_t;

static void writer_step(sim_t *s, dpram_t *m) {
    int n = s->use_seq ? 5 : 3, k = s->wstep;
    if (k >= n) return;
    if (s->use_seq) { if (k == 0) m->seq++; else if (k == 4) m->seq++; else m->w[k - 1] = s->version; }
    else m->w[k] = s->version;
    s->wstep++;
}

static void reader_step(sim_t *s, const dpram_t *m) {
    if (s->accepted) return;
    if (!s->use_seq) { s->got[s->rstep] = m->w[s->rstep]; if (++s->rstep == 3) { s->accepted = true; s->attempts = 1; } return; }
    switch (s->rstep) {
    case 0: s->s1 = m->seq; break;
    case 1: case 2: case 3: s->got[s->rstep - 1] = m->w[s->rstep - 1]; break;
    case 4: s->s2 = m->seq; break;
    }
    if (++s->rstep == 5) {
        s->attempts++;
        if ((s->s1 & 1u) == 0 && s->s1 == s->s2) s->accepted = true;
        else s->rstep = 0;                                  /* reject and retry */
    }
}

static void trial(const char *schedule, bool use_seq) {
    dpram_t mem = { 0, { 0, 0, 0 } };
    sim_t s; memset(&s, 0, sizeof s); s.use_seq = use_seq; s.version = 7;
    for (const char *c = schedule; *c; c++) { if (*c == 'W') writer_step(&s, &mem); else reader_step(&s, &mem); }
    while (s.wstep < (use_seq ? 5 : 3)) writer_step(&s, &mem);     /* the writer always finishes its update */
    while (!s.accepted) reader_step(&s, &mem);                       /* the reader retries until it has a read */
    bool consistent = s.got[0] == s.got[1] && s.got[1] == s.got[2];
    printf("  %-9s -> reader accepted [%2d %2d %2d]%s%s\n", schedule, s.got[0], s.got[1], s.got[2],
           consistent ? "  consistent" : "  TORN READ (words from two different updates)", use_seq && s.attempts > 1 ? "  (retried)" : "");
}

int main(void) {
    printf("Initial record: [0 0 0]; the writer is updating it to [7 7 7].\n\n");
    printf("NAIVE, no handshake:\n");
    trial("WWWRRR", false);       /* writer completes, then reader */
    trial("RRRWWW", false);       /* reader completes first: reads the old record */
    trial("WWRRRW", false);       /* reader runs while the writer is half done */
    trial("WRWRWR", false);       /* strictly alternating */
    printf("\nSEQUENCE COUNTER (odd while the writer is inside the update):\n");
    trial("WWWWWRRRRR", true);
    trial("RRRRRWWWWW", true);
    trial("WWWRRRRRWW", true);    /* the same bad moment as above: now detected and retried */
    trial("WRWRWRWRWR", true);
    return 0;
}
