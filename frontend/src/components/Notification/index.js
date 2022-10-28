
import '@vonage/vwc-snackbar';
import { useEffect, useRef, useCallback } from 'react';

export default function Notification({open, title, message, okText, okAction, cancelText, cancelAction, dismissAction}) {
    const ref = useRef(null);

    useEffect(() => {
      if (!ref) return;
       ref.current.addEventListener('closed', dismissAction);
    }, [ref]);

    return (
        <vwc-snackbar
        open={open || undefined}
        timeoutms="5000"
        icon="warning-solid"
        connotation="alert"
        header={title}
        message={message}
        position="BOTTOM-CENTER"
        legacy={true}
        ref={ref}
        >
        {okText? 
        <vwc-button
            slot="action"
            layout="outlined"
            shape="pill"
            dense=""
            type="submit"
            outlined=""
            onClick={() => {if (okAction) okAction()}}
            style={{marginRight: 8}}
            >
            {okText}
            <button type="submit" style={{display: "none"}}></button>
        </vwc-button> : null
        }

        {cancelText ? 
        <vwc-button
            slot="action"
            layout="outlined"
            shape="pill"
            dense=""
            type="submit"
            outlined=""
            onClick={() => {if (cancelAction) cancelAction()}}
        >
            {cancelText}
        <button type="submit" style={{display: "none"}}></button>
        </vwc-button> : ""
        }
        </vwc-snackbar>
    )
}