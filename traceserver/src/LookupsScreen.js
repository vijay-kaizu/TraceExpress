import React, {useState, useEffect} from "react";
import Cookies from 'universal-cookie';
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import {useTranslation, withTranslation} from 'react-i18next';
import {IconButton} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const LookupsScreen = () => {
    const {t} = useTranslation();
    const [list, setList] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        loadList();
    }, []);

    const loadList = () => {
        const cookies = new Cookies();
        fetch(process.env.REACT_APP_SERVER_URL + "/lookups/list", {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setList(result);
                },
                (error) => {
                    setError(error);
                }
            );
    };

    const deleteLookup = (lookup_id) => {
        const cookies = new Cookies();
        fetch(process.env.REACT_APP_SERVER_URL + "/lookups/delete?lookup_id=" + lookup_id, {
            method: 'DELETE',
            headers: new Headers({
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                () => {
                    loadList();
                },
                (error) => {
                    setError(error);
                }
            );
    };

    if (error || (list && list.message)) {
        return <div>Error: {error ? error.message : list.message}</div>;
    }

    const styles = {
        divStyle: {
            maxWidth: '1024px',
            margin: '20px auto',
        },
        headerStyle: {
            fontWeight: 'bold',
        },
        tableStyle: {
            width: '100%',
        },
        btnStyle: {
            marginLeft: '10px',
        }
    };

    return (
        <div>
            <div style={styles.divStyle}>
                <h3>{error && error.message}</h3>
                <table style={styles.tableStyle}>
                    <tr>
                        <td><h2>{t('lookup.all_lookups')}</h2></td>
                        <td align="right">
                            <Button href='/settings'>{t('settings')}</Button>
                            <Button style={styles.btnStyle} href='/lookups/new'>{t('lookup.new_lookup')}</Button>
                        </td>
                    </tr>
                </table>

                <Table striped bordered hover size="sm">
                    <thead style={styles.headerStyle}>
                    <tr>
                        <td>{t('lookup.lookup_name')}</td>
                        <td>{t('lookup.db_name')}</td>
                        <td>{t('lookup.movement_code')}</td>
                        <td>{t('lookup.query')}</td>
                        <td></td>
                    </tr>
                    </thead>
                    <tbody>
                    {list.map(item => (
                        <tr key={item.lookup_id}>
                            <td>{item.lookup_name}</td>
                            <td>{item.lookup_db_name}</td>
                            <td>{item.movement_code}</td>
                            <td>{item.query}</td>
                            <td>
                                <IconButton
                                    aria-label="edit"
                                    size="medium"
                                    href={'/lookups/' + item.lookup_id + '/edit'}
                                >
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
                                <IconButton
                                    aria-label="delete"
                                    size="medium"
                                    onClick={() => deleteLookup(item.lookup_id)}
                                >
                                    <DeleteIcon fontSize="inherit"/>
                                </IconButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};
export default LookupsScreen;
