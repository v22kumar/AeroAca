import type { Lesson } from "@/lib/content/schema";

export const embeddedLinuxBootChain: Lesson = {
  slug: "embedded-linux-boot-chain",
  moduleId: "embedded-linux",
  title: "Boot chain and device tree, from bootloader to login",
  summary: "Enough embedded Linux to hold the conversation and find a missing sensor: the stages from ROM code to login, what the device tree is for, the line between kernel and user space, and the four commands that answer 'why is my device not there?'",
  durationMinutes: 12,
  whyItMatters: "Many avionics, industrial and medical products pair a microcontroller with a Linux board, and the integration faults sit at the boundary: a sensor on an I2C bus that the kernel never probed, a pin muxed wrongly in the device tree, a driver that is not loaded. You do not need to be a kernel developer; you need to know where to look.",
  objectives: [
    "Name the boot stages of a typical ARM Linux board and what each one loads.",
    "Explain what the device tree describes and how a wrong node keeps a device off the bus.",
    "Diagnose a missing device with dmesg, the device-tree view in sysfs, lsmod and i2cdetect.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Describes the common U-Boot plus mainline-kernel flow on ARM boards (for example i.MX, STM32MP1, AM335x). Vendor-specific first-stage names vary; the structure does not.",
  },
  references: [
    { title: "Linux kernel documentation: Devicetree usage model (Documentation/devicetree/usage-model.rst)", note: "What the device tree is, how nodes map to drivers via compatible strings, status property." },
    { title: "U-Boot documentation: boot flow, SPL, environment, bootcmd", note: "Second-stage loader behaviour." },
    { title: "Linux i2c-tools: i2cdetect, i2cget", note: "User-space bus probing." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The sensor that exists on the schematic",
      body: `A new carrier board adds a pressure sensor on I2C bus 2 at address 0x76. The schematic is right, the sensor acknowledges on a bench probe, and \`/dev\` has no sign of it. The application engineer's first guess is a dead sensor. The schematic reviewer's first guess is a wrong pull-up.

It was neither. The device tree for the old carrier had I2C bus 2 marked \`status = "disabled"\`; nobody enabled it, so the kernel never registered the bus, never probed the address, and never loaded the driver. Twenty minutes with four commands finds this. This lesson is those commands and the map behind them.`,
    },
    {
      type: "concept",
      title: "The boot chain",
      body: `A typical ARM Linux board boots in stages, each small enough to fit where the previous one can put it:

1. **ROM code** in the SoC: reads boot-mode pins or fuses, finds the first-stage loader on SD, eMMC, QSPI or over USB/UART (the recovery path), loads it into on-chip SRAM.
2. **First-stage loader** (U-Boot SPL, or a vendor equivalent): initialises DRAM, the one thing the ROM cannot assume, and loads the full bootloader.
3. **U-Boot**: a full bootloader with a shell, environment variables (\`bootcmd\`, \`bootargs\`), network and storage drivers. It loads three things into RAM: the **kernel image**, the **device tree blob** (DTB) and optionally an **initramfs**, then jumps to the kernel with the DTB's address in a register.
4. **Kernel**: initialises the CPU, parses the device tree, probes devices and loads drivers, mounts the root filesystem named in \`bootargs\` (\`root=/dev/mmcblk0p2\`), and starts PID 1.
5. **init** (systemd, or BusyBox init on small systems): starts services, mounts the rest, brings up networking, and eventually the login prompt or your application.

The first three stages are the embedded Linux equivalent of the MCU bootloader lesson, with the same concerns: validation, A/B rootfs for safe updates, and a recovery path (ROM USB mode) when everything else is gone.`,
    },
    {
      type: "concept",
      title: "Device tree: hardware the kernel cannot discover",
      body: `PCI and USB devices announce themselves; a sensor on I2C does not. The **device tree** is a data file (\`.dts\` source, compiled to a \`.dtb\` blob) that tells the kernel what is wired to what: which I2C controllers exist and at which addresses, what is attached to them, which pins are muxed to which function, which clocks and regulators feed them.

A node for the scenario's sensor looks like:

\`\`\`dts
&i2c2 {
    status = "okay";
    pinctrl-names = "default";
    pinctrl-0 = <&i2c2_pins>;
    pressure@76 {
        compatible = "bosch,bmp280";
        reg = <0x76>;
    };
};
\`\`\`

Three things do the work. **status** enables or disables the node; a disabled bus is invisible, which was the scenario's fault. **compatible** is the string the kernel matches against drivers; a typo means no driver binds and the device exists but does nothing. **reg** is the address on the parent bus. The pinctrl entries select the pad function; a wrong mux is a bus that is enabled, driven, and connected to the wrong pins.

**Kernel space vs user space.** Drivers, the scheduler, filesystems and the device tree live in the kernel; they run privileged and a bug there crashes the system. Your application, shells, Python and \`i2cdetect\` live in user space and reach hardware only through what the kernel exposes: \`/dev\` nodes, \`/sys\` attributes, sockets. The boundary is why "the sensor works with i2cget but my driver does not see it" is a meaningful sentence: user space can poke the bus directly through \`/dev/i2c-2\` even when no kernel driver has bound.`,
      deeper: {
        title: "Overlays and where the DTB comes from",
        body: `On many boards the DTB is chosen by U-Boot from a name in its environment, and **overlays** (\`.dtbo\`) patch a base tree for a carrier or a cape at boot. A missing device after a hardware change is often a boot environment still naming the old tree. \`/proc/device-tree\` (a view of \`/sys/firmware/devicetree/base\`) shows the tree the kernel is actually running with, which is the one to trust over any file on disk.`,
      },
    },
    {
      type: "example",
      title: "Worked example: four commands for a missing I2C device",
      body: `\`\`\`
# 1. Did the kernel see the bus?
$ dmesg | grep -i i2c
imx-i2c 30a30000.i2c: ... (bus 0) ... (bus 1)        # no line for bus 2

# 2. What does the running device tree say about it?
$ cat /proc/device-tree/soc/bus@30800000/i2c@30a40000/status
disabled

# 3. Is the driver even present?
$ lsmod | grep bmp ; grep BMP280 /boot/config-$(uname -r)
CONFIG_BMP280=m                                        # built as a module, not loaded

# 4. After fixing the tree (status = "okay") and rebooting: is the chip on the bus?
$ i2cdetect -y 2
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
70: -- -- -- -- -- -- 76 --                            # the sensor acknowledges
$ ls /sys/bus/iio/devices/                             # driver bound, iio device appears
\`\`\`

The order matters: bus first, tree second, driver third, chip last. Starting at step 4 on a disabled bus gives "no such device" and sends people to the soldering iron. Starting at the device tree answers the scenario in two commands.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "linux-boot-order",
        skill: "embedded-linux",
        objective: "Order the Linux boot chain.",
        prompt: `Put the stages of an ARM Linux board's boot in order.`,
        items: [
          { id: "rom", text: "SoC ROM code reads boot pins and loads the first-stage loader into SRAM", why: "Fixed in silicon; the only stage that cannot be updated." },
          { id: "spl", text: "First-stage loader (SPL) initialises DRAM and loads U-Boot", why: "DRAM must work before anything larger than SRAM can run." },
          { id: "uboot", text: "U-Boot loads the kernel, the device tree blob and the initramfs, then jumps to the kernel", why: "The full bootloader with storage and network drivers." },
          { id: "kernel", text: "Kernel parses the device tree, probes devices, mounts the root filesystem, starts PID 1", why: "Hardware becomes /dev and /sys here." },
          { id: "init", text: "init (systemd or BusyBox) starts services and the login or the application", why: "User space begins." },
        ],
        correctOrder: ["rom", "spl", "uboot", "kernel", "init"],
        solvedFeedback: `Correct. ROM → SPL → U-Boot → kernel (with DTB) → init.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "missing-i2c-device",
        skill: "embedded-linux",
        objective: "Choose the first check for a missing device.",
        prompt: `A sensor on I2C bus 2 acknowledges on a bench probe but \`i2cdetect -y 2\` reports that bus 2 does not exist. What do you check first?`,
        options: [
          { id: "a", text: "The device tree node for the I2C2 controller: its status and pinctrl, via /proc/device-tree and dmesg.", correct: true, feedback: `Yes. 'Bus does not exist' means the kernel never registered the controller, which is a device-tree or driver matter, not a wiring one. The bench probe already proved the chip.` },
          { id: "b", text: "The pull-up resistors on SDA and SCL.", correct: false, feedback: `Pull-ups affect whether a chip acknowledges, and the bench probe showed it does. They cannot make a bus disappear from the kernel.` },
          { id: "c", text: "Replace the sensor.", correct: false, feedback: `The sensor acknowledged on the bench. The fault is on the Linux side.` },
          { id: "d", text: "Install a newer version of i2c-tools.", correct: false, feedback: `i2cdetect reports what the kernel exposes; the tool is not the problem.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "kernel-vs-user",
        skill: "embedded-linux",
        objective: "Place things on the right side of the boundary.",
        prompt: `Select **every** item that lives in **kernel space**.`,
        options: [
          { id: "a", text: "The I2C controller driver and the BMP280 sensor driver.", correct: true, feedback: `Drivers are kernel code, built in or loaded as modules.` },
          { id: "b", text: "The parsed device tree.", correct: true, feedback: `The kernel parses the DTB at boot and exposes a read-only view under /proc/device-tree.` },
          { id: "c", text: "Your Python application reading /dev/i2c-2.", correct: false, feedback: `User space: it reaches the bus only through the device node the kernel provides.` },
          { id: "d", text: "The scheduler and the filesystem code.", correct: true, feedback: `Core kernel subsystems.` },
          { id: "e", text: "i2cdetect and the shell.", correct: false, feedback: `User-space tools; they use ioctl calls on /dev/i2c-N.` },
        ],
        solvedFeedback: `Right. Drivers, device tree, scheduler and filesystems are kernel space; applications, shells and i2c-tools are user space talking through /dev and /sys.`,
      },
    },
    {
      type: "interview",
      questionId: "linux-boot-chain",
      intro: `Name the five stages and what each loads, say what the device tree is for in one sentence, and give the four-command diagnosis in order. That is a complete, honest answer for a hardware-side engineer.`,
    },
    {
      type: "recap",
      summary: `- Boot chain: ROM code → first-stage loader (DRAM) → U-Boot (kernel + DTB + initramfs) → kernel (probe, mount rootfs, PID 1) → init → login or application.
- Device tree describes undiscoverable hardware: status enables a node, compatible binds a driver, reg is the bus address, pinctrl sets the pad function.
- Kernel space: drivers, device tree, scheduler, filesystems. User space: applications and tools, reaching hardware via /dev and /sys.
- Missing device: dmesg (bus registered?), /proc/device-tree (status, pins), lsmod and kernel config (driver present?), i2cdetect (chip answers?).`,
      cards: [
        { id: "lx-1", front: "Five stages of an ARM Linux boot?", back: "ROM code; first-stage loader (DRAM init); U-Boot (loads kernel, DTB, initramfs); kernel (parses DTB, probes, mounts rootfs, starts PID 1); init." },
        { id: "lx-2", front: "What is the device tree for?", back: "Describing hardware the kernel cannot discover: buses, addresses, pin muxing, clocks, regulators. status enables a node, compatible picks the driver, reg gives the address." },
        { id: "lx-3", front: "Sensor present on the bench, absent in /dev. First check?", back: "dmesg and /proc/device-tree: is the controller node enabled and registered? Then driver presence, then i2cdetect." },
        { id: "lx-4", front: "Kernel space vs user space?", back: "Kernel: drivers, device tree, scheduler, filesystems, privileged. User: applications and tools, reaching hardware through /dev nodes and /sys attributes." },
      ],
    },
  ],
};
