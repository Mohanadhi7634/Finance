const Debtor = require("../models/Debtor");

// ✅ Get All Debtors
exports.getDebtors = async (req, res) => {
  try {
    const debtors = await Debtor.find();
    res.status(200).json(debtors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching debtors", error });
  }
};


// ✅ Add Debtor
exports.addDebtor = async (req, res) => {
  try {
    const { id, name, address, mobile, debtAmount, debtDate, interestRate, currentDate } = req.body;
    const interestAmount = ((parseFloat(interestRate) / 100) * parseFloat(debtAmount)).toFixed(2);

    // Check for duplicate ID
    const existingDebtor = await Debtor.findOne({ id });
    if (existingDebtor) {
      return res.status(400).json({ message: "Debtor ID already exists. Use a unique ID." });
    }

    // Validate mobile
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    // Photo
    const photo = req.files?.photo ? {
      data: req.files.photo[0].buffer.toString("base64"),
      name: req.files.photo[0].originalname,
    } : {};

    // Bond Papers
    const bondPapers = req.files?.bondPapers?.map(file => ({
      data: file.buffer.toString("base64"),
      name: file.originalname,
    })) || [];

    // Check Leaves
    const checkLeaves = req.files?.checkLeaves?.map(file => ({
      data: file.buffer.toString("base64"),
      name: file.originalname,
    })) || [];

    const newDebtor = new Debtor({
      id, name, address, mobile, photo, debtAmount, debtDate, interestRate,
      interestAmount, currentDate, bondPapers, checkLeaves, interestPaidMonths: [],
    });

    await newDebtor.save();
    res.status(201).json({ message: "Debtor added successfully", debtor: newDebtor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



//edit 
exports.updateDebtor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, mobile, debtAmount, debtDate, interestRate, currentDate } = req.body;

    const debtor = await Debtor.findById(id);
    if (!debtor) return res.status(404).json({ message: "Debtor not found" });

    if (name) debtor.name = name;
    if (address) debtor.address = address;

    if (mobile) {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(mobile)) {
        return res.status(400).json({ message: "Invalid mobile number" });
      }
      debtor.mobile = mobile;
    }

    if (debtAmount) debtor.debtAmount = debtAmount;
    if (debtDate) debtor.debtDate = debtDate;
    if (interestRate) debtor.interestRate = interestRate;
    if (currentDate) debtor.currentDate = currentDate;

    if (debtAmount && interestRate) {
      debtor.interestAmount = ((parseFloat(interestRate) / 100) * parseFloat(debtAmount)).toFixed(2);
    }

    // Update photo
    if (req.files?.photo) {
      debtor.photo = {
        data: req.files.photo[0].buffer.toString("base64"),
        name: req.files.photo[0].originalname,
      };
    }

    // Update bond papers
    if (req.files?.bondPapers) {
      debtor.bondPapers = req.files.bondPapers.map(file => ({
        data: file.buffer.toString("base64"),
        name: file.originalname,
      }));
    }

    // Update check leaves
    if (req.files?.checkLeaves) {
      debtor.checkLeaves = req.files.checkLeaves.map(file => ({
        data: file.buffer.toString("base64"),
        name: file.originalname,
      }));
    }

    await debtor.save();
    res.status(200).json({ message: "Debtor updated successfully", debtor });

  } catch (error) {
    console.error("Error updating debtor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




// ✅ Pay Interest
// Controller in userController.js
exports.payInterest = async (req, res) => {
   console.log("➡️ /pay-interest endpoint hit", req.body); 
  const { debtorId, paidMonths, paidDate, amount } = req.body;

  const debtor = await Debtor.findOne({ id: debtorId });
  if (!debtor) return res.status(404).json({ message: "Debtor not found" });

  paidMonths.forEach(month => {
    debtor.interestPaidMonths.push({ month, date: paidDate, amount });
  });

  await debtor.save();
  res.status(200).json({ message: "Interest recorded successfully" });
};



// ✅ Pay Principal
// ✅ Pay Principal
exports.payPrincipal = async (req, res) => {
  try {
    const { id } = req.params; // MongoDB debtor _id
    const { amount, paymentDate, paymentMethod } = req.body;

    // Basic validations
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount." });
    }
    if (!paymentDate) {
      return res.status(400).json({ error: "Payment date is required." });
    }
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return res.status(400).json({ error: "Payment method is required and must be a string." });
    }

    // Find the debtor by ID
    const debtor = await Debtor.findById(id);
    if (!debtor) {
      return res.status(404).json({ error: "Debtor not found." });
    }

    const paymentAmount = parseFloat(amount);

    // Initialize remainingBalance if missing
    if (debtor.remainingBalance === undefined || debtor.remainingBalance === null) {
      debtor.remainingBalance = parseFloat(debtor.debtAmount);
    }

    const currentRemainingBalance = parseFloat(debtor.remainingBalance);

    if (paymentAmount > currentRemainingBalance) {
      return res.status(400).json({ error: "Payment amount exceeds remaining balance." });
    }

    // Update payment history
    debtor.paymentHistory.push({
      amount: paymentAmount.toFixed(2),
      date: paymentDate,
      method: paymentMethod,
    });

    // Calculate new remaining balance
    const newRemainingBalance = currentRemainingBalance - paymentAmount;
    debtor.remainingBalance = newRemainingBalance.toFixed(2);

    // Recalculate new interest amount based on updated balance
    const interestRatePercent = parseFloat(debtor.interestRate) / 100;
    debtor.interestAmount = (newRemainingBalance * interestRatePercent).toFixed(2);

    // Save the updated debtor
    await debtor.save();

    // Send success response
    res.status(200).json({ message: "Principal payment successful", debtor });

  } catch (error) {
    console.error("Error in payPrincipal:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};





// ✅ Get a single debtor by ID
const mongoose = require("mongoose");

exports.getDebtorById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid debtor ID format" });
    }

    const debtor = await Debtor.findById(req.params.id);
    if (!debtor) return res.status(404).json({ message: "Debtor not found" });

    res.json(debtor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDebtor = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid debtor ID format" });
    }

    const debtor = await Debtor.findByIdAndDelete(req.params.id);
    if (!debtor) return res.status(404).json({ message: "Debtor not found" });

    res.json({ message: "Debtor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



