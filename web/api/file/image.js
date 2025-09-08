// Alias endpoint to support /api/file/image?id=<id>
module.exports = async (req, res) => {
  try {
    const handler = require("./image/[id].js");
    return handler(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

