const express = require('express');
const { getCollectionData, connectDB, getDB } = require('./database.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect and start server
connectDB().then(async () => {
  app.listen(3000, async () => {
    console.log("Server is running on port 3000");
    startGames();
  });
}).catch(err => {
  console.error("Failed to connect to DB:", err);
});

async function startGames() {
  const db = getDB();
  let allGamesOver = false;
  
  // Loop until all games are over
  while (!allGamesOver) {
    try {
      // Get all games with "pending" status to update their timers
      const games = await db.collection('BattleShipGames').find({ gameStatus: "pending" }).toArray();
      
      for (const game of games) {
        const gameID = game.gameID;
        const timer = game.timer;
        const voteCount = game.voteCount;
        let enemyBoard = game.EnemyBoard;
        let friendlyBoard = game.FriendlyBoard;

        // Update timer for active games
        if (timer > 0) {
          await db.collection('BattleShipGames').updateOne(
            { gameID },
            { $inc: { timer: -1 } }  // Decrement the timer by 1
          );
        } else if (timer === 0) {
          // Process the game when the timer runs out
          console.log(`Timer ended for game ${gameID}`);

          if (voteCount === 0) {
            // Reset timer
            await db.collection('BattleShipGames').updateOne(
              { gameID },
              { $set: { timer: 30 } }
            );
          } else {
            // Find the most popular move
            let popularMove = "";
            let maxVotes = 0;
            for (const cell in enemyBoard) {
              if (enemyBoard[cell]?.votes > maxVotes) {  // Added optional chaining to avoid undefined errors
                maxVotes = enemyBoard[cell].votes;
                popularMove = cell;
              }
            }

            // Apply the most popular move to the board
            if (enemyBoard[popularMove]) {
              if (enemyBoard[popularMove].ship === 'none') {
                enemyBoard[popularMove].status = 'miss';
              } else {
                enemyBoard[popularMove].status = 'hit';
                checkWin(gameID);  // Make sure the checkWin function exists and handles the win logic
              }
            }

            // Play AI's move
            friendlyBoard = enemyAI(friendlyBoard);  // Ensure enemyAI function works as expected
            checkWin(gameID);  // Ensure this is called after the AI move

            // Update the game with the new boards and reset the vote count
            await db.collection('BattleShipGames').updateOne(
              { gameID },
              {
                $set: {
                  voteCount: 0,
                  EnemyBoard: enemyBoard,  // Corrected from `enemyBoard` to `EnemyBoard` to match MongoDB fields
                  FriendlyBoard: friendlyBoard,  // Corrected from `friendlyBoard` to `FriendlyBoard` to match MongoDB fields
                  timer: 30,  // Reset the timer
                }
              }
            );
          }
        }
      }

      // Check if all games are over
      const remainingGames = await db.collection('BattleShipGames').find({ gameStatus: "pending" }).toArray();
      if (remainingGames.length === 0) {
        allGamesOver = true;
      }
    } catch (err) {
      console.error("Error updating game timers:", err);
    }
    
    // Delay the next loop iteration to avoid a tight loop ( it was crashing every time)
    await new Promise(resolve => setTimeout(resolve, 1000));  // Delay for 1 second
  }
}



// Checks for a win
async function checkWin(gameID){
  const db = getDB();
  const game = await db.collection('BattleShipGames').findOne({ gameID: gameID });
  var friendlyShipsNotHit = 0;
  var enemyShipsNotHit = 0;
  const enemyBoard = game.EnemyBoard;
  const friendlyBoard = game.FriendlyBoard


  for (const cell in friendlyBoard) {
    const status = friendlyBoard[cell].status;
    const ship = friendlyBoard[cell].ship
    if (status !== 'hit' && ship !== 'none') {
      friendlyShipsNotHit++;
    }
  }
  for (const cell in enemyBoard) {
    const status = enemyBoard[cell].status;
    const ship = enemyBoard[cell].ship
    if (status !== 'hit' && ship !== 'none') {
      enemyShipsNotHit++;
    }
  }
  if(enemyShipsNotHit == 0){
    await db.collection('BattleShipGames').updateOne(
      { gameID },
      {
        $set: {
          gameStatus: "win"
        }
      }
    );
  } else if (friendlyShipsNotHit == 0){
    await db.collection('BattleShipGames').updateOne(
      { gameID },
      {
        $set: {
          gameStatus: "lose"
        }
      }
    );
  }

}
function enemyAI(friendlyBoard) {
  const availableTargets = [];

  // Get possible shootable squares
  for (const cell in friendlyBoard) {
    const status = friendlyBoard[cell].status;
    if (status !== 'hit' && status !== 'miss') {
      availableTargets.push(cell);
    }
  }

  // Pick a random untargeted one
  if (availableTargets.length > 0) {
    const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
    const cell = friendlyBoard[target];

    // Apply hit/miss logic
    if (cell.ship === 'none') {
      cell.status = 'miss';
    } else {
      cell.status = 'hit';
    }

    // Display this to console for bug testing
    console.log(`Enemy AI targeted ${target}: ${cell.status}`);
  }

  return friendlyBoard;
}
// Routes

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
  try {
    const gameID = req.params.gameID;
    console.log(gameID); // Confirm received ID

    const db = getDB();
    const game = await db.collection('BattleShipGames').findOne({gameID : gameID });

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json(game);
  } catch (err) {
    console.error("Failed to fetch data:", err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get timer for a game

app.get('/api/Battleship/:id/timer', async (req, res) => {
  const gameID = req.params.id;
  try {
    const db = getDB();
    const game = await db.collection('BattleShipGames').findOne({ gameID });

    if (game) {
      res.json({ timer: game.timer });
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (err) {
    console.error("Error fetching game timer:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/Battleship/:gameID/votes', async (req, res) => {
  try {
    const gameID = req.params.gameID;
    const { coordinate } = req.body;
    console.log("Received vote for game:", gameID, "coordinate:", coordinate);

    if (!coordinate) {
      return res.status(400).json({ message: 'Coordinate is required' });
    }
    const db = getDB();
    const game = await db.collection('BattleShipGames').findOne({ gameID : gameID });
    const enemyBoard = game.EnemyBoard;
    let friendlyBoard = game.FriendlyBoard;
    enemyBoard[coordinate].votes += 1;
    totalVotes = game['voteCount'] +=1;
    await db.collection('BattleShipGames').updateOne(
      { gameID : gameID },
      { $set: { 
        voteCount: totalVotes,
        EnemyBoard: enemyBoard } }
    );
    //Once the vote limit is reached, pick the move with the highest votes and call the enemyAI function.
    if(totalVotes => game['voteLimit']){
      friendlyBoard = enemyAI(friendlyBoard);
      let popularMove = "";
      let popularVotes = 0;
      for(const cell in enemyBoard){
        if(enemyBoard[cell]['votes'] > popularVotes){
          popularVotes = enemyBoard[cell]['votes'];
          popularMove = cell;
        }
        enemyBoard[cell]['votes'] = 0; //Reset board votes
      }
      //update the baord based on popularMove
      if(enemyBoard[popularMove]['ship'] == 'none'){
        enemyBoard[popularMove]['status'] = 'miss';
      }else{
        enemyBoard[popularBoard]['status'] = 'hit';
      }
      await db.collection('BattleShipGames').updateOne(
        { gameID : gameID },
        { $set: { 
          voteCount: 0,
          EnemyBoard: enemyBoard,
          FriendlyBoard: friendlyBoard
        } }
      );
    }
    res.end();
  }catch(err){
    res.status(500).json({ error: 'Server error.' });
  }

});

app.post('/api/Battleship/new-document', async (req, res) => {
  //I think this is called destructuring
  try{
    const { 'game-id': gameId, 'vote-limit': voteLimit } = req.body;

    // Basic validation
    if (!gameId || typeof voteLimit === 'undefined') {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    // TODO: Create the document in the database
    // Example: await db.collection('battleship').insertOne({ gameId, voteLimit });
    const db = getDB();
    await db.collection('BattleShipGames').insertOne(
      {
        "title": "Battleship",
        "gameID": gameId,
        "EnemyBoard": {
          "A1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Sumbarine"
          },
          "A5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "A10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Submarine"
          },
          "B5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "B10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Submarine"
          },
          "C5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "C10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "D1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Carrier"
          },
          "D2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Carrier"
          },
          "D3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Carrier"
          },
          "D4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Carrier"
          },
          "D5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Carrier"
          },
          "D6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "D7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "D8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "D9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "D10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "E10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "F1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Cruiser"
          },
          "F2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Cruiser"
          },
          "F3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Cruiser"
          },
          "F4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "F5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "F6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "F7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "F8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Battleship"
          },
          "F9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "F10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Battleship"
          },
          "G9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "G10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Battleship"
          },
          "H9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "H10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "I1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Destroyer"
          },
          "I2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Destroyer"
          },
          "I3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "I4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "I5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "I6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "I7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "I8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "Battleship"
          },
          "I9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "I10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J1": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J2": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J3": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J4": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J5": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J6": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J7": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J8": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J9": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          },
          "J10": {
            "votes": { "$numberInt": "0" },
            "status": "pending",
            "ship": "none"
          }
        },
        "FriendlyBoard": {
          "A1": { "status": "pending", "ship": "none" },
          "A2": { "status": "pending", "ship": "none" },
          "A3": { "status": "pending", "ship": "none" },
          "A4": {
            "status": "pending",
            "ship": "Sumbarine"
          },
          "A5": { "status": "pending", "ship": "none" },
          "A6": { "status": "pending", "ship": "none" },
          "A7": { "status": "pending", "ship": "none" },
          "A8": { "status": "pending", "ship": "none" },
          "A9": { "status": "pending", "ship": "none" },
          "A10": {
            "status": "pending",
            "ship": "none"
          },
          "B1": { "status": "pending", "ship": "none" },
          "B2": { "status": "pending", "ship": "none" },
          "B3": { "status": "pending", "ship": "none" },
          "B4": {
            "status": "pending",
            "ship": "Submarine"
          },
          "B5": { "status": "pending", "ship": "none" },
          "B6": { "status": "pending", "ship": "none" },
          "B7": { "status": "pending", "ship": "none" },
          "B8": { "status": "pending", "ship": "none" },
          "B9": { "status": "pending", "ship": "none" },
          "B10": {
            "status": "pending",
            "ship": "none"
          },
          "C1": { "status": "pending", "ship": "none" },
          "C2": { "status": "pending", "ship": "none" },
          "C3": { "status": "pending", "ship": "none" },
          "C4": {
            "status": "pending",
            "ship": "Submarine"
          },
          "C5": { "status": "pending", "ship": "none" },
          "C6": { "status": "pending", "ship": "none" },
          "C7": { "status": "pending", "ship": "none" },
          "C8": { "status": "pending", "ship": "none" },
          "C9": { "status": "pending", "ship": "none" },
          "C10": {
            "status": "pending",
            "ship": "none"
          },
          "D1": {
            "status": "pending",
            "ship": "Carrier"
          },
          "D2": {
            "status": "pending",
            "ship": "Carrier"
          },
          "D3": {
            "status": "pending",
            "ship": "Carrier"
          },
          "D4": {
            "status": "pending",
            "ship": "Carrier"
          },
          "D5": {
            "status": "pending",
            "ship": "Carrier"
          },
          "D6": { "status": "pending", "ship": "none" },
          "D7": { "status": "pending", "ship": "none" },
          "D8": { "status": "pending", "ship": "none" },
          "D9": { "status": "pending", "ship": "none" },
          "D10": {
            "status": "pending",
            "ship": "none"
          },
          "E1": { "status": "pending", "ship": "none" },
          "E2": { "status": "pending", "ship": "none" },
          "E3": { "status": "pending", "ship": "none" },
          "E4": { "status": "pending", "ship": "none" },
          "E5": { "status": "pending", "ship": "none" },
          "E6": { "status": "pending", "ship": "none" },
          "E7": { "status": "pending", "ship": "none" },
          "E8": { "status": "pending", "ship": "none" },
          "E9": { "status": "pending", "ship": "none" },
          "E10": {
            "status": "pending",
            "ship": "none"
          },
          "F1": {
            "status": "pending",
            "ship": "Cruiser"
          },
          "F2": {
            "status": "pending",
            "ship": "Cruiser"
          },
          "F3": {
            "status": "pending",
            "ship": "Cruiser"
          },
          "F4": { "status": "pending", "ship": "none" },
          "F5": { "status": "pending", "ship": "none" },
          "F6": { "status": "pending", "ship": "none" },
          "F7": { "status": "pending", "ship": "none" },
          "F8": {
            "status": "pending",
            "ship": "Battleship"
          },
          "F9": { "status": "pending", "ship": "none" },
          "F10": {
            "status": "pending",
            "ship": "none"
          },
          "G1": { "status": "pending", "ship": "none" },
          "G2": { "status": "pending", "ship": "none" },
          "G3": { "status": "pending", "ship": "none" },
          "G4": { "status": "pending", "ship": "none" },
          "G5": { "status": "pending", "ship": "none" },
          "G6": { "status": "pending", "ship": "none" },
          "G7": { "status": "pending", "ship": "none" },
          "G8": {
            "status": "pending",
            "ship": "Battleship"
          },
          "G9": { "status": "pending", "ship": "none" },
          "G10": {
            "status": "pending",
            "ship": "none"
          },
          "H1": { "status": "pending", "ship": "none" },
          "H2": { "status": "pending", "ship": "none" },
          "H3": { "status": "pending", "ship": "none" },
          "H4": { "status": "pending", "ship": "none" },
          "H5": { "status": "pending", "ship": "none" },
          "H6": { "status": "pending", "ship": "none" },
          "H7": { "status": "pending", "ship": "none" },
          "H8": {
            "status": "pending",
            "ship": "Battleship"
          },
          "H9": { "status": "pending", "ship": "none" },
          "H10": {
            "status": "pending",
            "ship": "none"
          },
          "I1": {
            "status": "pending",
            "ship": "Destroyer"
          },
          "I2": {
            "status": "pending",
            "ship": "Destroyer"
          },
          "I3": { "status": "pending", "ship": "none" },
          "I4": { "status": "pending", "ship": "none" },
          "I5": { "status": "pending", "ship": "none" },
          "I6": { "status": "pending", "ship": "none" },
          "I7": { "status": "pending", "ship": "none" },
          "I8": {
            "status": "pending",
            "ship": "Battleship"
          },
          "I9": { "status": "pending", "ship": "none" },
          "I10": {
            "status": "pending",
            "ship": "none"
          },
          "J1": { "status": "pending", "ship": "none" },
          "J2": { "status": "pending", "ship": "none" },
          "J3": { "status": "pending", "ship": "none" },
          "J4": { "status": "pending", "ship": "none" },
          "J5": { "status": "pending", "ship": "none" },
          "J6": { "status": "pending", "ship": "none" },
          "J7": { "status": "pending", "ship": "none" },
          "J8": { "status": "pending", "ship": "none" },
          "J9": { "status": "pending", "ship": "none" },
          "J10": { "status": "pending", "ship": "none" }
        },
        "pollStatus": "open",
        "voteCount": "0",
        "voteLimit": voteLimit,
        "timer": 30,
        "gameStatus": "pending"
      }
    );

    console.log('Received:', { gameId, voteLimit });

    res.status(201).json({ message: 'Document created successfully!' });
  }catch(err){
    res.status(500).json({ error: 'Server error.' });
  }
  
});

