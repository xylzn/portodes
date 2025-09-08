// node test-list.js  (CommonJS)
const { google } = require("googleapis");
require("dotenv").config();

(async function main() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json",
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth: await auth.getClient() });

    const q = `'${process.env.ROOT_FOLDER_ID}' in parents and trashed = false`;
    const res = await drive.files.list({
      q,
      fields: "files(id,name,mimeType)",
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    console.log("Isi root folder:");
    for (const f of (res.data.files || [])) {
      console.log(`- ${f.name} [${f.mimeType}] ${f.id}`);
    }
    if (!res.data.files || res.data.files.length === 0) {
      console.log("(kosong) — cek apakah foldernya berisi subfolder/file)");
    }
  } catch (e) {
    console.error("ERROR:", e.response?.data || e.message);
    process.exit(1);
  }
})();
