// Alias endpoint to support /api/file/thumb?id=<id>
module.exports = async (req, res) => {
  try {
    const handler = require("./thumb/[id].js");
    return handler(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

