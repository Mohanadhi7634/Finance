const bcrypt = require("bcrypt");
const User = require("../models/User");

// 🔐 Create User
exports.createUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Username already exists" });

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🔓 Login
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ (Optional) Manual Test for Hashing
const run = async () => {
  const password = "mohan@123";
  const hashed = await bcrypt.hash(password, 10);
  console.log("Hashed:", hashed);

  const isMatch = await bcrypt.compare("mysecret", hashed);
  console.log("Match:", isMatch); // should log: true
};

// Uncomment the next line to test manually:
// run();
