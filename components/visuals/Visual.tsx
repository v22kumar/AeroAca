"use client";

import type { VisualId } from "@/lib/content/schema";
import { McuBootChain } from "./McuBootChain";
import { I2cWaveform } from "./I2cWaveform";
import { RegisterBits } from "./RegisterBits";
import { RmwHazard } from "./RmwHazard";
import { UartFrame } from "./UartFrame";
import { SpiModes } from "./SpiModes";
import { IwdgTimeout } from "./IwdgTimeout";
import { Aliasing } from "./Aliasing";
import { Traceability } from "./Traceability";
import { StartupSequence } from "./StartupSequence";
import { PriorityInversion } from "./PriorityInversion";
import { ScpiConsole } from "./ScpiConsole";
import { FmeaWorksheet } from "./FmeaWorksheet";

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
  }
}
