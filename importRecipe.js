// importRecipe.js
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import csv from "csv-parser";

const DB_FILE = path.join(path.resolve(), "recipes.db");
const CSV_FILE = path.join(path.resolve(), "recipes.csv");

// Connect to SQLite database (will create if it doesn't exist)
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  // Drop table if exists
  db.run(`DROP TABLE IF EXISTS recipes`);

  // Create table
  db.run(`
    CREATE TABLE recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_name TEXT,
      prep_time INTEGER,
      cook_time INTEGER,
      total_time INTEGER,
      servings INTEGER,
      ingredients TEXT,
      directions TEXT,
      rating REAL,
      url TEXT,
      cuisine_path TEXT,
      nutrition TEXT,
      timing TEXT
    )
  `);

  // Prepare insert statement
  const stmt = db.prepare(`
    INSERT INTO recipes
    (recipe_name, prep_time, cook_time, total_time, servings, ingredients, directions, rating, url, cuisine_path, nutrition, timing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Read CSV and insert into database
  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on("data", (row) => {
      try {
        stmt.run(
          row.recipe_name?.trim() || "",
          parseInt(row.prep_time) || null,
          parseInt(row.cook_time) || null,
          parseInt(row.total_time) || null,
          parseInt(row.servings) || null,
          row.ingredients?.replace(/\r?\n|\r/g, " ").trim() || "",
          row.directions?.replace(/\r?\n|\r/g, " ").trim() || "",
          parseFloat(row.rating) || null,
          row.url?.trim() || "",
          row.cuisine_path?.trim() || "",
          row.nutrition?.trim() || "{}",
          row.timing?.trim() || "{}"
        );
      } catch (err) {
        console.error("Error inserting row:", err);
      }
    })
    .on("end", () => {
      stmt.finalize();
      db.close();
      console.log("✅ CSV imported into SQLite database!");
    })
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
    });
});
