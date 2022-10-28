import '@vonage/vwc-banner'

function InfoBanner({message}){
  return(
    <vwc-banner
    open=""
    connotation="info"
    message={message}
    role="status"
    aria-live="polite"
    ></vwc-banner>
  )
}

export default InfoBanner