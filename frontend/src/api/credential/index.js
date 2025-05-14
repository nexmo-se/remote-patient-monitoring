// @flow
import Credential from "entities/credential";
const url = new URL(window.location.href);
const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;

export default class CredentialAPI{
  static async generateCredential({sessionId="", role="publisher", data={}}){
    const apiURL = `${serverPath}/room/generateCredential`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({sessionId, role, data})
    })).json();
    
    if (!jsonResult.token) return null;
    const credential = new Credential(jsonResult.appId, jsonResult.sessionId, jsonResult.token);
    return credential;
  }
}