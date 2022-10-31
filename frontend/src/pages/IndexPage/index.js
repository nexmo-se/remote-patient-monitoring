import { useState, useContext, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { SessionContext } from "contexts/session";
import FullPageLoading from 'components/FullPageLoading';
import User from 'entities/user'
import '@vonage/vwc-formfield';
import '@vonage/vwc-radio';
import '@vonage/vwc-textfield';
import '@vonage/vwc-button';
import "./styles.css";

export default function IndexPage() {
    const [role, setRole] = useState('patient')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate();
    const mSession = useContext(SessionContext);;

    function onFormSubmit(e) {
        e.preventDefault();
        let user = new User(e.target.elements["userName"].value, role)
        setIsLoading(true);
        mSession.joinRoom(e.target.elements["roomName"].value, user)
    }

    useEffect(() => {
        if (mSession.session) {
            setIsLoading(false);
            navigate(`/${role}`)
        }
    }, [mSession.session, navigate, role])

    if (isLoading) return <FullPageLoading />
    else {
    return (
        <>
        <h2 id="room-form-title">Remote Patient Monitoring</h2>
        <form id="room-form"
        onSubmit={onFormSubmit}>
            <vwc-textfield
            label="Room Name:"
            dense=""
            value=""
            placeholder="Enter room name here"
            outlined=""
            required
            name="roomName"
            >
            <input
                slot="formInputElement"
                className="vivid-input-internal"
                type="text"
            />
            </vwc-textfield>
            <vwc-textfield
            label="User Name:"
            dense=""
            value=""
            placeholder="Enter user name here"
            outlined=""
            required
            name="userName"
            >
            <input
                slot="formInputElement"
                className="vivid-input-internal"
                type="text"
            />
            </vwc-textfield>
            <div className="role">
            <label>Role: </label>
            <vwc-formfield label="Nurse" name="role123" >
                <vwc-radio name="role-1" value="nurse" onClick={(e) => setRole(e.target.value)}></vwc-radio>
            </vwc-formfield>
            <vwc-formfield label="Patient">
                <vwc-radio name="role-1" value="patient" checked="" onClick={(e) => setRole(e.target.value)}></vwc-radio>
            </vwc-formfield>
            </div>
            <vwc-button
                label="Join"
                layout="filled"
                shape="pill"
                type="submit"
                unelevated=""
                >
                <button type="submit" style={{display: "none"}}></button>
            </vwc-button>
        </form>   
        </>     
    )
    }
}