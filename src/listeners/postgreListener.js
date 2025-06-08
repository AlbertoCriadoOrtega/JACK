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
