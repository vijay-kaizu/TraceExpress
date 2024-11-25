import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from 'react-bootstrap';

const Settings = () => {
    useEffect(() => {
        sessionStorage.clear()
    })
    const {t} = useTranslation();
    const containerStyle = {
        margin: "50px auto",
        width: "300px",
        textAlign: "center",
    };

    const buttonContainerStyle = {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginTop: "20px",
    };

    const buttonStyle = {
        width: "120px",
    };

    return (
        <div style={containerStyle}>
            <h3>{t('settings')}</h3>
            <div style={buttonContainerStyle}>
                <Button style={buttonStyle} href="/lookup_dbs">
                    {t('lookup_db.all_dbs')}
                </Button>
                <Button style={buttonStyle} href="/lookups">
                    {t('lookup.all_lookups')}
                </Button>
            </div>
        </div>
    );
};

export default Settings;
