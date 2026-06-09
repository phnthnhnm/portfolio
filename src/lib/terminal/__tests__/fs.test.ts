import { describe, expect, it } from "vitest";
import { FileSystem, type ProjectEntry } from "../fs";

const sampleProjects: ProjectEntry[] = [
  {
    id: "alpha",
    title: "Alpha Project",
    description: "First test project",
    techStack: ["Go", "Redis"],
  },
  {
    id: "beta",
    title: "Beta Project",
    description: "Second test project",
    techStack: ["TypeScript", "PostgreSQL"],
  },
];

function fresh(projects = sampleProjects) {
  return new FileSystem(projects);
}

describe("FileSystem", () => {
  describe("ls", () => {
    it("lists root directory with dirs first, then alphabetical", () => {
      const fs = fresh();
      const out = fs.ls();
      expect(out).toContain("/");
      expect(out).toContain("projects/");
      expect(out).toContain("about.md");
      expect(out).toContain("contact.txt");
      expect(out).toContain("skills.json");

      const lines = out.split("\n");
      const projIdx = lines.findIndex((l) => l.includes("projects/"));
      const aboutIdx = lines.findIndex((l) => l.includes("about.md"));
      expect(projIdx).toBeLessThan(aboutIdx);
    });

    it("lists a directory by path", () => {
      const fs = fresh();
      const out = fs.ls("projects");
      expect(out).toContain("alpha.md");
      expect(out).toContain("beta.md");
    });

    it("returns error for missing path", () => {
      const fs = fresh();
      expect(fs.ls("nope")).toBe("ls: nope: No such file or directory");
    });

    it('shows "(empty)" for empty directory', () => {
      const fs = new FileSystem([]);

      fs.root.children!.set("empty-dir", { type: "dir", name: "empty-dir", children: new Map() });
      const out = fs.ls("empty-dir");
      expect(out).toBe("(empty)");
    });
  });

  describe("cat", () => {
    it("reads a file at root", () => {
      const fs = fresh();
      const out = fs.cat("about.md");
      expect(out).toContain("About Me");
    });

    it("reads a file in a subdirectory", () => {
      const fs = fresh();
      const out = fs.cat("projects/alpha.md");
      expect(out).toContain("Alpha Project");
      expect(out).toContain("Go, Redis");
    });

    it("errors on missing file", () => {
      const fs = fresh();
      expect(fs.cat("nope.md")).toBe("cat: nope.md: No such file or directory");
    });

    it("errors when path is a directory", () => {
      const fs = fresh();
      expect(fs.cat("projects")).toBe("cat: projects: Is a directory");
    });

    it("errors when no argument given", () => {
      const fs = fresh();
      expect(fs.cat()).toBe("cat: missing file operand");
    });
  });

  describe("cd", () => {
    it("changes to a directory", () => {
      const fs = fresh();
      const err = fs.cd("projects");
      expect(err).toBe("");
      expect(fs.pwd()).toBe("/projects");
    });

    it("goes to root with / or ~", () => {
      const fs = fresh();
      fs.cd("projects");
      fs.cd("/");
      expect(fs.pwd()).toBe("/");
    });

    it("errors on missing directory", () => {
      const fs = fresh();
      expect(fs.cd("nope")).toBe("cd: nope: No such file or directory");
    });

    it("errors when path is a file", () => {
      const fs = fresh();
      expect(fs.cd("about.md")).toBe("cd: about.md: Not a directory");
    });
  });

  describe("pwd", () => {
    it("starts at /", () => {
      const fs = fresh();
      expect(fs.pwd()).toBe("/");
    });

    it("shows path after cd", () => {
      const fs = fresh();
      fs.cd("projects");
      expect(fs.pwd()).toBe("/projects");
    });
  });

  describe("resolve", () => {
    it("resolves root-level file", () => {
      const fs = fresh();
      const node = fs.resolve("about.md");
      expect(node).not.toBeNull();
      expect(node!.type).toBe("file");
    });

    it("resolves relative path from cwd", () => {
      const fs = fresh();
      fs.cd("projects");
      const node = fs.resolve("alpha.md");
      expect(node).not.toBeNull();
      expect(node!.type).toBe("file");
    });

    it("returns null for missing path", () => {
      const fs = fresh();
      expect(fs.resolve("nope")).toBeNull();
    });
  });

  describe("complete (tab completion)", () => {
    it("matches file prefix under cwd", () => {
      const fs = fresh();
      const matches = fs.complete("ab");
      expect(matches).toContain("about.md");
    });

    it("returns empty array when no match", () => {
      const fs = fresh();
      expect(fs.complete("xyz")).toEqual([]);
    });

    it("returns empty when cwd node is invalid", () => {
      const fs = fresh();
      fs.cwd = ["nonexistent"];
      expect(fs.complete("a")).toEqual([]);
    });

    it("matches under subdirectory when partial contains /", () => {
      const fs = fresh();
      const matches = fs.complete("projects/al");
      expect(matches).toContain("projects/alpha.md");
    });

    it("completes in cwd when partial has no /", () => {
      const fs = fresh();
      fs.cd("projects");
      const matches = fs.complete("be");
      expect(matches).toEqual(["beta.md"]);
    });
  });

  describe("project auto-generation", () => {
    it("creates project files from ProjectEntry array", () => {
      const fs = fresh();
      const out = fs.cat("projects/alpha.md");
      expect(out).toContain("# Alpha Project");
      expect(out).toContain("First test project");
      expect(out).toContain("Tech: Go, Redis");
    });

    it("projects directory does not exist when no projects passed", () => {
      const fs = new FileSystem([]);
      expect(fs.resolve("projects")).toBeNull();
      expect(fs.ls("projects")).toBe("ls: projects: No such file or directory");
    });

    it("creates projects directory when projects are passed", () => {
      const fs = fresh();
      expect(fs.resolve("projects")).not.toBeNull();
    });
  });
});
