import React, {useState} from "react";
import {Button} from 'react-bootstrap';
import Select from 'react-select';
import {useTranslation} from 'react-i18next';
import Cookies from 'universal-cookie';
import {useNavigate} from "react-router-dom";

const NewLookupDB = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [state, setState] = useState({
        lookup_db_id: -1,
        db_name: "",
        db_type: "",
        host: "",
        username: "",
        password: "",
        db_instance: "",
        test_connection_result: "",
        test_connection_success: false,
        supported_dbs: [
            {value: 'mysql', label: 'My SQL'},
            {value: 'mssql', label: 'Microsoft SQL'},
            {value: 'oracle', label: 'Oracle'},
        ]
    });

    const successStyle = {
        color: state.test_connection_success ? 'blue' : 'red',
        fontWeight: 'bold',
        marginTop: '10px',
    };

    const saveLookup = () => {
        const cookies = new Cookies();

        console.log("Saving lookup");
        fetch(process.env.REACT_APP_SERVER_URL + "/lookup_dbs/new", {
            method: 'POST',
            body: JSON.stringify({
                db_name: state.db_name,
                db_type: state.db_type.value,
                host: state.host,
                username: state.username,
                password: state.password,
                db_instance: state.db_instance
            }),
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    navigate('/lookup_dbs');
                },
                (error) => {
                    setState(prevState => ({...prevState, error}));
                }
            );
    };

    const testConnection = () => {
        const cookies = new Cookies();

        console.log("Testing connection");
        fetch(process.env.REACT_APP_SERVER_URL + "/lookup_dbs/test_connection", {
            method: 'POST',
            body: JSON.stringify({
                db_name: state.db_name,
                db_type: state.db_type.value,
                host: state.host,
                username: state.username,
                password: state.password,
                db_instance: state.db_instance
            }),
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setState(prevState => ({
                        ...prevState,
                        test_connection_result: result.message,
                        test_connection_success: result.success
                    }));
                },
                (error) => {
                    setState(prevState => ({...prevState, error}));
                }
            );
    };

    const styles = {
        wrapper: {
            flex: 1,
            width: '500px',
            alignItems: 'stretch',
        },
        container: {
            flex: 1,
            alignItems: 'stretch',
            justifyContent: "center",
            padding: 20,
        },
        fieldContainer: {
            marginTop: 10,
        },
        label: {
            fontSize: 16,
        },
        textInput: {
            height: 40,
            marginTop: 5,
            marginBottom: 10,
            borderColor: "#ccc",
            borderWidth: 1,
            backgroundColor: "#eaeaea",
            padding: 5,
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
            width: '100%',
            resize: 'vertical',
        }
    };

    const cancel = () => {
        navigate('/lookup_dbs')
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <div style={styles.main}>
                    <div style={styles.fieldContainer}>
                        <h2>{t('lookup_db.new_db')}</h2><br/>
                        <label style={styles.label}>{t('lookup_db.db_name')}</label><br/>
                        <input
                            value={state.db_name}
                            onChange={(e) => setState({...state, db_name: e.target.value})}
                            style={styles.textInput}
                        /><br/>
                        <label style={styles.label}>{t('lookup_db.db_type')}</label><br/>
                        <Select
                            value={state.db_type}
                            onChange={(db_type) => setState({...state, db_type})}
                            options={state.supported_dbs}
                        /><br/>
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
                        /><br/>

                        <label style={styles.label}>{t('lookup_db.db_instance')}</label><br/>
                        <input
                            value={state.db_instance}
                            onChange={(e) => setState({...state, db_instance: e.target.value})}
                            style={styles.textInput}
                        /><br/>

                        <div style={successStyle}>{state.test_connection_result}</div>
                        <br/>
                    </div>
                    <Button onClick={testConnection}
                            style={{width: '100%', marginBottom: '10px', backgroundColor: '#ff7961'}}>
                        {t('lookup_db.test_connection')}
                    </Button><br/>

                    <Button onClick={saveLookup}
                            style={{width: '100%', marginBottom: '10px', backgroundColor: '#0064e1'}}>
                        {t('lookup_db.save_lookup_db')}
                    </Button><br/>

                    <Button onClick={cancel}
                            style={{width: '100%', marginBottom: '10px', backgroundColor: '#999999'}}>
                        {t('cancel')}
                    </Button><br/>
                </div>
            </div>
        </div>
    );
};
export default NewLookupDB;
