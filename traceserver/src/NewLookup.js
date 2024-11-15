import React, {useEffect, useState} from "react";
import {useTranslation} from 'react-i18next';
import Cookies from 'universal-cookie';
import Select from 'react-select';
import {useNavigate} from "react-router-dom";
import Button from "react-bootstrap/Button";

const NewLookup = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [lookupName, setLookupName] = useState("");
    const [movementCode, setMovementCode] = useState("");
    const [lookupQuery, setLookupQuery] = useState("");
    const [lookupDbId, setLookupDbId] = useState(null);
    const [availableDbs, setAvailableDbs] = useState([]);

    useEffect(() => {
        loadLookupDBs();
    }, []);

    const loadLookupDBs = () => {
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
                    const lookupDbs = result.map(item => ({
                        value: item.lookup_db_id,
                        label: item.db_name
                    }));
                    setAvailableDbs(lookupDbs);
                },
                (error) => {
                    console.error(error);
                }
            );
    };

    const saveLookup = (e) => {
        e.preventDefault();
        const cookies = new Cookies();

        fetch(process.env.REACT_APP_SERVER_URL + "/lookups/new", {
            method: 'POST',
            body: JSON.stringify({
                lookup_name: lookupName,
                movement_code: movementCode,
                lookup_query: lookupQuery,
                lookup_db_id: lookupDbId.value
            }),
            headers: new Headers({
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'Content-Type': 'application/json',
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                () => {
                    navigate('/lookups');
                },
                (error) => {
                    console.error(error);
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
                        <h2>{t('lookup.new_lookup')}</h2>
                        <label style={styles.label}>{t('lookup.lookup_name')}</label>
                        <input
                            value={lookupName}
                            onChange={(e) => setLookupName(e.target.value)}
                            style={styles.textInput}
                        />
                        <label style={styles.label}>{t('lookup.db_name')}</label>
                        <Select
                            value={lookupDbId}
                            onChange={setLookupDbId}
                            options={availableDbs}
                        />
                        <label style={styles.label}>{t('lookup.movement_code')}</label>
                        <input
                            value={movementCode}
                            onChange={(e) => setMovementCode(e.target.value)}
                            style={styles.textInput}
                        />

                        <label style={styles.label}>{t('lookup.query')}</label>
                        <textarea
                            value={lookupQuery}
                            onChange={(e) => setLookupQuery(e.target.value)}
                            style={styles.textArea}
                        />

                        <Button onClick={saveLookup}
                                style={{
                                    width: '100%',
                                    marginBottom: '10px',
                                    backgroundColor: '#0064e1'
                                }}>{t('lookup.save_lookup')}</Button>
                        <Button onClick={cancel}
                                style={{
                                    width: '100%',
                                    marginBottom: '10px',
                                    backgroundColor: '#999999'
                                }}>{t('cancel')}</Button>
                        <br/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewLookup;
