const path = require('path');
require('dotenv').config();
const express = require("express");
const cors = require("cors");

const app = express(); // create express app
app.use(express.json());
app.use(cors());

const opentok = require('./opentok/opentok');
const rooms = {};

app.use(express.static(path.join(__dirname, "./frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/build/index.html"));
});

app.post("/room/:roomName/createSession", async (req, res) => {
  try{
    const { roomName } = req.params ?? 'demoRoom';
    if (rooms[roomName]) {
        res.json({roomName: roomName, sessionId: rooms[roomName]})
    }
    else {
        const session = await opentok.createSession()
        rooms[roomName] = session.sessionId;
        res.json({roomName: roomName, sessionId: session.sessionId})
    }
  }catch(err){
    console.error(err.stack);
    res.status(500).end(err.message);
  }
})

app.post("/room/generateCredential", (req, res) => {
  const { sessionId, role, data } = req.body;

    try{
        const credential = opentok.generateToken(sessionId, role, data);    
        res.json({sessionId, apiKey: credential.apiKey, token: credential.token});
      }catch(err){
        console.error(err.stack);
        res.status(500).end(err.message);
      }
});


const serverPort = process.env.PORT || process.env.NERU_APP_PORT || 3002;
app.listen(serverPort, () => {
    console.log('server started on port', serverPort);
  });