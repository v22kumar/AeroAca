/* Lesson: HardFault analysis. Build: gcc -std=c11 -Wall -Wextra -o faultdecode faultdecode.c && ./faultdecode
 *
 * When a Cortex-M core takes a fault it records WHY in the System Control Block (SCB) and pushes the
 * context it was running (including the program counter that faulted) onto the stack. This program
 * decodes three captured sets of fault registers the way you would at a debugger prompt.
 * The register layouts are from the Arm v7-M Architecture Reference Manual; the captured values are
 * synthetic examples, not output from a real device. */
#include <stdint.h>
#include <stdio.h>

typedef struct { const char *name; uint32_t hfsr, cfsr, bfar, mmfar, stacked_pc, stacked_lr, stacked_sp; } capture_t;

static void decode(const capture_t *c) {
    printf("%s\n", c->name);
    printf("  HFSR = 0x%08X  CFSR = 0x%08X\n", c->hfsr, c->cfsr);
    if (c->hfsr & (1u << 30)) printf("  HFSR.FORCED set: a configurable fault (usage, bus or memory) escalated to HardFault; read CFSR\n");
    if (c->hfsr & (1u << 1))  printf("  HFSR.VECTTBL set: a vector table read failed during exception entry\n");
    uint32_t mmfsr = c->cfsr & 0xFFu, bfsr = (c->cfsr >> 8) & 0xFFu, ufsr = (c->cfsr >> 16) & 0xFFFFu;
    if (mmfsr & (1u << 0)) printf("  MMFSR.IACCVIOL: instruction fetch from a region the MPU forbids\n");
    if (mmfsr & (1u << 1)) printf("  MMFSR.DACCVIOL: data access to a region the MPU forbids\n");
    if (mmfsr & (1u << 7)) printf("  MMFSR.MMARVALID: the faulting address is in MMFAR = 0x%08X\n", c->mmfar);
    if (bfsr & (1u << 0))  printf("  BFSR.IBUSERR: bus error on an instruction fetch\n");
    if (bfsr & (1u << 1))  printf("  BFSR.PRECISERR: precise data bus error; the stacked PC is the faulting instruction\n");
    if (bfsr & (1u << 2))  printf("  BFSR.IMPRECISERR: imprecise bus error (a buffered write); the stacked PC is AFTER the cause\n");
    if (bfsr & (1u << 7))  printf("  BFSR.BFARVALID: the faulting address is in BFAR = 0x%08X\n", c->bfar);
    if (ufsr & (1u << 0))  printf("  UFSR.UNDEFINSTR: undefined instruction (corrupt code, or a Thumb/ARM state mix-up)\n");
    if (ufsr & (1u << 1))  printf("  UFSR.INVSTATE: invalid EPSR state, often a branch to an address with bit 0 clear\n");
    if (ufsr & (1u << 8))  printf("  UFSR.UNALIGNED: unaligned access with unaligned traps enabled\n");
    if (ufsr & (1u << 9))  printf("  UFSR.DIVBYZERO: divide by zero with the trap enabled\n");
    printf("  stacked PC = 0x%08X  LR = 0x%08X  SP at fault = 0x%08X\n", c->stacked_pc, c->stacked_lr, c->stacked_sp);
    /* In this synthetic map RAM is 0x20000000..0x2001FFFF and flash is 0x08000000..0x080FFFFF */
    if (c->bfar >= 0x20020000u && (bfsr & (1u << 7))) printf("  note: BFAR is past the end of RAM (0x2001FFFF): a pointer that ran off the end\n");
    if (c->stacked_sp < 0x20000400u) printf("  note: SP is within 1 KiB of the bottom of RAM: suspect stack overflow\n");
    if (c->bfar == 0 && (bfsr & (1u << 7))) printf("  note: BFAR = 0: a null pointer dereference\n");
    printf("\n");
}

int main(void) {
    capture_t a = { "Capture A: write through a pointer that is NULL", (1u << 30), (1u << 15) | (1u << 9), 0x00000000u, 0, 0x0800214Au, 0x08002131u, 0x20001F80u };
    /* BFSR = 0x82 -> BFARVALID + PRECISERR; encoded as bits 15 and 9 of CFSR (BFSR starts at bit 8) */
    capture_t b = { "Capture B: an array index ran past the end of RAM", (1u << 30), (1u << 15) | (1u << 9), 0x20020010u, 0, 0x08003A22u, 0x08003A01u, 0x20001E40u };
    capture_t c = { "Capture C: divide by zero with the trap enabled", (1u << 30), (1u << 25), 0, 0, 0x08001C0Cu, 0x08001BF1u, 0x20001F00u };
    decode(&a); decode(&b); decode(&c);
    capture_t d = { "Capture D: imprecise bus error after a stack overflow", (1u << 30), (1u << 10), 0, 0, 0x08000F00u, 0x08000EE1u, 0x200003C8u };
    decode(&d);
    return 0;
}
