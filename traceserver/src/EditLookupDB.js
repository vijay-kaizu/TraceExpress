import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import Cookies from 'universal-cookie';
import Button from "react-bootstrap/Button";


const EditLookupDB = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {lookup_db_id} = useParams();

    const [state, setState] = useState({
        lookup_db_id: -1,
        db_name: '',
        db_type: '',
        host: '',
        username: '',
        password: '',
        db_instance: '',
        test_connection_result: '',
        test_connection_success: false,
        error: null,
    });

    // Fetch the lookup DB data when the component mounts
    useEffect(() => {
        loadLookupDB(lookup_db_id);
    }, [lookup_db_id]);

    const loadLookupDB = (lookup_db_id) => {
        const cookies = new Cookies();

        fetch(`${process.env.REACT_APP_SERVER_URL}/lookup_dbs/get?lookup_db_id=${lookup_db_id}`, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Basic ${cookies.get('login_token')}`,
                'X-DB-Name': cookies.get('backend_db_name'),
            }),
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setState({
                        ...state,
                        db_name: result.db_name,
                        db_type: result.db_type,
                        host: result.host,
                        username: result.username,
                        password: result.password,
                        db_instance: result.db_instance,
                        lookup_db_id: result.lookup_db_id,
                    });
                },
                (error) => {
                    setState({
                        ...state,
                        error,
                    });
                }
            );
    };

    const testConnection = () => {
        const cookies = new Cookies();

        fetch(`${process.env.REACT_APP_SERVER_URL}/lookup_dbs/test_connection`, {
            method: 'POST',
            body: JSON.stringify({
                db_name: state.db_name,
                db_type: state.db_type,
                host: state.host,
                username: state.username,
                password: state.password,
                db_instance: state.db_instance,
            }),
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Basic ${cookies.get('login_token')}`,
                'X-DB-Name': cookies.get('backend_db_name'),
            }),
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setState({
                        ...state,
                        test_connection_result: result.message,
                        test_connection_success: result.success,
                    });
                },
                (error) => {
                    setState({
                        ...state,
                        error,
                    });
                }
            );
    };

    const saveLookupDB = () => {
        const cookies = new Cookies();

        fetch(`${process.env.REACT_APP_SERVER_URL}/lookup_dbs/edit`, {
            method: 'POST',
            body: JSON.stringify({
                db_name: state.db_name,
                db_type: state.db_type,
                host: state.host,
                username: state.username,
                password: state.password,
                db_instance: state.db_instance,
                lookup_db_id: state.lookup_db_id,
            }),
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Basic ${cookies.get('login_token')}`,
                'X-DB-Name': cookies.get('backend_db_name'),
            }),
        })
            .then(res => res.json())
            .then(
                () => {
                    navigate('/lookup_dbs');
                },
                (error) => {
                    setState({
                        ...state,
                        error,
                    });
                }
            );
    };

    const cancel = () => {
        navigate('/lookup_dbs');
    };

    const successStyle = {
        color: state.test_connection_success ? 'blue' : 'red',
    };

    if (state.error) {
        return <div>Error: {state.error.message}</div>;
    }

    const styles = {
        wrapper: {
            flex: 1,
            width: '500px',
            alignItems: 'stretch',
            // margin: '0 auto',
            // paddingTop: '20px',
            // fontFamily: 'Arial, sans-serif',
        },
        container: {
            flex: 1,
            alignItems: 'stretch',
            justifyContent: "center",
            padding: 20,
            // backgroundColor: '#f9f9f9',
            // borderRadius: '8px',
            // boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        fieldContainer: {
            marginTop: 10,
            marginBottom: 20,
        },
        label: {
            fontSize: 16,
            marginBottom: '5px',
            fontWeight: 'bold',
        },
        textInput: {
            height: 40,
            marginTop: 5,
            marginBottom: 10,
            borderColor: "#ccc",
            borderWidth: 1,
            backgroundColor: "#eaeaea",
            padding: 5,
            borderRadius: '4px',
            width: '100%',
        },
        textArea: {
            height: 150,
            marginTop: 5,
            marginBottom: 10,
            borderColor: "#ccc",
            borderWidth: 1,
            backgroundColor: "#eaeaea",
            padding: 5,
            // borderRadius: '4px',
            width: '100%',
        },
    };

    return (
        // <form>
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <div style={styles.main}>
                    <div style={styles.fieldContainer}>
                        <h2>{t('lookup_db.edit_db')}</h2>
                        <label style={styles.label}>{t('lookup_db.db_name')}</label><br/>
                        <input
                            value={state.db_name}
                            onChange={(e) => setState({...state, db_name: e.target.value})}
                            style={styles.textInput}
                        /><br/>
                        <label style={styles.label}>{t('lookup_db.db_type')}</label>
                        <h3>{state.db_type}</h3>
                        <label style={styles.label}>{t('lookup_db.host')}</label><br/>
                        <input
                            value={state.host}
                            onChange={(e) => setState({...state, host: e.target.value})}
                            style={styles.textInput}
                        /><br/>
                        <label style={styles.label}>{t('lookup_db.user')}</label><br/>
                        <input
                            value={state.username}
                            onChange={(e) => setState({...state, username: e.target.value})}
                            style={styles.textInput}
                        /><br/>

                        <label style={styles.label}>{t('lookup_db.password')}</label><br/>
                        <input
                            type="password"
                            value={state.password}
                            onChange={(e) => setState({...state, password: e.target.value})}
                            style={styles.textInput}
                            // style={{width: '100%', marginBottom: '10px'}}
                        /><br/>

                        <label style={styles.label}>{t('lookup_db.db_instance')}</label><br/>
                        <input
                            value={state.db_instance}
                            onChange={(e) => setState({...state, db_instance: e.target.value})}
                            style={styles.textInput}
                        />
                    </div>

                    <div style={successStyle}>{state.test_connection_result}</div>
                    <br/>

                    <Button onClick={testConnection} style={{width: '100%', marginBottom: '10px',backgroundColor:'#ff7961'}}>
                        {t('lookup_db.test_connection')}
                    </Button>
                    <br/>
                    <Button  onClick={saveLookupDB} style={{width: '100%', marginBottom: '10px',backgroundColor:'#0064e1'}}>
                        {t('lookup_db.save_lookup_db')}
                    </Button>
                    <br/>
                    <Button onClick={cancel} style={{width: '100%', marginBottom: '10px',backgroundColor:'#999999'}}>
                        {t('cancel')}
                    </Button>
                </div>
            </div>
        </div>
        // </form>
    );
};

export default EditLookupDB;

