startServerBtn.addEventListener("click", () => {
  ipc.send("startServer");
  if (startServerBtn.innerText == "Start") {
    startServerBtn.innerText = "Stop";
  } else {
    startServerBtn.innerText = "Start";
  }
});

openFolderBtn.addEventListener("click", () => {
  ipc.send("openFolderBtn");
});

function checkIfServerIsRunning() {
  ipc.send("checkIfJarRunning");

  ipc.on("checkIfJarRunningResponse", (event, isRunning) => {
    if (isRunning) {
      startServerBtn.innerText = "Stop";
    }
  });
}

checkIfServerIsRunning();
