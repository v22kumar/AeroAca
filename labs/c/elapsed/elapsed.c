/* Lesson: Fixed-width integers. Build: gcc -std=c11 -Wall -Wextra -o elapsed elapsed.c && ./elapsed */
#include <stdint.h>
#include <stdio.h>

/* Elapsed milliseconds that stays correct when the 32-bit tick wraps:
   unsigned subtraction is defined modulo 2^32, so (now - then) is right
   even when now has wrapped past zero and is numerically smaller. */
static uint32_t elapsed_ms(uint32_t now, uint32_t then) { return now - then; }

/* The wrong way: a signed comparison of the raw values. */
static int expired_wrong(uint32_t now, uint32_t deadline) { return now >= deadline; }
static int expired_right(uint32_t now, uint32_t start, uint32_t timeout) { return elapsed_ms(now, start) >= timeout; }

int main(void) {
    uint32_t then = 0xFFFFFFF0u;         /* 16 ms before the wrap */
    uint32_t now = 0x00000014u;          /* 20 ms after the wrap */
    printf("then = 0x%08X, now = 0x%08X\n", then, now);
    printf("elapsed_ms = %u\n", elapsed_ms(now, then));

    uint32_t start = 0xFFFFFFF0u, timeout = 100u;
    uint32_t deadline = start + timeout; /* wraps to a small number */
    printf("deadline = 0x%08X (wrapped)\n", deadline);
    printf("expired_wrong at now=0x%08X: %s\n", now, expired_wrong(now, deadline) ? "yes" : "no");
    printf("expired_right at now=0x%08X: %s\n", now, expired_right(now, start, timeout) ? "yes" : "no");
    now = start + 100u;
    printf("expired_right at now=start+100: %s\n", expired_right(now, start, timeout) ? "yes" : "no");

    uint8_t a = 200, b = 100;
    uint8_t sum8 = (uint8_t)(a + b);     /* promoted to int, then truncated */
    printf("uint8 200 + 100 = %u (wrapped), as int = %d\n", sum8, a + b);
    return 0;
}
