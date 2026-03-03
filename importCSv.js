// importCsv.js
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const CSV_FILE = path.join(path.resolve(), "recipes.csv"); 
const OUTPUT_FILE = path.join(path.resolve(), "recipes.json");

const recipes = [];

fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on("data", (row) => {
    try {
      // Parse JSON fields safely
      let nutrition = {};
      let timing = {};

      try { nutrition = row.nutrition ? JSON.parse(row.nutrition) : {}; } catch (e) {}
      try { timing = row.timing ? JSON.parse(row.timing) : {}; } catch (e) {}

      const recipe = {
        recipe_name: row.recipe_name || "",
        prep_time: parseInt(row.prep_time) || 0,
        cook_time: parseInt(row.cook_time) || 0,
        total_time: parseInt(row.total_time) || 0,
        servings: parseInt(row.servings) || 0,
        ingredients: row.ingredients ? row.ingredients.split("|").map(s => s.trim()) : [],
        directions: row.directions ? row.directions.split("|").map(s => s.trim()) : [],
        rating: parseFloat(row.rating) || 0,
        url: row.url || "",
        cuisine_path: row.cuisine_path || "",
        nutrition,
        timing
      };

      recipes.push(recipe);

    } catch (err) {
      console.error("Error processing row:", err);
    }
  })
  .on("end", () => {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(recipes, null, 2));
    console.log(`✅ Successfully imported ${recipes.length} recipes into recipes.json`);
  })
  .on("error", (err) => {
    console.error("Error reading CSV:", err);
  });
