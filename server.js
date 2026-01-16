// ================= BACKEND SERVER.JS =================
const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected mawa!"))
  .catch(err => console.error("DB Connection Error:", err));

// 2. Order Schema (Database Structure)
const orderSchema = new mongoose.Schema({
  orderId: String,
  paymentId: String,
  amount: Number,
  status: String,
  customer: {
    name: String,
    phone: String,
    addr: String
  },
  items: Array,
  date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const rzp = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET
});

// 3. Create Order API (Payment Modal open avvadaniki)
app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Converts Rupees to Paise
      currency: "INR",
      receipt: "rcpt_" + Math.random(),
    };
    const order = await rzp.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

// 4. Save Order API (IKKADA IDI PETTALI MAWA!)
app.post('/save-order', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ message: "Order saved successfully in DB!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save order" });
  }
});

// 5. Get All Orders (Order list display cheyadaniki)
app.get('/orders', async (req, res) => {
  const orders = await Order.find().sort({ date: -1 });
  res.json(orders);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
