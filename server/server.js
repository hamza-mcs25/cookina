// server/server.js
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// ⚡ Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// -------------------- SQLite Database --------------------
const DB_FILE = path.join(__dirname, "../recipes.db");
const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("❌ Could not connect to database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// -------------------- ROUTES --------------------

// Root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Planner routes (optional JSON file or localStorage)
const DATA_FILE = path.join(__dirname, "../plannerData.json");

function readPlanner() {
  if (!fs.existsSync(DATA_FILE)) return { made: [], todo: [], buy: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writePlanner(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/planner", (req, res) => res.json(readPlanner()));
app.post("/planner", (req, res) => {
  writePlanner(req.body);
  res.json({ success: true });
});

// -------------------- Recipe Search --------------------
app.post("/getRecipe", (req, res) => {
  const { dish } = req.body;
  if (!dish) return res.status(400).json({ error: "Dish name missing" });

  const query = `SELECT * FROM recipes WHERE recipe_name LIKE ? LIMIT 10`;
  db.all(query, [`%${dish}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: "Recipe not found" });

    const results = rows.map(r => ({
      title: r.recipe_name,
      ingredients: r.ingredients ? r.ingredients.split("|") : [],
      steps: r.directions ? r.directions.split("|") : [],
      prep_time: r.prep_time,
      cook_time: r.cook_time,
      total_time: r.total_time,
      servings: r.servings,
      rating: r.rating,
      url: r.url,
      cuisine: r.cuisine_path,
      nutrition: r.nutrition
    }));

    res.json(results);
  });
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
