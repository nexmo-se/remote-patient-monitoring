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

    updateMuteIconVisibility(targetCallSubscriber, mSession.changedStream.stream)

  }, [mSession.changedStream])

  function updateMuteIconVisibility(subscriber, stream, forceMute= false) {
    if (!subscriber) return;
    let mute = true
    if ((stream && stream.hasAudio) || (!stream && !forceMute)) mute= false 

    if (mute) {
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
            audioLevel: e.audioLevel
          }
          sortedSubscribers = [...prev, data].sort((a,b) => a.audioLevel < b.audioLevel ? 1 : -1)
        }
        // filter hidden subscriber
        let monitorContainer = document.getElementsByClassName("monitorContainer")[0]
        let inCallSubscriberId;
        for (let dom of monitorContainer.getElementsByClassName("OT_root")) {
          if (dom.style.display === "none") inCallSubscriberId = dom.id
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

  useEffect(() => {
    if (!mSession.user || mSession.user.role !== "nurse") return;

    let prevLoudestDom = document.getElementsByClassName("loudest")[0];
         
    if (!loudestSubscriber) {
      return
    }
    
    let currentLoudestDom = document.getElementById(loudestSubscriber.id);
    let targetId = loudestSubscriber.id;
    if (soloAudioSubscriber) {
      currentLoudestDom = document.getElementById(soloAudioSubscriber.id)
      targetId = soloAudioSubscriber
    }

    if (prevLoudestDom &&  prevLoudestDom.id === targetId)  return;
    if (prevLoudestDom) prevLoudestDom.classList.remove('loudest')
    if (currentLoudestDom && !currentLoudestDom.classList.contains("loudest")) currentLoudestDom.classList.add("loudest")

  },[loudestSubscriber, mSession.user, mMessage.requestCall, soloAudioSubscriber])
  
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
    subscriber.on("audioLevelUpdated", handleAudioLevelChange)
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
    updateMuteIconVisibility}
}
export default useSubscriber;