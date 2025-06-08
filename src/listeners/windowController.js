minimizeBtn.addEventListener("click", () => {
  ipc.send("manualMinimize");
});
maximizeBtn.addEventListener("click", () => {
  ipc.send("manualMaximize");
});
closeBtn.addEventListener("click", (event) => {
  const userConfirmed = confirm("This will stop the server, are you sure?");

  if (!userConfirmed) {
    event.preventDefault();
  } else {
    ipc.send("manualClose");
  }
});
