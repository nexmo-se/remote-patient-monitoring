// @flow
import { useState, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import OT from "@opentok/client";
import RoomAPI from "api/room";
import CredentialAPI from "api/credential";
import User from "entities/user";

export const SessionContext = createContext({});
function SessionProvider({ children }){
  const navigate = useNavigate();
  const [ user, setUser ] = useState();
  const [ session, setSession ] = useState();
  const [ streams, setStreams ] = useState([]);
  const [ changedStream, setChangedStream ] = useState();
  const [ connections, setConnections ] = useState([]);

  function handleStreamPropertyChanged({ stream, changedProperty, newValue, oldValue }){
    setChangedStream({ stream, changedProperty, newValue, oldValue, token: uuid() });
  }

  function handleConnectionCreated(e){
    setConnections((prevConnections) => [ ...prevConnections, e.connection ]);
  }

  function handleConnectionDestroyed(e){
    setConnections((prevConnections) => [ ...prevConnections].filter((connection) => connection.id !== e.connection.id));
  }

  function handleSessionDisconnected(e){
      setConnections([])
      setSession(null)
      setUser(null)
  }

  function handleStreamCreated(e){
    setStreams((prevStreams) => [ ...prevStreams, e.stream ]);
  }

  function handleStreamDestroyed(e){
    setStreams((prevStreams) => [ ...prevStreams].filter((stream) => stream.id !== e.stream.id));
  }

  async function connect(credential){
    try{
      let newSession = OT.initSession(credential.apiKey, credential.sessionId); 

      newSession.on("streamPropertyChanged", handleStreamPropertyChanged);
      newSession.on("streamCreated", (e) => handleStreamCreated(e));
      newSession.on("streamDestroyed", (e) => handleStreamDestroyed(e));
      newSession.on("sessionDisconnected", (e) => handleSessionDisconnected(e));
      newSession.on("connectionCreated", (e) => handleConnectionCreated(e));
      newSession.on("connectionDestroyed", (e) => handleConnectionDestroyed(e));
      
      await new Promise((resolve, reject) => {
        newSession.connect(credential.token, (err) => {
          if(err) reject(err);
          else resolve();
        })
      });
      const userData = JSON.parse(newSession.connection.data)
      const newUser = new User(userData.name, userData.role, newSession.connection.id)
      setUser(newUser)
      setSession(newSession);
    }catch(err){
      console.log(err);
    }
  }

  async function joinRoom(roomName, user) {
    setUser(user)
    const newRoom = await RoomAPI.createSession(roomName);
    const credential = await CredentialAPI.generateCredential({sessionId: newRoom.sessionId, role: "publisher", data: user});
    connect(credential)
  }

  async function disconnect() {
    if (session) {
      session.disconnect();
      setSession(null)
    }
    navigate("/");
  }

  return (
    <SessionContext.Provider value={{
      user,
      session,
      streams,
      changedStream,
      connections,
      connect,
      disconnect,
      joinRoom
    }}>
      {children}
    </SessionContext.Provider>
  )
}
export default SessionProvider