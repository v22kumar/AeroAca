// @vitest-environment node
import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { labs } from "@/lib/labs/generated";
import manifest from "@/labs/manifest.json";
import { lessons, projects } from "@/content";

const root = process.cwd();

function run(command: string, cwd: string): { out: string; code: number } {
  try {
    const out = execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, LC_ALL: "C", PYTHONHASHSEED: "0" } });
    return { out: out.replace(/\r\n/g, "\n").trimEnd(), code: 0 };
  } catch (e) {
    const err = e as { stdout?: string; status?: number };
    return { out: String(err.stdout ?? "").replace(/\r\n/g, "\n").trimEnd(), code: err.status ?? 1 };
  }
}

/**
 * The academy promises reproducible expected results. These tests rebuild and rerun every lab
 * on the CI runner (gcc, make, python3) and diff the output against the committed expectation.
 * They fail loudly when a tool is missing rather than skipping, so a green CI means verified.
 */
describe("labs: runnable programs with verified expected output", () => {
  it("the toolchain the labs need is present", () => {
    for (const tool of ["gcc --version", "make --version", "python3 --version"]) {
      expect(run(tool, root).code, `${tool} must be available on the test machine`).toBe(0);
    }
  });

  it("every lab source file is tracked by git (a .gitignore pattern once hid two lab folders from CI)", () => {
    for (const lab of manifest.labs) {
      const tracked = run(`git ls-files --error-unmatch ${lab.dir}/${lab.file}`, root);
      expect(tracked.code, `${lab.dir}/${lab.file} is not tracked by git`).toBe(0);
    }
  });

  it("lib/labs/generated.ts matches labs/manifest.json and the files on disk", () => {
    expect(Object.keys(labs).sort()).toEqual(manifest.labs.map((l) => l.id).sort());
    for (const lab of manifest.labs) {
      const g = labs[lab.id]!;
      const file = join(root, lab.dir, lab.file);
      expect(existsSync(file), file).toBe(true);
      expect(g.code).toBe(readFileSync(file, "utf8").replace(/\r\n/g, "\n").trimEnd());
      expect(g.command).toBe(lab.command);
    }
  });

  for (const lab of manifest.labs) {
    it(`${lab.id}: running "${lab.command}" prints the expected output`, () => {
      const { out, code } = run(lab.command, join(root, lab.dir));
      expect(out).toBe(labs[lab.id]!.expectedOutput);
      if (!lab.id.includes("known-failure")) expect(code).toBe(0);
    });
  }

  it("every lab step in a lesson and every build-it step in the portfolio names a real lab", () => {
    for (const lesson of lessons) {
      for (const step of lesson.steps) if (step.type === "lab") expect(labs[step.lab], `${lesson.slug} -> ${step.lab}`).toBeDefined();
    }
    for (const p of projects) {
      for (const st of p.stages) for (const b of st.buildIt?.steps ?? []) expect(labs[b.lab], `${p.slug}/${st.id} -> ${b.lab}`).toBeDefined();
    }
  });

  it("no build product is committed under labs/", () => {
    const tracked = run("git ls-files --cached --others --exclude-standard labs", root).out.split("\n").filter(Boolean);
    expect(tracked.length).toBeGreaterThan(0);
    for (const f of tracked) expect(/\.(c|h|py|md|json|txt|gitignore)$|Makefile$/.test(f), `${f} looks like a build product`).toBe(true);
  });
});
