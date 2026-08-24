// @ts-check
"use strict";

/**
 * Electron main process for Hardware Spec Dashboard.
 *
 * The renderer payload is the Next.js static export in `out/`. Rather than
 * loading it over `file://` (which breaks Next's absolute `/_next/...` asset
 * URLs), we register a privileged `app://` scheme and resolve requests against
 * the export directory. That keeps the exact same bundle working in the
 * browser, on a static host, and inside the desktop app.
 */

const { app, BrowserWindow, protocol, net, shell, Menu, nativeTheme } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const SCHEME = "app";
const APP_ORIGIN = `${SCHEME}://dashboard`;
const OUT_DIR = path.join(__dirname, "..", "out");

/** Set by `npm run electron:dev` to point at the live Next dev server. */
const DEV_SERVER_URL = process.env.HSD_DEV_SERVER || "";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self' app:",
  // Next's static export inlines its hydration bootstrap, so inline scripts
  // must be permitted. Remote origins remain blocked entirely.
  "script-src 'self' app: 'unsafe-inline'",
  "style-src 'self' app: 'unsafe-inline'",
  "img-src 'self' app: data: blob:",
  "font-src 'self' app: data:",
  "connect-src 'self' app:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

/**
 * Map an incoming `app://` pathname onto a real file inside `out/`.
 * Returns null when the request escapes the export root or matches nothing.
 * @param {string} pathname
 * @returns {string | null}
 */
function resolveExportPath(pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.startsWith("/")) rel = rel.slice(1);

  const candidates = [];
  if (rel === "" || rel.endsWith("/")) {
    candidates.push(path.join(rel, "index.html"));
  } else if (path.extname(rel) === "") {
    candidates.push(path.join(rel, "index.html"), `${rel}.html`);
  } else {
    candidates.push(rel);
  }
  // Client-side routes that were never pre-rendered still get a shell.
  candidates.push("404.html", "index.html");

  for (const candidate of candidates) {
    const absolute = path.resolve(OUT_DIR, candidate);
    // Path-traversal guard: the resolved file must stay under OUT_DIR.
    if (!absolute.startsWith(path.resolve(OUT_DIR) + path.sep)) continue;
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return absolute;
  }
  return null;
}

function registerAppProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const { pathname } = new URL(request.url);
    const filePath = resolveExportPath(pathname);
    if (!filePath) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain" },
      });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Project Repository",
          click: () => {
            void shell.openExternal("https://github.com/Pikasud90/hardware-spec-dashboard");
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1560,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#05070d",
    show: false,
    autoHideMenuBar: process.platform !== "darwin",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // External links open in the user's real browser, never in-app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  // Block any navigation away from the bundled application origin.
  win.webContents.on("will-navigate", (event, targetUrl) => {
    const allowed = DEV_SERVER_URL || APP_ORIGIN;
    if (!targetUrl.startsWith(allowed)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(targetUrl)) void shell.openExternal(targetUrl);
    }
  });

  if (DEV_SERVER_URL) {
    void win.loadURL(DEV_SERVER_URL);
  } else {
    void win.loadURL(`${APP_ORIGIN}/`);
  }

  return win;
}

app.whenReady().then(() => {
  nativeTheme.themeSource = "dark";
  registerAppProtocol();

  if (!DEV_SERVER_URL) {
    const { session } = require("electron");
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [CONTENT_SECURITY_POLICY],
        },
      });
    });
  }

  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
