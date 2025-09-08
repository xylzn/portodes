// node index.js — PUBLIC API ONLY (read-only)
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();

const app = express();

/* ===== middlewares ===== */
app.use(cors());
app.use(express.json());


/* ===== Google Drive helper (READ ONLY) ===== */
async function getDrive() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json",
    scopes: ["https://www.googleapis.com/auth/drive.readonly"], // read-only cukup
  });
  const client = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: client });
  // helper untuk akses token
  drive._authClient = client;
  return drive;
}

/* ===== API PUBLIK ===== */

// 1) List kategori (sub-folder dari ROOT)
app.get("/api/categories", async (req, res) => {
  try {
    const drive = await getDrive();
    const r = await drive.files.list({
      q: `'${process.env.ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 100,
    });
    res.json(r.data.files || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2) List karya per kategori (terbaru dulu)
app.get("/api/gallery", async (req, res) => {
  try {
    const { categoryId } = req.query;
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

    const data = (r.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      width: f.imageMediaMetadata?.width || null,
      height: f.imageMediaMetadata?.height || null,
      preview: `https://drive.google.com/file/d/${f.id}/preview`,
      view: f.webViewLink,
      thumb: f.thumbnailLink || null,
      modifiedTime: f.modifiedTime,
    }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3) “Paling Baru Dikerjakan” lintas kategori
app.get("/api/latest", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const drive = await getDrive();

    // ambil semua kategori
    const cats = await drive.files.list({
      q: `'${process.env.ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 100,
    }).then(r => r.data.files || []);

    const perCat = Math.max(5, Math.ceil(limit / Math.max(1, cats.length)));

    // ambil top N per kategori → gabung → sort global
    const chunks = await Promise.all(cats.map(async (cat) => {
      const r = await drive.files.list({
        q: `'${cat.id}' in parents and trashed=false and (mimeType contains 'image/' or mimeType='application/pdf')`,
        orderBy: "modifiedTime desc",
        fields: "files(id,name,mimeType,thumbnailLink,webViewLink,modifiedTime,imageMediaMetadata(width,height))",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: perCat,
      });
      return (r.data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        width: f.imageMediaMetadata?.width || null,
        height: f.imageMediaMetadata?.height || null,
        preview: `https://drive.google.com/file/d/${f.id}/preview`,
        view: f.webViewLink,
        thumb: f.thumbnailLink || null,
        modifiedTime: f.modifiedTime,
        category: cat,
      }));
    }));

    const all = chunks.flat()
      .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime))
      .slice(0, limit);

    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3b) Proxy thumbnail/image supaya dapat diakses publik via server
app.get("/api/file/thumb/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const drive = await getDrive();
    const meta = await drive.files.get({ fileId, fields: "mimeType", supportsAllDrives: true }).then(r => r.data);
    const stream = await drive.files.get({ fileId, alt: "media", supportsAllDrives: true }, { responseType: "stream" });
    res.setHeader("Content-Type", meta.mimeType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=86400");
    stream.data.on("error", () => res.status(502).end());
    stream.data.pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/file/image/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const drive = await getDrive();
    const meta = await drive.files.get({ fileId, fields: "mimeType", supportsAllDrives: true }).then(r => r.data);
    const stream = await drive.files.get({ fileId, alt: "media", supportsAllDrives: true }, { responseType: "stream" });
    res.setHeader("Content-Type", meta.mimeType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600");
    stream.data.on("error", () => res.status(502).end());
    stream.data.pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4) Endpoint contact sederhana (stub)
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email, message required" });
  }
  // TODO: integrasi email / penyimpanan bila diperlukan
  res.json({ ok: true });
});

// ===== Static Front-End (web/) =====
const staticDir = path.join(__dirname, "../web");
app.use(express.static(staticDir));

// SPA fallback: arahkan selain /api/* ke index.html
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

/* ===== start ===== */
app.listen(process.env.PORT || 3000, () =>
  console.log(`API ready at http://localhost:${process.env.PORT || 3000}`)
);
