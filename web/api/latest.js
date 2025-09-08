const { getDrive } = require("./_drive");

module.exports = async (req, res) => {
  try {
    const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID;
    if (!ROOT_FOLDER_ID) {
      return res.status(500).json({ error: "Missing ROOT_FOLDER_ID env" });
    }
    const limit = Number(req.query.limit || 20);
    const drive = await getDrive();

    // List categories (subfolders of ROOT)
    const cats = await drive.files
      .list({
        q: `'${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id,name)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 100,
      })
      .then((r) => r.data.files || []);

    const perCat = Math.max(5, Math.ceil(limit / Math.max(1, cats.length)));

    const chunks = await Promise.all(
      cats.map(async (cat) => {
        const r = await drive.files.list({
          q: `'${cat.id}' in parents and trashed=false and (mimeType contains 'image/' or mimeType='application/pdf')`,
          orderBy: "modifiedTime desc",
          fields:
            "files(id,name,mimeType,thumbnailLink,webViewLink,modifiedTime,imageMediaMetadata(width,height))",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          pageSize: perCat,
        });
        return (r.data.files || []).map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          width: f.imageMediaMetadata?.width || null,
          height: f.imageMediaMetadata?.height || null,
          preview: `https://drive.google.com/file/d/${f.id}/preview`,
          image: `/api/file/image/${f.id}`,
          view: f.webViewLink,
          thumb: f.thumbnailLink || null,
          modifiedTime: f.modifiedTime,
          category: cat,
        }));
      })
    );

    const all = chunks
      .flat()
      .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime))
      .slice(0, limit);

    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
