/* Lesson: Structural coverage and MC/DC. Build: gcc -std=c11 -Wall -Wextra -o mcdc mcdc.c && ./mcdc
 *
 * For a decision built from several conditions, MC/DC (modified condition/decision coverage) asks for
 * a set of tests in which every condition is shown to independently change the decision's outcome:
 * for each condition there must be a PAIR of tests that differ only in that condition and give
 * different outcomes. This program enumerates all input combinations, finds those pairs, and then
 * searches for the smallest test set that has a pair for every condition. */
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

#define MAXN 4

typedef bool (*decision_fn)(unsigned bits);   /* bit i of `bits` is condition i (A = bit 0) */

static bool d_and_or(unsigned v) { bool A = v & 1u, B = v & 2u, C = v & 4u; return (A && B) || C; }
static bool d_and_of_or(unsigned v) { bool A = v & 1u, B = v & 2u, C = v & 4u; return A && (B || C); }
static bool d_four(unsigned v) { bool A = v & 1u, B = v & 2u, C = v & 4u, D = v & 8u; return (A && B) || (C && D); }

static void show_vector(unsigned v, int n) {
    for (int i = 0; i < n; i++) putchar((v >> i) & 1u ? 'T' : 'F');
}

/* Does the set (bit mask over vectors) contain an independence pair for condition c? */
static bool has_pair(decision_fn f, int n, uint32_t set_lo, uint32_t set_hi, int c, unsigned *pa, unsigned *pb) {
    unsigned count = 1u << n;
    for (unsigned a = 0; a < count; a++) {
        unsigned b = a ^ (1u << c);
        if (a > b) continue;
        bool in_a = a < 32 ? (set_lo >> a) & 1u : (set_hi >> (a - 32)) & 1u;
        bool in_b = b < 32 ? (set_lo >> b) & 1u : (set_hi >> (b - 32)) & 1u;
        if (in_a && in_b && f(a) != f(b)) { if (pa) *pa = a; if (pb) *pb = b; return true; }
    }
    return false;
}

static void analyse(const char *name, decision_fn f, int n) {
    unsigned count = 1u << n;
    printf("Decision: %s   (%d conditions, %u input combinations)\n", name, n, count);
    printf("  truth table:");
    for (unsigned v = 0; v < count; v++) { printf(" "); show_vector(v, n); printf("=%c", f(v) ? 'T' : 'F'); }
    printf("\n");
    for (int c = 0; c < n; c++) {
        printf("  condition %c independence pairs:", 'A' + c);
        int pairs = 0;
        for (unsigned a = 0; a < count; a++) {
            unsigned b = a ^ (1u << c);
            if (a < b && f(a) != f(b)) { printf(" (");  show_vector(a, n); printf(",");  show_vector(b, n); printf(")"); pairs++; }
        }
        printf("  [%d]\n", pairs);
    }
    /* smallest set of vectors that gives every condition a pair (exhaustive over subsets) */
    uint64_t best = 0; int best_size = 99;
    for (uint64_t s = 1; s < (1ull << count); s++) {
        int size = __builtin_popcountll(s);
        if (size >= best_size) continue;
        uint32_t lo = (uint32_t)(s & 0xFFFFFFFFu), hi = (uint32_t)(s >> 32);
        bool ok = true;
        for (int c = 0; c < n && ok; c++) ok = has_pair(f, n, lo, hi, c, NULL, NULL);
        if (ok) { best = s; best_size = size; }
    }
    printf("  smallest MC/DC set: %d tests (n + 1 = %d):", best_size, n + 1);
    for (unsigned v = 0; v < count; v++) if ((best >> v) & 1u) { printf(" "); show_vector(v, n); printf("=%c", f(v) ? 'T' : 'F'); }
    printf("\n");
    /* what weaker criteria need */
    bool seen_t = false, seen_f = false; int dec_cov = 0;
    for (unsigned v = 0; v < count && dec_cov < 2; v++) { bool o = f(v); if ((o && !seen_t) || (!o && !seen_f)) { dec_cov++; if (o) seen_t = true; else seen_f = true; } }
    printf("  decision coverage needs only 2 tests (one true outcome, one false); MC/DC needs %d\n\n", best_size);
}

int main(void) {
    analyse("(A && B) || C", d_and_or, 3);
    analyse("A && (B || C)", d_and_of_or, 3);
    analyse("(A && B) || (C && D)", d_four, 4);
    /* A test set that reaches 100 % decision coverage but fails MC/DC for (A && B) || C. */
    unsigned weak[] = { 0x7, 0x0 };   /* TTT -> T, FFF -> F */
    printf("Check: tests TTT and FFF on (A && B) || C\n");
    uint32_t set = 0; for (unsigned i = 0; i < 2; i++) set |= 1u << weak[i];
    printf("  decision coverage: both outcomes seen -> yes\n");
    for (int c = 0; c < 3; c++) printf("  condition %c shown independent: %s\n", 'A' + c, has_pair(d_and_or, 3, set, 0, c, NULL, NULL) ? "yes" : "NO");
    return 0;
}
