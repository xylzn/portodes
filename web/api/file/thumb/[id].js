const { getDrive } = require("../../_drive");

module.exports = async (req, res) => {
  try {
    const fileId = req.query.id;
    if (!fileId) return res.status(400).json({ error: "id required" });

    const drive = await getDrive();
    const meta = await drive.files
      .get({ fileId, fields: "mimeType", supportsAllDrives: true })
      .then((r) => r.data);
    const stream = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );
    res.setHeader("Content-Type", meta.mimeType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=86400");
    stream.data.on("error", () => res.status(502).end());
    stream.data.pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

