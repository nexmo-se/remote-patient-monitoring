import { AppType } from "./constants";

let appType = null

export function checkAppType() {
    if (appType !== null) {
        return appType
    }

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const type = urlParams.get('type')

    if (type == AppType.EDUCATION) {
        appType = AppType.EDUCATION
    }
    else {
        appType = AppType.HEALTHCARE
    }

    return appType
}

export const HostRole = (checkAppType() == AppType.EDUCATION) ? "Examiner" : "Nurse"
export const ParticipantRole = (checkAppType() == AppType.EDUCATION) ? "Candidate" : "Patient"