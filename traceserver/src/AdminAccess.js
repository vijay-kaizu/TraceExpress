import React, {useEffect} from 'react';
import Cookies from 'universal-cookie';
import {useNavigate, useParams} from "react-router-dom";

const AdminAcceess = () => {
    const { access_token, backend_db_name } = useParams();
    const navigate = useNavigate();
    const cookies = new Cookies();

    useEffect(() => {
        if (access_token) {
            console.log("Access token:", access_token);
            cookies.set('login_token', access_token, { path: '/', maxAge: 360000 });
            const dbName = backend_db_name || 'default_db';
            cookies.set('backend_db_name', dbName, { path: '/', maxAge: 360000 });
            console.log("navigating to trace component")
            navigate('/settings');
        }
    }, [access_token, backend_db_name, cookies, navigate]);

    return (
        <div><h2>Invalid access token.</h2></div>
    )
}
export default AdminAcceess;