
import { useEffect, useRef } from 'react';
import '@vonage/vwc-snackbar';

export default function Notification({open, title, message, okText, okAction, cancelText, cancelAction, dismissAction}) {
    const ref = useRef(null);

    useEffect(() => {
      if (!ref) return;
       ref.current.addEventListener('closed', dismissAction);
    }, [ref]);

    function handleOk() {
        if (okAction && okAction !== dismissAction) okAction();
    }    

    function handleCancel() {
        if (cancelAction && cancelAction !== dismissAction) cancelAction();
    }

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
            onClick={handleOk}
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
            onClick={handleCancel}
        >
            {cancelText}
        <button type="submit" style={{display: "none"}}></button>
        </vwc-button> : ""
        }
        </vwc-snackbar>
    )
}