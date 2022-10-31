import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "contexts/session";
import { MessageContext } from "contexts/message";
import ConfirmDialog from "components/ConfirmDialog";
import LayoutContainer from "components/LayoutContainer";
import VideoHoverContainer from 'components/VideoHoverContainer';
import VideoControl from "components/VideoControl";
import InfoBanner from "components/InfoBanner";
import Notification from "components/Notification";
import QueueListDrawer from "components/QueueListDrawer";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";
import User from "entities/user";
import MessageAPI from "api/message";
import './styles.css'

const MAX_PUBLISHER_PER_PAGE = 9
const MAX_PUBLISHER_IN_CALL_PER_PAGE = 4;

function NursePage() {
    const [inCall, setInCall] = useState(false)
    const [targetUser, setTargetUser] = useState(null)
    const [requestCall, setRequestCall] = useState(false)
    const [requestPublishIds, setRequestPublishIds] = useState([])
    const [confirmDialogMessage, setConfirmDialogMessage] = useState("")
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
    const [openNotification, setOpenNotification] = useState(false)
    const [openQueueList, setOpenQueueList] = useState(false)
    const [pubPageNumber, setPubPageNumber] = useState(0)
    const [pubPerPage, setPubPerPage] = useState(MAX_PUBLISHER_PER_PAGE)
    const [maxPageNumber, setMaxPageNumber] = useState(1)

    const navigate = useNavigate();
    const mSession = useContext(SessionContext);
    const mMessage = useContext(MessageContext)
    const mPublisher = usePublisher("cameraContainer");
    const mSubscriber = useSubscriber("cameraContainer");

    useEffect(() => {
        if (!mSession.user || !mSession.session) {
            navigate('/')
            return;
        }
    }, [mSession.user, mSession.session, navigate])

    // Subscribe to all streams
    useEffect(() => {
        if(mSession.session) {
          mSubscriber.subscribe(mSession.streams);
        }
      }, [ mSession.streams, mSession.session]);

    // Request patient to publish
    useEffect(() => {
      let has
      const connectionIds = mSession.connections.filter((connection) => {
        return JSON.parse(connection.data).role === "patient" && (!mMessage.requestCall || connection.id !== mMessage.requestCall.id)
      }).map(connection => connection.id)

      const numberOfPatients = mSession.connections.filter((connection) => { return JSON.parse(connection.data).role === "patient"}).length
      setMaxPageNumber(Math.ceil(numberOfPatients/pubPerPage))

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
        setPubPerPage(MAX_PUBLISHER_IN_CALL_PER_PAGE)
      }
      else { 
        if (mPublisher.publisher) mPublisher.unpublish();
        setPubPerPage(MAX_PUBLISHER_PER_PAGE) 
      }
    }, [inCall, mPublisher.publisher, mSession.user])

    // End Call session if the patient's connection dropped
    useEffect(() => {
      if (!mMessage.requestCall) return;
      if (mSession.connections.find((connection) => connection.id === mMessage.requestCall.id)) {
        setInCall(true)
      }
      else {
        setInCall(false)
      }
    }, [mSession.connections, mMessage.requestCall])

    // Unmute if in a call
    useEffect(() => {
      if (!mPublisher.publisher) return;
      if (inCall) mPublisher.publisher.publishAudio(true)
      else mPublisher.publisher.publishAudio(false)
    }, [inCall, mPublisher.publisher])

    // Open confirm dialog message
    useEffect(() => {
      if (targetUser && confirmDialogMessage) {
        setOpenConfirmDialog(true)
      }
    }, [targetUser, confirmDialogMessage])

    // Open notification
    useEffect(() => {
      if (mMessage.lastRaiseHandRequest) {
        setOpenNotification(true)
      }
    }, [mMessage.lastRaiseHandRequest])
  
    // Request one on one call
    useEffect(() => {
      if (requestCall && targetUser) {
        MessageAPI.requestCall(mSession.session, targetUser);
        setRequestCall(false)
        resetDialogState()
      }
    }, [mSession.session, targetUser, requestCall])

    function resetDialogState() {
      setOpenConfirmDialog(false)
      setTargetUser(null)
      setConfirmDialogMessage("")
    }

    function onCameraContainerClick(e) {
      const targetDom = e.target.closest(".OT_root")
      if (!targetDom) return;
      const targetSubscriber = mSubscriber.subscribers.find((subscriber) => {
        return subscriber.id === targetDom.id
      })
      if (!targetSubscriber) return;

      const targetUser = JSON.parse(targetSubscriber.stream.connection.data)

      if (targetUser.role !== "nurse" && (!mMessage.requestCall || mMessage.requestCall.id !== targetUser.id)) {
          setTargetUser(new User(targetUser.name, targetUser.role, targetSubscriber.stream.connection.id))
          setConfirmDialogMessage(`Are you sure you want to start a call with patient: ${targetUser.name} ?`)
      }
    }

    function confirmDialogConfirmAction() {
      setRequestCall(true)
    }

    function confirmDialogCancelAction() {
      resetDialogState()
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
          setTargetUser(user)
          setRequestCall(true)
      }
    }, [inCall])


    return (
      <QueueListDrawer open={openQueueList} hideDrawer={hideDrawer} acceptCall={acceptRaiseHandRequest} rejectCall={rejectRaiseHandRequest}>
      <div id="nursePage">
          {inCall? 
            <InfoBanner message="In Call"></InfoBanner> : null
          }
          {maxPageNumber === 0 ? <h1 className="noPatientMessage">No Patient</h1> : null }
          <div className="videoContainer" onClick={onCameraContainerClick} >
            <LayoutContainer id="cameraContainer" size="big"/>
          </div>
          {mPublisher.publisher? (
            <VideoHoverContainer>
              <VideoControl 
                publisher={mPublisher.publisher} 
                unpublish={mPublisher.unpublish}
              />
            </VideoHoverContainer>
          ): null}
          <vwc-button
            label="Queue List"
            layout="filled"
            shape="pill"
            type="submit"
            unelevated=""
            connotation="cta"
            onClick={() => setOpenQueueList(true)}
            style={{position: "absolute", bottom: "32px", left: "24px"}}
          >
          <button type="submit" style={{display: "none"}}></button>
          </vwc-button>
          {maxPageNumber > 0 ? <p style={{position: "absolute", bottom: "24px", left: "160px"}}>{`Number of patients: ${mSession.connections.filter((connection) => JSON.parse(connection.data).role === "patient").length}`}</p> : null}
          {pubPageNumber > 0 ? <vwc-icon-button onClick={prevPage} connotation="info" icon="arrow-left-solid" style={{position: "absolute", bottom: "32px", right: "64px"}}></vwc-icon-button> : null}
          {pubPageNumber + 1 < maxPageNumber ?   <vwc-icon-button onClick={nextPage} connotation="info" icon="arrow-right-solid" style={{position: "absolute", bottom: "32px", right: "24px"}}></vwc-icon-button> : null }
          <ConfirmDialog 
            open={openConfirmDialog} 
            confirmAction={confirmDialogConfirmAction} 
            cancelAction={confirmDialogCancelAction} 
            message={confirmDialogMessage}>
          </ConfirmDialog>
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