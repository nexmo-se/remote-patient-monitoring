// @flow
import { useState } from "react";
import "./styles.css";

function VideoHoverContainer({ children, ...props }){
  const [ visible, setVisible ] = useState(false);

  function handleMouseEnter(){
    setVisible(true);
  }
  
  function handleMouseLeave(){
    setVisible(false);
  }

  return (
    <div 
      id="video-hover-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div className={`root ${!visible ? "hidden" : ""}`}>
        {children}
      </div>
    </div>
  );
}
export default VideoHoverContainer;