const { getDrive } = require("./_drive");

module.exports = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;
    if (!categoryId) return res.status(400).json({ error: "categoryId required" });

    const drive = await getDrive();
    const r = await drive.files.list({
      q: `'${categoryId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType='application/pdf')`,
      orderBy: "modifiedTime desc",
      fields: "files(id,name,mimeType,thumbnailLink,webViewLink,modifiedTime,imageMediaMetadata(width,height))",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 200,
    });

    const data = (r.data.files || []).map((f) => ({
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
    }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
