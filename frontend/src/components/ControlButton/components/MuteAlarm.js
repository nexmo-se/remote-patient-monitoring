// @flow
import ControlButton from "components/ControlButton";

function MuteAlarm ({onClick, ...props}) {

  return (
    <ControlButton 
      {...props}
      isActive={false}
      activeIcon="notification-off-solid"
      inActiveIcon="notification-off-solid"
      tooltipName="mute-notification-button"
      tooltipTitle="Turn off alarm"
      onClick={onClick}
    >
    </ControlButton>
  )
}

export default MuteAlarm;