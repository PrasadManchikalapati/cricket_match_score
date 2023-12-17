const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertSnakeObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertSnakeObjectToResponseObject1 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const dbQuery = `SELECT * FROM player_details ORDER BY player_id;`;
  const result = await db.all(dbQuery);
  response.send(result.map((each) => convertSnakeObjectToResponseObject(each)));
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const result = await db.get(dbQuery);
  response.send(convertSnakeObjectToResponseObject(result));
});

app.use(express.json());

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const dbQuery = `UPDATE player_details
    SET player_name='${playerName}' WHERE player_id=${playerId};`;
  await db.run(dbQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const result = await db.get(dbQuery);
  response.send(convertSnakeObjectToResponseObject1(result));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `SELECT DISTINCT match_details.match_id AS matchId,
  match_details.match AS matchName,match_details.year AS year
  FROM match_details JOIN player_match_score WHERE player_id=${playerId};`;
  const result = await db.all(dbQuery);
  response.send(result);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `SELECT player_details.player_id AS playerId, 
  player_details.player_name AS playerName From player_match_score JOIN player_details
  WHERE match_id=${matchId}`;
  const result = await db.all(dbQuery);
  response.send(result);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `SELECT player_details.player_id AS playerId,
                           player_details.player_name AS playerName,
                           sum(player_match_score.score) AS totalScore,
                           sum(player_match_score.fours) AS totalFours,
                          sum(player_match_score.sixes) AS totalSixes
                    FROM player_details LEFT JOIN player_match_score ON player_details.player_id=
                    player_match_score.player_id WHERE player_details.player_id=${playerId} ;`;
  const result = await db.get(dbQuery);
  response.send(result);
});
module.exports = app;
