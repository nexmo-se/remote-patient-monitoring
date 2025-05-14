# Vonage Video Remote Patient Monitoring Reference App

Remote Patient monitoring app enables a nurse to monitor multiple patients' conditions remotely, and start a 1-1 video call with a patient when needed.

The app has the following roles:
- A Nurse can:
  - Monitor up to 10 patients at a time
  - Start a 1-1 call with a patient
  - View a queue list of patient's call request 
  - Accept or Reject a patient’s call request
  - Receive alarm when a patient move away from the video cam
  - Mute an alarm
  - See an indicator on the loudest patient's video tile
  - Subscribe to a patient's audio during monitoring
  - View the rest of the patients while in a call
  
- Patients can:
  - Join a 1-1 call that initiated by a nurse
  - Request to call a nurse

When you first launch the app, you will be asked to enter a room name. Ensure both nurse and patients have the same room name so they can join the same session.

## Architecture
This app makes use of vonage video api to communicate between nurse and patients, such as call requests and missing patient alerts. 
For human detection, we use Google Mediapipe Holistic library to detect a patient's face, hands, and pose. If a patient doesnt exist in the video frame, a signal will be sent to the session, so the nurse can get an alarm on the missing patient's video tile.
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
