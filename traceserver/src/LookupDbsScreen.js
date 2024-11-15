import React, {useEffect, useState} from "react";
import Cookies from "universal-cookie";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import {IconButton} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {useTranslation} from 'react-i18next';

const LookupDbsScreen = () => {
    const {t} = useTranslation();
    const [list, setList] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadList();
    }, []);

    const divStyle = {
        maxWidth: '1024px',
        margin: '20px auto'
    };

    const headerStyle = {
        fontWeight: 'bold'
    };
    const btnStyle = {
        marginLeft: "10px"
    };
    const tableStyle = {
        width: "100%"
    };

    const loadList = () => {
        const cookies = new Cookies();
        fetch(process.env.REACT_APP_SERVER_URL + "/lookup_dbs/list", {
            method: 'get', headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {

                    setList(result)
                },
                (error) => {
                    setError(error)
                }
            )
    }

    const deleteLookupDb = (lookup_db_id) => {
        const cookies = new Cookies();
        fetch(process.env.REACT_APP_SERVER_URL + "/lookup_dbs/delete?lookup_db_id=" + lookup_db_id, {
            method: 'delete',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    loadList();
                },
                (error) => {
                    setError(error)
                }
            )
    }


    return (
        error || list.message ? (
            <div>Error: {error ? error.message : list.message}</div>
        ) : (
            <div style={divStyle}>
                <table style={tableStyle}>
                    <tbody>
                    <tr>
                        <td><h2>{t('lookup_db.all_dbs')}</h2></td>
                        <td align="right">
                            <Button href='/settings'>{t('settings')}</Button>
                            <Button style={btnStyle} href='/lookup_dbs/new'>{t('lookup_db.new_db')}</Button>
                        </td>
                    </tr>
                    </tbody>
                </table>

                <Table striped bordered hover size="sm">
                    <thead style={headerStyle}>
                    <tr>
                        <td>{t('lookup_db.db_name')}</td>
                        <td>{t('lookup_db.db_type')}</td>
                        <td>{t('lookup_db.host')}</td>
                        <td>{t('lookup_db.user')}</td>
                        <td>{t('lookup_db.db_instance')}</td>
                        <td></td>
                    </tr>
                    </thead>
                    <tbody>
                    {list.map(item => (
                        <tr key={item.lookup_db_id}>
                            <td>{item.db_name}</td>
                            <td>{item.db_type}</td>
                            <td>{item.host}</td>
                            <td>{item.username}</td>
                            <td>{item.db_instance}</td>
                            <td>
                                <IconButton aria-label="edit" size="medium"
                                            href={`/lookup_dbs/${item.lookup_db_id}/edit`}>
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
                                <IconButton aria-label="delete" size="medium"
                                            onClick={() => deleteLookupDb(item.lookup_db_id)}>
                                    <DeleteIcon fontSize="inherit"/>
                                </IconButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        )
    );

}
export default LookupDbsScreen;