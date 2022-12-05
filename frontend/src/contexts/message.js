// @flow
import { useState, useEffect, createContext, useContext} from "react";
import { SessionContext } from "contexts/session";
import User from 'entities/user';
import MessageAPI from "api/message";

export const MessageContext = createContext({});
export default function MessageProvider({ children }){
  const [ requestCall, setRequestCall ] = useState();
  const [ raisedHands, setRaisedHands ] = useState([]);
  const [ lastRaiseHandRequest, setLastRaiseHandRequest ] = useState();
  const [ rejectedRequest, setRejectedRequest ] = useState();
  const mSession = useContext(SessionContext);;

  function removeRaisedHand(user) {
    if(!user) return;
    setRaisedHands((prevRaisedHands) =>
      prevRaisedHands.filter((prevRaisedHand) => {
        return prevRaisedHand.id !== user.id;
      })
    );
  }

  useEffect(() => {
    let nurse = mSession.connections.find((connection) => JSON.parse(connection.data).role === "nurse")
    if(!nurse) {
      setRequestCall(false)
      setRaisedHands([])
    }
    else {
      let connectionIds = mSession.connections.map((connection) => connection.id)
      setRaisedHands((prev) => prev.filter((prevRaiseHand) => connectionIds.includes(prevRaiseHand.id)))
    }
  }, [mSession.connections])

  useEffect(() => {
    if(!mSession.session) return;
    mSession.session.on("signal:raise-hand", ({ data }) => {
      const jsonData = JSON.parse(data);
      const user = User.fromJSON(jsonData.user);
      setLastRaiseHandRequest(user)
      setRaisedHands((prev) => {
        const isExistingUser = prev.find((raisedHand) => {
          return raisedHand.id === user.id
        });
        if (!isExistingUser && JSON.parse(mSession.session.connection.data).role === "nurse") MessageAPI.sendQueueList(mSession.session, [...prev, user]) ;
        return prev;
      });
    });

    mSession.session.on("signal:queue-list", ({ data }) => {
      const jsonData = JSON.parse(data);
      setRaisedHands(jsonData.queueList);
    });

    mSession.session.on("signal:request-call", ({ data }) => {
      const jsonData = JSON.parse(data);
      const user = User.fromJSON(jsonData.user);
      setRequestCall((prev) => {
        if (user.id !== prev.id ) return user
        else return prev
      });
      removeRaisedHand(user)
    });
    mSession.session.on("signal:reject-raise-hand", ({ data }) => {
      const jsonData = JSON.parse(data);
      const user = User.fromJSON(jsonData.user);
      removeRaisedHand(user)
      setRejectedRequest(user)
    });
  }, [ mSession.session ])

  return (
    <MessageContext.Provider value={{ 
      requestCall,
      raisedHands,
      lastRaiseHandRequest,
      rejectedRequest
    }}>
      {children}
    </MessageContext.Provider>
  )
}