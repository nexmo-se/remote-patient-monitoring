// @flow
import "@vonage/vwc-select";
import "@vonage/vwc-list/vwc-list-item";
import { useState } from "react";
import MessageAPI from "api/message";
import { MonitorType } from "utils/constants";

function MonitoringControl ({children}) {
  const [monitorType, setMonitorType] = useState(MonitorType.NONE)

  const monitorTypeChange = (event) => {
    const newMonitoringType = event.target.value 
    if (newMonitoringType !== monitorType) {
      setMonitorType(newMonitoringType)
      MessageAPI.monitoringTypeChanged(newMonitoringType)
    }
  }

  return(
    <div className="monitoring-control">
      {children}
      <vwc-select label="Monitoring Type" value={monitorType} onClick={monitorTypeChange}>
        <vwc-list-item value={MonitorType.NONE} role="option">None</vwc-list-item>
        <vwc-list-item value={MonitorType.OBJECTRON} role="option">Objectron(Cup)</vwc-list-item>
        <vwc-list-item value={MonitorType.FACE_MESH} role="option"> Face Mesh</vwc-list-item>
        <vwc-list-item value={MonitorType.POSE} role="option">Pose</vwc-list-item>
      </vwc-select>
    </div>
  )
}

export default MonitoringControl;