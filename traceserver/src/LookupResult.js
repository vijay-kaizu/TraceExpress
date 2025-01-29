import React, {useEffect, useState} from "react";
import Cookies from 'universal-cookie';
import Table from "react-bootstrap/Table";
import {CircularProgress} from "@mui/material";
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import {useTranslation} from "react-i18next";

const LookupResult = ({movement_code,
                          lookup_id,
                          node_props,
                          all_props,
                          lookup_name,
                          activeItemId,
                          setActiveItemId
                      }) => {
    const {t} = useTranslation();
    const [lookupResults, setLookupResults] = useState(null);
    const [success, setSuccess] = useState(true);
    const [message, setMessage] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLookupResults(null);
        setLoaded(false);
    }, [movement_code, lookup_id]);

    const loadLookupResults = () => {
        if (!loaded) {
            setLoading(true);
            const cookies = new Cookies();
            const mapParam = JSON.stringify(all_props);

            fetch(process.env.REACT_APP_SERVER_URL + "/movement-code-lookup?movement_code=" + movement_code + "&lookup_id=" + lookup_id + "&warehouse=" + node_props.warehouse + "&company_code=" + node_props.company_code + "&part_job=" + node_props.part_job + "&line_lot_stage=" + node_props.line_lot_stage + "&map=" + encodeURIComponent(mapParam), {
                method: 'get',
                headers: new Headers({
                    'Authorization': 'Basic ' + cookies.get('login_token'),
                    'X-DB-Name': cookies.get('backend_db_name')
                })
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        setLookupResults(result.lookup_result);
                        setSuccess(result.success);
                        setMessage(result.message);
                        setLoaded(true);
                        setLoading(false);
                        setActiveItemId(lookup_id);
                    },
                    (error) => {
                        console.error(error);
                    }
                );
        } else {
            setActiveItemId(activeItemId === lookup_id ? null : lookup_id);
        }
    };

    const isPanelVisible = activeItemId === lookup_id;

    const lookupNameDivStyle = {
        backgroundColor: '#17a2b8',
        color: 'white',
        display: 'table',
        padding: '3px',
        fontSize: '12px',
        marginBottom: isPanelVisible ? '2px' : '10px',
        width: '325px'
    };
    const errorMessageStyle = {
        color: 'red'
    };
    const progressStyle = {
        height: '20px',
        width: '20px'
    };
    const lookupResultStyle = {
        maxHeight: '60vh',
        marginBottom: '10px',
        border: '1px solid #17a2b8',
        backgroundColor: '#ffffff',
        padding: '2px',
        fontSize: '10px',
        width: '325px',
        display: !isPanelVisible ? 'none' : 'block',
        overflow: 'auto'
    };
    const valueStyle = {
        color: '#17a2b8',
        padding: '3px',
        fontWeight: 'bold',
        fontSize: '16px',
    };
    const keyStyle = {
        padding: '3px',
        fontWeight: 'bold',
        fontSize: '16px',
    };
    const textStyle = {
        display: 'inline-block',
        fontSize: '16px',
        verticalAlign: 'middle',
        padding: '5px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '300px',
    };

    const iconStyle = {
        display: 'table-cell',
        fontSize: '24px',
        verticalAlign: 'middle',
        margin: '5px'
    };

    const tableStyle = {
        marginBottom: '0px'
    };
    const lookupNameStyle = {
        width: '95%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        padding: '5px',
    };
    const lookupIconStyle = {
        width: '10%'
    };

    let indents = [];
    if (lookupResults != null && lookupResults.length > 0) {
        let keys = Object.keys(lookupResults[0]);
        for (let i = 0; i < keys.length; i++) {
            let row = [];
            row.push(<td style={keyStyle}>{keys[i]}</td>);
            for (let j = 0; j < lookupResults.length; j++) {
                row.push(<td style={valueStyle}>{lookupResults[j][keys[i]]}</td>);
            }
            indents.push(<tr>{row}</tr>);
        }
    } else {
        if (!success) {
            indents.push(<h6 style={errorMessageStyle}>{message}</h6>);
        } else {
            indents.push(<td style={keyStyle}>{t('no_records_found')}</td>);
        }
    }

    return (
        <div>
            <div style={lookupNameDivStyle} onClick={loadLookupResults}>
                <table style={{width: '100%', tableLayout: 'fixed'}}>
                    <tr>
                        <td style={lookupNameStyle}>
                            <span style={textStyle}>{lookup_name}</span>
                        </td>
                        <td style={lookupIconStyle}>
                            {loading ? (
                                <CircularProgress style={progressStyle}/>
                            ) : (
                                isPanelVisible ? (
                                    <IndeterminateCheckBoxIcon style={iconStyle}/>
                                ) : (
                                    <LocalHospitalIcon style={iconStyle}/>
                                )
                            )}
                        </td>
                    </tr>
                </table>
            </div>
            <div style={lookupResultStyle}>
                <Table striped bordered hover size="sm" style={tableStyle}>
                    <tbody>{indents}</tbody>
                </Table>
            </div>
        </div>
    );
};

export default LookupResult;
