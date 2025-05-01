const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const uri = "mongodb+srv://general:general@gamehostcluster.g3wicus.mongodb.net/?retryWrites=true&w=majority&appName=GameHostCluster";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
// Connect to DB
async function connectDB() {
  try {
    await client.connect();
    db = client.db("ASE220GameHosterDB");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

// Get the data
app.get('/', async (req, res) => {
  try {
    const collection = db.collection("BattleShipGames");
    const data = await collection.find().toArray();
    res.json(data);
  } catch (err) {
    console.error("Failed to fetch data:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
connectDB().then(() => {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
});
