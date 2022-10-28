import { useState, useEffect } from "react";
import Hangup from "./components/Hangup";
import Mute from "./components/Mute";
import Video from "./components/Video";
import '@vonage/vwc-icon-button';
import '@vonage/vwc-tooltip'
import './styles.css'

function ControlButton({name, activeIcon, inActiveIcon, tooltipTitle, active, ...props}) {
  const [showToolTip, setShowToolTip] = useState(false)

  function handleMouseEnter(){
    setShowToolTip(true);
  }
  
  function handleMouseLeave(){
    setShowToolTip(false);
  }
  return (
    <div className="control-button tooltip-wrapper" {...props} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <vwc-icon-button
        connotation={active ? "success" : "alert"}
        icon={active ? activeIcon: inActiveIcon}
        shape="circled"
        id={name}
        layout="filled"
      ></vwc-icon-button>
      <vwc-tooltip
        open={showToolTip || undefined}
        icon={active ? activeIcon: inActiveIcon}
        anchor={name}
        text={tooltipTitle}
        corner="top"
      ></vwc-tooltip>
    </div>
  )
}

ControlButton.Hangup = Hangup;
ControlButton.Mute = Mute;
ControlButton.Video = Video;
export default ControlButton;