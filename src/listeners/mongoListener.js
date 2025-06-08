startDatabaseBtnMongo.addEventListener("click", () => {
  ipc.send("startDatabaseBtnMongo");
  if (startDatabaseBtnMongo.innerText == "Start") {
    startDatabaseBtnMongo.innerText = "Stop";
  } else {
    startDatabaseBtnMongo.innerText = "Start";
  }
});

beekeperBtn.addEventListener("click", () => {
  ipc.send("startBeekeper");
});
