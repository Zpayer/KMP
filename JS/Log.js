
const STYLES = {
    info: {
        badge: "background:#3b82f6; color:#fff; padding:2px 7px; border-radius:4px; font-weight:bold;",
        tag: "background:#1e3a5f; color:#93c5fd; padding:2px 7px; border-radius:4px;",
        text: "color:#e2e8f0;",
        dot: "🔵",
    },
    debug: {
        badge: "background:#8b5cf6; color:#fff; padding:2px 7px; border-radius:4px; font-weight:bold;",
        tag: "background:#2e1065; color:#c4b5fd; padding:2px 7px; border-radius:4px;",
        text: "color:#cbd5e1;",
        dot: "🟣",
    },
    warn: {
        badge: "background:#f59e0b; color:#000; padding:2px 7px; border-radius:4px; font-weight:bold;",
        tag: "background:#451a03; color:#fcd34d; padding:2px 7px; border-radius:4px;",
        text: "color:#fef3c7;",
        dot: "🟡",
    },
    error: {
        badge: "background:#ef4444; color:#fff; padding:2px 7px; border-radius:4px; font-weight:bold;",
        tag: "background:#450a0a; color:#fca5a5; padding:2px 7px; border-radius:4px;",
        text: "color:#fee2e2;",
        dot: "🔴",
    },
    success: {
        badge: "background:#22c55e; color:#000; padding:2px 7px; border-radius:4px; font-weight:bold;",
        tag: "background:#052e16; color:#86efac; padding:2px 7px; border-radius:4px;",
        text: "color:#dcfce7;",
        dot: "🟢",
    },
};

let _domPanel = null;

function _domAppend(level, tag, args) {
    if (!_domPanel?.isConnected) return;
    const s = STYLES[level];
    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap:6px; align-items:baseline; padding:2px 0; font-family:monospace; font-size:12px;";

    const badge = document.createElement("span");
    badge.textContent = `${s.dot} ${level.toUpperCase()}`;
    badge.style.cssText = s.badge + " flex-shrink:0;";

    const tagEl = document.createElement("span");
    tagEl.textContent = tag;
    tagEl.style.cssText = s.tag + " flex-shrink:0;";

    const body = document.createElement("span");
    body.style.cssText = s.text + " white-space:pre-wrap; word-break:break-all;";
    body.textContent = args.map(a =>
        typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
    ).join(" ");

    row.append(badge, tagEl, body);
    _domPanel.appendChild(row);
    _domPanel.scrollTop = _domPanel.scrollHeight;
}

function _print(level, tag, args) {
    const s = STYLES[level];
    const fn = level === "error" ? console.error
        : level === "warn" ? console.warn
            : level === "debug" ? console.debug
                : console.log;

    const plain = args.filter(a => typeof a !== "object");
    const objs = args.filter(a => typeof a === "object");

    fn(
        `%c ${level.toUpperCase()} %c ${tag} %c ${plain.join(" ")}`,
        s.badge, s.tag, s.text,
        ...objs
    );

    _domAppend(level, tag, args);
}

const log = {
    setPanel(el) { _domPanel = el; },

    info(...args) { _print("info", args[0] ?? "", args.slice(1)); },
    debug(...args) { _print("debug", args[0] ?? "", args.slice(1)); },
    warn(...args) { _print("warn", args[0] ?? "", args.slice(1)); },
    error(...args) { _print("error", args[0] ?? "", args.slice(1)); },
    success(...args) { _print("success", args[0] ?? "", args.slice(1)); },
};

export default log;
