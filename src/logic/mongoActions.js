const { ipcMain, dialog } = require("electron");
const Docker = require("dockerode");
const docker = new Docker();
const { execFile } = require("child_process");
const path = require("path");

const dockerFile = {
  Image: "mongo:6",
  name: "MONGO_DATABASE",
  Env: ["MONGO_INITDB_ROOT_USERNAME=root", "MONGO_INITDB_ROOT_PASSWORD=root"],
  ExposedPorts: {
    "27017/tcp": {},
  },
  HostConfig: {
    PortBindings: {
      "27017/tcp": [{ HostPort: "27017" }],
    },
    Binds: ["mongo_data:/data/db"],
  },
};

// Ensure the MongoDB Docker image is available locally, pull it if not
async function ensureImage() {
  const images = await docker.listImages(); // Get list of Docker images
  const exists = images.some(
    (img) => img.RepoTags && img.RepoTags.includes("mongo:6")
  );

  if (!exists) {
    console.log("Pulling MongoDB image...");
    await new Promise((resolve, reject) => {
      docker.pull("mongo:6", (err, stream) => {
        if (err) return reject(err); // Handle errors while pulling
        docker.modem.followProgress(
          stream,
          () => resolve(), // Resolve promise when pull is complete
          () => {} // No-op on progress
        );
      });
    });
    console.log("MongoDB image pulled successfully.");
  } else {
    console.log("MongoDB image already exists.");
  }
}

// Check if the MongoDB container already exists
async function containerExists() {
  const containers = await docker.listContainers({ all: true }); // Get all containers
  return containers.some((c) => c.Names.includes("/MONGO_DATABASE")); // Check by name
}

// Start the MongoDB container
async function startMongoContainer() {
  try {
    const container = docker.getContainer("MONGO_DATABASE"); // Get container by name
    await container.start(); // Start the container
    console.log("MongoDB container started.");
  } catch (err) {
    if (err.statusCode === 409) {
      // Container already running
      console.log("Container already running.");
    } else {
      // Show error dialog
      dialog.showMessageBox({
        type: "info",
        title: "Alert",
        message: "Error starting container: " + (err.message || err),
        buttons: ["OK"],
      });
    }
  }
}

// Stop the MongoDB container
async function stopMongoContainer() {
  try {
    const container = docker.getContainer("MONGO_DATABASE");
    await container.stop(); // Stop the container
    console.log("MongoDB container stopped.");
  } catch (err) {
    // Show error dialog
    dialog.showMessageBox({
      type: "info",
      title: "Alert",
      message: "Error stopping container: " + (err.message || err),
      buttons: ["OK"],
    });
  }
}

// Check if the MongoDB container is currently running
async function checkIfContainerIsRunning() {
  try {
    const container = docker.getContainer("MONGO_DATABASE");
    const state = await container.inspect(); // Inspect container state
    return state.State.Running; // Return true if running
  } catch (err) {
    // Show error dialog and return false
    dialog.showMessageBox({
      type: "info",
      title: "Alert",
      message: "Error checking container state: " + (err.message || err),
      buttons: ["OK"],
    });
    return false;
  }
}

// Initialize MongoDB container: pull image and create container if not exists
async function initMongoContainer() {
  await ensureImage(); // Ensure image is available

  const exists = await containerExists(); // Check if container already exists
  if (!exists) {
    await docker.createContainer(dockerFile); // Create container
    console.log("MongoDB container created.");
  } else {
    console.log("MongoDB container already exists.");
  }
}

// Set up IPC event listeners for Electron buttons
function buttonFunctionsMongo() {
  // Initialize container when app starts
  initMongoContainer()
    .then(() => {
      console.log("MongoDB container ready.");
    })
    .catch((err) => {
      console.error("Init failed:", err);
    });

  // Handle MongoDB start/stop button click
  ipcMain.on("startDatabaseBtnMongo", async () => {
    console.log("Try to start/stop MongoDB");

    const isRunning = await checkIfContainerIsRunning(); // Check current state

    if (isRunning) {
      await stopMongoContainer(); // Stop if running
    } else {
      await startMongoContainer(); // Start if not running
    }
  });

  // Launch Beekeeper Studio (MongoDB GUI client)
  ipcMain.on("startBeekeper", async () => {
    const exePath = path.resolve(
      __dirname,
      "../utils/BeekeeperStudioPortable.exe" // Path to Beekeeper executable
    );

    execFile(exePath, (error, stdout, stderr) => {
      if (error) {
        console.error("Error launching Beekeeper:", error);
        return;
      }
      console.log("Beekeeper output:", stdout); // Log output if successful
    });
  });

  // Check if MongoDB container is running and respond to renderer process
  ipcMain.on("checkIfContainerIsRunningMongo", async (event) => {
    const isRunning = await checkIfContainerIsRunning();
    event.sender.send("checkIfContainerIsRunningMongoResponse", isRunning); // Send result back
  });
}

// Export the function to be used in other parts of the application
module.exports = buttonFunctionsMongo;
