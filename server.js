const express = require('express');
const { getCollectionData, connectDB, getDB } = require('./database.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect and start server
connectDB().then(() => {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
    //Commenting out this logic for now.
    /*
    while(gameWon == 0){
      let seconds = 33;
      const countdownElement = document.getElementById('countdown');
      const countdown = setInterval(() => {
          seconds--;
          if(seconds >= 3) {
            countdownElement.textContent = (seconds-3);
          }
          if (seconds < 3) {
              clearInterval(countdown);
              countdownElement.textContent = "Time's up!";
          }
          if(seconds < 0) {
            // timer logic goes here to choose most voted move, and to choose opponent move
          }
      }, 1000);
    }
    */
  });
}).catch(err => {
  console.error("Failed to connect to DB:", err);
});

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

app.post('/api/Battleship/:gameID/votes', async (req, res) => {
  const gameID = req.params.gameID;
  const { coordinate } = req.body;
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
});

app.post('/api/Battleship/new', async (req, res) => {
  // Create new game logic
});

//This function is the enemy AI. Feed it the board with the friendly ships on it as that is the board the enemy fires on.
function enemyAI(boardState){
  let coordinateList = [];
  for(const coordinate in boardState){
    if (boardState[coordinate]['status'] == "pending"){
      coordinateList.push(coordinate);
    }
  }
  let choosenCoordinate =  coordinateList[Math.floor(Math.random() * coordinateList.length)]; //Pick a coordinate out of the list
  if(boardState[choosenCoordinate]['ship'] == 'none'){
    boardState[choosenCoordinate]['status'] = 'miss';
  }else{
    boardState[choosenCoordinate]['status'] = 'hit';
  }
  return boardState;
}
