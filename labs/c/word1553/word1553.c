/* Lesson: MIL-STD-1553B, the word and the message.
   Build: gcc -std=c11 -Wall -Wextra -o word1553 word1553.c && ./word1553 */
#include <stdint.h>
#include <stdio.h>

/* A 1553 word on the wire is 20 bit-times: 3 of sync, 16 of data, 1 of odd parity.
   Here we build the 16 data bits of a COMMAND word and compute its parity. */

typedef struct {
    unsigned rt;   /* remote terminal address, 5 bits, 0..31 (31 = broadcast) */
    unsigned tr;   /* transmit/receive, 1 bit: 1 = the RT transmits */
    unsigned sa;   /* subaddress or mode, 5 bits (0 or 31 = mode command) */
    unsigned wc;   /* word count or mode code, 5 bits (word count 0 means 32) */
} command_t;

static uint16_t encode_command(command_t c) {
    return (uint16_t)(((c.rt & 0x1Fu) << 11) | ((c.tr & 0x1u) << 10) | ((c.sa & 0x1Fu) << 5) | (c.wc & 0x1Fu));
}

static command_t decode_command(uint16_t w) {
    command_t c;
    c.rt = (w >> 11) & 0x1Fu;
    c.tr = (w >> 10) & 0x1u;
    c.sa = (w >> 5) & 0x1Fu;
    c.wc = w & 0x1Fu;
    return c;
}

/* Odd parity: the parity bit makes the total number of ones in the 17 bits odd. */
static unsigned odd_parity_bit(uint16_t w) {
    unsigned ones = 0;
    for (unsigned i = 0; i < 16; i++) ones += (w >> i) & 1u;
    return (ones % 2u == 0u) ? 1u : 0u;
}

static void show(const char *label, command_t c) {
    uint16_t w = encode_command(c);
    printf("%-34s RT=%2u T/R=%u SA=%2u WC=%2u -> 0x%04X parity=%u\n", label, c.rt, c.tr, c.sa, c.wc, w, odd_parity_bit(w));
}

int main(void) {
    /* The bus controller asks RT 5 to transmit 4 data words from subaddress 3. */
    show("BC asks RT 5 to transmit 4 words", (command_t){ .rt = 5, .tr = 1, .sa = 3, .wc = 4 });
    /* The bus controller sends RT 12 two data words to subaddress 1. */
    show("BC sends RT 12 two words", (command_t){ .rt = 12, .tr = 0, .sa = 1, .wc = 2 });
    /* Word count 0 means 32 data words, the maximum in one message. */
    show("32 data words (count field = 0)", (command_t){ .rt = 5, .tr = 1, .sa = 3, .wc = 0 });
    /* Subaddress 31 (or 0) turns the last field into a mode code: 2 = transmit status word. */
    show("Mode code 2: transmit status word", (command_t){ .rt = 5, .tr = 1, .sa = 31, .wc = 2 });

    /* Decode a word captured by a bus monitor. */
    uint16_t captured = 0x2C64;
    command_t d = decode_command(captured);
    printf("\ncaptured 0x%04X decodes to RT=%u T/R=%u SA=%u WC=%u", captured, d.rt, d.tr, d.sa, d.wc);
    printf(" (%s)\n", d.tr ? "RT transmits" : "RT receives");
    printf("parity bit on the wire should be %u\n", odd_parity_bit(captured));

    /* A word with the wrong parity: the receiver rejects it and does not respond. */
    unsigned wire_parity = 0; /* what a corrupted capture carried */
    printf("if the captured parity bit were %u: %s\n", wire_parity, wire_parity == odd_parity_bit(captured) ? "valid word" : "parity error, word rejected, no response expected");
    return 0;
}
