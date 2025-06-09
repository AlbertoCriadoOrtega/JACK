const download = require("download");
const path = require("path");

const url =
  "https://github.com/beekeeper-studio/beekeeper-studio/releases/download/v5.2.12/Beekeeper-Studio-5.2.12-portable.exe";

function beekeeperDownload() {
  (async () => {
    try {
      await download(url, path.resolve(__dirname, "../utils/"), {
        filename: "BeekeeperStudioPortable.exe",
      });
      console.log("Download complete!");
    } catch (error) {
      console.error("Download failed:", error.message);
    }
  })();

  console.log(path.resolve(__dirname));
}

module.exports = beekeeperDownload;
