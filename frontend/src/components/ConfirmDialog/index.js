// @flow
import '@vonage/vwc-dialog';
import '@vonage/vwc-button';

export default function ConfirmDialog({open, message, confirmAction, cancelAction}) {
  function cancel(e) {
    e.preventDefault();
    if (cancelAction) cancelAction();
  }

  function confirm(e) {
    e.preventDefault();
    if (confirmAction) confirmAction();
  }

  return (
  <vwc-dialog open={open || undefined}>
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