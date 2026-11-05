import { mcuBoardDoesNotBoot } from "./lessons/mcu-board-does-not-boot";
import { i2cSensorNotAcknowledging } from "./lessons/i2c-sensor-not-acknowledging";
import { embeddedCRegisterBitMasks } from "./lessons/embedded-c-register-bit-masks";
import { watchdogsAndResetLoops } from "./lessons/watchdogs-and-reset-loops";
import { uartFramingAndBaud } from "./lessons/uart-framing-and-baud";
import { spiModesAndChipSelect } from "./lessons/spi-modes-and-chip-select";
import { oscilloscopeProbing } from "./lessons/oscilloscope-probing";
import { fixedWidthIntegersOverflowShifts } from "./lessons/fixed-width-integers-overflow-shifts";
import { boardBringUpChecklist } from "./lessons/board-bring-up-checklist";
import { writingATrustworthyTestCase } from "./lessons/writing-a-trustworthy-test-case";
import { rootCauseAnalysis } from "./lessons/root-cause-analysis";
import { interfaceControlAndIntegrationFaults } from "./lessons/interface-control-and-integration-faults";
import { freshBoardNoSignOfLife } from "./missions/fresh-board-no-sign-of-life";
import { theSensorThatNeverAnswers } from "./missions/the-sensor-that-never-answers";
import { theUartThatPrintsGarbage } from "./missions/the-uart-that-prints-garbage";
import { theBoardThatResetsEverySecond } from "./missions/the-board-that-resets-every-second";
import { theRequirementNobodyCouldTest } from "./missions/the-requirement-nobody-could-test";
import { twoBoardsOneBusNoAgreement } from "./missions/two-boards-one-bus-no-agreement";
import type { Lesson, Mission } from "@/lib/content/schema";

/**
 * Content registry. To publish a new lesson or mission:
 *  1. Add a file under content/lessons or content/missions.
 *  2. Import and append it here.
 *  3. Mark it "published" with its slug in content/curriculum.ts.
 * The validation test in tests/content.test.ts will refuse anything inconsistent.
 */
export const lessons: Lesson[] = [
  mcuBoardDoesNotBoot,
  watchdogsAndResetLoops,
  i2cSensorNotAcknowledging,
  uartFramingAndBaud,
  spiModesAndChipSelect,
  embeddedCRegisterBitMasks,
  fixedWidthIntegersOverflowShifts,
  oscilloscopeProbing,
  rootCauseAnalysis,
  boardBringUpChecklist,
  interfaceControlAndIntegrationFaults,
  writingATrustworthyTestCase,
];

export const missions: Mission[] = [
  freshBoardNoSignOfLife,
  theBoardThatResetsEverySecond,
  theSensorThatNeverAnswers,
  theUartThatPrintsGarbage,
  twoBoardsOneBusNoAgreement,
  theRequirementNobodyCouldTest,
];

export { curriculum } from "./curriculum";
export { journey, journeyBlocks } from "./journey";
export { interviewQuestions } from "./interview";
