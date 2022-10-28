// @flow
import { Stream } from "@opentok/client";

class User{

  constructor(name = '', role = '', id = '', stream = Stream){
    this.name = name;
    this.role = role;
    this.id = id;
    this.stream = stream;
  }

  toJSON(){
    const jsonData = {
      id: this.id,
      name: this.name,
      role: this.role
    }
    return JSON.parse(JSON.stringify(jsonData));
  }

  static fromJSON(data = {}){
    const user = new User(data.name, data.role, data.id);
    return user;
  }
}
export default User;