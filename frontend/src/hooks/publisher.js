// @flow
import { useState, useEffect, useContext } from "react";
import LayoutManager from "utils/layout-manager";
import OT from "@opentok/client";
import delay from "delay";
import { SessionContext } from "contexts/session";


function usePublisher(containerId, autoLayout=true, displayName=true){
  const [ publisher, setPublisher ] = useState();
  const [ isPublishing, setIsPublishing ] = useState(false);
  const [ publisherOptions, setPublisherOptions ] = useState();
  const [ hasAudio, setHasAudio] = useState(true);
  const [ hasVideo, setHasVideo] = useState(true);

  const [ stream, setStream ] = useState();
  const [ layoutManager, setLayoutManager ] = useState(new LayoutManager(containerId));
  const mSession = useContext(SessionContext);


  useEffect(() => {
    const { changedStream } = mSession;
    if(changedStream){
      const { connection:otherConnection } = changedStream.stream;
      const { connection:myConnection } = mSession.session;
      if(otherConnection.id === myConnection.id && publisher?.stream.id === changedStream.stream.id){
        switch(changedStream.changedProperty){
          case "hasAudio": return setHasAudio(changedStream.newValue);
          case "hasVideo": return setHasVideo(changedStream.newValue);
          default: return;
        }
      }
    }
  }, [ mSession.changedStream ]);

  function handleDestroyed(){
    setPublisher(null);
  }

  function handleStreamCreated(e){
    setStream(e.stream);
  }

  function handleStreamDestroyed(e){
      setStream(null);
      if (publisher) publisher.destroy();
      setPublisher(null)
      layoutManager.layout();
  }

  function handleAccessDenied(){
    if (publisher) {
      resetPublisher();
    }
  }

  function resetPublisher() {
    publisher.off("destroyed", handleDestroyed);
    publisher.off("streamCreated", handleStreamCreated);
    publisher.off("streamDestroyed", handleStreamDestroyed);
    publisher.off("accessDenied", handleAccessDenied)
    publisher.destroy();
    setPublisher(null);
  }

  async function unpublish(){
    if(publisher) {
      mSession.session.unpublish(publisher);
    }
  }
  
  async function publishAttempt(publisher, attempt = 1, noRetry = false) {
    console.log(`Attempting to publish in ${attempt} try`)
    if (attempt > 1)  { publisher = OT.initPublisher(containerId, publisherOptions); }

    publisher.on("destroyed", handleDestroyed);
    publisher.on("streamCreated", handleStreamCreated);
    publisher.on("streamDestroyed", handleStreamDestroyed);
    publisher.on("accessDenied", handleAccessDenied)

    const { retry, error } = await new Promise(
      (resolve, reject) => {
        mSession.session.publish(
          publisher,
          (err) => {
            if (err && noRetry) {
              resolve({ retry: undefined, error: err });
            }
            if (err && attempt < 3) {
              resolve({ retry: true, error: err });
            } if (err && attempt >= 3) {
              resolve({ retry: false, error: err });
            } else resolve({ retry: false, error: undefined });
          }
        )
      }
    )

    if (retry) {
      // Wait for 2 seconds before attempting to publish again
      await delay(2000 * attempt);
      await publishAttempt(
        publisher,
        attempt + 1
      );
    } else if (error) {
      if (noRetry) return;
      alert(`
      We tried to access your camera/mic 3 times but failed. 
      Please make sure you allow us to access your camera/mic and no other application is using it.
      You may refresh the page to retry`)
      mSession.disconnect();
      setIsPublishing(false);
      setPublisher(null);
    } else {
      setIsPublishing(false);
      setPublisher(publisher);
    }
  }

  async function publish(
    user, 
    extraData
  ){
    try{
      if(!mSession.session) throw new Error("You are not connected to session");
      setIsPublishing(true);
      if (!publisher) {        
        const isScreenShare = extraData && extraData.videoSource === 'screen' ? true : false;
        const options = { 
          insertMode: "append",
          name: user.name,
          publishAudio: false,
          publishVideo: true,
          style: { 
            buttonDisplayMode: "off",
            nameDisplayMode: displayName? "on": "off"
          }
        };
        const finalOptions = Object.assign({}, options, extraData);
        setPublisherOptions(finalOptions);
        const newPublisher = OT.initPublisher(containerId, finalOptions);
        publishAttempt(newPublisher, 1, isScreenShare);     
      }
      else {
        publishAttempt(publisher);
      }   
 
    }catch(err){
      console.log(err.stack);
    }
  }

  useEffect(() => {
    try{
      if(autoLayout && stream && publisher) {
        const element = document.getElementById(publisher.id);

        if (element && !element.classList.contains("OT_big")) element.classList.add("OT_big");
      }
      if (document.getElementById(containerId)) layoutManager.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ publisher, stream, layoutManager, autoLayout, containerId])

  return { 
    isPublishing,
    unpublish, 
    publish,
    hasAudio, 
    hasVideo,
    setHasAudio,
    setHasVideo,
    publisher, 
    stream,
    layoutManager
  }
}
export default usePublisher;