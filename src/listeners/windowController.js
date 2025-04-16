minimizeBtn.addEventListener("click", () => {
  ipc.send("manualMinimize");
});
maximizeBtn.addEventListener("click", () => {
  ipc.send("manualMaximize");
});
closeBtn.addEventListener("click", () => {
  ipc.send("manualClose");
});
