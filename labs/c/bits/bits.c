/* Lesson: Register bit masks. Build: gcc -std=c11 -Wall -Wextra -o bits bits.c && ./bits */
#include <stdint.h>
#include <stdio.h>

/* The register is a plain variable here so the program runs on any PC.
   On the target it would be a volatile pointer to the peripheral's address. */
static uint32_t CR = 0x00000A50u;

#define BIT(n) (1u << (n))
#define FIELD_MASK(msb, lsb) (((1u << ((msb) - (lsb) + 1u)) - 1u) << (lsb))

static void show(const char *what) { printf("%-28s CR = 0x%08X\n", what, CR); }

int main(void) {
    show("initial");
    CR |= BIT(0);                 /* set bit 0 (enable) */
    show("set bit 0");
    CR &= ~BIT(4);                /* clear bit 4 */
    show("clear bit 4");
    CR ^= BIT(11);                /* toggle bit 11 */
    show("toggle bit 11");
    /* write a 3-bit field at bits 7..5 to the value 6 without touching neighbours */
    CR = (CR & ~FIELD_MASK(7, 5)) | ((6u << 5) & FIELD_MASK(7, 5));
    show("field[7:5] = 6");
    printf("bit 0 is %s, field[7:5] reads %u\n", (CR & BIT(0)) ? "set" : "clear", (unsigned)((CR & FIELD_MASK(7, 5)) >> 5));
    return 0;
}
