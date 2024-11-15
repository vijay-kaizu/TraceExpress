import Button from "react-bootstrap/Button";
import {useTranslation} from "react-i18next";

const Settings = () => {
    const {t} = useTranslation();
    const divStyle = {
        margin: "50px auto",
        width: '300px'
    };
    const buttonStyle = {
        marginRight: "20px"
    }
    return <div style={divStyle}>
        <h3>{t('settings')}</h3>
        <Button style={buttonStyle}
                href='/lookup_dbs'>{t('lookup_db.all_dbs')}</Button>
        <Button style={buttonStyle} href='/lookups'>{t('lookup.all_lookups')}</Button>
    </div>

}
export default Settings;
