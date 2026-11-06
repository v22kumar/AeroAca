/* Portfolio project: STM32 sensor monitor. Detection logic as a pure, hardware-free function.
 * The same file compiles on the host (make test, make sim) and on the target. */
#ifndef DETECT_H
#define DETECT_H
#include <stdbool.h>
#include <stdint.h>

/* One sensor sample, as the driver delivers it. temp_centi is in 0.01 degC. */
typedef struct {
    uint32_t t_ms;       /* millisecond timestamp of the sample */
    bool     acked;      /* false when the sensor did not acknowledge on the bus */
    int32_t  temp_centi; /* valid only when acked */
} sample_t;

typedef enum { FAULT_NONE = 0, FAULT_NACK, FAULT_RANGE, FAULT_JUMP, FAULT_STUCK, FAULT_CONFIG } fault_t;

/* Configuration, range-checked by detect_config_ok() at start-up (requirement R7). */
typedef struct {
    int32_t  min_centi;      /* R3: lowest plausible reading, default -4000 */
    int32_t  max_centi;      /* R3: highest plausible reading, default 12500 */
    int32_t  max_jump_centi; /* R3: largest plausible change between samples, default 500 */
    uint32_t stuck_ms;       /* R3: no change for this long is a fault, default 5000 */
} detect_cfg_t;

/* History the caller owns; zero-initialise before the first call. */
typedef struct {
    bool     have_last;
    int32_t  last_centi;       /* last valid reading */
    uint32_t last_change_ms;   /* when the reading last changed */
} history_t;

bool    detect_config_ok(const detect_cfg_t *cfg);
fault_t detect(const sample_t *now, history_t *h, const detect_cfg_t *cfg);
const char *fault_name(fault_t f);

/* TMP102 conversion (ICD golden pairs: 0x19 0x00 -> 2500, 0xE7 0x00 -> -2500). */
int32_t tmp102_to_centi(uint8_t msb, uint8_t lsb);

#endif
