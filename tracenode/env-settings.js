module.exports = Object.freeze({
    PORT: 9001,
    ADMIN_ACCESS_TOKEN: 'mkN2ZqQubxyS8TzRurP2RCfEnCLjRgdF',
    USER_ACCESS_TOKEN: 'sfsnb9Nhzak2JB8CTXNYDy7NUqdy9wHn',
    databases: {
        ERP61: {
            DB_URL: 'mssql://trace_express:"Trace_pass@1234"@115.241.198.147/trace_express',
            DB_TYPE: 'mssql'
        },
        ERP60: {
            DB_URL: 'mysql://junit_user:"Junit_user_password@123"@115.241.198.148/trace_express',
            DB_TYPE: 'mysql'
        },
        ERP59: {
            DB_TYPE: 'oracle',
            ORACLE_DB: {
                USER_NAME: 'C##trace_admin',
                PASSWORD: 'root',
                HOST: '192.168.0.106',
                DB_INSTANCE: 'ORCL'
            },
        },
        trace_db_a: {
            DB_URL: 'oracle://admin:"trace123"@trace-orcl.cadv8fwjzfkf.ap-northeast-1.rds.amazonaws.com/ORCL',
            DB_TYPE: 'oracle'
        },
        trace_db_b: {
            DB_URL: 'mssql://admin:"trace123"@tracedemo.cadv8fwjzfkf.ap-northeast-1.rds.amazonaws.com/tracedemo',
            DB_TYPE: 'mssql'
        },
        trace_db_c: {
            DB_URL: 'mssql://admin:"trace123"@ttracedemo.cadv8fwjzfkf.ap-northeast-1.rds.amazonaws.com/tracedemo',
            DB_TYPE: 'mssql'
        }
    }
});