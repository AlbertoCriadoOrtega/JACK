startServerBtn.addEventListener("click", () => {
  console.log("Start server");

  ipc.send("startServer");
});
