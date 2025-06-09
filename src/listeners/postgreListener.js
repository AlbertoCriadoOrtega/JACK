startDatabaseBtnPost.addEventListener("click", () => {
  ipc.send("startDatabaseBtnPost");
  if (startDatabaseBtnPost.innerText == "Start") {
    startDatabaseBtnPost.innerText = "Stop";
  } else {
    startDatabaseBtnPost.innerText = "Start";
  }
});

beekeperBtn.addEventListener("click", () => {
  ipc.send("startBeekeper");
});

function checkIfContainerIsRunning() {
  ipc.send("checkIfContainerIsRunningPostgre");

  ipc.on("checkIfContainerIsRunningPostgreResponse", (event, isRunning) => {
    if (isRunning) {
      startDatabaseBtnPost.innerText = "Stop";
    }
  });
}

checkIfContainerIsRunning();
