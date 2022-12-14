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
// import { FaceDetection } from '@mediapipe/face_detection';
import { Holistic } from '@mediapipe/holistic';
import './styles.css'

const REQUEST_MESSAGE = "A Nurse start a call"
const REJECT_MESSAGE = "Your request was rejected"
const CALL_ENDED_MESSAGE = "Nurse left the call"
const HUMAN_DETECTION_TIMESTAMP = 2000

function PatientPage() {
    const [inCall, setInCall] = useState(false)
    const [openNotification, setOpenNotification] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState(REQUEST_MESSAGE)
    const [disableRequestButton, setDisableRequestButton] = useState(true)
    const [queueNumber, setQueueNumber] = useState(null)
    const [humanDetectionInterval, setHumanDetectionInterval] = useState()
    const [humanDetection, setHumanDetection ] = useState()
    const [isMeExist, setIsMeExist] = useState(true)
    const [nurseConnectionIds, setNurseConnectionIds] = useState([])

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
       setupMediaHelper()
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
      let nurseConnectionIds = mSession.connections.filter((connection) => JSON.parse(connection.data).role === "nurse").map((connection) => connection.id)
      setNurseConnectionIds( (prevConnectionIds) => {
        if (prevConnectionIds.sort().toString() !== nurseConnectionIds.sort().toString()) {
          return nurseConnectionIds
        }
        return prevConnectionIds
      })

    }, [mSession.connections])

    useEffect(() => {
      if (nurseConnectionIds.length === 0 && inCall) {
        notify(CALL_ENDED_MESSAGE); setInCall(false);
      }
      else if (nurseConnectionIds.length > 0 && !mMessage.raisedHands.find((raisehand) => raisehand.id === mSession.user.id)) {
        setDisableRequestButton(false)
      }
      else if (nurseConnectionIds.length === 0) {
        setDisableRequestButton(true)
      }
    
    }, [nurseConnectionIds, inCall, mMessage.raisedHands])

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

    useEffect(() => {
      if (mPublisher.publisher && humanDetection) {
         // send camera image as bitmap
        if (humanDetectionInterval) {
          clearInterval(humanDetectionInterval)
        }
        const publisherDom = document.getElementById(mPublisher.publisher.id)
        const publisherVideoDom  = publisherDom.getElementsByTagName('video')[0];

        const interval = setInterval(async () => {
          const bitmap = await createImageBitmap(publisherVideoDom)
            humanDetection.send({ image: bitmap })
            .catch(e => {
              console.log("detection error: ", e)
            })
          }, HUMAN_DETECTION_TIMESTAMP);
          setHumanDetectionInterval(interval)
      }
    }, [mPublisher.publisher, humanDetection])
    
    useEffect(() => {
      if (!mSession.session) return;
      if (nurseConnectionIds.length > 0) {
       MessageAPI.updateUserState(mSession.session, mSession.user, isMeExist)
      }
    }, [isMeExist, mSession.session, nurseConnectionIds])

    async function setupMediaHelper() {
      /** Face Only detection **/
      // const detection = new FaceDetection({
      //   locateFile: (file) => {
      //     return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`;
      //   },
      // });
      // detection.setOptions({
      // selfieMode: true,
      // model: 'short',
      // minDetectionConfidence: 0.7,
      // });

      const detection = new Holistic({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
      }});
      
      detection.setOptions({
        staticImageMode: true,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
      });
      
      detection.onResults(onResults);
      await detection.initialize();
      setHumanDetection(detection)
    }

    function onResults(results) {
      // if (results.detections.length > 0) { // For Face Only detection
      if (results.faceLandmarks || results.leftHandLandmarks || results.rightHandLandmarks) {
        setIsMeExist(true)
      }
      else {
        setIsMeExist(false)
      }
    }
    

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