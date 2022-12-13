import { useState } from "react";
import '@vonage/vwc-icon-button';
import '@vonage/vwc-tooltip';
import Hangup from "./components/Hangup";
import Mute from "./components/Mute";
import Video from "./components/Video";
import Call from "./components/Call";
import MuteAlarm from "./components/MuteAlarm";
import './styles.css';

function ControlButton({isActive, activeIcon, inActiveIcon, tooltipName, tooltipTitle, onClick, ...props}) {
  const [showToolTip, setShowToolTip] = useState(false)

  function handleMouseEnter(){
    setShowToolTip(true);
  }
  
  function handleMouseLeave(){
    setShowToolTip(false);
  }

  return (
    <div className="control-button tooltip-wrapper" onClick={onClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <vwc-icon-button
        connotation={isActive ? "success" : "alert"}
        icon={isActive ? activeIcon: inActiveIcon}
        shape="circled"
        id={tooltipName}
        layout="filled"
      ></vwc-icon-button>
      <vwc-tooltip
        open={showToolTip || undefined}
        icon={isActive ? activeIcon: inActiveIcon}
        anchor={tooltipName}
        text={tooltipTitle}
        corner="top"
      ></vwc-tooltip>
    </div>
  )
}

ControlButton.Hangup = Hangup;
ControlButton.Mute = Mute;
ControlButton.Video = Video;
ControlButton.Call = Call;
ControlButton.MuteAlarm = MuteAlarm

export default ControlButton;