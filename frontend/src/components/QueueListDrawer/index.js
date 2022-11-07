import { useContext } from "react"
import { MessageContext } from "contexts/message";
import '@vonage/vwc-side-drawer'

export default function QueueListDrawer({open, hideDrawer, rejectCall, acceptCall, children}) {
    const mMessage = useContext(MessageContext);

    function acceptRequest(e) {
        const targetDom = e.target.closest('vwc-list-item')
        const targetConnectionId = targetDom.getAttribute("data-user-id")
        const targetUser = mMessage.raisedHands.find((user) => user.id === targetConnectionId)
        acceptCall(targetUser, true)
    }

    function rejectRequest(e) {
        e.stopPropagation();
        const targetDom = e.target.closest('vwc-list-item')
        const targetConnectionId = targetDom.getAttribute("data-user-id")
        const targetUser = mMessage.raisedHands.find((user) => user.id === targetConnectionId)
        rejectCall(targetUser)
    }

    return (
        <vwc-side-drawer position="start" hastopbar="true" modal="" open={open || undefined} onClick={hideDrawer}>
            <div slot="top-bar" style={{margin: "0 auto"}}>
                <vwc-text font-face="body-1-bold">Queue List</vwc-text>
            </div>
            <hr></hr>
            <vwc-list>
            {Array.isArray(mMessage.raisedHands) && mMessage.raisedHands.map((user, index) => {
                return (
                    <div key={`queue-item-hr-${index}`}>
                    <vwc-list-item  data-user-id={user.id} mwc-list-item="" tabindex="0" aria-disabled="false">
                        <p style={{margin: 0, fontSize: "18px", lineHeight: "32px"}}>{user.name}</p>
                    <vwc-button label="Accept" dense="" type="submit" unelevated="" onClick={acceptRequest}>
                        <button type="submit" style={{display: "none"}}></button>
                    </vwc-button>
                    <vwc-button label="Reject" dense="" type="submit" unelevated="" onClick={rejectRequest}>
                        <button type="submit" style={{display: "none"}}></button>
                    </vwc-button>
                    </vwc-list-item> 
                    <hr></hr>
                    </div>
                )
            })
            }
            </vwc-list>
            <div slot="app-content">
                {children}
            </div>
        </vwc-side-drawer>
    )
}