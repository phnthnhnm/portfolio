import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { FileSystem, type ProjectEntry } from "@/lib/terminal/fs";

interface Props {
  projects?: ProjectEntry[];
}

// ── Component ─────────────────────────────────────────────────────────

interface CommandOutput {
  type: "output" | "input" | "error";
  text: string;
}

const banner = `██████╗ ████████╗███╗   ██╗
██╔══██╗╚══██╔══╝████╗  ██║
██████╔╝   ██║   ██╔██╗ ██║
██╔═══╝    ██║   ██║╚██╗██║
██║        ██║   ██║ ╚████║
╚═╝        ╚═╝   ╚═╝  ╚═══╝

Welcome to my interactive terminal!
Type 'help' to see available commands.
`;

export default function Terminal({ projects = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [promptPath, setPromptPath] = useState("~");
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Create filesystem once
  const [fs] = useState(() => new FileSystem(projects));

  // Build commands that close over fs and setPromptPath
  const commands: Record<string, (args: string[]) => string> = {
    help: () =>
      `Available commands:
  ls [path]   — List directory contents
  cat <file>  — Print file contents
  cd <dir>    — Change directory
  pwd         — Print working directory
  whoami      — Who I am
  contact     — How to reach me
  clear       — Clear the terminal
  help        — Show this help`,

    whoami: () =>
      `phan-thanh-nam
Backend Engineer
Location: Vietnam
Focus: Scalable APIs, Distributed Systems, Cloud Infrastructure`,

    ls: (args) => fs.ls(args[0]),

    cat: (args) => fs.cat(args[0]),

    cd: (args) => {
      const err = fs.cd(args[0]);
      if (err) return err;
      // Update prompt display
      const p = fs.pwd();
      setPromptPath(p === "/" ? "/" : p.replace(/^\//, ""));
      return "";
    },

    pwd: () => fs.pwd(),

    contact: () => fs.cat("contact.txt") ?? "No contact info found.",

    clear: () => "__CLEAR__",
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = useCallback(
    (cmdStr: string) => {
      const trimmed = cmdStr.trim();
      if (!trimmed) return;

      const [cmd, ...args] = trimmed.split(/\s+/);
      const handler = commands[cmd];

      const prompt = promptPath || "~";
      setHistory((prev) => [...prev, { type: "input", text: `${prompt} $ ${trimmed}` }]);

      if (handler) {
        const result = handler(args);
        if (result === "__CLEAR__") {
          setHistory([]);
        } else if (result) {
          setHistory((prev) => [...prev, { type: "output", text: result }]);
        }
      } else {
        setHistory((prev) => [
          ...prev,
          {
            type: "error",
            text: `bash: ${cmd}: command not found. Type 'help' for available commands.`,
          },
        ]);
      }

      setCmdHistory((prev) => [...prev, trimmed]);
      setHistoryIdx(-1);
    },
    [promptPath],
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx =
          historyIdx === -1
            ? cmdHistory.length - 1
            : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= cmdHistory.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(newIdx);
          setInput(cmdHistory[newIdx]);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const partial = input.trimStart();
      // First try filename completion under cwd
      const fileMatches = fs.complete(partial);
      if (fileMatches.length === 1) {
        setInput(input.replace(partial, fileMatches[0]));
      } else if (fileMatches.length > 1) {
        // Show ambiguous matches as output
        const prompt = promptPath || "~";
        setHistory((prev) => [
          ...prev,
          { type: "input", text: `${prompt} $ ${input}` },
          { type: "output", text: fileMatches.join("  ") },
        ]);
        setInput("");
      } else {
        // Fall back to command completion
        const cmdPartial = partial.split(/\s+/)[0];
        const cmdMatches = Object.keys(commands).filter((c) =>
          c.startsWith(cmdPartial),
        );
        if (cmdMatches.length === 1) {
          setInput(cmdMatches[0] + " ");
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-indigo-400 shadow-lg transition-all hover:bg-slate-700 hover:scale-105"
        aria-label={isOpen ? "Close terminal" : "Open terminal"}
      >
        <svg
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      </button>

      {/* Terminal window */}
      {isOpen && (
        <div class="fixed bottom-24 right-6 z-50 w-[min(90vw,550px)] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
          {/* Title bar */}
          <div class="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
            <div class="flex gap-1.5">
              <button
                onClick={() => setIsOpen(false)}
                class="h-3 w-3 rounded-full bg-red-500 transition-colors hover:bg-red-400"
                aria-label="Close terminal"
              />
              <div class="h-3 w-3 rounded-full bg-yellow-500" />
              <div class="h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <span class="ml-2 font-mono text-xs text-slate-500">
              terminal — phnthnhnm
            </span>
          </div>

          {/* Output area */}
          <div
            ref={outputRef}
            onClick={focusInput}
            class="h-87.5 overflow-y-auto p-4 font-mono text-sm leading-relaxed cursor-text"
          >
            {/* Banner */}
            <div class="mb-2 whitespace-pre text-indigo-400 text-xs leading-tight select-none">
              {banner}
            </div>

            {/* History */}
            {history.map((line, i) => (
              <div key={i} class="mb-1">
                {line.type === "input" && (
                  <span class="text-emerald-400">{line.text}</span>
                )}
                {line.type === "output" && (
                  <pre class="whitespace-pre-wrap text-slate-300 my-1">
                    {line.text}
                  </pre>
                )}
                {line.type === "error" && (
                  <span class="text-red-400">{line.text}</span>
                )}
              </div>
            ))}

            {/* Input line */}
            <div class="flex items-center">
              <span class="mr-2 text-emerald-400 select-none">
                {promptPath || "~"} $
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onInput={(e) =>
                  setInput((e.target as HTMLInputElement).value)
                }
                onKeyDown={handleKeyDown}
                class="flex-1 border-none bg-transparent font-mono text-sm text-slate-200 outline-none caret-indigo-400"
                spellcheck={false}
                autocomplete="off"
                aria-label="Terminal input"
              />
              <span class="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-indigo-400 select-none" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
