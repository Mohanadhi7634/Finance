const express = require("express");
const router = express.Router();
const { createUser, loginUser } = require("../controllers/userController");
const { saveLogout, getLastLogout } = require("../controllers/userLogController");

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout", saveLogout);
router.get("/last-logout/:username", getLastLogout);

module.exports = router;
