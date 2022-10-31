import ControlButton from "../index";

function Video ({hasVideo, onClick, ...props}) {
  
  return (
    <ControlButton 
      {...props}
      isActive={hasVideo}
      activeIcon="video-solid"
      inActiveIcon="video-off-solid"
      tooltipName="video-control-button"
      tooltipTitle={hasVideo? "Turn off Camera": "Turn on Camera"}
      onClick={onClick}
    >
    </ControlButton>
  )
}

export default Video;