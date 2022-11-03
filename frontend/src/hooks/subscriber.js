// @flow
import { MessageContext } from "contexts/message";
import { SessionContext } from "contexts/session";
import { useState, useEffect, useContext, useCallback } from "react";
import LayoutManager from "utils/layout-manager";

function useSubscriber({call, monitor}){
  const [ subscribed, setSubscribed ] = useState([]);
  const [ subscribers, setSubscribers ] = useState([]);
  const [ inCallSubscriber, setInCallSubscriber ] = useState();
  const [ callLayout, setCalLayout ] = useState(new LayoutManager(call));
  const [ monitorLayout, setMonitorLayout ] = useState(new LayoutManager(monitor));  
  const mSession = useContext(SessionContext)
  const mMessage = useContext(MessageContext)

  useEffect(() => {
    if(mSession.changedStream && (mSession.changedStream.changedProperty === "hasAudio")){
      const targetSubscriber = subscribers.find((subscriber) => 
        subscriber.stream && mSession.changedStream.stream && subscriber.stream.id === mSession.changedStream.stream.id
      )
      
      if (!targetSubscriber) return;
      const targetDom = document.getElementById(mSession.changedStream.oldValue ? targetSubscriber.id : `${targetSubscriber.id}-mute`);
      
      if (!targetDom) return;
      targetSubscriber.subscribeToAudio(mSession.changedStream.newValue);
      if (mSession.changedStream.newValue) {
        targetDom.remove();
      }
      else{
        insertMuteIcon(targetSubscriber,targetDom);
      }
    }
  }, [ mSession.changedStream ])

  useEffect(() => {
    if (!mMessage.requestCall || !mSession.user || mSession.user.role !== "nurse") return;
    const targetSubscriber = subscribers.find((subscriber) => mMessage.requestCall.id === subscriber.stream.connection.id)
    if (targetSubscriber && (!inCallSubscriber || targetSubscriber.id !== inCallSubscriber.id)) {
      resubscribe(inCallSubscriber);
      resubscribe(targetSubscriber)
    }
    else if (!mMessage.requestCall.id && inCallSubscriber) {
      resubscribe(inCallSubscriber);
    }
  }, [mMessage.requestCall, mSession.user])


  function insertMuteIcon(targetSubscriber,targetDom) {
    const childNodeStr = `<div
    id=${targetSubscriber.id}-mute
    style="
    position: absolute; 
    bottom: 8px; 
    left: 8px;
    background: url(${process.env.PUBLIC_URL}/assets/mute.png);
    background-position: center;
    background-size: contain;
    height: 22px;
    width: 22px;
    background-repeat: no-repeat;">
    </div>`;
    targetDom.insertAdjacentHTML('beforeend', childNodeStr);
  }

  function unsubscribe() {
    subscribers.forEach((subscriber) => {
      mSession.session.unsubscribe(subscriber);
    })
      setSubscribers([]);
      setSubscribed([]);
  }

  // Change subscriber container
  function resubscribe(subscriber) {
    if (!subscriber) return;
    const stream = subscriber.stream;
    mSession.session.unsubscribe(subscriber);
    setSubscribers((prevSubscribers) => {
      return prevSubscribers.filter((t_subscriber) => {
        return t_subscriber !== subscriber
      })
    })
    subscribeSingleStream(stream)
  }

  async function subscribe(streams){
    setSubscribed(streams);

    const streamIDs = streams.map((stream) => stream.id);
    const subscribedIDs = subscribed.map((stream) => stream.id);

    const newStreams = streams.filter((stream) => !subscribedIDs.includes(stream.id))
    const removedStreams = subscribed.filter((stream) => !streamIDs.includes(stream.id));

    removedStreams.forEach((stream) => {
      setSubscribers((prevSubscribers) => {
        return prevSubscribers.filter((subscriber) => {
          return !!subscriber.stream
        })
      })
    })
    await Promise.all(newStreams.map((stream) => {
       subscribeSingleStream(stream)
    }));
  };

  async function subscribeSingleStream(stream) {
    if (!stream) return;
    const subscriberOptions =  { insertMode: "append", style: { 
      buttonDisplayMode: "off",
      nameDisplayMode: "on",
    }};
    let containerId = monitor;
    if (JSON.parse(stream.connection.data).role === "nurse" || (mMessage.requestCall && mMessage.requestCall.id === stream.connection.id)) {
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
      })
    });
    setSubscribers((prevSubscribers) => [ ...prevSubscribers, subscriber ]);
  }

  useEffect(() => {
    try{
      if (mMessage.requestCall) {
        subscribers.forEach((subscriber) => {
          const element = document.getElementById(subscriber.id);
          if (subscriber.stream && mMessage.requestCall.id === subscriber.stream.connection.id) setInCallSubscriber(subscriber)
          if (element && (JSON.parse(subscriber.stream.connection.data).role === "nurse" || mMessage.requestCall.id === subscriber.stream.connection.id)) {
            if (!element.classList.contains("OT_big")) element.classList.add("OT_big");
          }
          else if (element) {
            element.classList.remove("OT_big");
          }
        })
      }
     if (document.getElementById(call)) callLayout.layout();
     if (document.getElementById(monitor)) monitorLayout.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ subscribers, callLayout, monitorLayout, call, monitor ]);


  return { subscribe, unsubscribe, subscribers }
}
export default useSubscriber;