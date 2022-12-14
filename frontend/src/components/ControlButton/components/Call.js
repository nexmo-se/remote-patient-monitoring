// @flow
import ControlButton from "components/ControlButton";

function Call ({onClick, ...props}) {

  return (
    <ControlButton 
      {...props}
      isActive={true}
      activeIcon="call-solid"
      inActiveIcon="call-solid"
      tooltipName="call-button"
      tooltipTitle="Call Patient"
      onClick={onClick}
    >
    </ControlButton>
  )
}

export default Call;