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
import OT from "@vonage/client-sdk-video";
import { MonitorType } from "utils/constants";
import { HostRole } from "utils/utils";
import { MediaProcessorConnector} from '@vonage/media-processor'
import MediaProcessorHelperWorker from "helpers/MediaProcessorHelperWorker";
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

import './styles.css'

const REQUEST_MESSAGE = `A ${HostRole} start a call`
const REJECT_MESSAGE = "Your request was rejected"
const CALL_ENDED_MESSAGE = `${HostRole} left the call`
const HUMAN_DETECTION_TIMESTAMP = 2000

function ParticipantPage() {
    const [inCall, setInCall] = useState(false)
    const [openNotification, setOpenNotification] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState(REQUEST_MESSAGE)
    const [disableRequestButton, setDisableRequestButton] = useState(true)
    const [queueNumber, setQueueNumber] = useState(null)
    const [humanDetectionInterval, setHumanDetectionInterval] = useState()
    const [isMeExist, setIsMeExist] = useState(true)
    const [hostConnectionIds, setHostConnectionIds] = useState([])

    const navigate = useNavigate();
    const mSession = useContext(SessionContext);
    const mMessage = useContext(MessageContext);
    const mPublisher = usePublisher("cameraContainer");
    const mSubscriber = useSubscriber({ 
        call : "cameraContainer",
        monitor: "cameraContainer"
      });

    let mediaProcessor = null

    useEffect(() => {
        window.onpopstate = e => {
          window.location.reload(true)
       }
    },[])

    useEffect(() => {
      if(mPublisher.stream) {
        setupMediaHelper()
      }
    }, [mPublisher.stream])

    // useEffect(() => {
    //   if (mediaProcessor) {
    //     changeTransformType(mMessage.monitoringType)
    //   }
    // }, [mMessage.monitoringType])

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
      let hostConnectionIds = mSession.connections.filter((connection) => JSON.parse(connection.data).role === "host").map((connection) => connection.id)
      setHostConnectionIds( (prevConnectionIds) => {
        if (prevConnectionIds.sort().toString() !== hostConnectionIds.sort().toString()) {
          return hostConnectionIds
        }
        return prevConnectionIds
      })

    }, [mSession.connections])

    useEffect(() => {
      if (hostConnectionIds.length === 0 && inCall) {
        notify(CALL_ENDED_MESSAGE); setInCall(false);
      }
      else if (hostConnectionIds.length > 0 && !mMessage.raisedHands.find((raisehand) => raisehand.id === mSession.user.id)) {
        setDisableRequestButton(false)
      }
      else if (hostConnectionIds.length === 0) {
        setDisableRequestButton(true)
      }
    
    }, [hostConnectionIds, inCall, mMessage.raisedHands])

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
        const hostStreams = mSession.streams.filter((stream) => JSON.parse(stream.connection.data).role === "host")
        if (hostStreams.length > 0) mSubscriber.subscribe(hostStreams)
      }
      else {
        mSubscriber.unsubscribe()
      }
    }, [inCall, mSession.streams])

    useEffect(() => {
      if (mPublisher.publisher) {
         // send camera image as bitmap
        if (humanDetectionInterval) {
          clearInterval(humanDetectionInterval)
        }
        const publisherDom = document.getElementById(mPublisher.publisher.id)
        const publisherVideoDom  = publisherDom.getElementsByTagName('video')[0];

        const interval = setInterval(async () => {
          const bitmap = await createImageBitmap(publisherVideoDom)
            const hasHuman = await detectHuman(bitmap)
            setIsMeExist(hasHuman)
          }, HUMAN_DETECTION_TIMESTAMP);
          setHumanDetectionInterval(interval)
      }
    }, [mPublisher.publisher])
    
    useEffect(() => {
      if (!mSession.session) return;
      if (hostConnectionIds.length > 0) {
       MessageAPI.updateUserState(mSession.session, mSession.user, isMeExist)
      }
    }, [isMeExist, mSession.session, hostConnectionIds])

    async function setupMediaHelper() {
      let processor = new MediaProcessorHelperWorker()

      processor.init(MonitorType.FACE_MESH).then( () => {
        const connector = new MediaProcessorConnector(processor)

        processor.getEventEmitter().on('error', (e => {
          console.error(e)
        }))
        processor.getEventEmitter().on('pipelineInfo', (i => {
          console.info(i)
        }))
        processor.getEventEmitter().on('warn', (w => {
          console.warn(w)
        }))

        if (OT.hasMediaProcessorSupport()) {
          mPublisher.publisher
          .setVideoMediaProcessorConnector(connector)
          .then(() => {
          })
          .catch((e) => {
            console.error(e);
          });
        }  else {
          console.log('Browser does not support media processors');
        }
      })
    }

    async function detectHuman(imageBitmap) {
      // Load model
      await tf.setBackend('webgl'); // or 'cpu' if needed
      await tf.ready();             // Ensure backend is ready

      const model = await cocoSsd.load();

      // Convert ImageBitmap to HTMLCanvasElement
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0);
    
      // Run detection
      const predictions = await model.detect(canvas);

      // Check if any prediction is a "person"
      const hasPerson = predictions.some(p => p.class === 'person');
      return hasPerson;
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
      <div id="participantPage">
        {!inCall ? 
          <>
          <h1 id="monitoring-message">You are now under monitoring...</h1>
          <vwc-button
            label={mMessage.raisedHands.find((raisehand) => raisehand.id === mSession.user.id)? "Request sent":`Call ${HostRole}`}
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

export default ParticipantPage