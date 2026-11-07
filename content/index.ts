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
import { fromResetVectorToMain } from "./lessons/from-reset-vector-to-main";
import { priorityInversion } from "./lessons/priority-inversion";
import { milStd1553bTheWordAndTheMessage } from "@/content/lessons/mil-std-1553b-the-word-and-the-message";
import { milStd1553bControllerTerminalsAndFaults } from "@/content/lessons/mil-std-1553b-controller-terminals-and-faults";
import { arinc429WordsLabelsAndSsm } from "@/content/lessons/arinc-429-words-labels-and-ssm";
import { rs422Rs485AndFramedSerialWithCrc } from "@/content/lessons/rs-422-rs-485-and-framed-serial-with-crc";
import { telemetryPacketsAndParsingWithStruct } from "@/content/lessons/telemetry-packets-and-parsing-with-struct";
import { do178cLevelsAndObjectives } from "@/content/lessons/do-178c-levels-and-objectives";
import { requirementsBasedTestingHlrLlr } from "@/content/lessons/requirements-based-testing-hlr-llr";
import { structuralCoverageAndMcdc } from "@/content/lessons/structural-coverage-and-mcdc";
import { traceabilityProblemReportsAndChangeImpact } from "@/content/lessons/traceability-problem-reports-and-change-impact";
import { whyFlightControlIsRedundant } from "@/content/lessons/why-flight-control-is-redundant";
import { votingMonitorsAndFailover } from "@/content/lessons/voting-monitors-and-failover";
import { testingACrossChannelLink } from "@/content/lessons/testing-a-cross-channel-link";
import { tasksTheSchedulerAndTheTick } from "@/content/lessons/tasks-the-scheduler-and-the-tick";
import { willItMeetItsDeadline } from "@/content/lessons/will-it-meet-its-deadline";
import { frameBasedExecutivesAndOverruns } from "@/content/lessons/frame-based-executives-and-overruns";
import { sharedMemoryDpramHandshakes } from "@/content/lessons/shared-memory-dpram-handshakes";
import { measuringWcetAndJitter } from "@/content/lessons/measuring-wcet-and-jitter";
import { deadlockAndLockOrdering } from "@/content/lessons/deadlock-and-lock-ordering";
import { hilArchitectureAndBenchDesign } from "@/content/lessons/hil-architecture-and-bench-design";
import { fromFmeaToFaultInjection } from "@/content/lessons/from-fmea-to-fault-injection";
import { logsToEvidence } from "@/content/lessons/logs-to-evidence";
import { pytestForHardwareTests } from "@/content/lessons/pytest-for-hardware-tests";
import { architectureOfATestFramework } from "@/content/lessons/architecture-of-a-test-framework";
import { debugProbeAndGdbOnTarget } from "@/content/lessons/debug-probe-and-gdb-on-target";
import { hardfaultAnalysis } from "@/content/lessons/hardfault-analysis";
import { buildingAFrameParserAndBreakingIt } from "@/content/lessons/building-a-frame-parser-and-breaking-it";
import { controlLoopAndPid } from "@/content/lessons/control-loop-and-pid";
import { careerGapContractAndOwnership } from "@/content/lessons/career-gap-contract-and-ownership";
import { claimsMetricsAndNegotiation } from "@/content/lessons/claims-metrics-and-negotiation";
import { isrToTaskHandoff } from "./lessons/isr-to-task-handoff";
import { bootloadersImagesAndRecovery } from "./lessons/bootloaders-images-and-recovery";
import { embeddedLinuxBootChain } from "./lessons/embedded-linux-boot-chain";
import { talkingToAnInstrumentWithPyvisa } from "./lessons/talking-to-an-instrument-with-pyvisa";
import { serialAutomationAndTestLogs } from "./lessons/serial-automation-and-test-logs";
import { silHilWhatEachProves } from "./lessons/sil-hil-what-each-proves";
import { fmeaForASmallEmbeddedProduct } from "./lessons/fmea-for-a-small-embedded-product";
import { avionicsAndAutomotiveStandardsScope } from "./lessons/avionics-and-automotive-standards-scope";
import { medicalAndIndustrialStandardsScope } from "./lessons/medical-and-industrial-standards-scope";
import { sameSkillsDifferentIndustries } from "./lessons/same-skills-different-industries";
import { presentingAPortfolioProjectHonestly } from "./lessons/presenting-a-portfolio-project-honestly";
import { tellingADebuggingStory } from "./lessons/telling-a-debugging-story";
import { readingAPowerTree } from "./lessons/reading-a-power-tree";
import { opAmpSanityChecks } from "./lessons/op-amp-sanity-checks";
import { adcResolutionReferenceAndNoise } from "./lessons/adc-resolution-reference-and-noise";
import { readingASchematicLikeAReviewer } from "./lessons/reading-a-schematic-like-a-reviewer";
import { datasheetTriage } from "./lessons/datasheet-triage";
import { interruptsAndNvicPriorities } from "./lessons/interrupts-and-nvic-priorities";
import { canArbitrationErrorFramesAndBusOff } from "./lessons/can-arbitration-error-frames-and-bus-off";
import { pointersToHardware } from "./lessons/pointers-to-hardware";
import { raiiForPeripherals } from "./lessons/raii-for-peripherals";
import { pollingInterruptsAndDma } from "./lessons/polling-interrupts-and-dma";
import { logicAnalysersDecodingABus } from "./lessons/logic-analysers-decoding-a-bus";
import { circuitLawsOnTheBench } from "./lessons/circuit-laws-on-the-bench";
import { capacitorsInductorsRcAndFilters } from "./lessons/capacitors-inductors-rc-and-filters";
import { diodesAndTransistorsAsSwitches } from "./lessons/diodes-and-transistors-as-switches";
import { logicLevelsThresholdsAndOpenDrain } from "./lessons/logic-levels-thresholds-and-open-drain";
import { groundingProtectionAndTheFirstThingThatBreaks } from "./lessons/grounding-protection-and-the-first-thing-that-breaks";
import { theDmmAndTheBenchSupply } from "./lessons/the-dmm-and-the-bench-supply";
import { cFoundationsForFirmware } from "./lessons/c-foundations-for-firmware";
import { stackHeapAndWhereYourVariablesLive } from "./lessons/stack-heap-and-where-your-variables-live";
import { stateMachinesThatSurviveReview } from "./lessons/state-machines-that-survive-review";
import { aRingBufferForTheUartDriver } from "./lessons/a-ring-buffer-for-the-uart-driver";
import { choosingAndReadingAnMcu } from "./lessons/choosing-and-reading-an-mcu";
import { yourFirstStm32Project } from "./lessons/your-first-stm32-project";
import { gpioAndTheClockTree } from "./lessons/gpio-and-the-clock-tree";
import { lowPowerModesAndWakeUpSources } from "./lessons/low-power-modes-and-wake-up-sources";
import { freshBoardNoSignOfLife } from "./missions/fresh-board-no-sign-of-life";
import { theSensorThatNeverAnswers } from "./missions/the-sensor-that-never-answers";
import { theUartThatPrintsGarbage } from "./missions/the-uart-that-prints-garbage";
import { theBoardThatResetsEverySecond } from "./missions/the-board-that-resets-every-second";
import { theRequirementNobodyCouldTest } from "./missions/the-requirement-nobody-could-test";
import { twoBoardsOneBusNoAgreement } from "./missions/two-boards-one-bus-no-agreement";
import { theTaskThatNeverRuns } from "./missions/the-task-that-never-runs";
import { theFlakyAutomatedTest } from "./missions/the-flaky-automated-test";
import { theRailThatSags } from "./missions/the-rail-that-sags";
import { theSchematicThatAlmostShipped } from "./missions/the-schematic-that-almost-shipped";
import { stm32SensorMonitor } from "./projects/stm32-sensor-monitor";
import type { Project } from "@/lib/content/schema";
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
  fromResetVectorToMain,
  priorityInversion,
  milStd1553bTheWordAndTheMessage,
  milStd1553bControllerTerminalsAndFaults,
  arinc429WordsLabelsAndSsm,
  rs422Rs485AndFramedSerialWithCrc,
  telemetryPacketsAndParsingWithStruct,
  do178cLevelsAndObjectives,
  requirementsBasedTestingHlrLlr,
  structuralCoverageAndMcdc,
  traceabilityProblemReportsAndChangeImpact,
  whyFlightControlIsRedundant,
  votingMonitorsAndFailover,
  testingACrossChannelLink,
  tasksTheSchedulerAndTheTick,
  willItMeetItsDeadline,
  frameBasedExecutivesAndOverruns,
  sharedMemoryDpramHandshakes,
  measuringWcetAndJitter,
  deadlockAndLockOrdering,
  hilArchitectureAndBenchDesign,
  fromFmeaToFaultInjection,
  logsToEvidence,
  pytestForHardwareTests,
  architectureOfATestFramework,
  debugProbeAndGdbOnTarget,
  hardfaultAnalysis,
  buildingAFrameParserAndBreakingIt,
  controlLoopAndPid,
  careerGapContractAndOwnership,
  claimsMetricsAndNegotiation,
  isrToTaskHandoff,
  bootloadersImagesAndRecovery,
  embeddedLinuxBootChain,
  talkingToAnInstrumentWithPyvisa,
  serialAutomationAndTestLogs,
  silHilWhatEachProves,
  fmeaForASmallEmbeddedProduct,
  avionicsAndAutomotiveStandardsScope,
  medicalAndIndustrialStandardsScope,
  sameSkillsDifferentIndustries,
  presentingAPortfolioProjectHonestly,
  tellingADebuggingStory,
  readingAPowerTree,
  opAmpSanityChecks,
  adcResolutionReferenceAndNoise,
  readingASchematicLikeAReviewer,
  datasheetTriage,
  interruptsAndNvicPriorities,
  canArbitrationErrorFramesAndBusOff,
  pointersToHardware,
  raiiForPeripherals,
  pollingInterruptsAndDma,
  logicAnalysersDecodingABus,
  circuitLawsOnTheBench,
  capacitorsInductorsRcAndFilters,
  diodesAndTransistorsAsSwitches,
  logicLevelsThresholdsAndOpenDrain,
  groundingProtectionAndTheFirstThingThatBreaks,
  theDmmAndTheBenchSupply,
  cFoundationsForFirmware,
  stackHeapAndWhereYourVariablesLive,
  stateMachinesThatSurviveReview,
  aRingBufferForTheUartDriver,
  choosingAndReadingAnMcu,
  yourFirstStm32Project,
  gpioAndTheClockTree,
  lowPowerModesAndWakeUpSources,
];

export const missions: Mission[] = [
  freshBoardNoSignOfLife,
  theBoardThatResetsEverySecond,
  theSensorThatNeverAnswers,
  theUartThatPrintsGarbage,
  twoBoardsOneBusNoAgreement,
  theRequirementNobodyCouldTest,
  theTaskThatNeverRuns,
  theFlakyAutomatedTest,
  theRailThatSags,
  theSchematicThatAlmostShipped,
];

export { curriculum } from "./curriculum";
export { journey, journeyStages } from "./journey";
export { careerLadder } from "./career-ladder";
export { interviewQuestions } from "./interview";

export const projects: Project[] = [stm32SensorMonitor];
