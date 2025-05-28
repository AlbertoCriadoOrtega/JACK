startDatabaseBtn.addEventListener("click", () => {
  ipc.send("startDatabaseBtn");
});

beekeperBtn.addEventListener("click", () => {
  ipc.send("startBeekeper");
});
