// @flow
import { MessageContext } from "contexts/message";
import { SessionContext } from "contexts/session";
import { useState, useEffect, useContext } from "react";
import LayoutManager from "utils/layout-manager";

function useSubscriber(containerId){
  const [ subscribed, setSubscribed ] = useState([]);
  const [ subscribers, setSubscribers ] = useState([]);
  const [ layoutManager, setLayoutManager ] = useState(new LayoutManager(containerId));
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
      mSession.session.unsubscribe(subscriber);
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
    await Promise.all(newStreams.map(async (stream) => {
      const subscriberOptions =  { insertMode: "append", style: { 
        buttonDisplayMode: "off",
        nameDisplayMode: "on",
      }};
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
          if (element && (JSON.parse(subscriber.stream.connection.data).role === "nurse" || mMessage.requestCall.id === subscriber.stream.connection.id) && !element.classList.contains("OT_big")) {
            element.classList.add("OT_big");
          }
          else if (element) {
            element.classList.remove("OT_big");
          }
        })
      }
     if (document.getElementById(containerId)) layoutManager.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ subscribers, layoutManager, containerId, mMessage.requestCall ]);


  return { subscribe, unsubscribe, subscribers }
}
export default useSubscriber;