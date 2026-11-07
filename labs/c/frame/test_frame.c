/* test_frame.c: one test per sentence of the contract in frame.h. No framework: a counter, a macro, an exit code. */
#include "frame.h"
#include <stdio.h>
#include <string.h>

static int checks, failures;
#define CHECK(cond, msg) do { checks++; if (!(cond)) { failures++; printf("FAIL line %d: %s\n", __LINE__, msg); } } while (0)

typedef struct { int frames; uint8_t last_len; uint8_t last[PAYLOAD_MAX]; } sink_t;
static void on_frame(const uint8_t *payload, uint8_t len, void *ctx) {
    sink_t *s = ctx; s->frames++; s->last_len = len; memcpy(s->last, payload, len);
}

static size_t build(uint8_t *out, const uint8_t *payload, uint8_t len) {
    out[0] = FRAME_START; out[1] = len; memcpy(&out[2], payload, len);
    out[2u + len] = frame_crc8(&out[1], (size_t)len + 1u);
    return 3u + len;
}
static void feed(frame_parser_t *p, const uint8_t *d, size_t n) { for (size_t i = 0; i < n; i++) frame_feed(p, d[i]); }

int main(void) {
    frame_parser_t p; sink_t s; uint8_t buf[200];
    const uint8_t msg[] = { 0x10, 0x20, 0x30 };

    /* 1. a good frame is delivered once, with its payload */
    memset(&s, 0, sizeof s); frame_init(&p, on_frame, &s);
    feed(&p, buf, build(buf, msg, 3));
    CHECK(s.frames == 1 && s.last_len == 3 && memcmp(s.last, msg, 3) == 0, "valid frame delivered with its payload");

    /* 2. bytes before a start byte are ignored */
    memset(&s, 0, sizeof s); frame_init(&p, on_frame, &s);
    const uint8_t junk[] = { 0x00, 0xFF, 0x13 };
    feed(&p, junk, sizeof junk); feed(&p, buf, build(buf, msg, 3));
    CHECK(s.frames == 1, "garbage before the start byte is skipped");

    /* 3. a wrong CRC is never delivered */
    memset(&s, 0, sizeof s); frame_init(&p, on_frame, &s);
    size_t n = build(buf, msg, 3); buf[n - 1] ^= 0x01;
    feed(&p, buf, n);
    CHECK(s.frames == 0 && p.bad_crc == 1, "frame with a bad CRC is not delivered");

    /* 4. length 0 and length above the maximum are rejected */
    memset(&s, 0, sizeof s); frame_init(&p, on_frame, &s);
    const uint8_t zero[] = { FRAME_START, 0x00, 0x00 }, big[] = { FRAME_START, PAYLOAD_MAX + 1u, 0x01 };
    feed(&p, zero, sizeof zero); feed(&p, big, sizeof big);
    CHECK(s.frames == 0 && p.bad_len == 2, "length 0 and length > PAYLOAD_MAX are rejected");

    /* 5. the largest legal frame is accepted and nothing is written past the buffer */
    memset(&s, 0, sizeof s); frame_init(&p, on_frame, &s);
    p.mem[PAYLOAD_MAX] = 0xA5u;                       /* stands for the variable that follows the buffer */
    uint8_t full[PAYLOAD_MAX]; for (unsigned i = 0; i < PAYLOAD_MAX; i++) full[i] = (uint8_t)i;
    feed(&p, buf, build(buf, full, PAYLOAD_MAX));
    CHECK(s.frames == 1 && s.last_len == PAYLOAD_MAX, "frame with the maximum payload is delivered");
    CHECK(p.mem[PAYLOAD_MAX] == 0xA5u, "the byte after the buffer was overwritten");

    /* 6. two frames back to back give two callbacks */
    memset(&s, 0, sizeof s); frame_init(&p, on_frame, &s);
    n = build(buf, msg, 3); n += build(buf + n, msg, 2);
    feed(&p, buf, n);
    CHECK(s.frames == 2, "two consecutive frames are both delivered");

    /* 7. a good frame that begins inside a corrupt one is still found */
    memset(&s, 0, sizeof s); frame_init(&p, on_frame, &s);
    uint8_t inner[8]; const uint8_t im[] = { 0xAA, 0xBB }; size_t ni = build(inner, im, 2);   /* 7E 02 AA BB crc */
    uint8_t outer[16]; outer[0] = FRAME_START; outer[1] = (uint8_t)ni; memcpy(&outer[2], inner, ni);
    uint8_t good_outer_crc = frame_crc8(&outer[1], ni + 1u); outer[2u + ni] = (uint8_t)(good_outer_crc ^ 0x5Au);   /* deliberately wrong */
    feed(&p, outer, ni + 3u);
    CHECK(s.frames == 1, "stream_with_inner_frame: wrong number of frames delivered");

    printf("%d checks, %d failed\n", checks, failures);
    return failures ? 1 : 0;
}
