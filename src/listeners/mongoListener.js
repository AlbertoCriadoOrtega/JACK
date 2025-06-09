startDatabaseBtnMongo.addEventListener("click", () => {
  ipc.send("startDatabaseBtnMongo");
  if (startDatabaseBtnMongo.innerText == "Start") {
    startDatabaseBtnMongo.innerText = "Stop";
  } else {
    startDatabaseBtnMongo.innerText = "Start";
  }
});

function checkIfContainerIsRunning() {
  ipc.send("checkIfContainerIsRunningMongo");

  ipc.on("checkIfContainerIsRunningMongoResponse", (event, isRunning) => {
    if (isRunning) {
      startDatabaseBtnMongo.innerText = "Stop";
    }
  });
}

checkIfContainerIsRunning();
