import ControlButton from "components/ControlButton";

function HangUp ({onClick}) {

    return (
      <ControlButton
        isActive={false}
        activeIcon="end-call-solid"
        inActiveIcon="end-call-solid"
        tooltipName="hangup-control-button"
        tooltipTitle="End Call"
        onClick={onClick}
      >
      </ControlButton>
    )
}

export default HangUp;