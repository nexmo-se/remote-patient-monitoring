// @flow
import ControlButton from "components/ControlButton";
import { ParticipantRole } from "utils/utils";

function Call ({onClick, ...props}) {

  return (
    <ControlButton 
      {...props}
      isActive={true}
      activeIcon="call-solid"
      inActiveIcon="call-solid"
      tooltipName="call-button"
      tooltipTitle={`Call ${ParticipantRole}`}
      onClick={onClick}
    >
    </ControlButton>
  )
}

export default Call;