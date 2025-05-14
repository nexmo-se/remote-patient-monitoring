const { vcr } = require("@vonage/vcr-sdk")

const path = require('path');
require('dotenv').config();
const express = require("express");
const cors = require("cors");

const app = express(); // create express app
app.use(express.json());
app.use(cors());

const vonageVideo = require('./vonageVideo/vonageVideo');

app.use(express.static(path.join(__dirname, "./frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/build/index.html"));
});

app.get('/_/health', async (req, res) => {
  res.sendStatus(200);
});


app.post("/room/:roomName/createSession", async (req, res) => {
  try{
    const { roomName } = req.params ?? 'demoRoom';

    const dbState = vcr.getInstanceState();
    const sessionId = await dbState.get(`sessions:${roomName}`);

    if (sessionId) {
        await dbState.expire(`sessions:${roomName}`, 60 * 60 * 4);
        res.json({roomName: roomName, sessionId: sessionId })
    }
    else {
        const session = await vonageVideo.createSession()
        await dbState.set(`sessions:${roomName}`, session.sessionId);
        await dbState.expire(`sessions:${roomName}`, 60 * 60 * 4);
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
        const credential = vonageVideo.generateToken(sessionId, role, data);
        res.json({sessionId, appId: credential.appId, token: credential.token});
      }catch(err){
        console.error(err.stack);
        res.status(500).end(err.message);
      }
});


const serverPort =  process.env.NERU_APP_PORT || process.env.PORT || 3002;
app.listen(serverPort, () => {
    console.log('server started on port', serverPort);
  });