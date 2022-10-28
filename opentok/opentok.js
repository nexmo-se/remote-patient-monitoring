const OpenTok = require('opentok');
const apiKey = process.env.VIDEO_API_API_KEY;
const apiSecret = process.env.VIDEO_API_API_SECRET;
if (!apiKey || !apiSecret) {
  throw new Error(
    'Missing config values for env params OT_API_KEY and OT_API_SECRET'
  );
}

const opentok = new OpenTok(apiKey, apiSecret);

const createSession = () => {
  return new Promise((resolve, reject) => {
    opentok.createSession({ mediaMode: 'routed' }, function (error, session) {
      if (error) {
        reject(error);
      } else {
        resolve({ sessionId: session.sessionId });
      }
    });
  });
};

const generateToken = (sessionId, role, data) => {
  token = opentok.generateToken(sessionId, {role, data: JSON.stringify(data)});
  return { token: token, apiKey: apiKey };
};


module.exports = {
  createSession,
  generateToken
};