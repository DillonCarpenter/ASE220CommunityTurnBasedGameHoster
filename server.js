const express = require('express');
const { db, getCollectionData } = require('./database.js');

const app = express();

// Get the data
app.get('/', async (req, res) => {
  try {
    const Battleship = await getCollectionData("BattleShipGames");
    console.log("Battleship");
    res.json(Battleship);
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
  //Get the data
  try {

    const gameID = req.params.gameID;
    console.log(gameID); //Make sure I received the ID correctly

    //Finding document
    const game = await db.collection('BattleShipGames').findOne({ "gameID": gameID }).toArray();
    console.log(game);

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json(game);

  } catch (err) {
    console.error("Failed to fetch data:", err);
    res.status(500).json({ error: 'Server error.' });
  }
});


app.post('/api/Battleship/:gameID/votes', async (req, res) => {
  const gameID = req.params.gameID;
  //Intended to update a Battleship document with the new vote.
});

app.post('/api/Battleship/new', async (req, res) => {
});
// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
