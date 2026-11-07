/* frame.h: a byte-at-a-time parser for framed serial data.
 *
 * Frame on the wire:   0x7E | length | payload (length bytes) | crc8
 *   - length is 1 to PAYLOAD_MAX
 *   - crc8 (polynomial 0x07, initial value 0) covers the length byte and the payload
 * Contract (each sentence has a test in test_frame.c):
 *   1. Bytes before a start byte are ignored.
 *   2. A frame with a length of 0 or more than PAYLOAD_MAX is rejected.
 *   3. A frame whose CRC is wrong is never delivered.
 *   4. The parser never writes outside its own buffer, for any input.
 *   5. After any rejected frame the parser resynchronises: a good frame that began inside the
 *      rejected bytes is still found. One callback per good frame. */
#ifndef FRAME_H
#define FRAME_H

#include <stddef.h>
#include <stdint.h>

#define FRAME_START 0x7Eu
#define PAYLOAD_MAX 64u

typedef void (*frame_cb)(const uint8_t *payload, uint8_t len, void *ctx);
typedef enum { S_WAIT_START, S_LEN, S_PAYLOAD, S_CRC } frame_state_t;

typedef struct {
    frame_state_t state;
    uint8_t len, idx;
    uint8_t raw[PAYLOAD_MAX + 3u];     /* every byte since the start byte, kept so a failed frame can be re-scanned */
    uint8_t nraw;
    uint8_t mem[PAYLOAD_MAX + 1u];     /* payload buffer; mem[PAYLOAD_MAX] stands for "the variable that follows the buffer in RAM" */
    frame_cb cb;
    void *ctx;
    uint32_t good, bad_crc, bad_len;
} frame_parser_t;

void frame_init(frame_parser_t *p, frame_cb cb, void *ctx);
void frame_feed(frame_parser_t *p, uint8_t byte);
uint8_t frame_crc8(const uint8_t *data, size_t n);

#endif
