/* Lesson: A ring buffer for the UART driver. Build: gcc -std=c11 -Wall -Wextra -o ring ring.c && ./ring */
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

/* Single-producer (ISR writes), single-consumer (main loop reads) ring buffer.
   Head and tail are each written by only one side, so no lock is needed as long as
   the index type is written atomically (a byte or word on Cortex-M). Capacity is a
   power of two so the wrap is a mask, and one slot is kept empty to tell full from empty. */
#define RING_SIZE 8u
#define RING_MASK (RING_SIZE - 1u)

typedef struct {
    volatile uint8_t head;   /* written by the producer (ISR) */
    volatile uint8_t tail;   /* written by the consumer (main loop) */
    uint8_t buf[RING_SIZE];
} ring_t;

static bool ring_put(ring_t *r, uint8_t byte) {
    uint8_t next = (uint8_t)((r->head + 1u) & RING_MASK);
    if (next == r->tail) return false;          /* full: drop and report */
    r->buf[r->head] = byte;
    r->head = next;                              /* publish last, after the data is written */
    return true;
}

static bool ring_get(ring_t *r, uint8_t *out) {
    if (r->tail == r->head) return false;        /* empty */
    *out = r->buf[r->tail];
    r->tail = (uint8_t)((r->tail + 1u) & RING_MASK);
    return true;
}

static uint8_t ring_count(const ring_t *r) { return (uint8_t)((r->head - r->tail) & RING_MASK); }

static int passed = 0, failed = 0;
#define CHECK(name, cond) do { if (cond) { passed++; printf("PASS %s\n", name); } else { failed++; printf("FAIL %s\n", name); } } while (0)

int main(void) {
    ring_t r = { 0, 0, {0} };
    uint8_t out = 0;
    CHECK("empty at start", !ring_get(&r, &out));
    CHECK("put then get returns the byte", ring_put(&r, 0x41) && ring_get(&r, &out) && out == 0x41);

    /* fill: capacity is RING_SIZE - 1 because one slot distinguishes full from empty */
    unsigned accepted = 0;
    for (uint8_t i = 0; i < 10; i++) accepted += ring_put(&r, i);
    CHECK("accepts exactly 7 of 10 bytes", accepted == RING_SIZE - 1u);
    CHECK("count reports 7", ring_count(&r) == 7);
    CHECK("full buffer rejects a put", !ring_put(&r, 0xFF));

    /* drain in order */
    bool in_order = true;
    for (uint8_t i = 0; i < 7; i++) { ring_get(&r, &out); if (out != i) in_order = false; }
    CHECK("drains in FIFO order", in_order);
    CHECK("empty after drain", !ring_get(&r, &out));

    /* wrap: indices pass the end of the array many times */
    bool wrap_ok = true;
    for (uint16_t i = 0; i < 1000; i++) { ring_put(&r, (uint8_t)i); ring_get(&r, &out); if (out != (uint8_t)i) wrap_ok = false; }
    CHECK("1000 put/get pairs survive the index wrap", wrap_ok);

    printf("%d passed, %d failed\n", passed, failed);
    return failed == 0 ? 0 : 1;
}
