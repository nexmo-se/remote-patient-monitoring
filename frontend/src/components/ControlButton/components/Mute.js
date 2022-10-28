// @flow
import ControlButton from "components/ControlButton";

function MuteButton ({ hasAudio, ...props }) {

  return (
    <ControlButton 
      {...props}
      name="mic-control-button"
      activeIcon="microphone-2-solid"
      inActiveIcon="mic-mute-solid"
      active={hasAudio}
      tooltipTitle={hasAudio? "Mute Microphone": "Unmute Microphone"}
    >
    </ControlButton>
  )
}

MuteButton.defaultProps = { size: 50, fontSize: 24 }
export default MuteButton;