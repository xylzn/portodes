const { getDrive } = require("./_drive");

module.exports = async (req, res) => {
  try {
    const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID;
    if (!ROOT_FOLDER_ID) {
      return res.status(500).json({ error: "Missing ROOT_FOLDER_ID env" });
    }
    const drive = await getDrive();
    const r = await drive.files.list({
      q: `'${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 100,
    });
    res.json(r.data.files || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

