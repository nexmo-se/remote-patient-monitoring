// @flow
import { useState, useEffect, createContext, useContext} from "react";
import { SessionContext } from "contexts/session";
import User from 'entities/user';

export const MessageContext = createContext({});
export default function MessageProvider({ children }){
  const [ requestPublishConnectionIds, setRequestPublishConnectionIds ] = useState([]);
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
    if(!mSession.session) return;
    mSession.session.on("signal:raise-hand", ({ data }) => {
      const jsonData = JSON.parse(data);
      const user = User.fromJSON(jsonData.user);
      setLastRaiseHandRequest(user)
      setRaisedHands((prev) => {
        const isExistingUser = prev.find((raisedHand) => {
          return raisedHand.id === user.id
        });
        if (!isExistingUser) return [...prev, user];
        else return prev;
      });
    });

    mSession.session.on("signal:request-publish", ({ data }) => {
      setRequestPublishConnectionIds(JSON.parse(data));    
    });

    mSession.session.on("signal:request-call", ({ data }) => {
      const jsonData = JSON.parse(data);
      const user = User.fromJSON(jsonData.user);
      setRequestCall(user);
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