#include "frame.h"
#include <string.h>
#include <stdbool.h>

uint8_t frame_crc8(const uint8_t *data, size_t n) {
    uint8_t crc = 0;
    for (size_t i = 0; i < n; i++) {
        crc ^= data[i];
        for (int bit = 0; bit < 8; bit++) crc = (crc & 0x80u) ? (uint8_t)((crc << 1) ^ 0x07u) : (uint8_t)(crc << 1);
    }
    return crc;
}

void frame_init(frame_parser_t *p, frame_cb cb, void *ctx) {
    memset(p, 0, sizeof *p);
    p->state = S_WAIT_START;
    p->cb = cb;
    p->ctx = ctx;
}

/* Process one byte. Returns false if this byte caused a frame to be rejected. */
static bool step(frame_parser_t *p, uint8_t b) {
    switch (p->state) {
    case S_WAIT_START:
        if (b == FRAME_START) { p->raw[0] = b; p->nraw = 1; p->state = S_LEN; }
        return true;
    case S_LEN:
        p->raw[p->nraw++] = b;
        if (b == 0u || b > PAYLOAD_MAX) { p->bad_len++; p->state = S_WAIT_START; return false; }
        p->len = b; p->idx = 0; p->state = S_PAYLOAD;
        return true;
    case S_PAYLOAD:
        p->raw[p->nraw++] = b;
        p->mem[p->idx++] = b;
        if (p->idx == p->len) p->state = S_CRC;
        return true;
    case S_CRC:
        p->raw[p->nraw++] = b;
        p->state = S_WAIT_START;
        if (frame_crc8(&p->raw[1], (size_t)p->len + 1u) == b) {
            p->good++;
            if (p->cb) p->cb(p->mem, p->len, p->ctx);
            return true;
        }
        p->bad_crc++;
        return false;
    }
    return true;
}

void frame_feed(frame_parser_t *p, uint8_t byte) {
    uint8_t queue[2u * (PAYLOAD_MAX + 3u)];
    size_t head = 0, tail = 0;
    queue[tail++] = byte;
    while (head < tail) {
        uint8_t c = queue[head++];
        if (!step(p, c)) {
            /* A frame was rejected. Everything after its start byte goes back in front of what is still
               waiting, so a real frame that began inside the rejected bytes is not lost. Each re-scan is
               shorter than the one before it, so this always ends. */
            size_t rest = tail - head, replay = (size_t)p->nraw - 1u;
            memmove(&queue[replay], &queue[head], rest);
            memcpy(&queue[0], &p->raw[1], replay);
            head = 0;
            tail = replay + rest;
        }
    }
}
