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

## Environment Variables
You need to setup some environment variables 

  - `PORT` -- this variable works only for manual deployment. Heroku deployment will automatically fill the value.
  - `VIDEO_API_API_KEY` -- your Vonage Video API - API Key
  - `VIDEO_API_API_SECRET` -- your Vonage Video API - API Secret

## Deploy to Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/nexmo-se/remote-patient-monitoring)

## Manual Deployment
This section is for manual deployment. It means you need to have a 
  
  - Linux machine with `SSH`. Make sure you can `SSH` to your machine.
  - `NodeJS` installed
  - `yarn` or `npm` installed

Once you satisfy the requirements, you can proceed to below steps.
  
  - Clone and navigate inside this repository.
  - Rename `.env.example` to `.env` and fill in the environment variable.
  - Install dependencies by typing `yarn install` if you are using `yarn` or `npm install` if you are using `npm`
  - Build the package by typing `yarn build` if you are using `yarn` or `npm run build` if you are using `npm`
  - Start the server `yarn start` or `npm run start`
  - Open your web browser. For example `http://localhost:3002`

The local deployment has been done. You can use various technology such as `ngrok` or `nginx` to make it public. Furthermore, for this demo to run smoothly in public, you need `https` or `SSL`. 

`ngrok` will automatically grant you `SSL` certificate. However, if `nginx` was choose as public deployment, you can use `Let's Encrypt` to get your free `SSL` certificate.
