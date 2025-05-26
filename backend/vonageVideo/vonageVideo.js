const { Auth } = require('@vonage/auth');
const { Video } = require('@vonage/video');

const credentials = new Auth({
  applicationId: process.env.API_APPLICATION_ID,
  privateKey: process.env.VCR_PRIVATE_KEY,
});
const options = {};
const videoClient = new Video(credentials, options);


const createSession = () => {
  return new Promise((resolve, reject) => {
    videoClient.createSession({ mediaMode: "routed"})
      .then( session => {
        resolve({ sessionId: session.sessionId });
      })
      .catch(error => {
        reject(error);
      })
  });
};

const generateToken = (sessionId, role, data) => {
  const options = {
    role,
    expireTime: new Date().getTime() / 1000 + 24 * 60 * 60, // in 1 day
    data: JSON.stringify(data),
  }

  token = videoClient.generateClientToken(sessionId, options);
  return {sessionId, token, appId: process.env.API_APPLICATION_ID}
};


module.exports = {
  createSession,
  generateToken
};