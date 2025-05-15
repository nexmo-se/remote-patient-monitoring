# Vonage Video Remote Monitoring Reference App

Remote monitoring app enables a host to monitor multiple participants' conditions remotely, and start a 1-1 video call with a participant when needed.

The app has the following roles:
- A Host can:
  - Monitor up to 10 participants at a time
  - Start a 1-1 call with a participant
  - View a queue list of participant's call request 
  - Accept or Reject a participant call request
  - Receive alarm when a participant move away from the video cam
  - Mute an alarm
  - See an indicator on the loudest participant's video tile
  - Subscribe to a participant's audio during monitoring
  - View the rest of the participant while in a call
  
- Participants can:
  - Join a 1-1 call that initiated by a host
  - Request to call a host

When you first launch the app, you will be asked to enter a room name. Ensure both host and participants have the same room name so they can join the same session.

## Architecture
This app makes use of vonage video api to communicate between host and participants, such as call requests and missing participants alerts. 
For human detection, we use Google Mediapipe Holistic library to detect a participant's face, hands, and pose. If a participant doesnt exist in the video frame, a signal will be sent to the session, so the host can get an alarm on the missing participant's video tile.
  - Backend: NodeJS
  - Frontend: ReactJS
  - Video call/monitoring: Vonage Video API
  - Human Detection: Mediapipe Holistic library

## Debugging
Rename `vcr.example.yml` to `vcr.yml` and fill in the variable.
Run `vcr debug` to debug locally
For more information: [VCR Debugging](https://developer.vonage.com/en/vonage-cloud-runtime/getting-started/debugging?source=vonage-cloud-runtime)

## Deploy to VCR
Rename `vcr.example.yml` to `vcr.yml` and fill in the variable.
Run `vcr deploy` to create a running instance
For more information: [VCR Deploying](https://developer.vonage.com/en/vonage-cloud-runtime/getting-started/deploying?source=vonage-cloud-runtime)
