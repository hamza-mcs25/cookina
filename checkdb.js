import sqlite3 from "sqlite3";
import path from "path";

const DB_FILE = path.join(path.resolve(), "recipes.db");
const db = new sqlite3.Database(DB_FILE);

db.all("SELECT recipe_name FROM recipes LIMIT 10", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("First 10 recipes:");
    rows.forEach(r => console.log(r.recipe_name));
  }
  db.close();
});
