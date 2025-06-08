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

async function ensureImage() {
  const images = await docker.listImages();
  const exists = images.some(
    (img) => img.RepoTags && img.RepoTags.includes("postgres:15")
  );

  if (!exists) {
    console.log("Pulling PostgreSQL image...");
    await new Promise((resolve, reject) => {
      docker.pull("postgres:15", (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(
          stream,
          () => resolve(),
          () => {}
        );
      });
    });
    console.log("PostgreSQL image pulled successfully.");
  } else {
    console.log("PostgreSQL image already exists.");
  }
}

async function containerExists() {
  const containers = await docker.listContainers({ all: true });
  return containers.some((c) => c.Names.includes("/POSTGRES_DATABASE"));
}

async function startPostgresContainer() {
  try {
    const container = docker.getContainer("POSTGRES_DATABASE");
    await container.start();
    await grantAccess();
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

async function stopPostgresContainer() {
  try {
    const container = docker.getContainer("POSTGRES_DATABASE");
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
    const container = docker.getContainer("POSTGRES_DATABASE");
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

async function initPostgresContainer() {
  await ensureImage();

  const exists = await containerExists();
  if (!exists) {
    await docker.createContainer(dockerFile);
    console.log("PostgreSQL container created.");
  } else {
    console.log("PostgreSQL container already exists.");
  }
}

async function grantAccess() {
  const container = docker.getContainer("POSTGRES_DATABASE");

  const sql = `
    ALTER USER admin WITH SUPERUSER;
  `;

  const exec = await container.exec({
    Cmd: ["psql", "-U", "admin", "-c", sql],
    Env: ["PGPASSWORD=admin"],
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

function buttonFunctionsPostgres() {
  initPostgresContainer()
    .then(() => {
      console.log("PostgreSQL container ready.");
    })
    .catch((err) => {
      console.error("Init failed:", err);
    });

  ipcMain.on("startDatabaseBtnPost", async () => {
    console.log("Try to start/stop PostgreSQL");

    const isRunning = await checkIfContainerIsRunning();

    if (isRunning) {
      await stopPostgresContainer();
    } else {
      await startPostgresContainer();
    }
  });

  ipcMain.on("startBeekeper", async () => {
    const exePath = path.resolve(
      __dirname,
      "../utils/Beekeeper-Studio-5.2.10-portable.exe"
    );

    execFile(exePath, (error, stdout, stderr) => {
      if (error) {
        console.error("Error launching Beekeeper:", error);
        return;
      }
      console.log("Beekeeper output:", stdout);
    });
  });
}

module.exports = buttonFunctionsPostgres;
