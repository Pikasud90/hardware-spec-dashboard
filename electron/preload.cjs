"use strict";

/**
 * Minimal, read-only bridge. The dashboard is entirely offline and needs no
 * privileged capability beyond knowing that it is running inside the desktop
 * shell, so nothing mutable is exposed to the renderer.
 */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("hsd", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
