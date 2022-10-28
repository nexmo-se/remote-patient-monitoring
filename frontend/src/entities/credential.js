// @flow
class Credential{
  
    constructor(apiKey = '', sessionId = '', token = ''){
      this.apiKey = apiKey;
      this.sessionId = sessionId;
      this.token = token;
    }
  }
  export default Credential;