const express = require('express');
const { getCollectionData } = require('./db');

const app = express();

// Get the data
app.get('/', async (req, res) => {
  try {
    const data = await getCollectionData("BattleShipGames");
    res.json(data);
  } catch (err) {
    console.error("Failed to fetch data:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
