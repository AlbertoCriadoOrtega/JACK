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

async function ensureImage() {
  const images = await docker.listImages();
  const exists = images.some(
    (img) => img.RepoTags && img.RepoTags.includes("mongo:6")
  );

  if (!exists) {
    console.log("Pulling MongoDB image...");
    await new Promise((resolve, reject) => {
      docker.pull("mongo:6", (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(
          stream,
          () => resolve(),
          () => {}
        );
      });
    });
    console.log("MongoDB image pulled successfully.");
  } else {
    console.log("MongoDB image already exists.");
  }
}

async function containerExists() {
  const containers = await docker.listContainers({ all: true });
  return containers.some((c) => c.Names.includes("/MONGO_DATABASE"));
}

async function startMongoContainer() {
  try {
    const container = docker.getContainer("MONGO_DATABASE");
    await container.start();
    console.log("MongoDB container started.");
  } catch (err) {
    if (err.statusCode === 409) {
      console.log("Container already running.");
    } else {
      dialog.showMessageBox({
        type: "info",
        title: "Alert",
        message: "Error starting container: " + (err.message || err),
        buttons: ["OK"],
      });
    }
  }
}

async function stopMongoContainer() {
  try {
    const container = docker.getContainer("MONGO_DATABASE");
    await container.stop();
    console.log("MongoDB container stopped.");
  } catch (err) {
    dialog.showMessageBox({
      type: "info",
      title: "Alert",
      message: "Error stopping container: " + (err.message || err),
      buttons: ["OK"],
    });
  }
}

async function checkIfContainerIsRunning() {
  try {
    const container = docker.getContainer("MONGO_DATABASE");
    const state = await container.inspect();
    return state.State.Running;
  } catch (err) {
    dialog.showMessageBox({
      type: "info",
      title: "Alert",
      message: "Error checking container state: " + (err.message || err),
      buttons: ["OK"],
    });
    return false;
  }
}

async function initMongoContainer() {
  await ensureImage();

  const exists = await containerExists();
  if (!exists) {
    await docker.createContainer(dockerFile);
    console.log("MongoDB container created.");
  } else {
    console.log("MongoDB container already exists.");
  }
}

function buttonFunctionsMongo() {
  initMongoContainer()
    .then(() => {
      console.log("MongoDB container ready.");
    })
    .catch((err) => {
      console.error("Init failed:", err);
    });

  ipcMain.on("startDatabaseBtnMongo", async () => {
    console.log("Try to start/stop MongoDB");

    const isRunning = await checkIfContainerIsRunning();

    if (isRunning) {
      await stopMongoContainer();
    } else {
      await startMongoContainer();
    }
  });

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

  ipcMain.on("checkIfContainerIsRunningMongo", async (event) => {
    const isRunning = await checkIfContainerIsRunning();
    event.sender.send("checkIfContainerIsRunningMongoResponse", isRunning);
  });
}

module.exports = buttonFunctionsMongo;
