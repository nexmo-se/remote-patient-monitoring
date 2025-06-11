// @flow
import { MessageContext } from "contexts/message";
import { SessionContext } from "contexts/session";
import { useState, useEffect, useContext } from "react";
import LayoutManager from "utils/layout-manager";

function useSubscriber({call, monitor}){
  const [ subscribed, setSubscribed ] = useState([]);
  const [ callSubscribers, setCallSubscribers ] = useState([]);
  const [ monitorSubscribers, setMonitorSubscribers ] = useState([]);
  const [ monitorSubscribersAudioVolume, setMonitorSubscribersAudioVolume] = useState([]);
  const [ soloAudioSubscriber, setSoloAudioSubscriber] = useState()
  const [ inCallConnectionId, setInCallConnectionId] = useState()
  const [ muteAllSubscriber, setMuteAllSubscriber] = useState(false)

  const [ loudestSubscriber, setLoudestSubscriber] = useState();
  const [ callLayout, setCalLayout ] = useState(new LayoutManager(call));
  const [ monitorLayout, setMonitorLayout ] = useState(new LayoutManager(monitor));  
  const mSession = useContext(SessionContext)
  const mMessage = useContext(MessageContext)

  useEffect(()=> {
    if (!mSession.changedStream) return;
    // Ensure cover the stream that doesnt trigger changedStream event
    const targetCallSubscriber = callSubscribers.find((subscriber) => 
      mSession.changedStream.stream.id === subscriber.stream.id
    )

    updateMuteIconVisibility(targetCallSubscriber, !mSession.changedStream.stream.hasAudio)

  }, [mSession.changedStream])

  function updateMuteIconVisibility(subscriber, isMuted) {
    if (!subscriber) return;

    if (isMuted) {
      const targetDom = document.getElementById(subscriber.id);
      if (targetDom) insertMuteIcon(subscriber,targetDom);
    }
    else {
      const targetDom = document.getElementById(`${subscriber.id}-mute`);
      if (targetDom) targetDom.remove();
    }
  }

  function insertMuteIcon(targetSubscriber,targetDom) {
    if (document.getElementById(`${targetSubscriber.id}-mute`)) return;
    const childNodeStr = `<div
    id=${targetSubscriber.id}-mute
    style="
    position: absolute; 
    bottom: 8px; 
    right: 8px;
    background: url(${process.env.PUBLIC_URL}/assets/mute.png);
    background-position: center;
    background-size: contain;
    height: 18px;
    width: 18px;
    background-repeat: no-repeat;">
    </div>`;
    targetDom.insertAdjacentHTML('beforeend', childNodeStr);
  }

  function handleAudioLevelChange(e) {
      setMonitorSubscribersAudioVolume((prev) => {
        // check if it is monitor subscriber
        const targetElemet = document.getElementById(e.target.id);
        if (targetElemet && targetElemet.closest(".layoutContainer").getAttribute("id") !== "monitorContainer") return prev
        const subscriberIndex = prev.findIndex((subscriber) => subscriber.id === e.target.id)      
        let sortedSubscribers;
        if (subscriberIndex !== -1) {
          prev[subscriberIndex].audioLevel = e.audioLevel
          sortedSubscribers = prev.sort((a,b) => a.audioLevel < b.audioLevel ? 1 : -1)
        }
        else {
          const data = {
            id: e.target.id,
            subscriber: e.target,
            audioLevel: e.audioLevel
          }
          sortedSubscribers = [...prev, data].sort((a,b) => a.audioLevel < b.audioLevel ? 1 : -1)
        }
        // filter hidden subscriber
        let monitorContainer = document.getElementsByClassName("monitorContainer")[0]
        let inCallSubscriberId;
        if (monitorContainer) {
          for (let dom of monitorContainer.getElementsByClassName("OT_root")) {
            if (dom.style.display === "none") inCallSubscriberId = dom.id
          }
        }

        if (inCallSubscriberId) sortedSubscribers = sortedSubscribers.filter((subscriber) => subscriber.id !== inCallSubscriberId)
     
        setLoudestSubscriber((prev) => {
          if (!prev || (sortedSubscribers.length > 0 &&  sortedSubscribers[0].audioLevel > 0.05)) return sortedSubscribers[0]
          else return prev
        })
        return sortedSubscribers
      })
  }

  function updateSoloAudioSubscriber(subscriberId) {
    if (!subscriberId ) {
      setSoloAudioSubscriber(null)
      return;
    }
    // Find Subscriber 
    const targetSubscriber = monitorSubscribers.find((subscriber) =>
    subscriber.id === subscriberId)

    if (targetSubscriber) setSoloAudioSubscriber(targetSubscriber)
    
  }

  function updateInCallConnectionId(connectionId) {
    setInCallConnectionId(connectionId)
  }

  function toggleMuteAllSubscriberAudio() {
    setMuteAllSubscriber((prevState) => !prevState)
  }

  useEffect(() => {
    if (!mSession.user || mSession.user.role !== "host") return;

    let prevLoudestDom = document.getElementsByClassName("loudest")[0];
         
    if (!loudestSubscriber) {
      return
    }
    
    let currentLoudestDom = document.getElementById(loudestSubscriber.id);
    let targetId = loudestSubscriber.id;

    if (prevLoudestDom &&  prevLoudestDom.id === targetId)  return;
    if (prevLoudestDom) prevLoudestDom.classList.remove('loudest')
    if (currentLoudestDom && !currentLoudestDom.classList.contains("loudest")) currentLoudestDom.classList.add("loudest")

  },[loudestSubscriber, mSession.user, mMessage.requestCall])

  useEffect(() => {
    if (!mSession.user || mSession.user.role !== "host") return;
    let prevMissingSubscriberDom = document.querySelectorAll(".missing");
    // Get corresponding subscriber ids
    const missingSubscribers = monitorSubscribers.filter((subscriber) => mMessage.missingUsers.find((user) => {
      return user.id === subscriber.stream.connection.id
    }))

    prevMissingSubscriberDom.forEach((subscriberDom) => {
      // find corresponding monitor subscriber id
      if (!missingSubscribers.find((subscriber) => subscriberDom.id === subscriber.id)) {
        subscriberDom.classList.remove('missing')
      }
    })

    missingSubscribers.forEach((subscriber) => {
      let missingUserDom = document.getElementById(subscriber.id)
      if (missingUserDom && !missingUserDom.classList.contains("missing")) missingUserDom.classList.add("missing")
    })
  }, [mSession.user, mMessage.missingUsers, monitorSubscribers])
  
  function unsubscribe() {
    callSubscribers.forEach((subscriber) => {
      if (subscriber.stream) mSession.session.unsubscribe(subscriber);
    })
    monitorSubscribers.forEach((subscriber) => {
      if (subscriber.stream) mSession.session.unsubscribe(subscriber);
    })
      setCallSubscribers([]);
      setMonitorSubscribers([]);
      setSubscribed([]);
  }

  async function subscribeSingleStream(stream) {
    if (!stream) return;
    const subscriberOptions =  { insertMode: "append", style: { 
      buttonDisplayMode: "off",
      nameDisplayMode: "on",
    }};
    let containerId = monitor;
    if (mMessage.requestCall && mMessage.requestCall.id === stream.connection.id) {
      containerId = call;
    }
    const subscriber = await new Promise((resolve, reject) => {
      const subscriber = mSession.session.subscribe(stream, containerId, subscriberOptions, (err) => {
        if(!err) {
          if (!stream.hasAudio) {
            const targetDom = document.getElementById(subscriber.id);
            insertMuteIcon(subscriber,targetDom)
          }
          resolve(subscriber);
        }
        else {
          console.log("subscribe error", err)
          console.log("subscribe stream", stream)

        }
      })
    });
    if (mSession.user.role === "host")  {
      subscriber.on("audioLevelUpdated", handleAudioLevelChange)
    }
    if (containerId === call) {
      setCallSubscribers((prevSubscribers) => [ ...prevSubscribers, subscriber ]);
    }
    if (containerId === monitor) {
      setMonitorSubscribers((prevSubscribers) => [ ...prevSubscribers, subscriber ]);
    }
  }

  async function subscribe(streams){
    setSubscribed(streams);

    const streamIDs = streams.map((stream) => stream.id);
    const subscribedIDs = subscribed.map((stream) => stream.id);

    const newStreams = streams.filter((stream) => !subscribedIDs.includes(stream.id))
    const removedStreams = subscribed.filter((stream) => !streamIDs.includes(stream.id));

    removedStreams.forEach((stream) => {
      setCallSubscribers((prevSubscribers) => {
        return prevSubscribers.filter((subscriber) => {
          return !!subscriber.stream
        })
      })
      setMonitorSubscribers((prevSubscribers) => {
        return prevSubscribers.filter((subscriber) => {
          return !!subscriber.stream
        })
      })
      setMonitorSubscribersAudioVolume((prevSubscribers) => {
        return prevSubscribers.filter((prev) => {
          return !!prev.subscriber.stream
        })
      })
      setSoloAudioSubscriber((prevSubscriber) => {
        if (prevSubscriber && !prevSubscriber.stream) return null
        else return prevSubscriber
      })
    })

    await Promise.all(newStreams.map(async (stream) => {
      subscribeSingleStream(stream)
    }));
  };

  useEffect(() => {
    try{
     if (document.getElementById(call)) callLayout.layout();
     if (document.getElementById(monitor)) monitorLayout.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ callSubscribers, monitorSubscribers, callLayout, monitorLayout, call, monitor, mMessage.requestCall ]);


  useEffect(() => {
      // unsubscribe all audio exept solo subcriber
      if (inCallConnectionId) {
        callSubscribers.forEach((subscriber) => {
          if (subscriber.stream && inCallConnectionId === subscriber.stream.connection.id) {
            subscriber.subscribeToAudio(true)
          }
          else subscriber.subscribeToAudio(false)
         })
         monitorSubscribers.forEach((subscriber) => {
           updateMuteIconVisibility(subscriber.subscribeToAudio(false), true)
         })
      }
      else {
        callSubscribers.forEach((subscriber) => {
          subscriber.subscribeToAudio(false)
        })
        monitorSubscribers.forEach((subscriber) => {
          if (muteAllSubscriber) {
            updateMuteIconVisibility(subscriber.subscribeToAudio(false), true)
          }
          else if(soloAudioSubscriber && subscriber.id !== soloAudioSubscriber.id) {
            updateMuteIconVisibility(subscriber.subscribeToAudio(false), true)
          }
          else {
            updateMuteIconVisibility(subscriber.subscribeToAudio(true), false)
          }
        })
      }
  }, [soloAudioSubscriber, muteAllSubscriber, inCallConnectionId, monitorSubscribers, callSubscribers])


  return { 
    subscribe, 
    subscribeSingleStream,
    unsubscribe, 
    callSubscribers, 
    monitorSubscribers, 
    callLayout,
    monitorLayout,
    soloAudioSubscriber,
    loudestSubscriber,
    updateSoloAudioSubscriber,
    updateMuteIconVisibility,
    muteAllSubscriber,
    toggleMuteAllSubscriberAudio,
    updateInCallConnectionId}
}
export default useSubscriber;