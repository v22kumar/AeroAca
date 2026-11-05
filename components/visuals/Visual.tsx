"use client";

import type { VisualId } from "@/lib/content/schema";
import { McuBootChain } from "./McuBootChain";
import { I2cWaveform } from "./I2cWaveform";
import { RegisterBits } from "./RegisterBits";
import { RmwHazard } from "./RmwHazard";

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
  }
}
