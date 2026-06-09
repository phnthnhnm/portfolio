// ── Virtual filesystem for the terminal ────────────────────────────────

export interface FsNode {
  type: "file" | "dir";
  name: string;
  content?: string;
  children?: Map<string, FsNode>;
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  techStack: string[];
}

export class FileSystem {
  root: FsNode;
  cwd: string[]; // path segments from root, e.g. ["projects"]

  constructor(projects: ProjectEntry[] = []) {
    this.root = { type: "dir", name: "/", children: new Map() };
    this.cwd = [];
    this._populate(projects);
  }

  private add(path: string, content: string) {
    const parts = path.split("/");
    let dir = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!dir.children!.has(parts[i])) {
        dir.children!.set(parts[i], {
          type: "dir",
          name: parts[i],
          children: new Map(),
        });
      }
      dir = dir.children!.get(parts[i])!;
    }
    const name = parts[parts.length - 1];
    dir.children!.set(name, { type: "file", name, content });
  }

  private _populate(projects: ProjectEntry[]) {
    this.add("about.md", `# About Me

I'm a backend engineer based in Vietnam. I build scalable APIs,
distributed systems, and cloud infrastructure.

Focus areas:
- .NET ecosystem (C#, ASP.NET, Entity Framework)
- Database design (PostgreSQL, Redis, SQL Server)
- Message queues & event-driven systems (RabbitMQ, gRPC)
- Containerized deployments (Docker, Kubernetes, NGINX)

Type 'cd projects/' and 'ls' to browse my work.`);

    this.add(
      "skills.json",
      JSON.stringify(
        {
          languages: ["C#", "Go", "Python", "TypeScript", "SQL"],
          frameworks: [".NET Core", "ASP.NET", "React", "Astro", "Express.js"],
          databases: ["PostgreSQL", "Redis", "SQL Server"],
          devops: ["Docker", "Kubernetes", "GitHub Actions", "AWS", "Azure"],
          messaging: ["RabbitMQ", "gRPC", "REST", "GraphQL"],
        },
        null,
        2,
      ),
    );

    this.add("contact.txt", `Email:    namthanh.phan@proton.me
GitHub:   github.com/phnthnhnm
LinkedIn: linkedin.com/in/phan-thanh-nam`);

    // Auto-generate project files from content collection
    for (const p of projects) {
      const techLine = p.techStack.join(", ");
      this.add(
        `projects/${p.id}.md`,
        `# ${p.title}\n\n${p.description}\n\nTech: ${techLine}`,
      );
    }
  }

  // Walk from root down cwd, then resolve the relative path
  private _traverse(relative: string): {
    parent: FsNode;
    node: FsNode | null;
    pathSegments: string[];
  } {
    let dir = this.root;
    const segments = relative
      .split("/")
      .filter((s) => s && s !== "." && s !== "..");
    // handle absolute paths
    const start = relative.startsWith("/") ? [] : this.cwd;
    const fullPath = [...start, ...segments];

    if (fullPath.length === 0)
      return { parent: dir, node: dir, pathSegments: [] };

    for (let i = 0; i < fullPath.length - 1; i++) {
      const child = dir.children?.get(fullPath[i]);
      if (!child || child.type !== "dir") {
        return { parent: dir, node: null, pathSegments: fullPath.slice(i) };
      }
      dir = child;
    }

    const lastName = fullPath[fullPath.length - 1];
    const node = dir.children?.get(lastName) ?? null;
    return { parent: dir, node, pathSegments: fullPath };
  }

  resolve(relative: string): FsNode | null {
    return this._traverse(relative).node;
  }

  ls(path?: string): string {
    const target = path ? this.resolve(path) : this._traverse(".").node;
    if (!target) return `ls: ${path}: No such file or directory`;
    if (target.type === "file") return target.name;
    if (!target.children || target.children.size === 0) return "(empty)";

    const entries: string[] = [];
    for (const [name, node] of target.children) {
      entries.push(node.type === "dir" ? `${name}/` : name);
    }
    entries.sort((a, b) => {
      const aDir = a.endsWith("/") ? 0 : 1;
      const bDir = b.endsWith("/") ? 0 : 1;
      if (aDir !== bDir) return aDir - bDir;
      return a.localeCompare(b);
    });

    const displayPath = path || this.pwd() || "/";
    return `${displayPath}\n${entries.map((e) => `  ${e}`).join("\n")}`;
  }

  cat(path?: string): string {
    if (!path) return "cat: missing file operand";
    const node = this.resolve(path);
    if (!node) return `cat: ${path}: No such file or directory`;
    if (node.type === "dir") return `cat: ${path}: Is a directory`;
    return node.content ?? "(empty)";
  }

  cd(path?: string): string {
    if (!path || path === "~" || path === "/") {
      this.cwd = [];
      return "";
    }
    const node = this.resolve(path);
    if (!node) return `cd: ${path}: No such file or directory`;
    if (node.type === "file") return `cd: ${path}: Not a directory`;

    const segments = path
      .split("/")
      .filter((s) => s && s !== "." && s !== "..");
    const start = path.startsWith("/") ? [] : this.cwd;
    this.cwd = [...start, ...segments];
    return "";
  }

  pwd(): string {
    return "/" + this.cwd.join("/");
  }

  // Tab completion: find all nodes under cwd that start with partial
  complete(partial: string): string[] {
    const dir =
      this.cwd.length === 0
        ? this.root
        : this.resolve(this.cwd.join("/"));
    if (!dir || dir.type !== "dir" || !dir.children) return [];

    const matches: string[] = [];
    for (const [name] of dir.children) {
      if (name.startsWith(partial)) matches.push(name);
    }
    // If partial contains a /, try completing at that depth
    if (partial.includes("/")) {
      const lastSlash = partial.lastIndexOf("/");
      const parentPath = partial.slice(0, lastSlash);
      const childPartial = partial.slice(lastSlash + 1);
      const parent = this.resolve(parentPath);
      if (parent && parent.type === "dir" && parent.children) {
        for (const [name] of parent.children) {
          if (name.startsWith(childPartial)) {
            matches.push(parentPath + "/" + name);
          }
        }
      }
    }
    return matches;
  }
}
