// @flow
import { MessageContext } from "contexts/message";
import { SessionContext } from "contexts/session";
import { useState, useEffect, useContext, useCallback } from "react";
import LayoutManager from "utils/layout-manager";

function useSubscriber({call, monitor}){
  const [ subscribed, setSubscribed ] = useState([]);
  const [ callSubscribers, setCallSubscribers ] = useState([]);
  const [ monitorSubscribers, setMonitorSubscribers ] = useState([]);

  const [ callLayout, setCalLayout ] = useState(new LayoutManager(call));
  const [ monitorLayout, setMonitorLayout ] = useState(new LayoutManager(monitor));  
  const mSession = useContext(SessionContext)
  const mMessage = useContext(MessageContext)

  useEffect(() => {
    if(mSession.changedStream && (mSession.changedStream.changedProperty === "hasAudio")){
      const targetMonitorSubscriber = monitorSubscribers.find((subscriber) => 
        subscriber.stream && mSession.changedStream.stream && subscriber.stream.id === mSession.changedStream.stream.id
      )
      const targetCallSubscriber = callSubscribers.find((subscriber) => 
      subscriber.stream && mSession.changedStream.stream && subscriber.stream.id === mSession.changedStream.stream.id
      )

      updateChangeProperty(targetMonitorSubscriber)
      updateChangeProperty(targetCallSubscriber)

    }
  }, [ mSession.changedStream ])

  function updateChangeProperty(subscriber) {
    if (!subscriber) return;
    const targetDom = document.getElementById(mSession.changedStream.oldValue ? subscriber.id : `${subscriber.id}-mute`);
      
    if (!targetDom) return;
    subscriber.subscribeToAudio(mSession.changedStream.newValue);
    if (mSession.changedStream.newValue) {
      targetDom.remove();
    }
    else{
      insertMuteIcon(subscriber,targetDom);
    }
  }

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
      })
    });
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


  return { subscribe, unsubscribe, callSubscribers, monitorSubscribers, subscribeSingleStream, callLayout, monitorLayout}
}
export default useSubscriber;