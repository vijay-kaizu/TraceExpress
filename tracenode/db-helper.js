var envSettings = require('./env-settings');
const mssql = require('mssql');
const mysql = require('mysql2/promise');
const oracledb = require('oracledb');

class DbHelper {

    constructor(db_name) {
        this.oracle_connection = null;
        this.db_name = db_name;
        this.mysqlConnection = null;
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
            const mssqlRegex = /mssql:\/\/(.*?):([^@]+(?:@[^@]+)*)@([^\/]+)(?:\/(.*))?/;
            const regex = /mysql:\/\/(.*?):([^@]+(?:@[^@]+)*)@([^\/]+)(?:\/(.*))?/;
            const mssqlMatch = dbUrl.match(mssqlRegex);
            const match = dbUrl.match(regex);

            if (mssqlMatch) {
                const [, user, password, server, database] = mssqlMatch;

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

                await mssql.close();
                await mssql.connect(config);
                console.log("Connected to MSSQL database:", this.db_name);
            } else if (match) {
                const [, user, password, server, database] = match;

                const config = {
                    user,
                    password,
                    host: server,
                    database
                };
                if (this.mysqlConnection) {
                    await this.mysqlConnection.end();
                    console.log('Closed existing MySQL connection');
                }
                this.mysqlConnection = await mysql.createConnection(config);
                console.log("Connected to MYSQL database:", this.db_name);
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
        } else if (envSettings.databases[this.db_name].DB_TYPE === "mssql") {
            return mssql.query(queryString);
        } else {
            const [rows] = await this.mysqlConnection.execute(queryString);
            return {recordset: rows};
        }
    }

    extract(result) {
        if (envSettings.databases[this.db_name].DB_TYPE === "oracle") {
            return result.rows;
        } else if (envSettings.databases[this.db_name].DB_TYPE === "mssql") {
            return result.recordset;
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
        } else if (envSettings.databases[this.db_name].DB_TYPE === "mssql") {
            return 'SELECT *, NEWID() as UNIQUE_ID from IC_LOT_TRACE';
        } else {
            return 'SELECT *, UUID() as UNIQUE_ID from IC_LOT_TRACE';
        }
    }
}


module.exports = {
    DbHelper
};