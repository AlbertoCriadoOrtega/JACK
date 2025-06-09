const { ipcMain, dialog } = require("electron");
const { spawn, exec } = require("child_process");
const path = require("path");
const kill = require("tree-kill");

// Store the reference to the running JAR process
let jarProcess = null;

// Flags to avoid duplicate dialog boxes or logs
let startedShown = false;
let errorShown = false;

// Utility function to check if the JAR process is still running
function isJarRunning() {
  if (!jarProcess) return false;

  try {
    // Attempt to send signal 0 to check if process exists
    process.kill(jarProcess.pid, 0);
    return true; // Process is running
  } catch {
    jarProcess = null;
    return false; // Process is not running
  }
}

// Main function to set up button and IPC logic
function buttonFunctionsServer() {
  // Handle "startServer" event from renderer
  ipcMain.on("startServer", () => {
    if (jarProcess) {
      // If the server is already running, stop it
      kill(jarProcess.pid, "SIGKILL", (err) => {
        if (err) console.error("Failed to kill process tree:", err);
      });

      // Reset state
      jarProcess = null;
      startedShown = false;
      errorShown = false;
      return;
    }

    // Define path to the JAR file
    const jarPath = path.join(__dirname, "..", "server", "Falcon.jar");

    // Define working directory where the JAR should be executed
    const workingDir = path.join(__dirname, "..", "server");

    // Start the Java process
    jarProcess = spawn("java", ["-jar", jarPath], { cwd: workingDir });

    // Handle process exit
    jarProcess.on("exit", (code, signal) => {
      // Reset state when the server stops
      jarProcess = null;
      startedShown = false;
      errorShown = false;
    });

    // Handle standard output (logs from the server)
    jarProcess.stdout.on("data", (data) => {
      if (!startedShown) {
        startedShown = true;
        // You can emit a message to the renderer process here if needed
      }
      console.log(`Server stdout: ${data.toString()}`);
    });

    // Handle standard error (server errors)
    jarProcess.stderr.on("data", (data) => {
      if (!errorShown) {
        errorShown = true;

        // Show an error dialog with the message
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

  // Check if the server process is running
  ipcMain.on("checkIfJarRunning", (event) => {
    event.sender.send("checkIfJarRunningResponse", isJarRunning());
  });

  // Open the folder containing HTML pages or resources
  ipcMain.on("openFolderBtn", () => {
    exec("explorer.exe " + path.join(__dirname, "..", "server/pages")); // Windows-only
  });
}

// Export the function to be used in the main process
module.exports = buttonFunctionsServer;
