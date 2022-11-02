// @flow
import {useRef, useEffect} from 'react';
import '@vonage/vwc-dialog';
import '@vonage/vwc-button';

export default function ConfirmDialog({open, message, confirmAction, cancelAction, dismissAction}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref) return;
     ref.current.addEventListener('closed', dismissAction);
  }, [ref]);
  
  function cancel(e) {
    e.preventDefault();
    if (cancelAction && cancelAction !== dismissAction) cancelAction();
  }

  function confirm(e) {
    e.preventDefault();
    if (confirmAction && confirmAction !== dismissAction) confirmAction();
  }

  return (
  <vwc-dialog open={open || undefined} ref={ref}>
    <h4>{message}</h4>
    <vwc-button slot="primaryAction" dialogaction="discard" type="submit" onClick={confirm}>
      Confirm
      <button type="submit" style={{display: "none"}}></button>
    </vwc-button>
    <vwc-button slot="secondaryAction" dialogaction="cancel" type="submit" onClick={cancel}>
      Cancel
      <button type="submit" style={{display: "none"}}></button>
    </vwc-button>
  </vwc-dialog>
  )
}