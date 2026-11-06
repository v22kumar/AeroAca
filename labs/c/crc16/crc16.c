/* Lesson: RS-485 and Modbus RTU. Build: gcc -std=c11 -Wall -Wextra -o crc16 crc16.c && ./crc16 */
#include <stdint.h>
#include <stdio.h>
#include <string.h>

/* CRC-16/MODBUS: polynomial 0x8005 reflected as 0xA001, initial value 0xFFFF, no final XOR.
   Check value for the ASCII string "123456789" is 0x4B37. Transmitted low byte first. */
static uint16_t crc16_modbus(const uint8_t *data, size_t len) {
    uint16_t crc = 0xFFFFu;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int b = 0; b < 8; b++) crc = (crc & 1u) ? (uint16_t)((crc >> 1) ^ 0xA001u) : (uint16_t)(crc >> 1);
    }
    return crc;
}

int main(void) {
    const char *check = "123456789";
    printf("check value for \"123456789\": 0x%04X (standard says 0x4B37)\n", crc16_modbus((const uint8_t *)check, strlen(check)));

    /* Read Holding Registers: slave 0x11, function 0x03, start 0x006B, quantity 0x0003 */
    uint8_t req[] = { 0x11, 0x03, 0x00, 0x6B, 0x00, 0x03 };
    uint16_t crc = crc16_modbus(req, sizeof req);
    printf("request %02X %02X %02X %02X %02X %02X -> CRC lo %02X hi %02X (frame ends ...%02X %02X)\n",
           req[0], req[1], req[2], req[3], req[4], req[5], crc & 0xFFu, crc >> 8, crc & 0xFFu, crc >> 8);

    /* A received frame: verify by recomputing over everything but the last two bytes */
    uint8_t frame[] = { 0x11, 0x03, 0x06, 0xAE, 0x41, 0x56, 0x52, 0x43, 0x40, 0x49, 0xAD };
    uint16_t calc = crc16_modbus(frame, sizeof frame - 2);
    uint16_t got = (uint16_t)(frame[sizeof frame - 2] | (frame[sizeof frame - 1] << 8));
    printf("response CRC calc 0x%04X, received 0x%04X: %s\n", calc, got, calc == got ? "VALID" : "INVALID");
    frame[4] ^= 0x01;   /* one bit flipped in flight */
    calc = crc16_modbus(frame, sizeof frame - 2);
    printf("after a one-bit error: calc 0x%04X, received 0x%04X: %s\n", calc, got, calc == got ? "VALID" : "INVALID");
    printf("registers: %u %u %u\n", (frame[3] << 8) | frame[4], (frame[5] << 8) | frame[6], (frame[7] << 8) | frame[8]);
    return 0;
}
