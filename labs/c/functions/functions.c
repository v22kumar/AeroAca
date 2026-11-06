/* Lesson: C foundations for firmware. Build: gcc -std=c11 -Wall -Wextra -o functions functions.c && ./functions */
#include <stdint.h>
#include <stdio.h>
#include <stddef.h>

/* A file-scope static: visible only inside this file (internal linkage). */
static uint32_t boot_count = 0;

/* static inside a function: one copy, keeps its value between calls. */
static uint32_t next_sequence(void) {
    static uint32_t seq = 0;
    return ++seq;
}

/* const: the compiler refuses writes; on a target this lives in flash. */
static const uint16_t crc_seed = 0xFFFFu;

/* Arrays decay to pointers when passed: the function needs the length. */
static uint32_t sum_u8(const uint8_t *data, size_t len) {
    uint32_t total = 0;
    for (size_t i = 0; i < len; i++) total += data[i];
    return total;
}

/* A struct passed by pointer: the caller's copy is updated, no large copy made. */
typedef struct { uint32_t t_ms; int32_t temp_centi; uint8_t flags; } sample_t;

static void stamp(sample_t *s, uint32_t now_ms) {
    s->t_ms = now_ms;
    s->flags |= 0x01u;   /* bit 0: valid */
}

int main(void) {
    boot_count++;
    printf("boot_count = %u\n", boot_count);
    /* Call order inside one printf is unspecified in C, so take the values first. */
    uint32_t a = next_sequence(), b = next_sequence(), c = next_sequence();
    printf("sequence: %u %u %u\n", a, b, c);
    printf("crc_seed = 0x%04X (const, read-only)\n", crc_seed);

    uint8_t frame[] = { 0xAA, 0x01, 0x09, 0xC4, 0x00 };
    printf("sizeof(frame) = %zu bytes, sum = %u\n", sizeof frame, sum_u8(frame, sizeof frame));
    const uint8_t *p = frame;
    printf("p[2] = 0x%02X, *(p + 3) = 0x%02X, p + 1 points %td byte(s) past p\n", p[2], *(p + 3), (p + 1) - p);

    sample_t s = { .temp_centi = 2500 };   /* other members zero-initialised */
    stamp(&s, 1234);
    printf("sample: t_ms=%u temp=%d flags=0x%02X sizeof=%zu (padding included)\n", s.t_ms, s.temp_centi, s.flags, sizeof s);
    return 0;
}
