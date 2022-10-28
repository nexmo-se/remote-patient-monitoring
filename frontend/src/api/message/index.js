// @flow
const url = new URL(window.location.href);
const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;


export default class MessageAPI{
  static async requestPublish(session, connectionsIds=[]){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "request-publish",
        data: JSON.stringify(connectionsIds)
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };

  static async requestOneOnOne(session, requestorStreamId, requesteeStreamId, user){
    const data = {
      requestorStreamId,
      requesteeStreamId,
      user
    }
    await new Promise((resolve, reject) => {
      session.signal({
        type: "request-one-on-one",
        data: JSON.stringify(data)
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };

  static async raiseHand(session, user){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "raise-hand",
        data: JSON.stringify({user})
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };

  static async rejectRaiseHandRequest(session, user){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "reject-call",
        data: JSON.stringify({user})
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };
}