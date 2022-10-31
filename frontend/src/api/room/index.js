import Room from "entities/room";

const url = new URL(window.location.href);
const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;

export default class RoomAPI{
  static async createSession(roomName, data={}){

    const apiURL = `${serverPath}/room/${roomName}/createSession`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify(data)
    })).json();
    
    let room = new Room(jsonResult.roomName, jsonResult.sessionId)
    return room;
  }

}