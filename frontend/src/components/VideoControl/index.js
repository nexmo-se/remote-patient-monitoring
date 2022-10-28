// @flow
import {useState, useCallback, useEffect, useContext} from "react";
import ControlButton from "components/ControlButton";
import { SessionContext } from "contexts/session";
import './styles.css'

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
  
  useEffect(
    () => {
      if (!publisher.stream) return;

      setHasAudio(publisher.stream.hasAudio);
      setHasVideo(publisher.stream.hasVideo);
    },
    [publisher.stream]
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
            unpublish={unpublish}
        /> : null}
      </div>
    )
  }
}

export default VideoControl;