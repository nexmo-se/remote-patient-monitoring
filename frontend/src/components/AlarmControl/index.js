// @flow
import {useContext} from "react";
import ControlButton from "components/ControlButton";
import { MessageContext } from "contexts/message";

function AlarmControl ({selectedUser, acceptCall, closeAlarm, ...props}) {
    const mMessage = useContext(MessageContext)

    async function callPatient(e) {
        if (!selectedUser) return;
        closeAlarm()
        await acceptCall(selectedUser, true)
    }

    function muteAlarm(e) {
        if (!selectedUser) return;
        closeAlarm()
        mMessage.removeMissingUser(selectedUser)
    }

    return(
      <div className="alarm-control" {...props}>
        <ControlButton.Call
          onClick={callPatient}
          style={{ marginRight: 8 }}
        />
        <ControlButton.MuteAlarm 
          onClick={muteAlarm}
        />
      </div>
    )
}

export default AlarmControl;