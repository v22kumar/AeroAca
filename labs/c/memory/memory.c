/* Lesson: Stack, heap and where your variables live. Build: gcc -std=c11 -Wall -Wextra -o memory memory.c && ./memory */
#include <stdint.h>
#include <stdio.h>
#include <string.h>

uint32_t initialised_global = 0x12345678u;   /* .data: copied from flash to RAM by startup code */
uint32_t zeroed_global;                      /* .bss: zeroed by startup code, costs no flash */
const uint32_t lookup[4] = { 10, 20, 30, 40 }; /* .rodata: stays in flash */

static uint32_t depth_reached = 0;

/* Each call adds a frame to the stack: return address, saved registers, locals. */
static void recurse(uint32_t n, uint8_t *first_frame) {
    uint8_t marker;                       /* a local: lives in this frame */
    uint32_t used = (uint32_t)(first_frame - &marker);
    if (n == 0 || used > 2000u) { depth_reached = used; return; }
    recurse(n - 1, first_frame);
}

static void fill_buffer_safely(char *dst, size_t dst_len, const char *src) {
    /* strncpy-style with guaranteed terminator: no overrun past dst_len */
    size_t i = 0;
    for (; i + 1 < dst_len && src[i] != '\0'; i++) dst[i] = src[i];
    dst[i] = '\0';
}

int main(void) {
    printf("initialised_global = 0x%08X (.data)\n", initialised_global);
    printf("zeroed_global      = %u (.bss, zero before main)\n", zeroed_global);
    printf("lookup[2]          = %u (.rodata, flash)\n", lookup[2]);

    uint8_t frame0;
    recurse(50, &frame0);
    /* Frame sizes differ between compilers, so only the direction and the order of magnitude are printed. */
    printf("stack grows %s; 50 nested calls used %s 500 bytes\n", &frame0 > (uint8_t *)&depth_reached ? "downward from high addresses" : "(layout differs on this platform)", depth_reached > 500u ? "more than" : "at most");

    char name[8];
    fill_buffer_safely(name, sizeof name, "TEMP_SENSOR_01");
    printf("buffer of %zu holds \"%s\" (truncated, terminated)\n", sizeof name, name);

    /* Why firmware avoids malloc: fragmentation and no recovery path. A fixed pool instead: */
    static uint8_t pool[4][16];
    static uint8_t pool_used = 0;
    uint8_t *block = pool_used < 4 ? pool[pool_used++] : NULL;
    printf("pool block %s, %u of 4 used\n", block ? "granted" : "exhausted", pool_used);
    return 0;
}
