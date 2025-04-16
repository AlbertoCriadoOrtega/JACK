mongoBtn.addEventListener("click", () => {
  ipc.send("changePageMongo");
});

sqlBtn.addEventListener("click", () => {
  ipc.send("changePageSql");
});

homeBtn.addEventListener("click", () => {
  ipc.send("changePageHome");
});

postgresBtn.addEventListener("click", () => {
  ipc.send("changePagePostgre");
});

httpServer.addEventListener("click", () => {
  ipc.send("changePageServer");
});
