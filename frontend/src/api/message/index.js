// @flow
export default class MessageAPI{
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

  static async sendQueueList(session, queueList){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "queue-list",
        data: JSON.stringify({queueList})
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

  static async updateUserState(session, user, state){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "user-state",
        data: JSON.stringify({user, state})
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };
}