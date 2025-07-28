const UserLog = require("../models/UserLog");

// Save logout (only for admin)
// Save logout log
exports.saveLogout = async (req, res) => {
  try {
    let { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ message: "Missing userId or username" });
    }

    // Force username to lowercase for consistency
    username = username.toLowerCase();

    // Save logout action
    await UserLog.create({ userId, username, action: "logout" });

    // Keep only last 5 logs per user
    const logs = await UserLog.find({ username }).sort({ timestamp: -1 });
    if (logs.length > 5) {
      const toDelete = logs.slice(5).map((l) => l._id);
      await UserLog.deleteMany({ _id: { $in: toDelete } });
    }

    res.status(200).json({ message: "Logout time saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get admin's last logout time only
exports.getLastLogout = async (req, res) => {
  try {
    const username = req.params.username?.toLowerCase();

    if (!username) {
      return res.status(400).json({ message: "Missing username in URL" });
    }

    const last = await UserLog.findOne({ username, action: "logout" }).sort({ timestamp: -1 });

    res.status(200).json({
      lastLogout: last ? last.timestamp : null,
    });
  } catch (err) {
    console.error("Error fetching last logout:", err.message);
    res.status(500).json({ error: err.message });
  }
};

