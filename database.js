const { MongoClient, ServerApiVersion } = require('mongodb');

// Setup
const uri = "mongodb+srv://general:general@gamehostcluster.g3wicus.mongodb.net/?retryWrites=true&w=majority&appName=GameHostCluster";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to the database
async function connectDB() {
  try {
    await client.connect();
    db = client.db("ASE220GameHosterDB");
    console.log("Connected to DB");
    return db;
  } catch (err) {
    console.error("Failed to connect to DB:", err);
  }
}

// Fetch data from a collection
async function getCollectionData(collectionName) {
  try {
    const collection = db.collection(collectionName);
    const data = await collection.find().toArray();
    return data;
  } catch (err) {
    console.error("Failed to fetch data:", err);
    throw err;
  }
}

db = connectDB();

module.exports = { db, getCollectionData };
