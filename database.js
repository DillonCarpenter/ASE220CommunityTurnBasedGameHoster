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
let db;

async function connectDB() {
  await client.connect();
  db = client.db("ASE220GameHosterDB");
  return db;
}

function getDB() {
    if (!db) throw new Error("DB not connected. Call connectDB() first.");
    return db;
  }
  

// Fetch data from a collection
async function getCollectionData(collectionName) {
    const collection = getDB().collection(collectionName);
    return await collection.find().toArray();
  }


module.exports = { connectDB, getCollectionData };

