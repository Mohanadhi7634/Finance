const express = require("express");
const router = express.Router();
const { getDebtors, addDebtor, payInterest, payPrincipal, getDebtorById, deleteDebtor, updateDebtor} = require("../controllers/debtorController");
const multer = require("multer");

// ✅ Multer Setup with Limits
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,

}).fields([
  { name: "photo", maxCount: 1 },
  { name: "bondPapers", maxCount: 5 },
  { name: "checkLeaves", maxCount: 5 },
]);

// ✅ Routes
router.get("/", getDebtors);
router.post("/add", upload, addDebtor);
router.post("/pay-interest", payInterest);
router.post("/:id/pay-principal", payPrincipal);

router.get("/:id", getDebtorById);
router.delete("/:id",deleteDebtor);

router.post("/update/:id", upload, updateDebtor);


module.exports = router;







