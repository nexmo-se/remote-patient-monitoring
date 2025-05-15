// @flow
import { useState, useEffect, createContext, useContext} from "react";
import { SessionContext } from "contexts/session";
import User from 'entities/user';
import MessageAPI from "api/message";
import { MonitorType } from "utils/constants";

export const MessageContext = createContext({});
export default function MessageProvider({ children }){
  const [ requestCall, setRequestCall ] = useState();
  const [ raisedHands, setRaisedHands ] = useState([]);
  const [ lastRaiseHandRequest, setLastRaiseHandRequest ] = useState();
  const [ rejectedRequest, setRejectedRequest ] = useState();
  const [ missingUsers, setMissingUsers ] = useState([]);
  const [ monitoringType, setMonitoringType ] = useState(MonitorType.NONE);

  const mSession = useContext(SessionContext);;

  function removeRaisedHand(user) {
    if(!user) return;
    setRaisedHands((prevRaisedHands) =>
      prevRaisedHands.filter((prevRaisedHand) => {
        return prevRaisedHand.id !== user.id;
      })
    );
  }

  function removeMissingUser(user) {
    if (!user) return;
    setMissingUsers((prevMissingUsers) =>
    prevMissingUsers.filter((prevMissingUser) => {
      return prevMissingUser.id !== user.id;
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
      setMissingUsers((prev) => prev.filter((prevMissingUser) => connectionIds.includes(prevMissingUser.id)))
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

    mSession.session.on("signal:user-state", ({ data }) => {
      const jsonData = JSON.parse(data);
      const user = User.fromJSON(jsonData.user);
      const isUserExistInCamera = jsonData.state;
      setMissingUsers((prev) => {
        if (!isUserExistInCamera) {
          const isExistingMissingUser = prev.find((prevUser) => {
            return prevUser.id === user.id
          });
          if (!isExistingMissingUser) return [...prev, user] ;
          return prev;
        }
        return prev.filter((prevUser) => prevUser.id !== user.id)
      })
    });

    mSession.session.on("signal:monitoring-type", ({ data }) => {
      const jsonData = JSON.parse(data);
      setMonitoringType(jsonData.monitoringType)
    });
  }, [ mSession.session ])

  return (
    <MessageContext.Provider value={{ 
      requestCall,
      raisedHands,
      lastRaiseHandRequest,
      rejectedRequest,
      missingUsers,
      monitoringType,
      removeMissingUser
    }}>
      {children}
    </MessageContext.Provider>
  )
}