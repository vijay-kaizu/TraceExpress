import React, {useState, useEffect} from "react";
import Cookies from 'universal-cookie';
import Table from "react-bootstrap/Table";
import {CircularProgress} from "@mui/material";
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';

const LookupResult = ({movement_code, lookup_id, node_props, all_props, lookup_name}) => {
    const [lookupResults, setLookupResults] = useState(null);
    const [success, setSuccess] = useState(true);
    const [message, setMessage] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hidePanel, setHidePanel] = useState(true);

    useEffect(() => {
        // Reset the state on component mount or when dependencies change
        setLookupResults(null);
        setLoaded(false);
    }, [movement_code, lookup_id]);

    const loadLookupResults = () => {
        console.log('loadLookupResults for ' + movement_code + '  ' + lookup_id);
        console.log('selectedItemProps for ' + JSON.stringify(all_props));

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
                        setHidePanel(false);
                    },
                    (error) => {
                        console.error(error);
                    }
                );
        } else {
            setHidePanel(prevState => !prevState);
        }
    };

    const lookupNameDivStyle = {
        backgroundColor: '#17a2b8',
        color: 'white',
        display: 'table',
        padding: '3px',
        fontSize: '12px',
        marginTop: '10px',
        width: '250px'
    };
    const errorMessageStyle = {
        color: 'red'
    };
    const progressStyle = {
        height: '20px',
        width: '20px'
    };
    const lookupResultStyle = {
        border: '1px solid #17a2b8',
        backgroundColor: '#ffffff',
        padding: '2px',
        fontSize: '10px',
        width: '250px',
        maxHeight: '300px',
        display: hidePanel ? 'none' : 'block',
        overflow: 'scroll'
    };
    const valueStyle = {
        color: '#17a2b8',
        padding: '3px',
        fontWeight: 'bold',
        fontSize: '14px',
    };
    const textStyle = {
        display: 'table-cell',
        fontSize: '16px',
        verticalAlign: 'middle',
        padding: '5px'
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
        width: '90%'
    };
    const lookupIconStyle = {
        width: '10%'
    };

    let indents = [];
    if (lookupResults != null && lookupResults.length > 0) {
        let keys = Object.keys(lookupResults[0]);
        for (let i = 0; i < keys.length; i++) {
            let row = [];
            row.push(<td>{keys[i]}</td>);
            for (let j = 0; j < lookupResults.length; j++) {
                row.push(<td style={valueStyle}>{lookupResults[j][keys[i]]}</td>);
            }
            indents.push(<tr>{row}</tr>);
        }
    } else {
        if (!success) {
            indents.push(<h6 style={errorMessageStyle}>{message}</h6>);
        }
    }

    return (
        <div>
            <div style={lookupNameDivStyle} onClick={loadLookupResults}>
                <table>
                    <tr>
                        <td style={lookupNameStyle}>
                            <span style={textStyle}>{lookup_name}</span>
                        </td>
                        <td style={lookupIconStyle}>
                            {loading ? <CircularProgress style={progressStyle}/>
                                : (!hidePanel ?
                                    <IndeterminateCheckBoxIcon style={iconStyle}/> :
                                    <LocalHospitalIcon style={iconStyle}/>)}
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
