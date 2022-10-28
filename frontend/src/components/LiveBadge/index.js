// @flow
import { useState, useEffect } from 'react';
import '@vonage/vwc-badge';


function LiveBadge({ style, className }){
  const [ isVisible, setIsVisible ] = useState(true);

  useEffect(() => {
    function toggleVisible(){
      setIsVisible((isVisible) => !isVisible);
    }

    const intervalID = setInterval(toggleVisible, 1000);
    return function cleanup(){
      clearInterval(intervalID);
    }
  }, [])

  return (
    <vwc-badge
        connotation="alert"
        layout="filled"
        text="Live"
        shape="pill"
        icon={isVisible ? "video-active-solid" : "video-active-line"}
    ></vwc-badge>
    )
}
export default LiveBadge;