import type { Lesson } from "@/lib/content/schema";

export const bootloadersImagesAndRecovery: Lesson = {
  slug: "bootloaders-images-and-recovery",
  moduleId: "firmware-arch",
  prerequisites: ["from-reset-vector-to-main", "watchdogs-and-reset-loops"],
  title: "Bootloaders, images and recovery paths",
  summary: "A bootloader is the only firmware that must never fail. Learn what it checks before it jumps, how an image header and a boot flag make an update survive a power cut, why two slots beat one, and how a unit gets back from a bad image without a factory visit.",
  durationMinutes: 10,
  whyItMatters: "Field updates are where products are bricked. The questions 'what happens if power fails during the update?' and 'how does a unit recover from a bad image?' separate candidates who have shipped from those who have read about it.",
  objectives: [
    "Describe a bootloader's job: validate, select, jump, and stay out of the way.",
    "Design an image header and an update sequence that is safe against power loss at any instant.",
    "Explain A/B slots, fallback, forced bootloader entry and the watchdog's role during an update.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Patterns follow widely used open bootloaders (MCUboot image format and swap/overwrite strategies, STM32 system bootloader behaviour). No vendor-internal process is described.",
  },
  references: [
    { title: "MCUboot design documentation: image format, slots, swap and overwrite upgrade modes", note: "Reference open-source implementation of header, trailer and A/B concepts." },
    { title: "STM32 microcontroller system memory boot mode", id: "AN2606", note: "Built-in ROM bootloader entered via BOOT pins; last-resort recovery on STM32." },
    { title: "Lesson: From reset vector to main()", note: "The jump sequence (MSP, VTOR, reset handler) is covered there." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The update that ended at 97 %",
      body: `A technician starts a firmware update over UART. At 97 % the site loses power. On restart, the unit's LED stays dark: the bootloader found the application's first word was 0xFFFF FFFF (erased) and, having no other image, sat waiting for an update on a UART that nobody at the site knew how to use.

The update had been written **in place**, over the only copy of the application, and the bootloader's only recovery path was a cable. A design with a second slot and a boot flag would have rebooted into the old firmware and reported "update failed". This lesson is that design.`,
    },
    {
      type: "concept",
      title: "What a bootloader does, and does not do",
      body: `A bootloader runs first (at the reset vector) and does four things:

1. **Decide whether to stay.** A pressed button, a magic word left in RAM by the application ("enter bootloader"), a cleared boot flag, or no valid image: any of these keeps it in update mode. Otherwise it leaves quickly; the application's startup time is part of the product.
2. **Validate the image** before trusting it: a **header** with a magic number, image length, version and a **CRC** (or a signature for secure boot) over the image body. Word 0 of the vector table must point into RAM, word 1 into the image's flash range. An erased slot fails all of these.
3. **Select** which image to run when there is more than one: the one marked by the **boot flag**, or the newest valid one, or the previous one if the new one failed to confirm itself.
4. **Jump**: interrupts off, peripherals quiet, VTOR to the image's table, MSP from word 0, branch to word 1 (the previous lesson's sequence).

It does not: contain the application's drivers, parse the application's configuration, or get updated by the application. The bootloader sector is **write-protected** and never erased by an update; it is the floor the unit can always fall back to.

Below it on STM32 is the **ROM bootloader** in system memory, selected by the BOOT pins, which speaks UART, USB DFU, I2C or SPI. It is the last resort when your own bootloader is damaged, and it is why every board should expose BOOT0 on a test point.`,
    },
    {
      type: "concept",
      title: "Surviving a power cut: slots, flags and order",
      body: `The update problem is that flash can only be erased in sectors and a power cut can land between any two writes. The design that survives it has three parts:

**Two slots (A/B).** The running image stays in slot A untouched while the new image is written into slot B. If power fails at 97 %, slot A still boots. Memory cost: two application-sized regions. Where flash is tight, a **swap** strategy keeps one full slot plus a scratch sector, trading memory for a slower, more complex update.

**A header and a trailer.** The header (magic, length, version, CRC) is written **first** but the image is not trusted until the whole body verifies against it. A **trailer** or a separate **boot flag** sector records "slot B is valid and selected". That flag is the **last** thing written, and it is a single word in a sector of its own, so the write is as close to atomic as flash gets.

**Confirm after boot.** The new image must call "confirm" (set a flag) once it has proven it works, for example after it has talked to the host. If the unit resets before confirming, the bootloader counts the failure and, after one or a few tries, **falls back** to slot A and reports it. The watchdog does the resetting: a new image that hangs is a watchdog reset is a fallback. This is also why the watchdog must be kept alive *during* the update itself, so a hung update does not become a hung unit.

Sequence for an update, in order, each step safe to lose power after: receive and write body to B → verify CRC of B → write B's trailer/boot flag → reset → bootloader selects B → B runs and confirms → (later) A becomes the spare.`,
      deeper: {
        title: "Version and rollback rules",
        body: `A header carries a version so the bootloader can refuse to install an older image when the product's security policy forbids downgrades. It also lets an update tool refuse an image built for a different hardware revision: a hardware ID in the header, checked against one in the bootloader, is cheaper than a returned unit. Secure boot replaces the CRC with a signature verified against a public key in the bootloader; the sequence above is unchanged.`,
      },
    },
    {
      type: "example",
      title: "Worked example: a minimal header and the check",
      body: `\`\`\`c
typedef struct {
    uint32_t magic;      /* 0x4D494D47 'GMIM' */
    uint32_t length;     /* body length in bytes */
    uint32_t version;    /* major.minor.patch packed */
    uint32_t hw_id;      /* must match bootloader's */
    uint32_t body_crc;   /* CRC-32 over the body */
    uint32_t header_crc; /* CRC-32 over the fields above */
} img_hdr_t;

bool image_valid(const img_hdr_t *h, uint32_t slot_base, uint32_t slot_size) {
    if (h->magic != IMG_MAGIC) return false;
    if (crc32(h, offsetof(img_hdr_t, header_crc)) != h->header_crc) return false;
    if (h->length > slot_size - sizeof *h) return false;      /* bounds before trusting length */
    if (h->hw_id != BOOT_HW_ID) return false;
    const uint8_t *body = (const uint8_t *)(slot_base + sizeof *h);
    if (crc32(body, h->length) != h->body_crc) return false;
    uint32_t sp = ((const uint32_t *)body)[0], rv = ((const uint32_t *)body)[1];
    return sp >= RAM_BASE && sp <= RAM_END && rv >= slot_base && rv < slot_base + slot_size && (rv & 1u);
}
\`\`\`

Note the order: check the header's own CRC before using \`length\`, and check \`length\` against the slot before running a CRC over it, or a corrupt header makes the bootloader read past flash and fault, which is a bricked unit by another route.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "safe-update-order",
        skill: "bootloader",
        objective: "Order a power-loss-safe update.",
        prompt: `Put the steps of an A/B firmware update in the order that is safe against a power cut after any step.`,
        items: [
          { id: "write", text: "Write the new image body into the inactive slot B", why: "Slot A keeps running whatever happens here." },
          { id: "verify", text: "Verify slot B's CRC against its header", why: "Nothing selects B until it has proven intact." },
          { id: "flag", text: "Write the boot flag selecting B (single word, own sector)", why: "The last, near-atomic write; before it, A boots; after it, B boots." },
          { id: "reset", text: "Reset; the bootloader validates and jumps to B", why: "The bootloader re-checks B regardless of the flag." },
          { id: "confirm", text: "B confirms itself after proving it works; otherwise the bootloader falls back to A", why: "A booting-but-broken image is caught by the confirm-or-fallback rule and the watchdog." },
        ],
        correctOrder: ["write", "verify", "flag", "reset", "confirm"],
        solvedFeedback: `Correct. Write, verify, flag last, reset, confirm. At every boundary a power cut leaves a bootable unit.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "bricked-at-97",
        skill: "bootloader",
        objective: "Identify the design fault behind a bricked unit.",
        prompt: `A unit was bricked when power failed at 97 % of an update. Which design change would have prevented it on its own?`,
        options: [
          { id: "a", text: "Write the new image into a second slot and select it with a boot flag only after it verifies.", correct: true, feedback: `Yes. The running image is never touched; a cut at any point leaves either A selected or B verified and selected.` },
          { id: "b", text: "Increase the UART baud rate so the update finishes faster.", correct: false, feedback: `Shortens the window; does not close it.` },
          { id: "c", text: "Have the application verify the image before it is written.", correct: false, feedback: `Verifying before writing does not help when the write itself is interrupted.` },
          { id: "d", text: "Disable the watchdog during updates so the unit is not reset mid-write.", correct: false, feedback: `The reset was a power cut, not a watchdog. Disabling the watchdog creates a new failure: a hung update that never recovers.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "bootloader-musts",
        skill: "bootloader",
        objective: "List bootloader invariants.",
        prompt: `Select **every** property a production bootloader should have.`,
        options: [
          { id: "a", text: "Its own flash sector is write-protected and never erased by an update.", correct: true, feedback: `The bootloader is the recovery floor; losing it means a programmer or the ROM bootloader.` },
          { id: "b", text: "It validates header bounds and CRC before trusting any field of the image, and checks the vector table's first two words.", correct: true, feedback: `A corrupt header must fail cleanly, not fault the bootloader.` },
          { id: "c", text: "It has a forced-entry path independent of the application (button, magic RAM word, missing image).", correct: true, feedback: `Otherwise an application that crashes at start can never be updated.` },
          { id: "d", text: "It includes the application's full driver set so updates can use any interface.", correct: false, feedback: `Size and attack surface grow, and bugs in those drivers now live in the one component that cannot be updated. Keep it minimal.` },
          { id: "e", text: "It keeps the watchdog serviced during an update and falls back to the previous image if a new one fails to confirm.", correct: true, feedback: `The watchdog turns a hung image into a reset, and the confirm rule turns that reset into a fallback.` },
        ],
        solvedFeedback: `Right. Protected, paranoid about the header, always enterable, minimal, and watchdog-aware with a fallback.`,
      },
    },
    {
      type: "interview",
      questionId: "bootloader-safe-update",
      intro: `Answer the power-cut question with the write-verify-flag-reset-confirm sequence, and the bad-image question with confirm-or-fallback plus the watchdog. Name the ROM bootloader as the last resort.`,
    },
    {
      type: "recap",
      summary: `- Bootloader: decide whether to stay, validate (header magic, bounds, CRC or signature, vector-table sanity), select, jump. Protected sector, never updated by the application.
- A/B slots keep the running image untouched; the boot flag is the last, single-word write; the new image confirms itself or the bootloader falls back.
- Watchdog stays alive during updates and turns a hung new image into a fallback.
- Forced entry (button, magic word, no valid image) and the ROM bootloader on BOOT0 are the recovery paths below your own.`,
      cards: [
        { id: "boot-1", front: "Safe update sequence?", back: "Write body to the inactive slot, verify its CRC, write the boot flag last (single word, own sector), reset, new image confirms or the bootloader falls back." },
        { id: "boot-2", front: "What must a bootloader check before jumping?", back: "Header magic and own CRC, length within the slot, hardware ID, body CRC or signature, word 0 in RAM and word 1 in the slot with the Thumb bit set." },
        { id: "boot-3", front: "How does a unit recover from a new image that boots but hangs?", back: "The watchdog resets it; the image never confirmed, so the bootloader counts the failure and falls back to the previous slot." },
        { id: "boot-4", front: "Last-resort recovery on an STM32?", back: "The ROM system bootloader selected by BOOT0, speaking UART, USB DFU, I2C or SPI; expose BOOT0 on a test point." },
      ],
    },
  ],
};
