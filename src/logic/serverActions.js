const { ipcMain, dialog } = require("electron");
const { spawn, exec } = require("child_process");
const path = require("path");
const kill = require("tree-kill");

let jarProcess = null;
let startedShown = false;
let errorShown = false;

function isJarRunning() {
  if (!jarProcess) return false;

  try {
    process.kill(jarProcess.pid, 0); // check if process exists
    return true;
  } catch {
    jarProcess = null;
    return false;
  }
}

function buttonFunctionsServer() {
  ipcMain.on("startServer", () => {
    if (jarProcess) {
      // Stop the process if already running
      kill(jarProcess.pid, "SIGKILL", (err) => {
        if (err) console.error("Failed to kill process tree:", err);
      });
      jarProcess = null;
      startedShown = false;
      errorShown = false;
      return;
    }

    // Path to the JAR file
    const jarPath = path.join(__dirname, "..", "server", "Falcon.jar");

    // Working directory: folder containing the JAR
    const workingDir = path.join(__dirname, "..", "server");

    jarProcess = spawn("java", ["-jar", jarPath], { cwd: workingDir });

    jarProcess.on("exit", (code, signal) => {
      jarProcess = null;
      startedShown = false;
      errorShown = false;
    });

    jarProcess.stdout.on("data", (data) => {
      if (!startedShown) {
        startedShown = true;
        // You can optionally send an event to renderer that server started
      }
      console.log(`Server stdout: ${data.toString()}`);
    });

    jarProcess.stderr.on("data", (data) => {
      if (!errorShown) {
        errorShown = true;
        dialog.showMessageBox({
          type: "error",
          title: "Error",
          message: "Error al iniciar el servidor:\n" + data.toString(),
          buttons: ["OK"],
        });
      }
      console.error(`Server stderr: ${data.toString()}`);
    });
  });

  ipcMain.on("checkIfJarRunning", (event) => {
    event.sender.send("checkIfJarRunningResponse", isJarRunning());
  });

  ipcMain.on("openFolderBtn", () => {
    exec("explorer.exe " + path.join(__dirname, "..", "server/pages"));
  });
}

module.exports = buttonFunctionsServer;
