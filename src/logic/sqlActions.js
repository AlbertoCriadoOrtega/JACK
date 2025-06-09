const { ipcMain, dialog } = require("electron");
const Docker = require("dockerode");
const docker = new Docker();
const { execFile } = require("child_process");
const path = require("path");

const dockerFile = {
  Image: "mysql:8.0",
  name: "SQL_DATABASE",
  Env: [
    "MYSQL_ROOT_PASSWORD=admin",
    "MYSQL_USER=admin",
    "MYSQL_PASSWORD=admin",
    "MYSQL_ROOT_HOST=%",
  ],
  ExposedPorts: {
    "3306/tcp": {},
  },
  HostConfig: {
    PortBindings: {
      "3306/tcp": [{ HostPort: "3306" }],
    },
    Binds: ["mysql_data:/var/lib/mysql"],
  },
};

async function ensureImage() {
  const images = await docker.listImages();
  const exists = images.some(
    (img) => img.RepoTags && img.RepoTags.includes("mysql:8.0")
  );

  if (!exists) {
    console.log("Pulling MySQL image...");
    await new Promise((resolve, reject) => {
      docker.pull("mysql:8.0", (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(
          stream,
          () => resolve(),
          () => {}
        );
      });
    });
    console.log("MySQL image pulled successfully.");
  } else {
    console.log("MySQL image already exists.");
  }
}

async function containerExists() {
  const containers = await docker.listContainers({ all: true });
  return containers.some((c) => c.Names.includes("/SQL_DATABASE"));
}

async function startMysqlContainer() {
  try {
    const container = docker.getContainer("SQL_DATABASE");
    await container.start();
    await grantAccess();
  } catch (err) {
    if (err.statusCode === 409) {
      // Container already started - ignore or log if needed
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

async function stopMysqlContainer() {
  try {
    const container = docker.getContainer("SQL_DATABASE");
    await container.stop();
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
    const container = docker.getContainer("SQL_DATABASE");
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

async function initMysqlContainer() {
  await ensureImage();

  const exists = await containerExists();
  if (!exists) {
    await docker.createContainer(dockerFile);
    console.log("MySQL container created.");
  } else {
    console.log("MySQL container already exists.");
  }
}

async function grantAccess() {
  const container = docker.getContainer("SQL_DATABASE");

  const sql = `
    GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' IDENTIFIED BY 'admin' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
  `;

  const exec = await container.exec({
    Cmd: ["mysql", "-u", "admin", "-padmin", "-e", sql],
    AttachStdout: true,
    AttachStderr: true,
  });

  const stream = await exec.start({});

  return new Promise((resolve, reject) => {
    let output = "";
    stream.on("data", (chunk) => (output += chunk.toString()));
    stream.on("end", () => resolve(output));
    stream.on("error", reject);
  });
}

function buttonFunctionsSQL() {
  // Initialize image and container BEFORE any button press
  initMysqlContainer()
    .then(() => {
      console.log("MySQL container ready.");
    })
    .catch((err) => {
      console.error("Init failed:", err);
    });

  // Button event handler only starts/stops container
  ipcMain.on("startDatabaseBtn", async () => {
    console.log("Try to start/stop database");

    const isRunning = await checkIfContainerIsRunning();

    if (isRunning) {
      await stopMysqlContainer();
    } else {
      await startMysqlContainer();
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

  ipcMain.on("checkIfContainerIsRunningSql", async (event) => {
    const isRunning = await checkIfContainerIsRunning();
    event.sender.send("checkIfContainerIsRunningSqlResponse", isRunning);
  });
}

module.exports = buttonFunctionsSQL;
