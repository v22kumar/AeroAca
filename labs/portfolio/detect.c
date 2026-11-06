#include "detect.h"

bool detect_config_ok(const detect_cfg_t *cfg) {
    if (cfg->min_centi >= cfg->max_centi) return false;
    if (cfg->max_jump_centi <= 0) return false;
    if (cfg->stuck_ms < 1000u || cfg->stuck_ms > 60000u) return false;
    return true;
}

/* Order matters: a NACK says nothing about the value, so it is checked first;
 * range before jump, because an out-of-range value must not update the history. */
fault_t detect(const sample_t *now, history_t *h, const detect_cfg_t *cfg) {
    if (!now->acked) return FAULT_NACK;
    if (now->temp_centi < cfg->min_centi || now->temp_centi > cfg->max_centi) return FAULT_RANGE;
    if (h->have_last) {
        int32_t delta = now->temp_centi - h->last_centi;
        if (delta < 0) delta = -delta;
        if (delta > cfg->max_jump_centi) return FAULT_JUMP;
        if (delta != 0) h->last_change_ms = now->t_ms;
        /* unsigned subtraction survives the 32-bit wrap (lesson: fixed-width integers) */
        if (now->t_ms - h->last_change_ms >= cfg->stuck_ms) {
            h->last_centi = now->temp_centi;
            return FAULT_STUCK;
        }
    } else {
        h->have_last = true;
        h->last_change_ms = now->t_ms;
    }
    h->last_centi = now->temp_centi;
    return FAULT_NONE;
}

const char *fault_name(fault_t f) {
    switch (f) {
        case FAULT_NONE:   return "NONE";
        case FAULT_NACK:   return "NACK";
        case FAULT_RANGE:  return "RANGE";
        case FAULT_JUMP:   return "JUMP";
        case FAULT_STUCK:  return "STUCK";
        case FAULT_CONFIG: return "CONFIG";
    }
    return "?";
}

int32_t tmp102_to_centi(uint8_t msb, uint8_t lsb) {
    /* 12-bit left-justified two's complement, 0.0625 degC per LSB */
    int16_t raw = (int16_t)(((uint16_t)msb << 8) | lsb);
    raw >>= 4;                              /* arithmetic shift keeps the sign */
    return ((int32_t)raw * 625) / 100;      /* 0.0625 degC = 6.25 centi-degC */
}
