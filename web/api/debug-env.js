module.exports = async (req, res) => {
  try {
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
    const hasRoot = Boolean(process.env.ROOT_FOLDER_ID);
    const gsaJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const hasJson = Boolean(gsaJson);
    const hasClient = Boolean(process.env.GOOGLE_CLIENT_EMAIL);
    const hasKey = Boolean(process.env.GOOGLE_PRIVATE_KEY);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      env,
      has_ROOT_FOLDER_ID: hasRoot,
      has_GOOGLE_SERVICE_ACCOUNT_JSON: hasJson,
      has_GOOGLE_CLIENT_EMAIL: hasClient,
      has_GOOGLE_PRIVATE_KEY: hasKey,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

