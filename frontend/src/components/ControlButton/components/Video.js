import ControlButton from "../index";
import '@vonage/vwc-icon-button'

function VideoButton ({hasVideo, ...props}) {
  return (
    <ControlButton 
      {...props}
      name="video-control-button"
      activeIcon="video-solid"
      inActiveIcon="video-off-solid"
      active={hasVideo}
      tooltipTitle={hasVideo? "Turn off Camera": "Turn on Camera"}
    >
    </ControlButton>
  )
}

VideoButton.defaultProps = { size: 50, fontSize: 24 }
export default VideoButton;