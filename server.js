require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}



const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));




const razorpay = new Razorpay({
 key_id: process.env.RAZORPAY_KEY_ID,
 key_secret: process.env.RAZORPAY_SECRET
});

const storage = multer.diskStorage({
 destination: (req, file, cb) => {
   cb(null, uploadDir);
 },
 filename: (req,file,cb)=>{
   cb(null, Date.now() + "-" + file.originalname);
 }
});

const upload = multer({storage});

/* CREATE ORDER */
app.post("/create-order", async (req, res) => {
 try {
   const { amount } = req.body;

   console.log("Create order request:", req.body);

   if (!amount) {
     return res.status(400).json({ error: "Amount is required" });
   }

   const order = await razorpay.orders.create({
     amount: Number(amount) * 100,
     currency: "INR",
     receipt: "RR3D-" + uuid()
   });

   res.json(order);

 } catch (err) {
   console.error("Razorpay error:", err);
   res.status(500).json({ error: "Razorpay order failed" });
 }
});


/* SAVE ORDER */
app.post("/save-order", upload.single("photo"), (req,res)=>{
 let orders = fs.existsSync("orders.json")
 ? JSON.parse(fs.readFileSync("orders.json"))
 : [];

 orders.push({
  id: uuid(),
  date: new Date(),
  ...req.body,
  photo: req.file ? req.file.filename : null
 });

 fs.writeFileSync("orders.json", JSON.stringify(orders,null,2));
 res.json({status:"saved"});
});

/* ADMIN */
app.get("/orders", (req,res)=>{
 let orders = fs.existsSync("orders.json")
 ? JSON.parse(fs.readFileSync("orders.json"))
 : [];
 res.json(orders.reverse());
});

app.listen(5000, ()=>console.log("🔥 Backend running at http://localhost:5000"));
