import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "contexts/session";
import { MessageContext } from "contexts/message";
import StartCallDialog from "components/StartCallDialog";
import LayoutContainer from "components/LayoutContainer";
import VideoHoverContainer from 'components/VideoHoverContainer';
import VideoControl from "components/VideoControl";
import InfoBanner from "components/InfoBanner";
import Notification from "components/Notification";
import QueueListDrawer from "components/QueueListDrawer";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";
import MessageAPI from "api/message";
import './styles.css'
import clsx from "clsx";

const MAX_PUBLISHER_PER_PAGE = process.env.REACT_APP_MAX_PATIENTS_PER_PAGE || 10
const MAX_PUBLISHER_IN_CALL_PER_PAGE = 3;

function NursePage() {
    const [inCall, setInCall] = useState(false)
    const [requestPublishIds, setRequestPublishIds] = useState([])
    const [openNotification, setOpenNotification] = useState(false)
    const [openStartCallDialog, setOpenStartCallDialog] = useState(false)
    const [openQueueList, setOpenQueueList] = useState(false)
    const [pubPageNumber, setPubPageNumber] = useState(0)
    const [pubPerPage, setPubPerPage] = useState(MAX_PUBLISHER_PER_PAGE)
    const [maxPageNumber, setMaxPageNumber] = useState(1)

    const navigate = useNavigate();
    const mSession = useContext(SessionContext);
    const mMessage = useContext(MessageContext)
    const mPublisher = usePublisher("callContainer");
    const mSubscriber = useSubscriber({ 
      call : "callContainer",
      monitor: "monitorContainer"
    });

    useEffect(() => {
        if (!mSession.user || !mSession.session) {
            navigate('/')
            return;
        }
    }, [mSession.user, mSession.session, navigate])

    // Subscribe to all streams
    useEffect(() => {
        if(mSession.session) {
          // Filter the stream that is not destroying
          const streams = mSession.streams.filter((stream) => mMessage.requestPublishConnectionIds.includes(stream.connection.id) )
          mSubscriber.subscribe(streams);
        }
    }, [ mSession.streams, mSession.session, mMessage.requestPublishConnectionIds]);

      useEffect(() => {
      // Update callContainer monitorContaner 's children visibility
      const targetSubscriberInMonitorContainer = mSubscriber.monitorSubscribers.find((subscriber) => subscriber.stream && mMessage.requestCall && mMessage.requestCall.id === subscriber.stream.connection.id)
      const targetSubscriberInCallContainer = mSubscriber.callSubscribers.find((subscriber) => subscriber.stream && mMessage.requestCall && mMessage.requestCall.id === subscriber.stream.connection.id)

      const callContainer = document.getElementById("callContainer")
      const callSubscribersDom = Array.from(callContainer.getElementsByClassName('OT_subscriber'));

      const monitorContainer = document.getElementById("monitorContainer")
      const monitorSubscribersDom = Array.from(monitorContainer.getElementsByClassName('OT_subscriber'));

      callSubscribersDom.forEach((dom) => {
        dom.style.display = "none"
      })
      monitorSubscribersDom.forEach((dom) => {
        dom.style.display = "block"
      })
      if (targetSubscriberInMonitorContainer) {
        document.getElementById(targetSubscriberInMonitorContainer.id).style.display = "none"
      }
      if (targetSubscriberInCallContainer) {
        document.getElementById(targetSubscriberInCallContainer.id).style.display = "block"
      }
      else {
        const targetStream = mSession.streams.find((stream) => mMessage.requestCall && mMessage.requestCall.id === stream.connection.id)
        mSubscriber.subscribeSingleStream(targetStream)
      }

      mSubscriber.callLayout.layout()
      mSubscriber.monitorLayout.layout()

      }, [mMessage.requestCall])

    // Request patient to publish
    useEffect(() => {
      const connectionIds = mSession.connections.filter((connection) => {
        return JSON.parse(connection.data).role === "patient" && (!mMessage.requestCall || connection.id !== mMessage.requestCall.id)
      }).map(connection => connection.id)

      setMaxPageNumber(connectionIds.length/pubPerPage)

      const requestConnectionIds = connectionIds.splice(pubPageNumber*pubPerPage, pubPerPage)
      if (mMessage.requestCall && mMessage.requestCall.id) {
        requestConnectionIds.push(mMessage.requestCall.id)
      }
      if (requestConnectionIds.length > 0 && requestPublishIds !== requestConnectionIds) {
        MessageAPI.requestPublish(mSession.session, requestConnectionIds);
        setRequestPublishIds(requestConnectionIds)
      }
    }, [mSession.connections, mSession.session, pubPageNumber, pubPerPage, mMessage.requestCall])

    // Adjust number of patient in a page
    useEffect(() => {
      if (inCall) {
        if (!mPublisher.publisher) mPublisher.publish(mSession.user);
        mSubscriber.updateSoloAudioSubscriber(null)
        setPubPerPage(MAX_PUBLISHER_IN_CALL_PER_PAGE)
      }
      else { 
        if (mPublisher.publisher) mPublisher.unpublish();
        setPubPerPage(MAX_PUBLISHER_PER_PAGE) 
      }

      if (mSubscriber.callLayout) mSubscriber.callLayout.layout()
      if (mSubscriber.monitorLayout) mSubscriber.monitorLayout.layout()
    }, [inCall, mSession.user])

    // End Call session if the patient's connection dropped
    useEffect(() => {
      if (!mMessage.requestCall) return;
      if (!inCall && mSession.connections.find((connection) => connection.id === mMessage.requestCall.id)) { 
        setInCall(true)
        setPubPageNumber(0)
      }
      else if (inCall && !mSession.connections.find((connection) => connection.id === mMessage.requestCall.id)) {
        setInCall(false)
        setPubPageNumber(0)
      }
    }, [mSession.connections, mMessage.requestCall])

    useEffect(() => {
      if (inCall) {
        mSubscriber.callSubscribers.forEach((subscriber) => {
        if (mMessage.requestCall.id === subscriber.stream.connection.id) subscriber.subscribeToAudio(true)
        else subscriber.subscribeToAudio(false)
        })
        mSubscriber.monitorSubscribers.forEach((subscriber) => {
          subscriber.subscribeToAudio(false)
        })
      }
      else {
        mSubscriber.callSubscribers.forEach((subscriber) => {
          subscriber.subscribeToAudio(false)
         })
         if (mSubscriber.soloAudioSubscriber) {
          mSubscriber.monitorSubscribers.forEach((subscriber) => {
            if (subscriber.id === mSubscriber.soloAudioSubscriber.id) subscriber.subscribeToAudio(true)
            else subscriber.subscribeToAudio(false)
          })
        }
        else {
          mSubscriber.monitorSubscribers.forEach((subscriber) => {
            subscriber.subscribeToAudio(true)
         })
        }
      }  
    }, [mSubscriber.soloAudioSubscriber, inCall, mMessage.requestCall])

    // Open notification
    useEffect(() => {
      if (mMessage.lastRaiseHandRequest) {
        setOpenNotification(true)
      }
    }, [mMessage.lastRaiseHandRequest])

    function onCameraContainerClick(e) {
      const targetDom = e.target.closest(".OT_root")
      if (!targetDom || inCall) return;
  
      if (!mSubscriber.soloAudioSubscriber || mSubscriber.soloAudioSubscriber.id !== targetDom.id) {
        mSubscriber.updateSoloAudioSubscriber(targetDom.id);
      }
      else {
        mSubscriber.updateSoloAudioSubscriber(null)
      }
    }

    function hideDrawer() {
      if (openQueueList) {
        setOpenQueueList(false)
      }
    }

    function nextPage() {
      setPubPageNumber(pubPageNumber + 1)
    }

    function prevPage() {
      setPubPageNumber(pubPageNumber - 1)
    }

    const rejectRaiseHandRequest = useCallback((user) => {
        if (!user) return;
        MessageAPI.rejectRaiseHand(mSession.session, user)
    }, [mSession.session])

    const acceptRaiseHandRequest = useCallback((user, forceEndCall=false) => {
      if (!user) return;
      if (forceEndCall || !inCall) {
        MessageAPI.requestCall(mSession.session, user)
      }
    }, [inCall])

    return (
      <QueueListDrawer open={openQueueList} hideDrawer={hideDrawer} acceptCall={acceptRaiseHandRequest} rejectCall={rejectRaiseHandRequest}>
      <div id="nursePage">
          {inCall? 
            <InfoBanner message="In Call"></InfoBanner> : 
            <p style={{position: "absolute", top: "16px", left: "24px"}}>{`Subscribed Audio: ${mSubscriber.soloAudioSubscriber ? JSON.parse(mSubscriber.soloAudioSubscriber.stream.connection.data).name: "All"}` }</p>
          }
          {maxPageNumber === 0 && !inCall? <h1 className="noPatientMessage">No Patient</h1> : null }
          <div className={clsx("callContainer", (inCall)? "inCall" : "")}>
            <LayoutContainer id="callContainer" size="big"/>
          </div>
          <div className={clsx("monitorContainer", (inCall)? "inCall" : "")} onClick={onCameraContainerClick} >
            <LayoutContainer id="monitorContainer" size="big"/>
          </div>
          {mPublisher.publisher? (
            <VideoHoverContainer className="video-action-container">
              <VideoControl 
                publisher={mPublisher.publisher} 
                unpublish={mPublisher.unpublish}
              />
            </VideoHoverContainer>
          ): null}
          <vwc-icon-button 
          icon="receptionist-solid" 
          layout="filled"
          shape="circled" 
          connotation="info"
          onClick={() => setOpenQueueList(true)}
          style={{position: "absolute", bottom: "32px", left: "24px"}}
          >
          </vwc-icon-button>
          <vwc-button
            label="Start A Call"
            layout="filled"
            shape="pill"
            type="submit"
            unelevated=""
            connotation="cta"
            onClick={() => setOpenStartCallDialog(true)}
            style={{position: "absolute", top: "16px", right: "64px"}}
          >
          <button type="submit" style={{display: "none"}}></button>
          </vwc-button>
          {maxPageNumber > 0 ? <p style={{position: "absolute", bottom: "24px", left: "84px"}}>{`Number of patients: ${mSession.connections.filter((connection) => JSON.parse(connection.data).role === "patient").length}`}</p> : null}
          {pubPageNumber > 0 ? <vwc-icon-button onClick={prevPage} connotation="info" shape="circled" layout="outlined" icon="arrow-bold-left-solid" style={{position: "absolute", bottom: "32px", right: "84px"}}></vwc-icon-button> : null}
          {pubPageNumber + 1 < maxPageNumber ?   <vwc-icon-button onClick={nextPage} connotation="info" shape="circled" layout="outlined" icon="arrow-bold-right-solid" style={{position: "absolute", bottom: "32px", right: "24px"}}></vwc-icon-button> : null }
          <StartCallDialog 
            open={openStartCallDialog} 
            dismissAction={() => setOpenStartCallDialog(false)}>
          </StartCallDialog>
          <Notification 
            open={openNotification}
            title="Call Request"
            message={mMessage.lastRaiseHandRequest ? `Patient: ${mMessage.lastRaiseHandRequest.name} raised a call request` : ""}
            okText={inCall ? "Add to Queue" : "Accept"}
            okAction={() => acceptRaiseHandRequest(mMessage.lastRaiseHandRequest)}
            cancelText="Reject"
            cancelAction={() => rejectRaiseHandRequest(mMessage.lastRaiseHandRequest)}
            dismissAction={() => setOpenNotification(false)}
          ></Notification>
      </div>
      </QueueListDrawer>
    )
}

export default NursePage