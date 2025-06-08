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
