const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// DELETE product

/* ================= UPLOADS FOLDER CHECK ================= */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* ================= SERVE IMAGES ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= FAKE DATABASE ================= */
let users = [];
let products = [];

/* ================= AUTH ================= */

// SIGN UP
app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  users.push({ email, password });
  res.json({ message: "Signup successful" });
});

// LOGIN
const ADMIN_EMAIL = "admin@stars.com";

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (email === ADMIN_EMAIL) {
    return res.json({
      message: "Admin login successful",
      role: "admin",
      redirectTo: "/admin_dashboard.html"
    });
  }

  res.json({
    message: "User login successful",
    role: "user",
    redirectTo: "/homepage.html"
  });
});

/* ================= PRODUCTS ================= */

// UPLOAD PRODUCT
app.post("/products", upload.single("image"), (req, res) => {
  const { name, price } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }

  const product = {
    id: Date.now(),
    name,
    price,
    image: `/uploads/${req.file.filename}`
  };

  products.push(product);
  res.json({ message: "Product uploaded", product });
});

app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id == id);
  if (index === -1) return res.status(404).json({ message: "Product not found" });

  products.splice(index, 1);
  res.json({ message: "Product deleted" });
});

// EDIT product
app.put("/products/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  const product = products.find(p => p.id == id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  product.name = name || product.name;
  product.price = price || product.price;
  if (req.file) product.image = `/uploads/${req.file.filename}`;

  res.json({ message: "Product updated", product });
});


// GET ALL PRODUCTS
app.get("/products", (req, res) => {
  res.json(products);
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
