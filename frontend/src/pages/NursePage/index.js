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
import AlarmControl from "components/AlarmControl";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";
import MessageAPI from "api/message";
import './styles.css'
import clsx from "clsx";
import User from "entities/user";

function NursePage() {
    const [inCall, setInCall] = useState(false)
    const [openNotification, setOpenNotification] = useState(false)
    const [openStartCallDialog, setOpenStartCallDialog] = useState(false)
    const [openQueueList, setOpenQueueList] = useState(false)
    const [alarmActionsPosition, setAlarmActionsPosition] = useState({display: "none"})
    const [selectedUser, setSelectedUser] = useState()
    
    const navigate = useNavigate();
    const mSession = useContext(SessionContext);
    const mMessage = useContext(MessageContext)
    const mPublisher = usePublisher("nurseContainer");
    const mSubscriber = useSubscriber({ 
      call : "callContainer",
      monitor: "monitorContainer"
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
    }, [mSession.user, mSession.session, navigate])

    // Subscribe to all streams
    useEffect(() => {
        mSubscriber.subscribe(mSession.streams);
    }, [ mSession.streams]);

    useEffect(() => {
    // Remove user from missingUsers list
    if (mMessage.requestCall) mMessage.removeMissingUser(mMessage.requestCall)

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

    // delay to ensure style is applied before layout
    setTimeout(function() {
      mSubscriber.callLayout.layout()
      mSubscriber.monitorLayout.layout()
    }, 2000);

    }, [mMessage.requestCall])

    // Adjust number of patient in a page
    useEffect(() => {
      if (inCall) {
        if (!mPublisher.publisher) mPublisher.publish(mSession.user);
        mSubscriber.updateSoloAudioSubscriber(null)
      }
      else if (mPublisher.publisher) { 
        mPublisher.unpublish();
        MessageAPI.requestCall(mSession.session, new User())
      }

      if (mSubscriber.callLayout) mSubscriber.callLayout.layout()
      if (mSubscriber.monitorLayout) mSubscriber.monitorLayout.layout()
    }, [inCall, mSession.user])

    // End Call session if the patient's connection dropped
    useEffect(() => {
      if (!mMessage.requestCall) return;
      if (!inCall && mSession.connections.find((connection) => connection.id === mMessage.requestCall.id)) { 
        setInCall(true)
        MessageAPI.requestCall(mSession.session, mMessage.requestCall);
      }
      else if (inCall && !mSession.connections.find((connection) => connection.id === mMessage.requestCall.id)) {
        setInCall(false)
        MessageAPI.requestCall(mSession.session, new User());
      }
    }, [mSession.connections, mMessage.requestCall])

    useEffect(() => {
      if (inCall) {
        mSubscriber.callSubscribers.forEach((subscriber) => {
        if (subscriber.stream && mMessage.requestCall.id === subscriber.stream.connection.id) subscriber.setAudioVolume(100)
        else subscriber.setAudioVolume(0)
        })
        mSubscriber.monitorSubscribers.forEach((subscriber) => {
          subscriber.setAudioVolume(0)
          mSubscriber.updateMuteIconVisibility(subscriber, null, true)
        })
      }
      else {
        mSubscriber.callSubscribers.forEach((subscriber) => {
          subscriber.setAudioVolume(0)
         })
         if (mSubscriber.soloAudioSubscriber) {
          mSubscriber.monitorSubscribers.forEach((subscriber) => {
            if (subscriber.id === mSubscriber.soloAudioSubscriber.id) {
              subscriber.setAudioVolume(100)
              mSubscriber.updateMuteIconVisibility(subscriber, null, false)
            }
            else {
              subscriber.setAudioVolume(0)
              mSubscriber.updateMuteIconVisibility(subscriber, null, true)
            }
          })
        }
        else {
          mSubscriber.monitorSubscribers.forEach((subscriber) => {
            subscriber.setAudioVolume(100)
            mSubscriber.updateMuteIconVisibility(subscriber, null, false)
         })
        }
      }  
    }, [mSubscriber.soloAudioSubscriber, inCall, mMessage.requestCall, mSubscriber.monitorSubscribers])

    // Open notification
    useEffect(() => {
      if (mMessage.lastRaiseHandRequest) {
        setOpenNotification(true)
      }
    }, [mMessage.lastRaiseHandRequest])

    useEffect(() => {
      let monitorSubscribersDom = document.getElementById("monitorContainer")
      let videosDoms = monitorSubscribersDom.querySelectorAll(".OT_root")

      videosDoms.forEach((video) => {
        video.addEventListener("mouseenter", showAlarmAction)
        video.addEventListener("mouseleave", hideAlarmAction)
      })

      return () => {
        videosDoms.forEach((video) => {
          video.removeEventListener("mouseenter", showAlarmAction)
          video.removeEventListener("mouseleave", hideAlarmAction)
        })
      }

    }, [mSubscriber.monitorSubscribers])

    useEffect(() => {
      if (selectedUser && !mMessage.missingUsers.find((user) => user.id === selectedUser.id)) {
        removeAlarmVisibility()
      }
    }, [mMessage.missingUsers, selectedUser])

    function setSoloAudio(e) {
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

    const rejectUser = useCallback((user) => {
        if (!user) return;
        MessageAPI.rejectRaiseHand(mSession.session, user)
    }, [mSession.session])

    const callUser = useCallback(async (user, forceEndCall=false) => {
      if (!user) return;
      if (forceEndCall || !inCall) {
        await MessageAPI.requestCall(mSession.session, user)
      }
    }, [inCall])

    const showAlarmAction = useCallback((e) => {
      const targetDom = e.target.closest(".OT_root")
      if (!targetDom || !targetDom.classList.contains("missing")) {
        removeAlarmVisibility()
        return;
      }

      let style = {
        display: "block",
        position: "absolute",
        left: `${targetDom.offsetLeft + 8}px`,
        top: `${targetDom.offsetTop + targetDom.offsetHeight - 56}px`,
        backgroundColor: "rgb(255,255,255,0.3)",
        padding: "4px 12px"
      }
      const subscriber = mSubscriber.monitorSubscribers.find((subscriber) => subscriber.id === targetDom.id)
      if (subscriber && subscriber.stream) {
        let user = JSON.parse(subscriber.stream.connection.data)
        setSelectedUser(new User(user.name, user.role, subscriber.stream.connection.id))
      }
      
      setAlarmActionsPosition(style)
    },[mSubscriber.monitorSubscribers])

 
    const hideAlarmAction =  useCallback((e) => {
      if (!e.toElement || e.toElement.classList.contains("alarm-control") || e.toElement.id === "mute-notification-button" || e.toElement.id === "call-button") return;
   
      setSelectedUser(null)
      removeAlarmVisibility()
    }, [])

    
    function removeAlarmVisibility() {
      let style = {
        display: "none"
      }
      setAlarmActionsPosition(style)
    }

    return (
      <QueueListDrawer open={openQueueList} hideDrawer={hideDrawer} acceptCall={callUser} rejectCall={rejectUser}>
      <div id="nursePage">
          {inCall? 
            <InfoBanner message="In Call"></InfoBanner> : 
            <p style={{position: "absolute", top: "16px", left: "24px"}}>{`Subscribed Audio: ${mSubscriber.soloAudioSubscriber && mSubscriber.soloAudioSubscriber.stream ? JSON.parse(mSubscriber.soloAudioSubscriber.stream.connection.data).name: "All"}` }</p>
          }
          {mSession.connections.length === 1 && !inCall? <h1 className="noPatientMessage">No Patient</h1> : null }
          <div className={clsx("callContainer", (inCall)? "inCall" : "")}>
            <LayoutContainer id="callContainer" size="big"/>
            <div className="nurseContainer">
            <LayoutContainer id="nurseContainer" size="big"/>
            </div>
          </div>
          <div className={clsx("monitorContainer", (inCall)? "inCall" : "")} onClick={setSoloAudio}>
            <LayoutContainer id="monitorContainer" size="big"/>
            <AlarmControl style={alarmActionsPosition} selectedUser={selectedUser} acceptCall={callUser} closeAlarm={removeAlarmVisibility}></AlarmControl>
          </div>
          {mPublisher.publisher? (
            <VideoHoverContainer className="videoCallControls">
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
          {mSession.connections.length > 1 ? <p style={{position: "absolute", bottom: "24px", left: "84px"}}>{`Number of patients: ${mSession.streams.filter((stream) => JSON.parse(stream.connection.data).role === "patient").length}`}</p> : null}
          <StartCallDialog 
            open={openStartCallDialog} 
            dismissAction={() => setOpenStartCallDialog(false)}>
          </StartCallDialog>
          <Notification 
            open={openNotification}
            title="Call Request"
            message={mMessage.lastRaiseHandRequest ? `Patient: ${mMessage.lastRaiseHandRequest.name} raised a call request` : ""}
            okText={inCall ? "Add to Queue" : "Accept"}
            okAction={() => callUser(mMessage.lastRaiseHandRequest)}
            cancelText="Reject"
            cancelAction={() => rejectUser(mMessage.lastRaiseHandRequest)}
            dismissAction={() => setOpenNotification(false)}
          ></Notification>
      </div>
      </QueueListDrawer>
    )
}

export default NursePage