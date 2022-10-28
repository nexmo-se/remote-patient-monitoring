import { useCallback, useContext, useEffect, useState } from "react"
import { SessionContext } from "contexts/session";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "components/ConfirmDialog";
import MessageAPI from "api/message";
import LayoutContainer from "components/LayoutContainer";
import VideoHoverContainer from 'components/VideoHoverContainer';
import VideoControl from "components/VideoControl";
import InfoBanner from "components/InfoBanner";
import Notification from "components/Notification";
import QueueListDrawer from "components/QueueListDrawer";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";
import './styles.css'
import { MessageContext } from "contexts/message";
import User from "entities/user";

function NursePage() {
    const [in1on1, setIn1on1] = useState(false)
    const [targetSubscriber, setTargetSubscriber] = useState(null)
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
    const [requestOneOnOne, setRequestOneOnOne] = useState(false)
    const [confirmDialogMessage, setConfirmDialogMessage] = useState("")
    const [openNotification, setOpenNotification] = useState(false)
    const [openQueueList, setOpenQueueList] = useState(false)
    const [pubPageNumber, setPubPageNumber] = useState(0)
    const [pubPerPage, setPubPerPage] = useState(4)
    const [maxPageNumber, setMaxPageNumber] = useState(0)


    const navigate = useNavigate();
    const mSession = useContext(SessionContext);
    const mMessage = useContext(MessageContext)
    const mPublisher = usePublisher("cameraContainer", true, true);
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
        if(mSession.session) {
          mSubscriber.subscribe(mSession.streams);
        }
      }, [ mSession.streams, mSession.session]);

    useEffect(() => {
      let connectionIds = mSession.connections.filter((connection) => JSON.parse(connection.data).role === "patient").map(connection => connection.id)
      setMaxPageNumber(Math.ceil(connectionIds.length/pubPerPage))

      const requestConnectionIds = connectionIds.splice(pubPageNumber*pubPerPage, pubPerPage)
      if (requestConnectionIds.length > 0) {
        MessageAPI.requestPublish(mSession.session, requestConnectionIds);
      }
    }, [mSession.connections, mSession.session, pubPageNumber, pubPerPage])

    useEffect(() => {
      if (targetSubscriber && confirmDialogMessage) {
        setOpenConfirmDialog(true)
      }

    }, [targetSubscriber, confirmDialogMessage])

    useEffect(() => {
      if (mPublisher.publisher && targetSubscriber && requestOneOnOne) {
        const userData = JSON.parse(targetSubscriber.stream.connection.data)
        MessageAPI.requestOneOnOne(mSession.session, mPublisher.publisher.stream.id, targetSubscriber.stream.id, new User(userData.name, userData.role, targetSubscriber.stream.connection.id));
        resetDialogState()
        setRequestOneOnOne(false)
      }

    }, [mPublisher.publisher, targetSubscriber, requestOneOnOne])

    useEffect(() => {
      // if patients drop the call

      if (in1on1 && mMessage.requestOneOnOne && !mSubscriber.subscribers.find((subscriber) => subscriber.stream.id === mMessage.requestOneOnOne.requesteeStreamId)) {
        setIn1on1(false)
      }

    }, [mSubscriber.subscribers, in1on1, mMessage.requestOneOnOne])

    useEffect(() => {
        if (in1on1) {
          if (!mPublisher.publisher) mPublisher.publish(mSession.user);
          setPubPerPage(2)
        }
        else { 
          if (mPublisher.publisher) mPublisher.unpublish();
          setPubPerPage(4) 
        }
    }, [in1on1])
  
    function onCameraContainerClick(e) {
      const targetDom = e.target.closest(".OT_root")
      if (!targetDom) return;
      const newTargetSubscriber = mSubscriber.subscribers.find((subscriber) => {
        return subscriber.id === targetDom.id
      })
      if (!newTargetSubscriber) return;

      if (!mMessage.requestOneOnOne || !(mMessage.requestOneOnOne.requestorStreamId === newTargetSubscriber.stream.id || mMessage.requestOneOnOne.requesteeStreamId === newTargetSubscriber.stream.id)) {
          setTargetSubscriber(newTargetSubscriber)
          setConfirmDialogMessage(`Are you sure you want to start 1-1 interation with patient: ${JSON.parse(newTargetSubscriber.stream.connection.data).name} ?`)
      }
    }

    useEffect(() => {
      if (!mPublisher.publisher) return;
      if (in1on1) mPublisher.publisher.publishAudio(true)
      else mPublisher.publisher.publishAudio(false)
    }, [in1on1, mPublisher.publisher])


    function confirmDialogConfirmAction() {
      joinOneOnOneCall();
    }

    function confirmDialogCancelAction() {
      resetDialogState()
    }

    function resetDialogState() {
      setOpenConfirmDialog(false)
      setTargetSubscriber(null)
      setConfirmDialogMessage("")
    }

    function joinOneOnOneCall() {
      setIn1on1(true);
      setRequestOneOnOne(true)
    }

    useEffect(() => {
      if (mMessage.lastRaiseHandRequest) {
        setOpenNotification(true)
      }
    }, [mMessage.lastRaiseHandRequest])

    function hideDrawer() {
      if (openQueueList) {
        setOpenQueueList(false)
      }
    }

    const rejectRaiseHandRequest = useCallback(() => {
      if (mMessage.lastRaiseHandRequest) {
        MessageAPI.rejectRaiseHandRequest(mSession.session, mMessage.lastRaiseHandRequest)
      }
    }, [mMessage.lastRaiseHandRequest, mSession.session])

    const acceptRaiseHandRequest = useCallback((user) => {
      if (!in1on1 && user) {
        const targetSubscriber = mSubscriber.subscribers.find((subscriber) => subscriber.stream.connection.id === user.id)
        if (targetSubscriber) {
          setTargetSubscriber(targetSubscriber)
          joinOneOnOneCall()
        }
      }
      else if (!in1on1 && mMessage.lastRaiseHandRequest) {
        const targetSubscriber = mSubscriber.subscribers.find((subscriber) => subscriber.stream.connection.id === mMessage.lastRaiseHandRequest.id)
        if (targetSubscriber) {
          setTargetSubscriber(targetSubscriber)
          joinOneOnOneCall()
        }
      }
    }, [mSubscriber.subscribers, mMessage.lastRaiseHandRequest, mSession.session])

    function nextPub() {
      setPubPageNumber(pubPageNumber + 1)
    }

    function prevPub() {
      setPubPageNumber(pubPageNumber - 1)
    }

    return (
      <QueueListDrawer open={openQueueList} hideDrawer={hideDrawer} acceptCall={acceptRaiseHandRequest}>
      <div id="nursePage">
          {in1on1? 
            <InfoBanner message="in 1-1 "></InfoBanner> :
            null
          }
          {maxPageNumber === 0 ? <h1 id="no-patient-message">No Patient</h1> : null}
          <div className="videoContainer" onClick={onCameraContainerClick} >
            <LayoutContainer id="cameraContainer" size="big" data-page-number={pubPageNumber}/>
          </div>
          {mPublisher.publisher? (
            <VideoHoverContainer>
              <VideoControl 
                publisher={mPublisher.publisher} 
                unpublish={mPublisher.unpublish}
              />
            </VideoHoverContainer>
          ): null}
          <ConfirmDialog 
            open={openConfirmDialog} 
            confirmAction={confirmDialogConfirmAction} 
            cancelAction={confirmDialogCancelAction} 
            message={confirmDialogMessage}>
          </ConfirmDialog>
          <Notification 
            open={openNotification}
            title="One On One Request"
            message={mMessage.lastRaiseHandRequest ? `Patient: ${mMessage.lastRaiseHandRequest.name} raised 1-1 request` : ""}
            okText={in1on1 ? "Add to Queue" : "Accept"}
            okAction={() => acceptRaiseHandRequest()}
            cancelText="Reject"
            cancelAction={() => rejectRaiseHandRequest()}
            dismissAction={() => setOpenNotification(false)}
          ></Notification>
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
          {pubPageNumber > 0 ? <vwc-icon-button onClick={prevPub} connotation="info" icon="arrow-left-solid" style={{position: "absolute", bottom: "32px", right: "64px"}}></vwc-icon-button> : null}
          {pubPageNumber + 1 < maxPageNumber ?   <vwc-icon-button onClick={nextPub} connotation="info" icon="arrow-right-solid" style={{position: "absolute", bottom: "32px", right: "24px"}}></vwc-icon-button> : null }
      </div>
      </QueueListDrawer>
    )
}

export default NursePage