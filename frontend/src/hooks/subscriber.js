// @flow
import { MessageContext } from "contexts/message";
import { SessionContext } from "contexts/session";
import { useState, useEffect, useContext } from "react";
import LayoutManager from "utils/layout-manager";

function useSubscriber({ moderator, screen, camera, custom }){
  const [ subscribed, setSubscribed ] = useState([]);
  const [ subscribers, setSubscribers ] = useState([]);
  const [ cameraLayout, setCameraLayout ] = useState(new LayoutManager(camera));
  const [ screenLayout, setScreenLayout ] = useState(new LayoutManager(screen));
  const mSession = useContext(SessionContext)
  const mMessage = useContext(MessageContext)

  useEffect(() => {
    const { changedStream } = mSession;
    if(changedStream && (changedStream.changedProperty === "hasAudio")){
      const targetSubscriber = subscribers.find((subscriber) => 
        subscriber.stream && changedStream.stream && subscriber.stream.id === changedStream.stream.id
      )
      
      if (!targetSubscriber) return;
      const targetDom = document.getElementById(changedStream.oldValue ? targetSubscriber.id : `${targetSubscriber.id}-mute`);
      
      if (!targetDom) return;
      targetSubscriber.subscribeToAudio(changedStream.newValue);
      if (changedStream.newValue) {
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

  function getContainerId(user, videoType){
    if(user.role === "moderator" && videoType === "camera") return moderator;
    else if(videoType === "camera") return camera;
    else if(videoType === "screen") return screen;
    else return custom;
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
      const { connection, videoType } = stream;
      const data = JSON.parse(connection.data);
      const containerId = getContainerId(data, videoType);
      const extraData = (data.role === "moderator")? { width: "100%", height: "100%" }: {}
      const finalOptions = Object.assign({}, extraData, { insertMode: "append", style: { 
        buttonDisplayMode: "off",
        nameDisplayMode: "on",
      }});
      const subscriber = await new Promise((resolve, reject) => {
        const subscriber = mSession.session.subscribe(stream, containerId, finalOptions, (err) => {
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
          if (element && (JSON.parse(subscriber.stream.connection.data).role === "nurse" || mMessage.requestCall.id === subscriber.stream.connection.id) ) {
            // ignore if OT_big class already exist
            if (!element.classList.contains("OT_big")) element.classList.add("OT_big");
          }
          else if (element) {
            element.classList.remove("OT_big");
          }
        })
      }
     if (document.getElementById(camera)) cameraLayout.layout();
      if (document.getElementById(screen)) screenLayout.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ subscribers, cameraLayout, screenLayout, camera, screen, mMessage.requestCall ]);


  return { subscribe, unsubscribe, subscribers }
}
export default useSubscriber;