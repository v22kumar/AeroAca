import type { Lesson } from "@/lib/content/schema";

export const pytestForHardwareTests: Lesson = {
  slug: "pytest-for-hardware-tests",
  moduleId: "python-advanced",
  format: "arc",
  prerequisites: ["serial-automation-and-test-logs", "logs-to-evidence"],
  title: "pytest for hardware tests: fixtures, parametrisation and markers",
  summary: "Replace a folder of copy-pasted scripts with one test suite: fixtures that set up and tidy the bench, parametrisation that turns a table of cases into tests, markers that separate simulation from hardware, and a report a reviewer can read. Code shown here is meant to be run on your own PC with pytest installed.",
  durationMinutes: 17,
  whyItMatters: "Test automation roles name pytest in most adverts, and 'how did you structure your tests' is a standard question. A candidate who can explain fixtures, parametrisation and markers, and why each exists, has clearly moved past throw-away scripts.",
  objectives: [
    "Explain what a fixture is, how setup and teardown work with yield, and what the scope controls.",
    "Turn a table of cases into tests with parametrize and read the resulting test names.",
    "Use a marker and a command-line option so tests that need real hardware are skipped or deselected cleanly.",
    "Produce a report, and keep the run reproducible by recording what the run used.",
  ],
  review: {
    status: "technically-reviewed",
    note: "pytest behaviour follows its documentation: test discovery by name, the assert statement, fixtures with yield, scopes, parametrize, markers registered in pytest.ini with --strict-markers, pytest.skip inside a fixture, the -m selection expression, the --junitxml option and the pytest_addoption and pytest_report_header hooks. pytest is not part of this academy's continuous-integration lab job, so the lesson has no runnable lab; the next lesson runs the same ideas with the standard library only. Every device, command and number is synthetic.",
  },
  references: [
    { title: "pytest documentation: fixtures, parametrize, markers, configuration", url: "https://docs.pytest.org/", note: "The authority for every call used here." },
    { title: "Lesson: From logs to evidence", note: "The report this suite should end with." },
    { title: "Lesson: Serial communication and test logs in Python", note: "Request-reply handling the fixture wraps." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "Forty scripts and one broken port",
      body: `A bench team has forty Python scripts, one per test. Each has its own \`main()\`, its own copy of the code that opens the serial port, and the port name typed in as \`COM3\`. A failure raises an exception and stops the script. The results go to the screen.

Monday: the bench PC is rebuilt and the port becomes \`COM7\`. Every script fails. Someone fixes thirty-seven of them by hand and misses three. Tuesday: a new engineer adds a case by copying a script, and the copy opens the port but never closes it, so the next script finds it busy.

There is no list of what ran, no shared setup, no way to run only the quick tests, and no report. The scripts work. The **structure** is what fails.

A test framework gives that structure, and for Python it is usually pytest.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The stage crew and the script",
      body: `A theatre has actors and a stage crew. The actors say their lines. The crew, unseen, sets the scene before each act and clears it afterwards.

A test suite works the same way. A **test** is the actor: a short function that says what it expects. The **fixture** is the stage crew: code that sets up the bench before the test and puts it back after, whether the test passed or failed. The test never opens a port itself. It just asks for a \`device\`, and the crew has one ready.

Because the crew is in one place, changing the port means changing **one** line, not forty. And because the test only states its expectation, a reader sees at once what is being checked.

Two more things come free. The runner finds tests by their names, so nothing needs a \`main()\`. And when an assertion fails, the runner shows both sides of the comparison, so you rarely need a print.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Fixtures, parametrisation and markers",
      body: `Three ideas do most of the work.

**Fixtures.** A function marked with the fixture decorator. A test names it as an argument, and pytest supplies the result. If the fixture uses \`yield\`, everything after the yield runs as **teardown**. The **scope** says how often it is built: for each test (the default), for each module, or once per session.

**Parametrisation.** One test function, many inputs. A decorator takes a list of values, and pytest runs the function once per value and names each run, such as \`test_echo_roundtrip[hello]\`. A table of cases becomes a set of separate tests, each reported on its own.

**Markers.** Labels such as \`hardware\` attached to a test. A run can then select or exclude tests by label. Registering markers in \`pytest.ini\` and adding \`--strict-markers\` makes a misspelt marker an error rather than a silent no-op.

Together they separate three concerns: how the bench is prepared (fixtures), what is checked (the test) and which tests run (markers).

Put shared fixtures in a file named \`conftest.py\`, and pytest finds them with no import.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "understand",
      title: "conftest.py: the bench set-up in one place",
      intro: `A small \`conftest.py\`. It gives every test a device, and gives hardware tests a way to say 'I need a real port'.`,
      language: "python",
      code: `import pytest

def pytest_addoption(parser):
    parser.addoption("--port", default=None, help="serial port of a real device")

@pytest.fixture
def device():
    dev = SimulatedDevice()      # your driver layer, with the same methods as the real one
    yield dev
    dev.close()

@pytest.fixture
def real_port(request):
    port = request.config.getoption("--port")
    if port is None:
        pytest.skip("needs hardware: pass --port")
    return port`,
      notes: [
        { lines: "3-4", text: `Add a command-line option, \`--port\`. The port name is now given when the suite is run, not typed into forty files. It defaults to nothing.` },
        { lines: "6-10", text: `The \`device\` fixture. Everything before \`yield\` is **set-up**: line 8 builds a device. \`SimulatedDevice\` is the project's own class, not part of pytest, and has the same methods as the real driver, so most tests run on either. The value after \`yield\` goes to the test. Everything after it is **teardown** and runs whether the test passed or failed, so the port is always closed.` },
        { lines: "12-17", text: `The \`real_port\` fixture. If no \`--port\` was given it **skips** the test with a stated reason, so a hardware test never fails on a PC with no bench; with a port, it hands the name to the test.` },
      ],
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "understand",
      title: "The tests: short and about the device",
      intro: `Four tests that use those fixtures. Each one is a sentence about the device.`,
      language: "python",
      code: `import pytest

@pytest.mark.parametrize("text", ["hello", "123", "ok"])
def test_echo_roundtrip(device, text):
    assert device.request(f"ECHO {text}") == text

def test_identity(device):
    assert device.request("ID?").startswith("ACME-NODE")

@pytest.mark.hardware
def test_flash_firmware(device, real_port):
    assert flash(real_port, "image.bin") == "OK"`,
      notes: [
        { lines: "3-5", text: `One function, three inputs. pytest runs it three times and names the runs \`test_echo_roundtrip[hello]\`, \`[123]\` and \`[ok]\`. If \`[123]\` fails, the other two still run and are still reported. The test asks for \`device\` by name and pytest supplies it: no open, no close, no port name. The plain \`assert\` on line 5 shows the actual and the expected value when it fails.` },
        { lines: "7-8", text: `A second test with no parameters, one sentence about the device: it identifies itself.` },
        { lines: "10-12", text: `A test marked \`hardware\` that also asks for \`real_port\`. It is skipped with no \`--port\`, and can be left out entirely with \`-m "not hardware"\`.` },
      ],
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: the same suite, three ways to run it",
      body: `The suite above has **five** tests: \`test_identity\`, three runs of \`test_echo_roundtrip\`, and the hardware test \`test_flash_firmware\`, the only one marked \`hardware\`.

**Run 1: \`pytest\`** with no options. Four tests use the simulated device and pass. The hardware test asks for \`real_port\`, which skips it with the reason "needs hardware". The summary reads **4 passed, 1 skipped**. The skip is listed, not hidden, when you add \`-rs\`.

**Run 2: \`pytest -m "not hardware"\`.** The hardware test is **deselected** before it runs: **4 passed, 1 deselected**. A deselected test is not asked for at all.

**Run 3: \`pytest --port COM7 --junitxml=report.xml\`.** With a port, the fixture returns it and the flash test runs on the real bench. The results are also written to \`report.xml\`, a file a CI system or a viewer can read.

**Skipped and deselected differ.** A skip is something the suite wanted to run and could not, and it is shown in the report. Deselection is a choice made by the person running it.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "count-parametrised",
        skill: "pytest-structure",
        objective: "Count the tests a file produces when some are parametrised (guided).",
        prompt: `A test file has \`test_a\` (no parameters), \`test_b\` parametrised over **4** values and \`test_c\` parametrised over **3** values. How many separate tests does pytest run?`,
        unit: "tests",
        answer: 8,
        tolerance: 0,
        hints: [
          `Each value of a parametrised test becomes its own test.`,
          `test_a is one test. test_b is four. test_c is three.`,
          `Add them: 1 + 4 + 3.`,
        ],
        solution: `1 + 4 + 3 = **8** tests. Each is reported separately, for example \`test_b[2]\`, so a failure points to the exact input.`,
        solvedFeedback: `Right: 8. Parametrisation multiplies tests, not functions; that is how a table of cases becomes a set of independently reported results.`,
        misconceptions: [
          { value: 3, tolerance: 0, feedback: `Three counts the functions. A parametrised function runs once per value, so test_b is four tests and test_c is three: 1 + 4 + 3 = 8.` },
          { value: 12, tolerance: 0, feedback: `That multiplies 4 by 3. Parameters of different functions do not multiply; they add: 1 + 4 + 3 = 8.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "Making a run reproducible and readable",
      body: `A suite is evidence only if someone else can run it and see the same thing.

**Pin and record.** Record the Python and pytest versions, the version of the suite and of the **device under test**. A hook called \`pytest_report_header\` can return lines such as the seed and the firmware version, which pytest prints at the top of every run.

**Seed any randomness.** A fixture that builds random data takes its seed from an option and prints it. A failure on seed 1234 can be reproduced on seed 1234.

**Write a report file.** \`--junitxml=report.xml\` is the standard. A short script, like the one in the previous lesson, can turn it into a table that shows the raw values.

**Keep tests independent.** A test must not depend on another having run first. If it changes the device, the fixture restores it in teardown.

**Wait for a condition, not for a time.** A fixed sleep is the usual cause of a **flaky test**: too short on a slow day, wasteful on a fast one. Poll for the expected state, with a timeout and a clear message.

Finally, name tests after the requirement they check, such as \`test_req_fuel_07_low_fuel\`, so the suite carries its own traceability.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "single",
        id: "skip-vs-deselect",
        skill: "pytest-structure",
        objective: "Choose how to keep hardware tests off a PC with no bench.",
        prompt: `You want the suite to run on any laptop with no bench connected, and to show clearly on the report which tests did not run and why. Which approach does that best?`,
        options: [
          { id: "a", text: "Delete the hardware tests from the repository on laptops.", correct: false, feedback: `That makes the laptop suite a different suite. Nothing records that hardware tests exist and did not run.` },
          { id: "b", text: "Mark them with a registered marker and have a fixture skip them with a reason when no port is given.", correct: true, feedback: `Right. The tests stay in the suite, a skipped test appears in the report with its reason, and with a port the same tests run for real. Use \`-m "not hardware"\` only when you want them left out on purpose.` },
          { id: "c", text: "Wrap each hardware test in try and except and pass when the port is missing.", correct: false, feedback: `A test that passes without doing anything is the worst outcome: the report says it was verified. A skip is honest; a silent pass is not.` },
          { id: "d", text: "Use time.sleep so the tests wait for a port to appear.", correct: false, feedback: `Waiting does not create a bench. The test will hang or fail, and a fixed sleep is also the usual source of flaky tests.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "fixture-facts",
        skill: "pytest-structure",
        objective: "Know what a fixture does.",
        prompt: `Select **every** true statement about the \`device\` fixture in the walkthrough.`,
        options: [
          { id: "a", text: "The code after \`yield\` runs after the test, even if the test failed.", correct: true, feedback: `Yes. That is teardown, and it is what makes sure the port is closed.` },
          { id: "b", text: "A test receives the device by naming \`device\` as an argument.", correct: true, feedback: `Yes. pytest matches argument names to fixtures; the test never builds the device.` },
          { id: "c", text: "Changing the port or the simulated class in one place changes it for every test that uses the fixture.", correct: true, feedback: `Yes. That is the reason to have a fixture: one place to change, instead of forty.` },
          { id: "d", text: "The fixture must be imported into every test file before it can be used.", correct: false, feedback: `A fixture defined in conftest.py is found automatically. Importing fixtures by hand is a sign they are in the wrong place.` },
        ],
        solvedFeedback: `Right: teardown after yield, injection by argument name, and one place to change. A fixture in conftest.py needs no import.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Where pytest suites go wrong",
      body: `A pytest suite is easy to start and easy to ruin. Five traps, each seen often.

**Order dependence.** Test B passes only because test A ran first and left the device in a state. Run in another order, it fails. Fixtures must give each test the same starting state.

**Session-scope leaks.** A fixture built once for the whole run is fast, but state left by one test reaches the next. Use a wide scope only for things that are truly read-only, such as an open port.

**Unregistered markers.** A typo like \`@pytest.mark.harware\` silently selects nothing. \`--strict-markers\` turns it into an error.

**Parametrise explosion.** Three parameters of ten values each is a thousand tests. Choose boundary values and representatives, not every combination.

**Hardware tests that look like unit tests.** If a test needs the bench, mark it, so a green laptop run is not read as a verified build.

Be honest about scope: pytest is a test **runner**. It does not give you a bench, a requirement trail or a safety argument. Those are the layers above, which the next lesson draws.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "strict-markers-error",
        skill: "pytest-structure",
        objective: "Diagnose an unregistered-marker error.",
        prompt: `A suite is run with \`--strict-markers\`. It stops at collection with an error saying the marker \`hardware\` is not found in the \`markers\` configuration. The tests use \`@pytest.mark.hardware\` correctly. What is the right fix?`,
        options: [
          { id: "a", text: "Remove --strict-markers so the error goes away.", correct: false, feedback: `That hides the check that protects you from typos in marker names. The marker is fine; it is just not declared.` },
          { id: "b", text: "Register the marker in pytest.ini under markers, with a one-line description, and keep --strict-markers.", correct: true, feedback: `Right. Declaring the marker is the intended fix: the suite now documents what hardware means and still rejects misspelt markers.` },
          { id: "c", text: "Rename the marker to something shorter.", correct: false, feedback: `A different name fails in the same way. The problem is that no marker is declared, not what it is called.` },
          { id: "d", text: "Import the marker at the top of every test file.", correct: false, feedback: `Markers are not imported. They are registered in configuration so pytest knows the full list.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "pytest-hardware-test-structure",
      intro: `Explain how you would structure a pytest suite that runs on a PC with simulated devices and on a bench with real ones.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Host-side tests of a protocol parser or a driver model run in pytest on every commit; fixtures give each test a fresh simulated device.
- **Aerospace and UAV systems.** A bench suite drives a unit over a serial or bus interface, with hardware-marked tests that run only when the rig is connected.
- **R&D and design.** Characterisation runs parametrise the temperature, the supply voltage and the load, and write one result per case.
- **Verification and interviews.** "How is your suite structured?" is answered with fixtures, parametrisation and markers, and with how a hardware test is kept from passing silently.`,
    },
    {
      type: "recap",
      summary: `- A test is a short function that says what is expected; a fixture builds and tidies the bench, and teardown after yield runs even when the test fails.
- parametrize turns a table of cases into separately named and separately reported tests; counts add across functions.
- Markers label tests; register them in pytest.ini with --strict-markers. A fixture can skip a hardware test with a reason; -m "not hardware" deselects it on purpose.
- Make runs reproducible: record versions and seeds in the header, write a report file, keep tests independent, wait for conditions, not for time.
- pytest is the runner, not the bench or the safety case.`,
      cards: [
        { id: "pyt-1", front: "What does the code after yield in a fixture do?", back: "It is teardown: it runs after the test finishes, even if the test failed, so the bench is restored." },
        { id: "pyt-2", front: "How many tests does a file with one plain test, one with 4 parameters and one with 3 produce?", back: "8: parametrisation adds one test per value, and counts across functions add." },
        { id: "pyt-3", front: "What is the difference between a skipped and a deselected test?", back: "A skipped test was selected but could not run, and the report shows it with its reason. A deselected test was left out on purpose, for example with -m 'not hardware'." },
        { id: "pyt-4", front: "Why register markers and use --strict-markers?", back: "So a misspelt marker is an error instead of silently selecting nothing, and the configuration documents what each marker means." },
      ],
    },
  ],
};
