// @flow
class Room{
    constructor(name = '', sessionId = ''){
      this.name = name;
      this.sessionId = sessionId;
    }

    toJSON() {
      const jsonData = {
        id: this.id,
        name: this.name,
        sessionId: this.sessionId,
      }
      return JSON.parse(JSON.stringify(jsonData));
    }
  
    static fromJSON(data){
      const room = new Room(data.roomName, data.sessionId);
      return room;
    }
  }
  export default Room;