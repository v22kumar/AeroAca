# Portfolio project labs. Host build only: gcc (or clang) and python3.
CC ?= gcc
CFLAGS ?= -std=c11 -Wall -Wextra -Werror -O0

.PHONY: test known-failure sim clean

test: test_detect
	@./test_detect

known-failure: test_detect
	@./test_detect --known-failure || true

sim: sim_bin
	@python3 sensor_model.py --fault nack --at 2.0 --seconds 4 | ./sim_bin

test_detect: detect.c test_detect.c detect.h
	@$(CC) $(CFLAGS) -o $@ detect.c test_detect.c

sim_bin: detect.c sim.c detect.h
	@$(CC) $(CFLAGS) -o $@ detect.c sim.c

clean:
	rm -f test_detect sim_bin
