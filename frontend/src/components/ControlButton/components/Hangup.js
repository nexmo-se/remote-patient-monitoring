import { useContext } from "react";
import ControlButton from "components/ControlButton";
import MessageAPI from "api/message";
import { SessionContext } from "contexts/session";

function HangupButton ({unpublish}) {
  const mSession = useContext(SessionContext);

    function handleEndCall() {
      unpublish()
      MessageAPI.requestOneOnOne(mSession.session, null, null, null);
    }
    return (
      <ControlButton 
        name="hangup-control-button"
        activeIcon="end-call-solid"
        inActiveIcon="end-call-solid"
        active={false}
        tooltipTitle="End Call"
        onClick={handleEndCall}
      >
      </ControlButton>
    )
}

HangupButton.defaultProps = { size: 50, fontSize: 24 }
export default HangupButton;