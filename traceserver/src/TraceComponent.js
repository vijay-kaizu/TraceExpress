import React, {useState, useEffect} from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import {useTranslation} from 'react-i18next';
import Cookies from 'universal-cookie';
import {IconButton} from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const TraceComponent = () => {
    const {t} = useTranslation(); // Use the useTranslation hook
    const cookies = new Cookies();

    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [listLoaded, setListLoaded] = useState(false);
    const [isList, setIsList] = useState(true);
    const [listItems, setListItems] = useState([]);
    const [searchProduct, setSearchProduct] = useState(localStorage.getItem('searchProduct') || '');
    const [searchLot, setSearchLot] = useState(localStorage.getItem('searchLot') || '');
    const [searchWarehouse, setSearchWarehouse] = useState(localStorage.getItem('searchWarehouse') || '');
    const [searchCompany, setSearchCompany] = useState(localStorage.getItem('searchCompany') || '');
    const [isFirstLoad, setIsFirstLoad] = useState(!localStorage.getItem('searchProduct'));

    const loadList = () => {
        console.log("before fetch");

        fetch(`${process.env.REACT_APP_SERVER_URL}/status-list?product=${searchProduct}&lot=${searchLot}&warehouse=${searchWarehouse}&company=${searchCompany}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            }
        })
            .then(response => {
                console.log("before result", response);
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to load data. Unknown error occurred');
                }
            })
            .then(data => {
                console.log("Items:", data.items);

                if (Array.isArray(data.items)) {
                    setListLoaded(true);
                    setListItems(data.items);
                } else {
                    setError("Unexpected response format");
                }
            })
            .catch(error => {
                setListLoaded(true);
                setError(error.message || error);
            });
    };


    const handleSubmit = (event) => {
        event.preventDefault();
        loadList();
    };
    const searchControlsStyle = {
        verticalAlign: 'top',
        width: '200px'
    };

    useEffect(() => {
        console.log("entered traceComponent")
        if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
            localStorage.clear();
            setSearchProduct('');
            setSearchLot('');
            setSearchWarehouse('');
            setSearchCompany('');
            loadList();
        } else {
            loadList();
        }

        return () => localStorage.clear();
    }, []);

    return (
        <div>
            {isList ? (
                error ? (
                    <div>{t('Error Loading List')}: {error.message}</div>
                ) : !listLoaded ? (
                    <div>{t('Loading...')}</div>
                ) : (
                    <Table>
                        <tbody>
                        <tr>
                            <td style={searchControlsStyle}>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="company">{"company"}</label>
                                        <input type="text" value={searchCompany}
                                               onChange={(e) => setSearchCompany(e.target.value)}
                                               className="form-control form-control-sm" id="company"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="warehouse">{t('warehouse')}</label>
                                        <input type="text" value={searchWarehouse}
                                               onChange={(e) => setSearchWarehouse(e.target.value)}
                                               className="form-control form-control-sm" id="warehouse"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="product">{t('product')}</label>
                                        <input type="text" value={searchProduct}
                                               onChange={(e) => setSearchProduct(e.target.value)}
                                               className="form-control form-control-sm" id="product"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lot">{t('lot')}</label>
                                        <input type="text" value={searchLot}
                                               onChange={(e) => setSearchLot(e.target.value)}
                                               className="form-control form-control-sm" id="lot"/>
                                    </div>
                                    <Button type="submit">{t('search')}</Button>
                                </form>
                            </td>
                            <td>
                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <td>{t('company')}</td>
                                        <td>{t('warehouse')}</td>
                                        <td>{t('product')}</td>
                                        <td>{t('lot')}</td>
                                        <td>{t('status')}</td>
                                        <td>{t('sequence')}</td>
                                        <td>{t('UOM')}</td>
                                        <td>{t('UOM_type')}</td>
                                        <td>{t('quantity')}</td>
                                        <td>{t('quantity_picked')}</td>
                                        <td>{t('quantity_in_despatch')}</td>
                                        <td>{t('quantity_reserved')}</td>
                                        <td>{t('quantity_awaiting_confirm_out')}</td>
                                        <td>{t('quantity_available')}</td>
                                        <td>{t('gem_archive_flag')}</td>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {listItems.length > 0 ? (
                                        listItems.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.COMPANY_CODE}</td>
                                                <td>{item.WAREHOUSE}</td>
                                                <td>{item.PART_CODE}</td>
                                                <td>{item.IC_LOT_NUMBER}</td>
                                                <td>{item.IC_STATUS_CODE}</td>
                                                <td>{item.IC_LOT_SEQUENCE}</td>
                                                <td>{item.UNIT_OF_MEASURE}</td>
                                                <td>{item.IC_PRODUCT_UOM_TYPE}</td>
                                                <td>{item.IC_QUANTITY}</td>
                                                <td>{item.IC_QTY_PICKED}</td>
                                                <td>{item.IC_QTY_IN_DESPATCH}</td>
                                                <td>{item.IC_QTY_RESERVED}</td>
                                                <td>{item.IC_QTY_AWAITING_CONFIRM_OUT}</td>
                                                <td>{item.IC_QTY_AVAILABLE}</td>
                                                <td>{item.GEM_ARCHIVE_FLAG}</td>
                                                <td>
                                                    <IconButton aria-label="view" size="small"
                                                                href={`/item/${item.WAREHOUSE}/${item.PART_CODE}/${item.IC_LOT_NUMBER}`}>
                                                        <ArrowForwardIosIcon fontSize="inherit"/>
                                                    </IconButton>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5">{isFirstLoad ? '' : t('no_matching_records')}</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </Table>
                            </td>
                        </tr>
                        </tbody>
                    </Table>
                )
            ) : (
                <div>{t('Something went wrong')}</div>
            )}
        </div>
    );
};

export default TraceComponent;