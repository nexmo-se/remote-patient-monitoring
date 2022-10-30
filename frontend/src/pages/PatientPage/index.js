import { useContext, useEffect, useState } from "react"
import { SessionContext } from "contexts/session";
import { useNavigate } from "react-router-dom";
import LayoutContainer from "components/LayoutContainer";
import LiveBadge from "components/LiveBadge";
import VideoHoverContainer from "components/VideoHoverContainer";
import VideoControl from "components/VideoControl";
import InfoBanner from "components/InfoBanner";
import Notification from "components/Notification";
import usePublisher from "hooks/publisher";
import { MessageContext } from "contexts/message";
import useSubscriber from "hooks/subscriber";
import MessageAPI from "api/message";
import './styles.css'

const REQUEST_MESSAGE = "A Nurse start 1-1 call"
const REJECT_MESSAGE = "Your request was rejected"
const CALL_ENDED_MESSAGE = "Nurse ended the call"

function PatientPage() {
    const [in1on1, setIn1on1] = useState(false)
    const [openNotification, setOpenNotification] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState(REQUEST_MESSAGE)
    const [disableRequestButton, setDisableRequestButton] = useState(false)
    const [queueNumber, setQueueNumber] = useState(null)

    const mPublisher = usePublisher("cameraContainer", true, true);

    const navigate = useNavigate();
    const mSession = useContext(SessionContext);
    const mMessage = useContext(MessageContext);
    const mSubscriber = useSubscriber({ 
      moderator: "cameraContainer", 
      camera: "cameraContainer", 
      screen: "cameraContainer" 
    });

    useEffect(() => {
        if (!mSession.user || !mSession.room) {
            navigate('/')
            return;
        }
    }, [mSession.user, mSession.room, navigate])

    useEffect(() => {
      if (!mSession.session) {
        return;
      }
      let nurse = mSession.connections.find((connection) => JSON.parse(connection.data).role === "nurse")

      // Unpublish if there is no nurse in the session or you are not requested to publish
      if (!in1on1 && mPublisher.publisher && (!nurse || !mMessage.requestPublishConnectionIds.includes(mSession.session.connection.id))) {
        mPublisher.unpublish()
      }
      else if (nurse && mSession.user.id && mMessage.requestPublishConnectionIds.includes(mSession.session.connection.id) && !mPublisher.isPublishing && !mPublisher.publisher) {
        mPublisher.publish(mSession.user); 
      }
    }, [ mSession.user, mSession.session, mSession.connections, mMessage.requestPublishConnectionIds, mPublisher, in1on1])

    useEffect(() => {
      if (mMessage.requestCall && mMessage.requestCall.id === mSession.user.id) {
        setNotificationMessage(REQUEST_MESSAGE)
        setOpenNotification(true)
        setIn1on1(true);
      }
      else if (in1on1) {  
        setNotificationMessage(CALL_ENDED_MESSAGE)
        setOpenNotification(true)
        setIn1on1(false);
      }
    }, [mMessage.requestCall])

    useEffect(() => {
      if (!mMessage.rejectedRequest) return;
      const me =  mMessage.rejectedRequest.id === mSession.user.id
      if (me) {
        setNotificationMessage(REJECT_MESSAGE)
        setOpenNotification(true)
      }
    }, [mMessage.rejectedRequest])

    useEffect(() => {
      if (!mSession.user) return;
      const meIndex =  mMessage.raisedHands.findIndex((user) => user.id === mSession.user.id)
      if (meIndex !== -1) {
        setQueueNumber(meIndex + 1)
      }
      else { 
        setQueueNumber(null) 
        setDisableRequestButton(false)
      }

    }, [mMessage.raisedHands])

    function raiseHand() {
      MessageAPI.raiseHand(mSession.session, mSession.user);
      setDisableRequestButton(true);
    }

    useEffect(() => {
      if (!mPublisher.publisher) return;
      if (in1on1) mPublisher.publisher.publishAudio(true)
      else mPublisher.publisher.publishAudio(false)
    }, [in1on1, mPublisher.publisher])

    useEffect(() => {
      if (in1on1) {
        const nurseStreams = mSession.streams.filter((stream) => JSON.parse(stream.connection.data).role === "nurse")
        mSubscriber.subscribe(nurseStreams)
      }
      else {
        mSubscriber.unsubscribe()
      }

    }, [in1on1, mSession.streams])

    return (
      <div id="patientPage">
        {!in1on1 ? 
          <>
          <h1 id="monitoring-message">You are now under monitoring...</h1>
          <vwc-button
            label={disableRequestButton? "Request sent":"Request 1-1"}
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
          <InfoBanner message="in 1-1"></InfoBanner>
        }
        <div className="cameraContainer">
            <LayoutContainer id="cameraContainer" size="big" hidden={!in1on1} />
        </div>
        {in1on1 && mPublisher.publisher ? (
          <VideoHoverContainer>
            <VideoControl 
              publisher={mPublisher.publisher} 
              unpublish={mPublisher.unpublish}
            />
          </VideoHoverContainer>
        ): null}
        {mPublisher.publisher ?
          <div className="logoContainer">
            <LiveBadge></LiveBadge>
          </div>  : ""
        }
        <Notification 
        open={openNotification}
        title="One on One Request."
        message={notificationMessage}
        okText="Ok"
        dismissAction={() => setOpenNotification(false)}
        ></Notification>
      </div>
    )
}

export default PatientPage