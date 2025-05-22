// @flow
import "@vonage/vwc-select";
import "@vonage/vwc-list/vwc-list-item";
import { useContext, useEffect, useState } from "react";
import MessageAPI from "api/message";
import { MonitorType } from "utils/constants";
import { SessionContext } from "contexts/session";
import { MessageContext } from "contexts/message";

function MonitoringControl ({children}) {
  const mSession = useContext(SessionContext)
  const mMessage = useContext(MessageContext)

  const monitorTypeChange = (event) => {
    const newMonitoringType = event.target.value 
    if (newMonitoringType !== mMessage.monitoringType) {
      MessageAPI.monitoringTypeChanged(mSession.session, newMonitoringType)
    }
  }

  useEffect(() => {
    if (mSession.connections.length > 0) {
      MessageAPI.monitoringTypeChanged(mSession.session, mMessage.monitoringType)
    }
  }, [mSession.connections])

  return(
    <div className="monitoring-control">
      {children}
      <vwc-select label="Monitoring Type" value={mMessage.monitoringType} onClick={monitorTypeChange} style={{width: '240px'}}>
        <vwc-list-item value={MonitorType.NONE} role="option">None</vwc-list-item>
        <vwc-list-item value={MonitorType.OBJECTRON} role="option">Objectron (Cell Phone)</vwc-list-item>
        <vwc-list-item value={MonitorType.FACE_MESH} role="option"> Face Mesh</vwc-list-item>
        <vwc-list-item value={MonitorType.POSE} role="option">Pose</vwc-list-item>
      </vwc-select>
    </div>
  )
}

export default MonitoringControl;