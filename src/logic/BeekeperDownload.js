const download = require("download");
const path = require("path");
const fs = require("fs").promises;

const url =
  "https://github.com/beekeeper-studio/beekeeper-studio/releases/download/v5.2.12/Beekeeper-Studio-5.2.12-portable.exe";

async function beekeeperDownload() {
  const destDir = path.resolve(__dirname, "../utils/");
  const filePath = path.join(destDir, "BeekeeperStudioPortable.exe");

  try {
    // Check if file already exists
    await fs.access(filePath);
    console.log("File already exists:", filePath);
  } catch {
    // File does not exist, so download it
    try {
      await download(url, destDir, {
        filename: "BeekeeperStudioPortable.exe",
      });
      console.log("Download complete!");
    } catch (error) {
      console.error("Download failed:", error.message);
    }
  }
}

module.exports = beekeeperDownload;
