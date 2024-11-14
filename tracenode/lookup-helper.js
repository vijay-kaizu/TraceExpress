const fs = require('fs');
const mssql = require('mssql');
var mysql = require('sync-mysql');
const oracledb = require('oracledb');
const envSettings = require("./env-settings");
const sql = require("mssql");

module.exports = {
    performLookup: async function performLookup(tenant_name, lookup, warehouse, company_code, part_job, line_lot_stage, movement_code, lookup_id, map) {
        let message = "Failed to perform the lookup";
        let success = false;
        let lookupResult = null;
        try {
            let lookupDBUrlsMap = getLookupDBs(tenant_name);
            if (lookup.lookup_db_id === null) {
                success = false;
                message = "No lookup DB configured.";
            } else {
                let lookupDB = lookupDBUrlsMap[lookup.lookup_db_id]
                let query = lookup.query;
                console.log(query);

                query = query.replace(/{{warehouse}}/g, warehouse);
                query = query.replace(/{{company_code}}/g, company_code);
                query = query.replace(/{{part_job}}/g, part_job);
                query = query.replace(/{{line_lot_stage}}/g, line_lot_stage);
                query = query.replace(/{{from_indicator}}/g, map.IC_LT_FROM_INDICATOR);
                query = query.replace(/{{from_div_wh_fa}}/g, map.IC_LT_FROM_DIV_WH_FA);
                query = query.replace(/{{from_doc_part_job}}/g, map.IC_LT_FROM_DOC_PART_JOB);
                query = query.replace(/{{from_line_lot_stage}}/g, map.IC_LT_FROM_LINE_LOT_STAGE);
                query = query.replace(/{{from_docseq_lotseq_line}}/g, map.IC_LT_FROM_DOCSEQ_LOTSEQ_LINE);
                query = query.replace(/{{from_status}}/g, map.IC_LT_FROM_STATUS);
                query = query.replace(/{{to_indicator}}/g, map.IC_LT_TO_INDICATOR);
                query = query.replace(/{{to_div_wh_fa}}/g, map.IC_LT_TO_DIV_WH_FA);
                query = query.replace(/{{to_doc_part_job}}/g, map.IC_LT_TO_DOC_PART_JOB);
                query = query.replace(/{{to_line_lot_stage}}/g, map.IC_LT_TO_LINE_LOT_STAGE);
                query = query.replace(/{{to_docseq_lotseq_line}}/g, map.IC_LT_TO_DOCSEQ_LOTSEQ_LINE);
                query = query.replace(/{{to_status}}/g, map.IC_LT_TO_STATUS);
                query = query.replace(/{{source_module}}/g, map.SOURCE_MODULE);
                query = query.replace(/{{description}}/g, map.DESCRIPTION);
                query = query.replace(/{{transaction_type}}/g, map.TRANSACTION_TYPE);
                query = query.replace(/{{movement_code}}/g, map.MOVEMENT_CODE);
                query = query.replace(/{{system_date}}/g, map.SYSTEM_DATE);
                query = query.replace(/{{transaction_date}}/g, map.TRANSACTION_DATE);
                query = query.replace(/{{ic_move_quantity_1}}/g, map.IC_MOVE_QUANTITY_1);
                query = query.replace(/{{unit_of_measure_1}}/g, map.UNIT_OF_MEASURE_1);
                query = query.replace(/{{ic_move_quantity_2}}/g, map.IC_MOVE_QUANTITY_2);
                query = query.replace(/{{unit_of_measure_2}}/g, map.UNIT_OF_MEASURE_2);
                console.log('After replace');
                console.log(query);
                console.log(convertToUrl(lookupDB));
                if (lookupDB.db_type === 'mssql') {

                    const dbUrl = envSettings.databases[tenant_name].DB_URL;
                    const regex = /mssql:\/\/(.*?):"(.*?)"@(.*?)(?:\/(.*))/;
                    const matches = dbUrl.match(regex);

                    if (matches) {
                        const [, user, password, server, database] = matches;

                        const config = {
                            user,
                            password,
                            server,
                            database,
                            options: {
                                encrypt: true,
                                trustServerCertificate: true
                            }
                        };

                        await sql.close();
                        await sql.connect(config);
                        const result = await sql.query(query);
                        success = true;
                        message = "Returning lookups for movement code = " + movement_code + " and lookup id = " + lookup_id;
                        lookupResult = result.recordset;
                        console.log("Connected to MSSQL database:", this.db_name);
                    } else {
                        console.error("Invalid MSSQL connection URL format.");
                    }
                } else if (lookupDB.db_type === 'mysql') {

                    let mysql_connection = new mysql({
                        host: lookupDB.host,
                        user: lookupDB.username,
                        password: lookupDB.password
                    });

                    const result = mysql_connection.query(query);

                    success = true;
                    message = "Returning lookups for movement code = " + movement_code + " and lookup id = " + lookup_id;
                    lookupResult = result;

                } else if (lookupDB.db_type === 'oracle') {

                    console.log("Processing oracle db");
                    let oracle_connection = await oracledb.getConnection({
                        user: lookupDB.username,
                        password: lookupDB.password,
                        connectString: lookupDB.host + '/' + lookupDB.db_instance
                    });

                    const result = await oracle_connection.execute(
                        query,
                        [],
                        {
                            outFormat: oracledb.OUT_FORMAT_OBJECT
                        }
                    );

                    console.log(result.metaData); // [ { name: 'FARMER' }, { name: 'PICKED' }, { name: 'RIPENESS' } ]
                    console.log(result.rows);
                    success = true;
                    message = "Returning lookups for movement code = " + movement_code + " and lookup id = " + lookup_id;
                    lookupResult = result.rows;

                } else {
                    success = false;
                    message = "Unsupported db type - " + lookupDB.db_type;
                }
            }
        } catch (err) {
            console.log("ERROR");
            console.log(err);
            success = false;
            message = "" + err;
        }
        return {"success": success, "message": message, "lookup_result": lookupResult};
    }, testConnection: async function testConnection(db_type, host, username, password, db_instance) {
        let message = "Failed to connect to db";
        let success = false;
        try {

            if (db_type === 'mssql') {

                await mssql.connect(db_type + '://' + username + ":" + password + "@" + host + "/" + db_instance);
                mssql.close();
                success = true;
                message = "Successfully connected to Microsoft SQL " + host + " " + username + " " + db_instance;
            } else if (db_type === 'mysql') {

                let mysql_connection = new mysql({
                    host: host,
                    user: username,
                    password: password
                });
                success = true;
                message = "Successfully connected to My SQL " + host + " " + username + " " + db_instance;

            } else if (db_type === 'oracle') {

                console.log("Processing oracle db");
                let oracle_connection = await oracledb.getConnection({
                    user: username,
                    password: password,
                    connectString: host + '/' + db_instance
                });
                message = "Successfully connected to Oracle " + host + " " + username + " " + db_instance;
                success = true;
            } else {
                success = false;
                message = "Unsupported db type - " + db_type;
            }

        } catch (err) {
            console.log("ERROR");
            console.log(err);
            success = false;
            message = "" + err;
        }
        return {"success": success, "message": message};
    },
};

function convertToUrl(lookupDB) {
    return lookupDB.db_type + '://' + lookupDB.username + ":" + lookupDB.password + "@" + lookupDB.host + "/" + lookupDB.db_instance;
}

function getLookupDBs(tenant_name) {
    let raw_data = fs.readFileSync('lookup-dbs-' + (tenant_name === '' ? 'default' : tenant_name) + '.json');
    let lookup_dbs = JSON.parse(raw_data);
    let lookup_db_map = {};
    for (let lookupDBIndex in lookup_dbs) {
        let lookupDB = lookup_dbs[lookupDBIndex];
        lookup_db_map[lookupDB.lookup_db_id] = lookupDB;
    }
    return lookup_db_map;
}