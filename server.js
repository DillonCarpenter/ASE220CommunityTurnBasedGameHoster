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

app.get('/api/user/:userID', async (req, res) => {
  const userID = req.params.userID;

  //Access the db and get the correct user document
});

//User endpoints
app.put('/api/user/:userID', async (req, res) => {
  const userID = req.params.userID;

  //Grab the response body and use it to update the user document
});

app.post('/api/user/create', async (req, res) => {
  //Create a new user document for a user that just created an account
  //Should probably verify that the account was successfully created as well
});

//Battleship Endpoints

app.get('/api/Battleship/:gameID', async (req, res) => {
  const gameID = req.params.gameID;
  //Get the Correct Battleship document
});

app.put('/api/Battleship/:gameID', async (req, res) => {
  const gameID = req.params.gameID;
  //Intended to update a Battleship document
});

app.post('/api/Battleship', async (req, res) => {
});
// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
