/* Lesson: Your first STM32 project. Build: gcc -std=c11 -Wall -Wextra -o stm32_arith stm32_arith.c && ./stm32_arith
 * The register arithmetic CubeMX did for an STM32F401 Nucleo, on the host, to compare with the debugger's SFR view. */
#include <stdint.h>
#include <stdio.h>

int main(void) {
    /* PLL: HSI 16 MHz / M * N / P  (VCO input must be 1..2 MHz, VCO output 192..432 MHz, P in {2,4,6,8}) */
    const uint32_t hsi = 16000000u, m = 16u, n = 336u, p = 4u;
    uint32_t vco_in = hsi / m, vco = vco_in * n, sysclk = vco / p;
    printf("PLL: %u MHz / M %u = %u MHz, x N %u = %u MHz VCO, / P %u = SYSCLK %u MHz\n", hsi / 1000000u, m, vco_in / 1000000u, n, vco / 1000000u, p, sysclk / 1000000u);
    printf("VCO input %s, VCO output %s\n", (vco_in >= 1000000u && vco_in <= 2000000u) ? "in range" : "OUT OF RANGE", (vco >= 192000000u && vco <= 432000000u) ? "in range" : "OUT OF RANGE");

    /* Bus clocks: AHB /1, APB1 /2 (max 42 MHz on F401), APB2 /1 (max 84 MHz) */
    uint32_t hclk = sysclk / 1u, pclk1 = hclk / 2u, pclk2 = hclk / 1u;
    printf("HCLK %u MHz, APB1 %u MHz (%s), APB2 %u MHz\n", hclk / 1000000u, pclk1 / 1000000u, pclk1 <= 42000000u ? "within 42 MHz limit" : "OVER LIMIT", pclk2 / 1000000u);

    /* SysTick: 1 ms tick from HCLK -> reload = HCLK/1000 - 1 */
    printf("SysTick LOAD for 1 ms = %u (0x%05X)\n", hclk / 1000u - 1u, hclk / 1000u - 1u);

    /* USART2 on APB1, oversampling by 16: BRR = fclk / baud, integer and 1/16 fraction */
    const uint32_t baud = 115200u;
    uint32_t brr_x16 = (pclk1 + baud / 2u) / baud;              /* USARTDIV * 16, rounded */
    uint32_t mantissa = brr_x16 / 16u, fraction = brr_x16 % 16u;
    uint32_t actual = pclk1 * 10u / brr_x16;                      /* x10 for one decimal */
    printf("USART2 BRR for %u baud at %u MHz: mantissa %u, fraction %u (BRR = 0x%04X), actual %u.%u baud (%s0.%u %% error)\n",
           baud, pclk1 / 1000000u, mantissa, fraction, (mantissa << 4) | fraction, actual / 10u, actual % 10u,
           actual / 10u >= baud ? "+" : "-", (actual / 10u >= baud ? actual / 10u - baud : baud - actual / 10u) * 100u / baud);

    /* GPIOA PA5: BSRR words. ODR currently has PA5 high and PA0 high. */
    uint32_t odr = (1u << 5) | (1u << 0);
    uint32_t set_pa5 = 1u << 5, reset_pa5 = 1u << (5 + 16);
    uint32_t toggle_pa5 = ((odr & (1u << 5)) ? (1u << (5 + 16)) : (1u << 5));
    printf("ODR = 0x%08X: BSRR set PA5 = 0x%08X, reset PA5 = 0x%08X, toggle PA5 writes 0x%08X\n", odr, set_pa5, reset_pa5, toggle_pa5);
    /* MODER: two bits per pin; PA5 output = 01 at bits 11:10 */
    uint32_t moder = 0x00000000u;
    moder = (moder & ~(3u << 10)) | (1u << 10);
    printf("MODER after PA5 output: 0x%08X (bits 11:10 = 01)\n", moder);
    return 0;
}
