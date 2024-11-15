import React, {useEffect, useState} from "react";
import Select from 'react-select';
import {useTranslation} from 'react-i18next';
import Cookies from 'universal-cookie';
import {useNavigate, useParams} from 'react-router-dom';
import Button from "react-bootstrap/Button";

const EditLookup = () => {
    const {t} = useTranslation();
    const {lookup_id} = useParams();
    const navigate = useNavigate();
    const [lookupName, setLookupName] = useState("");
    const [movementCode, setMovementCode] = useState("");
    const [lookupQuery, setLookupQuery] = useState("");
    const [lookupDbId, setLookupDbId] = useState(null);
    const [availableDbs, setAvailableDbs] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        loadLookup(lookup_id);
    }, [lookup_id]);

    const loadLookup = (lookupId) => {
        const cookies = new Cookies();

        fetch(process.env.REACT_APP_SERVER_URL + "/lookup_dbs/list", {
            method: 'get',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    const lookupDbs = result.map(db => ({
                        value: db.lookup_db_id,
                        label: db.db_name
                    }));
                    setAvailableDbs(lookupDbs);
                },
                (error) => {
                    setError(error);
                }
            );

        fetch(process.env.REACT_APP_SERVER_URL + "/lookups/get?lookup_id=" + lookupId, {
            method: 'get',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setLookupName(result.lookup_name);
                    setMovementCode(result.movement_code);
                    setLookupQuery(result.query);
                    setLookupDbId({value: result.lookup_db_id, label: result.lookup_db_name});
                },
                (error) => {
                    setError(error);
                }
            );
    };

    const saveLookup = (e) => {
        e.preventDefault();  // Prevent default form submission
        const cookies = new Cookies();

        fetch(process.env.REACT_APP_SERVER_URL + "/lookups/edit", {
            method: 'POST',
            body: JSON.stringify({
                lookup_name: lookupName,
                movement_code: movementCode,
                lookup_query: lookupQuery,
                lookup_id: lookup_id,
                lookup_db_id: lookupDbId.value
            }),
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                () => {
                    navigate('/lookups');
                },
                (error) => {
                    setError(error);
                }
            );
    };

    const cancel = () => {
        navigate('/lookups');
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

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <div style={styles.main}>
                    <div style={styles.fieldContainer}>
                        <h2>{t('lookup.edit_lookup')}</h2><br/>

                        <label style={styles.label}>{t('lookup.lookup_name')}</label><br/>
                        <input
                            value={lookupName}
                            onChange={(e) => setLookupName(e.target.value)}
                            style={styles.textInput}
                        /><br/>
                        <label style={styles.label}>{t('lookup.db_name')}</label><br/>
                        <Select
                            value={lookupDbId}
                            onChange={setLookupDbId}
                            options={availableDbs}
                        /><br/>
                        <label style={styles.label}>{t('lookup.movement_code')}</label><br/>
                        <input
                            value={movementCode}
                            onChange={(e) => setMovementCode(e.target.value)}
                            style={styles.textInput}
                        /><br/>
                        <label style={styles.label}>{t('lookup.query')}</label><br/>
                        <textarea
                            value={lookupQuery}
                            onChange={(e) => setLookupQuery(e.target.value)}
                            style={styles.textArea}
                        /><br/>
                    </div>
                    <Button onClick={saveLookup}
                            style={{
                                width: '100%',
                                marginBottom: '10px',
                                color: "#fff",
                                backgroundColor: '#0064e1'
                            }}>{t('lookup.save_lookup')}</Button>
                    <br/>
                    <Button onClick={cancel}
                            style={{
                                width: '100%',
                                marginBottom: '10px',
                                backgroundColor: '#999999',
                                color: '#fff',
                            }}>{t('cancel')}</Button>
                    <br/>
                </div>
            </div>
        </div>
    );
};

export default EditLookup;
