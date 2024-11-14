var envSettings = require('./env-settings');
const sql = require('mssql');
const oracledb = require('oracledb');

class DbHelper {

    constructor(db_name) {
        this.oracle_connection = null;
        this.db_name = db_name;
    }

    async connect() {
        if (envSettings.databases[this.db_name].DB_TYPE === "oracle") {
            this.oracle_connection = await oracledb.getConnection({
                user: envSettings.databases[this.db_name].ORACLE_DB.USER_NAME,
                password: envSettings.databases[this.db_name].ORACLE_DB.PASSWORD,
                connectString: envSettings.databases[this.db_name].ORACLE_DB.HOST + '/' + envSettings.databases[this.db_name].ORACLE_DB.DB_INSTANCE
            });

        } else {
            const dbUrl = envSettings.databases[this.db_name].DB_URL;
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
                console.log("Connected to MSSQL database:", this.db_name);
            } else {
                console.error("Invalid MSSQL connection URL format.");
            }
        }
    }

    async query(queryString) {
        console.log("X - " + queryString);
        if (envSettings.databases[this.db_name].DB_TYPE === "oracle") {
            return await this.oracle_connection.execute(
                queryString,
                [],
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );
        } else {
            return await sql.query(queryString);
        }
    }

    extract(result) {
        if (envSettings.databases[this.db_name].DB_TYPE === "oracle") {
            return result.rows;
        } else {
            return result.recordset;
        }
    }

    length(result) {
        if (envSettings.databases[this.db_name].DB_TYPE === "oracle") {
            return result.rows.length;
        } else {
            return result.recordset.length;
        }
    }

    selectQuery() {
        if (envSettings.databases[this.db_name].DB_TYPE === "oracle") {
            return 'SELECT a.*, rowid AS UNIQUE_ID from IC_LOT_TRACE a';
        } else {
            return 'SELECT *, NEWID() as UNIQUE_ID from IC_LOT_TRACE';
        }
    }
}


module.exports = {
    DbHelper
};