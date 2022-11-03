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
import clsx from "clsx";

const MAX_PUBLISHER_PER_PAGE = process.env.REACT_APP_MAX_PATIENTS_PER_PAGE || 10
const MAX_PUBLISHER_IN_CALL_PER_PAGE = 3;

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
          mSubscriber.subscribe(mSession.streams);
        }
      }, [ mSession.streams, mSession.session, mMessage.requestCall]);

    // Request patient to publish
    useEffect(() => {
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
        if (!mPublisher.publisher) mPublisher.publish(mSession.user, true, true);
        setPubPerPage(MAX_PUBLISHER_IN_CALL_PER_PAGE)
      }
      else { 
        if (mPublisher.publisher) mPublisher.unpublish();
        setPubPerPage(MAX_PUBLISHER_PER_PAGE) 
      }
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

      if (targetUser.role !== "nurse" && (!mMessage.requestCall || mMessage.requestCall.id !== targetSubscriber.stream.connection.id)) {
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
          <div className={clsx("callContainer", (inCall)? "inCall" : "")} onClick={onCameraContainerClick}>
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
          {pubPageNumber > 0 ? <vwc-icon-button onClick={prevPage} connotation="info" shape="circled" layout="outlined" icon="arrow-bold-left-solid" style={{position: "absolute", bottom: "32px", right: "84px"}}></vwc-icon-button> : null}
          {pubPageNumber + 1 < maxPageNumber ?   <vwc-icon-button onClick={nextPage} connotation="info" shape="circled" layout="outlined" icon="arrow-bold-right-solid" style={{position: "absolute", bottom: "32px", right: "24px"}}></vwc-icon-button> : null }
          <ConfirmDialog 
            open={openConfirmDialog} 
            confirmAction={confirmDialogConfirmAction} 
            cancelAction={confirmDialogCancelAction} 
            message={confirmDialogMessage}
            dismissAction={confirmDialogCancelAction}>
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