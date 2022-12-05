import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "contexts/session";
import { MessageContext } from "contexts/message";
import LayoutContainer from "components/LayoutContainer";
import LiveBadge from "components/LiveBadge";
import VideoHoverContainer from "components/VideoHoverContainer";
import VideoControl from "components/VideoControl";
import InfoBanner from "components/InfoBanner";
import Notification from "components/Notification";
import usePublisher from "hooks/publisher";
import useSubscriber from "hooks/subscriber";
import MessageAPI from "api/message";
import './styles.css'

const REQUEST_MESSAGE = "A Nurse start a call"
const REJECT_MESSAGE = "Your request was rejected"
const CALL_ENDED_MESSAGE = "Nurse left the call"

function PatientPage() {
    const [inCall, setInCall] = useState(false)
    const [openNotification, setOpenNotification] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState(REQUEST_MESSAGE)
    const [disableRequestButton, setDisableRequestButton] = useState(true)
    const [queueNumber, setQueueNumber] = useState(null)

    const navigate = useNavigate();
    const mSession = useContext(SessionContext);
    const mMessage = useContext(MessageContext);
    const mPublisher = usePublisher("cameraContainer");
    const mSubscriber = useSubscriber({ 
        call : "cameraContainer",
        monitor: "cameraContainer"
      });


    useEffect(() => {
        window.onpopstate = e => {
          window.location.reload(true)
       }
    },[])

    useEffect(() => {
        if (!mSession.user || !mSession.session) {
            navigate('/')
            return;
        }
        else if (!mPublisher.publisher) {
          mPublisher.publish(mSession.user)
        }
    }, [mSession.user, mSession.session, navigate])

    useEffect(() => {
      let nurse = mSession.connections.find((connection) => JSON.parse(connection.data).role === "nurse")
      if (!nurse && inCall) {
        notify(CALL_ENDED_MESSAGE); setInCall(false);
      }
      else if (nurse && !mMessage.raisedHands.find((raisehand) => raisehand.id === mSession.user.id)) {
        setDisableRequestButton(false)
      }
      else if (!nurse) {
        setDisableRequestButton(true)
      }
    
    }, [mSession.connections, inCall, mMessage.raisedHands])


    useEffect(() => {
      if (mMessage.requestCall && mSession.user && mMessage.requestCall.id === mSession.user.id) {
        notify(REQUEST_MESSAGE)
        setInCall(true);
      }
      else if (inCall) {
        notify(CALL_ENDED_MESSAGE)
        setInCall(false);
      }
    }, [mSession.user, mMessage.requestCall])

    useEffect(() => {
      if (!mMessage.rejectedRequest) return;
      if (mMessage.rejectedRequest.id === mSession.user.id) {
        notify(REJECT_MESSAGE)
      }
    }, [mSession.user, mMessage.rejectedRequest])

    // Set Queue number
    useEffect(() => {
      if (!mSession.user) return;
      const meIndex =  mMessage.raisedHands.findIndex((user) => user.id === mSession.user.id)
      if (meIndex !== -1) {
        setQueueNumber(meIndex + 1)
      }
      else { 
        setQueueNumber(null) 
      }

    }, [mMessage.raisedHands, mSession.user])

    // Unmute if in a call
    useEffect(() => {
      if (!mPublisher.publisher) return;
        mPublisher.publisher.publishAudio(true)
        mPublisher.publisher.publishVideo(true)
    }, [mPublisher.publisher, mMessage.requestCall])

    // Subscribe to in the call
    useEffect(() => {
      if (inCall) {
        const nurseStreams = mSession.streams.filter((stream) => JSON.parse(stream.connection.data).role === "nurse")
        if (nurseStreams.length > 0) mSubscriber.subscribe(nurseStreams)
      }
      else {
        mSubscriber.unsubscribe()
      }
    }, [inCall, mSession.streams])

    function notify(message) {
      setNotificationMessage(message)
      setOpenNotification(true)
    }

    function raiseHand() {
      MessageAPI.raiseHand(mSession.session, mSession.user);
      setDisableRequestButton(true);
    }

    return (
      <div id="patientPage">
        {!inCall ? 
          <>
          <h1 id="monitoring-message">You are now under monitoring...</h1>
          <vwc-button
            label={mMessage.raisedHands.find((raisehand) => raisehand.id === mSession.user.id)? "Request sent":"Call A Nurse"}
            layout="filled"
            shape="pill"
            type="submit"
            unelevated=""
            connotation="cta"
            onClick={raiseHand}
            disabled={ disableRequestButton || undefined}
          >
            <button type="submit" style={{display: "none"}}></button>
          </vwc-button>
          { queueNumber ? <p>{`Your queue number: ${queueNumber}`}</p> : null
          }
          </> : 
          <InfoBanner message="In Call"></InfoBanner>
        }
        <div className="videoContainer">
            <LayoutContainer id="cameraContainer" size="big" hidden={!inCall} />
        </div>
        {inCall && mPublisher.publisher ? (
          <VideoHoverContainer>
            <VideoControl 
              publisher={mPublisher.publisher} 
              unpublish={mPublisher.unpublish}
            />
          </VideoHoverContainer>
        ): null}
        {mPublisher.publisher && !inCall?
          <div className="liveBadgeContainer">
            <LiveBadge></LiveBadge>
          </div>  : ""
        }
        <Notification 
        open={openNotification}
        title={notificationMessage === CALL_ENDED_MESSAGE ? "Call Ended" : "Call Request"}
        message={notificationMessage}
        okText="Ok"
        dismissAction={() => setOpenNotification(false)}
        ></Notification>
      </div>
    )
}

export default PatientPage