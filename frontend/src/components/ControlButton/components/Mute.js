// @flow
import ControlButton from "components/ControlButton";

function Mute ({hasAudio, onClick, ...props}) {

  return (
    <ControlButton 
      {...props}
      isActive={hasAudio}
      activeIcon="microphone-2-solid"
      inActiveIcon="mic-mute-solid"
      tooltipName="mic-control-button"
      tooltipTitle={hasAudio? "Mute Microphone": "Unmute Microphone"}
      onClick={onClick}
    >
    </ControlButton>
  )
}

export default Mute;