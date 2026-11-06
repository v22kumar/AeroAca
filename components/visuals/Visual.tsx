"use client";

import dynamic from "next/dynamic";
import type { VisualId } from "@/lib/content/schema";
import { Skeleton } from "@/components/ui/Skeleton";

const loading = () => <Skeleton className="h-40 w-full" />;

const McuBootChain = dynamic(() => import("./McuBootChain").then((m) => m.McuBootChain), { loading });
const I2cWaveform = dynamic(() => import("./I2cWaveform").then((m) => m.I2cWaveform), { loading });
const RegisterBits = dynamic(() => import("./RegisterBits").then((m) => m.RegisterBits), { loading });
const RmwHazard = dynamic(() => import("./RmwHazard").then((m) => m.RmwHazard), { loading });
const UartFrame = dynamic(() => import("./UartFrame").then((m) => m.UartFrame), { loading });
const SpiModes = dynamic(() => import("./SpiModes").then((m) => m.SpiModes), { loading });
const IwdgTimeout = dynamic(() => import("./IwdgTimeout").then((m) => m.IwdgTimeout), { loading });
const Aliasing = dynamic(() => import("./Aliasing").then((m) => m.Aliasing), { loading });
const Traceability = dynamic(() => import("./Traceability").then((m) => m.Traceability), { loading });
const StartupSequence = dynamic(() => import("./StartupSequence").then((m) => m.StartupSequence), { loading });
const PriorityInversion = dynamic(() => import("./PriorityInversion").then((m) => m.PriorityInversion), { loading });
const ScpiConsole = dynamic(() => import("./ScpiConsole").then((m) => m.ScpiConsole), { loading });
const FmeaWorksheet = dynamic(() => import("./FmeaWorksheet").then((m) => m.FmeaWorksheet), { loading });
const StandardsMap = dynamic(() => import("./StandardsMap").then((m) => m.StandardsMap), { loading });
const SensorMonitorLab = dynamic(() => import("./SensorMonitorLab").then((m) => m.SensorMonitorLab), { loading });
const AdcQuantisation = dynamic(() => import("./AdcQuantisation").then((m) => m.AdcQuantisation), { loading });
const CanArbitration = dynamic(() => import("./CanArbitration").then((m) => m.CanArbitration), { loading });
const PwmTimer = dynamic(() => import("./PwmTimer").then((m) => m.PwmTimer), { loading });
const NvicPriorities = dynamic(() => import("./NvicPriorities").then((m) => m.NvicPriorities), { loading });
const DividerThevenin = dynamic(() => import("./DividerThevenin").then((m) => m.DividerThevenin), { loading });
const RcStep = dynamic(() => import("./RcStep").then((m) => m.RcStep), { loading });

/** Maps a content visual id to its interactive component. Add new visuals here and in the schema enum. */
export function Visual({ id }: { id: VisualId }) {
  switch (id) {
    case "mcu-boot-chain":
      return <McuBootChain />;
    case "i2c-waveform":
      return <I2cWaveform />;
    case "register-bits":
      return <RegisterBits />;
    case "rmw-hazard":
      return <RmwHazard />;
    case "uart-frame":
      return <UartFrame />;
    case "spi-modes":
      return <SpiModes />;
    case "iwdg-timeout":
      return <IwdgTimeout />;
    case "aliasing":
      return <Aliasing />;
    case "traceability":
      return <Traceability />;
    case "startup-sequence":
      return <StartupSequence />;
    case "priority-inversion":
      return <PriorityInversion />;
    case "scpi-console":
      return <ScpiConsole />;
    case "fmea-worksheet":
      return <FmeaWorksheet />;
    case "standards-map":
      return <StandardsMap />;
    case "sensor-monitor-lab":
      return <SensorMonitorLab />;
    case "adc-quantisation":
      return <AdcQuantisation />;
    case "can-arbitration":
      return <CanArbitration />;
    case "pwm-timer":
      return <PwmTimer />;
    case "nvic-priorities":
      return <NvicPriorities />;
    case "divider-thevenin":
      return <DividerThevenin />;
    case "rc-step":
      return <RcStep />;
  }
}
