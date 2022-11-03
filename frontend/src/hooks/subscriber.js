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
      if (subscriber.stream) mSession.session.unsubscribe(subscriber);
    })
      setSubscribers([]);
      setSubscribed([]);
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

    if (call !== monitor) {
      const callContainer = document.getElementById(call);
      const callSubscribersDom = Array.from(callContainer.getElementsByClassName('OT_subscriber'));
      
      // Find the requested subscriber
      const targetSubscriber = subscribers.find((subscriber) => subscriber.stream && mMessage.requestCall && mMessage.requestCall.id === subscriber.stream.connection.id)

      let hasTargetSubscriber = false
      callSubscribersDom.forEach(async (callSubscriberDom) => {
        if (!targetSubscriber || callSubscriberDom.id !== targetSubscriber.id) {
          // Resubscribe to move the subscriber from call container to monitor container
          const inCallSubscriber = subscribers.find((subscriber) => subscriber.id === callSubscriberDom.id)
          newStreams.push(inCallSubscriber.stream)
          await mSession.session.unsubscribe(inCallSubscriber)      
          setSubscribers((prevSubscribers) => {
            return prevSubscribers.filter((t_subscriber) => {
              return t_subscriber.id !== inCallSubscriber.id
            })
          })
        }
        else {
          hasTargetSubscriber =true
        }
      })
       // Resubscribe to move the subscriber from monitor container to call container
      if(!hasTargetSubscriber && targetSubscriber) {
        newStreams.push(targetSubscriber.stream)
        await mSession.session.unsubscribe(targetSubscriber)      
        setSubscribers((prevSubscribers) => {
          return prevSubscribers.filter((t_subscriber) => {
            return t_subscriber.id !== targetSubscriber.id
          })
        })
      }
    }

    await Promise.all(newStreams.map(async (stream) => {
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
    }));
  };

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