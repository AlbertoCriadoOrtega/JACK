const { ipcMain, dialog } = require("electron");
const Docker = require("dockerode");
const docker = new Docker();
const { execFile } = require("child_process");
const path = require("path");

const dockerFile = {
  Image: "postgres:15",
  name: "POSTGRES_DATABASE",
  Env: ["POSTGRES_USER=admin", "POSTGRES_PASSWORD=admin"],
  ExposedPorts: {
    "5432/tcp": {},
  },
  HostConfig: {
    PortBindings: {
      "5432/tcp": [{ HostPort: "5432" }],
    },
    Binds: ["postgres_data:/var/lib/postgresql/data"],
  },
};

// Ensure PostgreSQL image (postgres:15) exists locally
async function ensureImage() {
  const images = await docker.listImages(); // List all Docker images
  const exists = images.some(
    (img) => img.RepoTags && img.RepoTags.includes("postgres:15")
  );

  if (!exists) {
    // Pull image if it doesn't exist
    console.log("Pulling PostgreSQL image...");
    await new Promise((resolve, reject) => {
      docker.pull("postgres:15", (err, stream) => {
        if (err) return reject(err); // Handle error
        docker.modem.followProgress(
          stream,
          () => resolve(), // Resolve when done
          () => {} // Ignore progress
        );
      });
    });
    console.log("PostgreSQL image pulled successfully.");
  } else {
    console.log("PostgreSQL image already exists.");
  }
}

// Check if container with name "POSTGRES_DATABASE" exists
async function containerExists() {
  const containers = await docker.listContainers({ all: true }); // List all containers
  return containers.some((c) => c.Names.includes("/POSTGRES_DATABASE"));
}

// Start PostgreSQL container and grant superuser access to admin
async function startPostgresContainer() {
  try {
    const container = docker.getContainer("POSTGRES_DATABASE");
    await container.start(); // Start the container
    await grantAccess(); // Grant superuser access to 'admin'
  } catch (err) {
    if (err.statusCode === 409) {
      console.log("Container already running.");
    } else {
      // Show error dialog if start fails
      dialog.showMessageBox({
        type: "info",
        title: "Alert",
        message: "Error starting container: " + (err.message || err),
        buttons: ["OK"],
      });
    }
  }
}

// Stop PostgreSQL container
async function stopPostgresContainer() {
  try {
    const container = docker.getContainer("POSTGRES_DATABASE");
    await container.stop(); // Stop container
  } catch (err) {
    // Show error dialog if stop fails
    dialog.showMessageBox({
      type: "info",
      title: "Alert",
      message: "Error stopping container: " + (err.message || err),
      buttons: ["OK"],
    });
  }
}

// Check if PostgreSQL container is running
async function checkIfContainerIsRunning() {
  try {
    const container = docker.getContainer("POSTGRES_DATABASE");
    const state = await container.inspect(); // Inspect container status
    return state.State.Running; // Return true if running
  } catch (err) {
    // Show error dialog if check fails
    dialog.showMessageBox({
      type: "info",
      title: "Alert",
      message: "Error checking container state: " + (err.message || err),
      buttons: ["OK"],
    });
    return false;
  }
}

// Initialize the PostgreSQL container: pull image and create if needed
async function initPostgresContainer() {
  await ensureImage(); // Make sure image is available

  const exists = await containerExists(); // Check if container exists
  if (!exists) {
    await docker.createContainer(dockerFile); // Create new container
    console.log("PostgreSQL container created.");
  } else {
    console.log("PostgreSQL container already exists.");
  }
}

// Grant superuser privileges to the 'admin' user inside the PostgreSQL container
async function grantAccess() {
  const container = docker.getContainer("POSTGRES_DATABASE");

  const sql = `
    ALTER USER admin WITH SUPERUSER;
  `;

  const exec = await container.exec({
    Cmd: ["psql", "-U", "admin", "-c", sql], // Execute SQL as admin
    Env: ["PGPASSWORD=admin"], // Set password for authentication
    AttachStdout: true,
    AttachStderr: true,
  });

  const stream = await exec.start({}); // Start the command

  // Collect output and resolve when done
  return new Promise((resolve, reject) => {
    let output = "";
    stream.on("data", (chunk) => (output += chunk.toString()));
    stream.on("end", () => resolve(output));
    stream.on("error", reject);
  });
}

// Setup all button event handlers for PostgreSQL
function buttonFunctionsPostgres() {
  // Initialize container on app start
  initPostgresContainer()
    .then(() => {
      console.log("PostgreSQL container ready.");
    })
    .catch((err) => {
      console.error("Init failed:", err);
    });

  // Start/Stop PostgreSQL container on button click
  ipcMain.on("startDatabaseBtnPost", async () => {
    console.log("Try to start/stop PostgreSQL");

    const isRunning = await checkIfContainerIsRunning();

    if (isRunning) {
      await stopPostgresContainer(); // Stop if running
    } else {
      await startPostgresContainer(); // Start if not running
    }
  });

  // Launch Beekeeper Studio (PostgreSQL GUI tool)
  ipcMain.on("startBeekeper", async () => {
    const exePath = path.resolve(
      __dirname,
      "../utils/BeekeeperStudioPortable.exe"
    );

    execFile(exePath, (error, stdout, stderr) => {
      if (error) {
        console.error("Error launching Beekeeper:", error);
        return;
      }
      console.log("Beekeeper output:", stdout);
    });
  });

  // Check if PostgreSQL container is running and send result back to renderer
  ipcMain.on("checkIfContainerIsRunningPostgre", async (event) => {
    const isRunning = await checkIfContainerIsRunning();
    event.sender.send("checkIfContainerIsRunningPostgreResponse", isRunning);
  });
}

// Export the main function for use in other parts of the app
module.exports = buttonFunctionsPostgres;
