// @flow
import { useState, useEffect, createContext, useRef, useContext } from "react";
import { SessionContext } from "contexts/session";

export const MessageContext = createContext({});
export default function MessageProvider({ children }){
  const [ raisedHands, setRaisedHands ] = useState([]);
  const [ lastRaiseHandRequest, setLastRaiseHandRequest ] = useState();
  const [ rejectedRequest, setRejectedRequest ] = useState();

  const [ requestPublishConnectionIds, setRequestPublishConnectionIds ] = useState([]);
  const [ requestCall, setRequestCall ] = useState();

  const mSession = useContext(SessionContext);;

  const userRef = useRef();
  userRef.current = mSession.user;

  function removeRaisedHand(user) {
    if(!user) return;
    setRaisedHands((prevRaisedHands) =>
      prevRaisedHands.filter((prevRaisedHand) => {
        return prevRaisedHand.id !== user.id;
      })
    );
  }

  useEffect(() => {
    if(!mSession.session) return;
    mSession.session.on("signal:raise-hand", ({ data }) => {
      const jsonData = JSON.parse(data);
      setLastRaiseHandRequest(jsonData.user)
      setRaisedHands((prev) => {
        const isExistingUser = prev.find((raisedHand) => {
          return raisedHand.id === jsonData.user.id
        });
        if (!isExistingUser) return [...prev, jsonData.user];
        else return prev;
      });
    });

    mSession.session.on("signal:request-publish", ({ data }) => {
      setRequestPublishConnectionIds(JSON.parse(data));    
    });

    mSession.session.on("signal:request-call", ({ data }) => {
      const jsonData = JSON.parse(data);
      setRequestCall(jsonData.user);
      removeRaisedHand(jsonData.user)
    });
    mSession.session.on("signal:reject-call", ({ data }) => {
      const jsonData = JSON.parse(data);
      removeRaisedHand(jsonData.user)
      setRejectedRequest(jsonData.user)
    });
  }, [ mSession.session ])

  return (
    <MessageContext.Provider value={{ 
      requestPublishConnectionIds,
      requestCall,
      raisedHands,
      lastRaiseHandRequest,
      rejectedRequest
    }}>
      {children}
    </MessageContext.Provider>
  )
}