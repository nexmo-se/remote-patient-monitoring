// @flow
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

  static async requestCall(session, user){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "request-call",
        data: JSON.stringify({user})
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

  static async rejectRaiseHand(session, user){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "reject-raise-hand",
        data: JSON.stringify({user})
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };
}