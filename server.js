const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================= CLOUDINARY + MULTER ================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dakaf_products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  }
});

const upload = multer({ storage });

/* ================= FAKE DATABASE ================= */
let users = [];

const PRODUCTS_FILE = "./products.json";
let products = [];

// Load saved products
if (fs.existsSync(PRODUCTS_FILE)) {
  try{
     const data = 
     fs.readFileSync(PRODUCTS_FILE, "utf-8");
  products = data ? JSON.parse(data): [];
  } catch (err){
    console.error("failed to parse products.json, starting fresh");
    products = [];
  }
 
}

// Save products helper
function saveProducts() {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

/* ================= AUTH ================= */

// SIGN UP
app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  const exists = users.find(u => u.email === email);
  if (exists) {
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

// CREATE PRODUCT
app.post("/products", upload.single("image"), (req, res) => {
  const { name, price } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Image required" });
  }

  const product = {
    id: Date.now(),
    name,
    price,
    image: req.file.path // ✅ Cloudinary URL
  };

  products.push(product);
  saveProducts();

  res.json({ message: "Product uploaded", product });
});

// GET ALL PRODUCTS
app.get("/products", (req, res) => {
  res.json(products);
});

// UPDATE PRODUCT
app.put("/products/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  const product = products.find(p => p.id == id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  product.name = name || product.name;
  product.price = price || product.price;

  if (req.file) {
    product.image = req.file.path; // ✅ Cloudinary
  }

  saveProducts();
  res.json({ message: "Product updated", product });
});

// DELETE PRODUCT
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;

  const exists = products.find(p => p.id == id);
  if (!exists) {
    return res.status(404).json({ message: "Product not found" });
  }

  products = products.filter(p => p.id != id);
  saveProducts();

  res.json({ message: "Product deleted" });
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
