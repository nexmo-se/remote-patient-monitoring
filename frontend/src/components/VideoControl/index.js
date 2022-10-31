// @flow
import {useState, useCallback, useEffect, useContext} from "react";
import ControlButton from "components/ControlButton";
import { SessionContext } from "contexts/session";
import MessageAPI from "api/message";
import User from "entities/user";

function VideoControl ({ publisher, unpublish, children }) {
  const [hasAudio, setHasAudio] = useState(publisher.stream?.hasAudio ?? false);
  const [hasVideo, setHasVideo] = useState(publisher.stream?.hasVideo ?? false);
  const mSession = useContext(SessionContext);

  const toggleVideo = useCallback(
    () => {
      setHasVideo(
        (prevVideo) => {
          if (!publisher) return false;

          const newVideo = !prevVideo;
          publisher.publishVideo(newVideo);
          return newVideo;
        }
      );
    },
    [publisher]
  )

  const toggleAudio = useCallback(
    () => {
      setHasAudio(
        (prevAudio) => {
          if (!publisher) return false;

          const newAudio = !prevAudio;
          publisher.publishAudio(newAudio);
          return newAudio;
        }
      );
    },
    [publisher]
  );

  function endCall() {
    unpublish();
    MessageAPI.requestCall(mSession.session, new User());
  }
  
  useEffect(
    () => {
      if (!publisher.stream) return;
      setHasAudio(publisher.stream.hasAudio);
      setHasVideo(publisher.stream.hasVideo);
    },
    [publisher.stream.hasAudio, publisher.stream.hasVideo]
  )

  if (!publisher) {
    return null;
  } else {
    return(
      <div className="video-control">
        {children}
        <ControlButton.Video
          hasVideo={hasVideo} 
          onClick={toggleVideo}
          style={{ marginRight: 8 }}
        />
        <ControlButton.Mute 
          hasAudio={hasAudio} 
          onClick={toggleAudio}
          style={{ marginRight: 8 }}
        />
        {mSession.user.role === "nurse" ?
         <ControlButton.Hangup
            onClick={endCall}
        /> : null}
      </div>
    )
  }
}

export default VideoControl;