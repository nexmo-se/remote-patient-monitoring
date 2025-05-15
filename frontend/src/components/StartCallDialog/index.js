// @flow
import {useRef, useEffect, useContext} from 'react';
import { SessionContext } from "contexts/session";
import { MessageContext } from "contexts/message";

import MessageAPI from "api/message";
import '@vonage/vwc-dialog';
import '@vonage/vwc-button';
import User from 'entities/user';
import { ParticipantRole } from "utils/utils";

export default function StartCallDialog({open, dismissAction}) {
  const ref = useRef(null);
  const mSession = useContext(SessionContext);
  const mMessage = useContext(MessageContext)

  useEffect(() => {
    if (!ref) return;
     ref.current.addEventListener('closed', dismissAction);
  }, [ref]);
  
  
  function call(e, connection) {
    e.preventDefault();
    const connectionData = JSON.parse(connection.data);
    MessageAPI.requestCall(mSession.session, new User(connectionData.name, connectionData.role,connection.id))
    dismissAction()
  }

  return (
  <vwc-dialog open={open || undefined} ref={ref} heading={`Call A ${ParticipantRole}`} close-button="true">
    <hr></hr>
    <vwc-list>
    {mSession.connections.map((connection, index) => {
        const connectionData = JSON.parse(connection.data);
        if (connectionData.role !== "participant" || (mMessage.requestCall && mMessage.requestCall.id === connection.id)) return;
        else {
        return (
          <div key={`call-user-hr-${index}`}>
            <vwc-list-item  style={{textAlign: "left", position: "relative"}}data-connection-id={connection.id} mwc-list-item="" tabindex="0" aria-disabled="false">
              <p style={{margin: 0, fontSize: "18px", lineHeight: "32px", paddingRight: "64px", paddingLeft: "16px"}}>{connectionData.name}</p>
              <vwc-button style={{position: "absolute", top: 0, right: "8px"}} label="Call" layout="outlined" shape="pill" dense="" type="submit" unelevated="" onClick={(e) => call(e,connection)}>
                  <button type="submit" style={{display: "none"}}></button>
              </vwc-button>
            </vwc-list-item> 
            <hr></hr>
          </div>
        )
        }
    })
    }
    </vwc-list>
  </vwc-dialog>
  )
}