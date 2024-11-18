import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';

const Access = () => {
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
            sessionStorage.clear();
            navigate('/');
        }
    }, [access_token, backend_db_name, cookies, navigate]);

    return <h2>Invalid access token.</h2>;
};

export default Access;
