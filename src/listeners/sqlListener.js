startDatabaseBtn.addEventListener("click", () => {
  ipc.send("startDatabaseBtn");
  if (startDatabaseBtn.innerText == "Start") {
    startDatabaseBtn.innerText = "Stop";
  } else {
    startDatabaseBtn.innerText = "Start";
  }
});

beekeperBtn.addEventListener("click", () => {
  ipc.send("startBeekeper");
});

function checkIfContainerIsRunning() {
  ipc.send("checkIfContainerIsRunningSql");

  ipc.on("checkIfContainerIsRunningSqlResponse", (event, isRunning) => {
    if (isRunning) {
      startDatabaseBtn.innerText = "Stop";
    }
  });
}

checkIfContainerIsRunning();
