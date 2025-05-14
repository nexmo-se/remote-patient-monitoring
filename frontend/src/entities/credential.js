// @flow
class Credential{
  
    constructor(appId = '', sessionId = '', token = ''){
      this.appId = appId;
      this.sessionId = sessionId;
      this.token = token;
    }
  }
  export default Credential;