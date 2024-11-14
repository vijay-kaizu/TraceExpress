const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const {v4: uuidv4} = require('uuid');

var envSettings = require('./env-settings');
var lookupHelper = require('./lookup-helper');

const port = envSettings.PORT;
const {DbHelper} = require('./db-helper');
const layout = true;

app.options('*', cors());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({message: 'Missing Authorization Header'});
    }

    // verify auth credentials
    const accessToken = req.headers.authorization.split(' ')[1];
    const admin_paths = ['/lookups/delete', '/lookups/edit', '/lookups/new', '/lookup_dbs/delete', '/lookup_dbs/edit', '/lookup_dbs/new', '/lookup_dbs/test_connection'];
    if (admin_paths.includes(req.path) && accessToken !== envSettings.ADMIN_ACCESS_TOKEN) {
        return res.status(401).json({message: 'Invalid access token'});
    }
    if (accessToken !== envSettings.ADMIN_ACCESS_TOKEN && accessToken !== envSettings.USER_ACCESS_TOKEN) {
        return res.status(401).json({message: 'Invalid access token'});
    }
    console.log("Request headers " + JSON.stringify(req.headers));
    req.dbHelper = new DbHelper(req.headers['x-db-name']);
    req.tenantName = req.headers['x-db-name'];
    if (!(req.tenantName in envSettings.databases)) {
        return res.status(401).json({message: 'Invalid database name'});
    }

    next();
});

app.delete('/lookups/delete', async (req, res) => {
    console.log("Delete Request received : " + req.query.lookup_id);
    let raw_data = readLookupsFile(req);
    let lookups = JSON.parse(raw_data);
    let matchedIndex = -1;
    for (let lookupIndex in lookups) {
        let lookup = lookups[lookupIndex];
        console.log('DELETE ^' + lookup.lookup_id + '^ with *' + req.query.lookup_id + '*');
        if (lookup.lookup_id === req.query.lookup_id) {
            matchedIndex = lookupIndex;
        }
    }
    if (matchedIndex > -1) {
        lookups.splice(matchedIndex, 1);
    }
    writeLookupsFile(req, JSON.stringify(lookups));
    res.send({
        success: true
    });
});

app.get('/lookups/get', async (req, res) => {
    console.log("Get Request received : " + req.query.lookup_id);
    let raw_data = readLookupsFile(req);
    let lookups = JSON.parse(raw_data);
    let matched = null;
    for (let lookupIndex in lookups) {
        let lookup = lookups[lookupIndex];
        console.log('GET ^' + lookup.lookup_id + '^ with *' + req.query.lookup_id + '*');
        if (lookup.lookup_id === req.query.lookup_id) {
            matched = lookup;
            let lookup_dbs = getLookupsMap(req);
            matched.lookup_db_name = lookup_dbs[matched.lookup_db_id];

        }
    }
    console.log("Returning " + JSON.stringify(matched));
    res.send(matched);
});
app.post('/lookups/edit', async (req, res) => {
    console.log("Request received : " + JSON.stringify(req.body));
    let raw_data = readLookupsFile(req);
    let lookups = JSON.parse(raw_data);
    for (let lookupIndex in lookups) {
        let lookup = lookups[lookupIndex];
        console.log('EDIT ^' + lookup.lookup_id + '^ with *' + req.body.lookup_id + '*');
        if (lookup.lookup_id === req.body.lookup_id) {
            lookup.movement_code = req.body.movement_code;
            lookup.lookup_name = req.body.lookup_name;
            lookup.query = req.body.lookup_query;
            lookup.lookup_db_id = req.body.lookup_db_id;
        }
    }
    writeLookupsFile(req, JSON.stringify(lookups));
    res.send({
        success: true
    });
});

app.post('/lookups/new', async (req, res) => {
    console.log("Request received : " + JSON.stringify(req.body));
    let raw_data = readLookupsFile(req);
    let lookups = JSON.parse(raw_data);
    const newLookup = {
        "movement_code": req.body.movement_code,
        "lookup_id": uuidv4(),
        "lookup_name": req.body.lookup_name,
        "query": req.body.lookup_query,
        "lookup_db_id": req.body.lookup_db_id
    };
    console.log("New Lookup " + JSON.stringify(newLookup));
    lookups.push(newLookup);
    writeLookupsFile(req, JSON.stringify(lookups));
    res.send({
        success: true
    });
});

app.get('/lookups/list', async (req, res) => {
    let raw_data = readLookupsFile(req);
    let lookups = JSON.parse(raw_data);
    let lookup_dbs = getLookupsMap(req);
    console.log("Finding DB names using " + JSON.stringify(lookup_dbs));
    for (let lookupIndex in lookups) {
        let lookup = lookups[lookupIndex];
        console.log("Lookup DB id is " + lookup.lookup_db_id);
        lookup.lookup_db_name = lookup_dbs[lookup.lookup_db_id];
    }
    res.send(lookups);
});

app.delete('/lookup_dbs/delete', async (req, res) => {
    console.log("Delete Request received : " + req.query.lookup_db_id);
    let raw_data = readLookupDBsFile(req);
    let lookup_dbs = JSON.parse(raw_data);
    let matchedIndex = -1;
    for (let lookupDBIndex in lookup_dbs) {
        let lookup = lookup_dbs[lookupDBIndex];
        console.log('DELETE ^' + lookup.lookup_db_id + '^ with *' + req.query.lookup_db_id + '*');
        if (lookup.lookup_db_id === req.query.lookup_db_id) {
            matchedIndex = lookupDBIndex;
        }
    }
    if (matchedIndex > -1) {
        lookup_dbs.splice(matchedIndex, 1);
    }
    writeLookupDBsFile(req, JSON.stringify(lookup_dbs));
    res.send({
        success: true
    });
});

app.get('/lookup_dbs/get', async (req, res) => {
    console.log("Get Request received : " + req.query.lookup_db_id);
    let raw_data = readLookupDBsFile(req);
    let lookup_dbs = JSON.parse(raw_data);
    let matched = null;
    for (let lookupDBIndex in lookup_dbs) {
        let lookupDb = lookup_dbs[lookupDBIndex];
        console.log('GET ^' + lookupDb.lookup_db_id + '^ with *' + req.query.lookup_db_id + '*');
        if (lookupDb.lookup_db_id === req.query.lookup_db_id) {
            matched = lookupDb;
        }
    }
    console.log("Returning " + JSON.stringify(matched));
    res.send(matched);
});
app.post('/lookup_dbs/edit', async (req, res) => {
    console.log("Request received : " + JSON.stringify(req.body));
    let raw_data = readLookupDBsFile(req);
    let lookup_dbs = JSON.parse(raw_data);
    for (let lookupDbIndex in lookup_dbs) {
        let lookupDb = lookup_dbs[lookupDbIndex];
        console.log('EDIT ^' + lookupDb.lookup_db_id + '^ with *' + req.body.lookup_db_id + '*');
        if (lookupDb.lookup_db_id === req.body.lookup_db_id) {
            lookupDb.db_name = req.body.db_name;
            lookupDb.db_type = req.body.db_type;
            lookupDb.host = req.body.host;
            lookupDb.username = req.body.username;
            lookupDb.password = req.body.password;
            lookupDb.db_instance = req.body.db_instance;
        }
    }
    writeLookupDBsFile(req, JSON.stringify(lookup_dbs));
    res.send({
        success: true
    });
});

app.post('/lookup_dbs/new', async (req, res) => {
    console.log("Request received DB : " + JSON.stringify(req.body));
    let raw_data = readLookupDBsFile(req);
    let lookup_dbs = JSON.parse(raw_data);
    const newLookupDB = {
        "lookup_db_id": uuidv4(),
        "db_name": req.body.db_name,
        "db_type": req.body.db_type,
        "host": req.body.host,
        "username": req.body.username,
        "password": req.body.password,
        "db_instance": req.body.db_instance
    };
    console.log("New Lookup " + JSON.stringify(newLookupDB));
    lookup_dbs.push(newLookupDB);
    writeLookupDBsFile(req, JSON.stringify(lookup_dbs));
    res.send({
        success: true
    });
});

app.post('/lookup_dbs/test_connection', async (req, res) => {
    console.log("Request received DB : " + JSON.stringify(req.body));
    var result = await lookupHelper.testConnection(req.body.db_type, req.body.host, req.body.username,
        req.body.password,
        req.body.db_instance);
    res.send(result);
});

app.get('/lookup_dbs/list', async (req, res) => {
    let raw_data = readLookupDBsFile(req);
    let lookup_dbs = JSON.parse(raw_data);
    res.send(lookup_dbs);
});

app.get('/movement-codes', async (req, res) => {
    let raw_data = readLookupsFile(req);
    let lookups = JSON.parse(raw_data);
    console.log(lookups);
    var lookupItems = [];
    var matched = false;
    for (let lookupIndex in lookups) {
        let lookup = lookups[lookupIndex];
        console.log(lookup.movement_code);
        console.log('^' + lookup.movement_code + '^ with *' + req.query.movement_code + '*');
        if (lookup.movement_code === req.query.movement_code) {
            lookupItems.push({
                'lookup_name': lookup.lookup_name,
                'movement_code': lookup.movement_code,
                'lookup_id': lookup.lookup_id
            });
            matched = true;
        }
    }
    var result = {
        "matched": matched,
        "msg": "Returning lookups for movement code : " + req.query.movement_code,
        "lookups": lookupItems
    };
    console.log(result);
    res.send(result);
});
app.get('/movement-code-lookup', async (req, res) => {
    const mapParam = req.query.map;
    const decodedMap = decodeURIComponent(mapParam);
    const map = JSON.parse(decodedMap);

    let raw_data = readLookupsFile(req);
    let lookups = JSON.parse(raw_data);
    let result = {
        "success": false,
        "msg": "Failed to perform lookup. Unknown error",
        "lookup_result": null
    };
    console.log('^' + req.query.lookup_id + '^ with *' + req.query.movement_code + '*');
    console.log('^' + req.query.warehouse + '^' + req.query.company_code + '^' + req.query.part_job + '^' + req.query.line_lot_stage + '^');
    for (let lookupIndex in lookups) {
        let lookup = lookups[lookupIndex];
        console.log('Matching with ^' + lookup.lookup_id + '^ with *' + lookup.movement_code + '*');
        if (lookup.movement_code === req.query.movement_code && (lookup.lookup_id + "") === req.query.lookup_id) {
            result = await lookupHelper.performLookup(req.tenantName, lookup, req.query.warehouse, req.query.company_code, req.query.part_job, req.query.line_lot_stage, req.query.movement_code, req.query.lookup_id, map);
        }
    }
    console.log(result);
    res.send(result);
});

app.get('/item', async (req, res) => {
    console.log(`Item = ${req.query.uniqueID}, ${req.query.product}, ${req.query.lot}, ${req.query.warehouse}`);

    var result = await getItem(req.dbHelper, req.query.uniqueID, req.query.product, req.query.lot, req.query.warehouse);
    res.send(result);
});

app.get('/list', async (req, res) => {
    console.log("Getting List");

    var result = await getList(req.dbHelper, req.query.searchKey, req.query.searchValue);
    res.send({"items": result});
});

app.get('/status-list', async (req, res) => {
    console.log("Getting Status List");

    var result = await getStatusList(req.dbHelper, req.query.product, req.query.lot, req.query.warehouse, req.query.company);
    res.send({"items": result});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

async function getList(dbHelper, searchKey = "IC_LT_TO_INDICATOR", searchValue = "I") {
    let allRecords = [];
    try {
        await dbHelper.connect();
        const query = `SELECT *
                       from IC_LOT_TRACE
                       where ${searchKey} like '%${searchValue}%'`;
        console.log(query);
        const result = await dbHelper.query(query);
        return dbHelper.extract(result);
    } catch (err) {
        console.log("ERROR");
        console.log(err);
    }
    return [];
}

async function getStatusList(dbHelper, product, lot, warehouse, company) {
    let allRecords = [];
    if ((product === undefined || product === '') && (lot === undefined || lot === '') && (warehouse === undefined || warehouse === '') && (company === undefined || company === ''))
        return allRecords;
    try {
        await dbHelper.connect();
        let query = `SELECT *
                     from IC_LOT_STATUS
                     where 1 = 1 `;
        if (company !== undefined && company !== '') {
            query += `and COMPANY_CODE like '%${company}%'`
        }
        if (product !== undefined && product !== '') {
            query += `and PART_CODE like '%${product}%'`
        }
        if (lot !== undefined && lot !== '') {
            query += `and IC_LOT_NUMBER like '%${lot}%'`
        }
        if (warehouse !== undefined && warehouse !== '') {
            query += `and WAREHOUSE like '%${warehouse}%'`
        }
        query += ` order by COMPANY_CODE, WAREHOUSE, PART_CODE, IC_LOT_NUMBER, IC_STATUS_CODE, IC_LOT_SEQUENCE, UNIT_OF_MEASURE`;
        console.log(query);
        const result = await dbHelper.query(query);
        return dbHelper.extract(result);
    } catch (err) {
        console.log("ERROR");
        console.log(err);
    }
    return [];
}

async function getItem(dbHelper, uniqueID, product, lot, warehouse) {
    console.log("Getting item" + uniqueID + " " + product + " " + lot + " " + warehouse);
    let allRecords = [];
    let nodeData = [];
    let linkData = [];
    let nextRandomId = 9786;
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await dbHelper.connect();
        let query = null;
        if (uniqueID !== undefined) {
            query = dbHelper.selectQuery() + ` where unique_id = ${uniqueID}`;
        } else {
            query = dbHelper.selectQuery() + ` where IC_LT_TO_INDICATOR = 'I' and IC_LT_TO_DIV_WH_FA = '${warehouse}' and IC_LT_TO_DOC_PART_JOB = '${product}' and IC_LT_TO_LINE_LOT_STAGE = '${lot}'`;
        }
        console.log(query);
        let result = await dbHelper.query(query);
        if (await dbHelper.length(result) >= 1) {
            let record = dbHelper.extract(result)[0];
            record["level"] = 0;

            nodeData.push({
                'key': 1,
                'text': record.IC_LT_TO_DIV_WH_FA + "/"
                    + record.IC_LT_TO_DOC_PART_JOB + "/"
                    + record.IC_LT_TO_LINE_LOT_STAGE,
                'item_path': record.IC_LT_TO_DIV_WH_FA + "/"
                    + record.IC_LT_TO_DOC_PART_JOB + "/"
                    + record.IC_LT_TO_LINE_LOT_STAGE,
                'icon': '/movement_codes/inventory.png',
                'movement_code': record.MOVEMENT_CODE,
                'node_props': {
                    'warehouse': record.IC_LT_TO_DIV_WH_FA,
                    'company_code': record.COMPANY_CODE,
                    'part_job': record.IC_LT_TO_DOC_PART_JOB,
                    'line_lot_stage': record.IC_LT_TO_LINE_LOT_STAGE
                },
                'row': 0,
                'col': 1,
                'circleColor': 'lightblue',
                'UNIQUE_ID': record.UNIQUE_ID,
                'unique_part': 'to'
            });

            allRecords.push(record);
            await findForwardRecursive(dbHelper, record, allRecords, nodeData, linkData, 0, 1, 1, 200.0);
            let tempRecord = {
                'COMPANY_CODE': record.COMPANY_CODE,
                'IC_LT_FROM_INDICATOR': record.IC_LT_TO_INDICATOR,
                'IC_LT_FROM_DIV_WH_FA': record.IC_LT_TO_DIV_WH_FA,
                'IC_LT_FROM_DOC_PART_JOB': record.IC_LT_TO_DOC_PART_JOB,
                'IC_LT_FROM_LINE_LOT_STAGE': record.IC_LT_TO_LINE_LOT_STAGE,
                'IC_LT_FROM_DOCSEQ_LOTSEQ_LINE': record.IC_LT_TO_DOCSEQ_LOTSEQ_LINE,
                'IC_LT_FROM_STATUS': record.IC_LT_TO_STATUS
            };
            await findBackwardRecursive(dbHelper, tempRecord, allRecords, nodeData, linkData, 0, 1, 1, 200.0);
            if (layout)
                updateRowPositions(nodeData, linkData);
            else
                updateRowPositionsSimple(nodeData, linkData);
        }
    } catch
        (err) {
        console.log("ERROR");
        console.log(err);
    }
    return {"items": allRecords, "nodes": nodeData, "links": linkData, "randomId": nextRandomId};
}

function updateRowPositionsSimple(nodeData, linkData) {
    for (let nodeIndex in nodeData) {
        let nodeItem = nodeData[nodeIndex];
        nodeItem['loc'] = (nodeItem['col'] * 250) + ' ' + nodeItem['row'];
    }
}

function updateRowPositions(nodeData, linkData) {
    let nodeMap = {};
    let columns = {};
    let minimumCol = -1;
    let maximumCol = 0;
    for (let nodeIndex in nodeData) {
        let nodeItem = nodeData[nodeIndex];
        nodeMap[nodeItem['key']] = nodeItem;
        let nodeColumn = nodeItem['col'];
        if (nodeColumn < minimumCol) {
            minimumCol = nodeItem['col'];
        }
        if (nodeColumn > maximumCol) {
            maximumCol = nodeItem['col'];
        }
        if (columns[nodeColumn] === undefined) {
            columns[nodeColumn] = [nodeItem];
        } else {
            columns[nodeColumn].push(nodeItem);
        }
    }

    let forwardChildrenMap = {};
    for (let linkIndex in linkData) {
        let linkItem = linkData[linkIndex];
        let fromItem = nodeMap[linkItem['from']];
        let fromNodeKey = linkItem['from'];
        let toItem = nodeMap[linkItem['to']];
        let toItemAvailableRow = toItem['availableRow'];
        let fromItemAvailableRow = fromItem['availableRow'];
        if (fromItem['col'] >= 0) {
            if (fromItemAvailableRow > toItemAvailableRow) {
                for (let betaIndex in columns[toItem['col']]) {
                    let betaItem = columns[toItem['col']][betaIndex];
                    if (betaItem['availableRow'] >= toItemAvailableRow) {
                        betaItem['availableRow'] = betaItem['availableRow'] + fromItemAvailableRow - toItemAvailableRow;
                    }
                }
            }
            if (forwardChildrenMap[fromNodeKey] === undefined) {
                forwardChildrenMap[fromNodeKey] = [toItem];
            } else {
                forwardChildrenMap[fromNodeKey].push(toItem);
            }
        }
    }
    nodeMap[1]['tree_size'] = updateCounts(1, forwardChildrenMap);

    let maxRowPositions = {};

    for (let nodeIndex in nodeData) {
        let nodeItem = nodeData[nodeIndex];
        nodeMap[nodeItem['key']] = nodeItem;
        let nodeColumn = nodeItem['col'];
        if (maxRowPositions[nodeColumn] === undefined) {
            maxRowPositions[nodeColumn] = 0;
        }
        if (nodeItem['tree_size'] !== undefined) {
            maxRowPositions[nodeColumn] = maxRowPositions[nodeColumn] + nodeItem['tree_size'];
        }
        nodeItem['availableRow'] = maxRowPositions[nodeColumn];
    }

    updateChildrenAvailableRow(nodeMap[1], forwardChildrenMap);

    for (let columnIndex = maximumCol; columnIndex >= 0; columnIndex--) {
        for (let betaIndex in columns[columnIndex]) {
            let betaItem = columns[columnIndex][betaIndex];
            let itemChildren = forwardChildrenMap[betaItem['key']];
            if (itemChildren !== undefined) {
                let sum = 0;
                for (let childIndex in itemChildren) {
                    sum += itemChildren[childIndex]['availableRow'];
                }
                let newPosition = sum / itemChildren.length;
                betaItem['availableRow'] = newPosition;
            } else {
                console.log("Could not find " + betaItem['key'] + " in " + forwardChildrenMap);
            }
        }
    }

    for (let nodeIndex in nodeData) {
        let nodeItem = nodeData[nodeIndex];
        if (nodeItem['col'] >= 0) {
            nodeItem['loc'] = (nodeItem['col'] * 250) + ' ' + (nodeItem['availableRow'] * 150);
        } else {
            nodeItem['loc'] = (nodeItem['col'] * 250) + ' ' + (nodeMap[1]['availableRow'] * 150 + nodeItem['row']);
        }
    }
}

function updateCounts(parentKey, childrenMap) {
    let itemChildren = childrenMap[parentKey];
    let allChildCount = 0;
    if (itemChildren !== undefined) {
        for (let childIndex in itemChildren) {
            let childCount = updateCounts(itemChildren[childIndex]['key'], childrenMap);
            itemChildren[childIndex]['tree_size'] = childCount;
            allChildCount += childCount;
        }
    } else return 1;
    return allChildCount;
}

function updateChildrenAvailableRow(parentItem, childrenMap) {
    let itemChildren = childrenMap[parentItem['key']];
    if (itemChildren !== undefined) {
        let lastChildAvailableRow = itemChildren[itemChildren.length - 1]['availableRow'];
        let parentAvailableRow = parentItem['availableRow'];
        for (let childIndex in itemChildren) {
            if (lastChildAvailableRow < parentAvailableRow) {
                itemChildren[childIndex]['availableRow'] = itemChildren[childIndex]['availableRow'] + parentAvailableRow - lastChildAvailableRow;
            }
            updateChildrenAvailableRow(itemChildren[childIndex], childrenMap);
        }
    }
}

async function findBackwardRecursive(dbHelper, record, allRecords, nodeData, linkData, parentRow, parentCol, parentNode, heightMargin) {
    let children = await findBackward(dbHelper, record);
    parentRow = parentRow - (((children.length - 1) / 2.0) * heightMargin);
    for (let fr in children) {
        console.log("BACKWARD SEARCH RESULT " + fr + " " + children[fr]["UNIQUE_ID"]);
        let backwardRecordItem = children[fr];
        allRecords.push(backwardRecordItem);
        let newNodeIndex = nodeData.length + 1;
        nodeData.push({
            'key': newNodeIndex,
            'text': backwardRecordItem.IC_LT_FROM_DIV_WH_FA + "/"
                + backwardRecordItem.IC_LT_FROM_DOC_PART_JOB + "/"
                + backwardRecordItem.IC_LT_FROM_LINE_LOT_STAGE + "\n"
                + (backwardRecordItem.DESCRIPTION !== null ? backwardRecordItem.DESCRIPTION : ''),
            'item_path': backwardRecordItem.IC_LT_FROM_INDICATOR === 'I' ? backwardRecordItem.IC_LT_FROM_DIV_WH_FA + "/"
                + backwardRecordItem.IC_LT_FROM_DOC_PART_JOB + "/"
                + backwardRecordItem.IC_LT_FROM_LINE_LOT_STAGE : null,
            'icon': await getImageName(backwardRecordItem.IC_LT_FROM_INDICATOR, backwardRecordItem.MOVEMENT_CODE),
            'movement_code': backwardRecordItem.MOVEMENT_CODE,
            'node_props': {
                'warehouse': backwardRecordItem.IC_LT_FROM_DIV_WH_FA,
                'company_code': backwardRecordItem.COMPANY_CODE,
                'part_job': backwardRecordItem.IC_LT_FROM_DOC_PART_JOB,
                'line_lot_stage': backwardRecordItem.IC_LT_FROM_LINE_LOT_STAGE
            },
            'row': parentRow,
            'col': parentCol - 1,
            'UNIQUE_ID': backwardRecordItem.UNIQUE_ID,
            'unique_part': 'from'
        });
        let newLinkIndex = -(linkData.length + 1);
        linkData.push(
            {
                key: newLinkIndex,
                to: parentNode,
                from: newNodeIndex
            },
        );
        await findBackwardRecursive(dbHelper, backwardRecordItem, allRecords, nodeData, linkData, parentRow, parentCol - 1, newNodeIndex, children.length > 1 ? heightMargin * 0.8 : heightMargin);
        parentRow += heightMargin;
    }
}

async function findForwardRecursive(dbHelper, record, allRecords, nodeData, linkData, parentRow, parentCol, parentNode, heightMargin) {

    let children = await findForward(dbHelper, record);
    parentRow = parentRow - (((children.length - 1) / 2.0) * heightMargin);
    for (let fr in children) {
        console.log("FORWARD SEARCH RESULT " + fr + " " + children[fr]["UNIQUE_ID"]);
        let forwardRecordItem = children[fr];
        allRecords.push(forwardRecordItem);
        let newNodeIndex = nodeData.length + 1;
        nodeData.push({
            'key': newNodeIndex,
            'text': forwardRecordItem.IC_LT_TO_DIV_WH_FA + "/"
                + forwardRecordItem.IC_LT_TO_DOC_PART_JOB + "/"
                + forwardRecordItem.IC_LT_TO_LINE_LOT_STAGE + "\n"
                + (forwardRecordItem.DESCRIPTION !== null ? forwardRecordItem.DESCRIPTION : ''),
            'item_path': forwardRecordItem.IC_LT_TO_INDICATOR === 'I' ? forwardRecordItem.IC_LT_TO_DIV_WH_FA + "/"
                + forwardRecordItem.IC_LT_TO_DOC_PART_JOB + "/"
                + forwardRecordItem.IC_LT_TO_LINE_LOT_STAGE : null,
            'icon': await getImageName(forwardRecordItem.IC_LT_TO_INDICATOR, forwardRecordItem.MOVEMENT_CODE),
            'movement_code': forwardRecordItem.MOVEMENT_CODE,
            'node_props': {
                'warehouse': forwardRecordItem.IC_LT_TO_DIV_WH_FA,
                'company_code': forwardRecordItem.COMPANY_CODE,
                'part_job': forwardRecordItem.IC_LT_TO_DOC_PART_JOB,
                'line_lot_stage': forwardRecordItem.IC_LT_TO_LINE_LOT_STAGE
            },
            'row': parentRow,
            'col': parentCol + 1,
            'UNIQUE_ID': forwardRecordItem.UNIQUE_ID,
            'unique_part': 'to'
        });
        let newLinkIndex = -(linkData.length + 1);
        linkData.push(
            {
                key: newLinkIndex,
                to: newNodeIndex,
                from: parentNode
            },
        );

        await findForwardRecursive(dbHelper, forwardRecordItem, allRecords, nodeData, linkData, parentRow, parentCol + 1, newNodeIndex, children.length > 1 ? heightMargin * 0.8 : heightMargin);
        parentRow += heightMargin;
    }
}

function getLookupsMap(req) {
    let raw_data = readLookupDBsFile(req);
    let lookup_dbs = JSON.parse(raw_data);
    let lookup_db_map = {};
    for (let lookupDBIndex in lookup_dbs) {
        lookup_db_map[lookup_dbs[lookupDBIndex].lookup_db_id] = lookup_dbs[lookupDBIndex].db_name;
    }
    return lookup_db_map;
}

async function getImageName(indicator, movement_code) {
    if (indicator === 'I') return '/movement_codes/inventory.png';
    if (['BATEXP', 'MMMR', 'PMMI', 'QRTRAN', 'SOLIT',
        'STO', 'ICAJ', 'PMCONF', 'PMMR', 'QUALTR', 'SOWHFR',
        'TRL', 'LOTADJ', 'PMJC', 'PMRC', 'SOCNOT', 'SOWHTO',
        'WHFR', 'MMMI', 'PMMC', 'QCTRAN', 'SODCNF', 'GRNA', 'GRNADJ',
        'STI', 'WHTO'].indexOf(movement_code) !== -1)
        return '/movement_codes/' + movement_code + '.png';
    return '/movement_codes/user_defined.png';
}

async function findForward(dbHelper, record) {
    const result = await findForwardLink(dbHelper,
        record['COMPANY_CODE'],
        record['IC_LT_TO_INDICATOR'],
        record['IC_LT_TO_DIV_WH_FA'],
        record['IC_LT_TO_DOC_PART_JOB'],
        record['IC_LT_TO_LINE_LOT_STAGE'],
        record['IC_LT_TO_DOCSEQ_LOTSEQ_LINE'],
        record['IC_LT_TO_STATUS']
    );
    return result;
}

async function findBackward(dbHelper, record) {
    const result = await findBackwardLink(dbHelper,
        record['COMPANY_CODE'],
        record['IC_LT_FROM_INDICATOR'],
        record['IC_LT_FROM_DIV_WH_FA'],
        record['IC_LT_FROM_DOC_PART_JOB'],
        record['IC_LT_FROM_LINE_LOT_STAGE'],
        record['IC_LT_FROM_DOCSEQ_LOTSEQ_LINE'],
        record['IC_LT_FROM_STATUS']
    );
    return result;
}

async function findBackwardLink(dbHelper, COMPANY_CODE, IC_LT_FROM_INDICATOR, IC_LT_FROM_DIV_WH_FA, IC_LT_FROM_DOC_PART_JOB, IC_LT_FROM_LINE_LOT_STAGE, IC_LT_FROM_DOCSEQ_LOTSEQ_LINE, IC_LT_FROM_STATUS) {
    console.log(`Find backward for ${COMPANY_CODE}, ${IC_LT_FROM_INDICATOR}, ${IC_LT_FROM_DIV_WH_FA}, ${IC_LT_FROM_DOC_PART_JOB}, ${IC_LT_FROM_LINE_LOT_STAGE}, ${IC_LT_FROM_DOCSEQ_LOTSEQ_LINE}, ${IC_LT_FROM_STATUS}`);
    let query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_TO_INDICATOR ${w(IC_LT_FROM_INDICATOR)} and IC_LT_TO_STATUS ${w(IC_LT_FROM_STATUS)} and IC_LT_TO_DIV_WH_FA ${w(IC_LT_FROM_DIV_WH_FA)} and IC_LT_TO_DOC_PART_JOB ${w(IC_LT_FROM_DOC_PART_JOB)} and IC_LT_TO_LINE_LOT_STAGE ${w(IC_LT_FROM_LINE_LOT_STAGE)} and IC_LT_TO_DOCSEQ_LOTSEQ_LINE ${w(IC_LT_FROM_DOCSEQ_LOTSEQ_LINE)}`;
    if (IC_LT_FROM_INDICATOR.startsWith('PM')) {
        query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_TO_INDICATOR like 'PM%' and IC_LT_TO_STATUS ${w(IC_LT_FROM_STATUS)} and IC_LT_TO_DIV_WH_FA ${w(IC_LT_FROM_DIV_WH_FA)} and IC_LT_TO_DOC_PART_JOB ${w(IC_LT_FROM_DOC_PART_JOB)} and IC_LT_TO_LINE_LOT_STAGE ${w(IC_LT_FROM_LINE_LOT_STAGE)}`;
    } else if (IC_LT_FROM_INDICATOR.startsWith('ICSTO')) {
        query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_TO_INDICATOR = 'ICSTI' and IC_LT_TO_STATUS ${w(IC_LT_FROM_STATUS)} and IC_LT_TO_DIV_WH_FA ${w(IC_LT_FROM_DIV_WH_FA)} and IC_LT_TO_DOC_PART_JOB ${w(IC_LT_FROM_DOC_PART_JOB)}`;
        let result = await dbHelper.query(query);
        if (await dbHelper.length(result) == 1) {
            query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_TO_INDICATOR = 'ICSTI' and IC_LT_TO_STATUS ${w(IC_LT_FROM_STATUS)} and IC_LT_TO_DIV_WH_FA ${w(IC_LT_FROM_DIV_WH_FA)} and IC_LT_TO_DOC_PART_JOB ${w(IC_LT_FROM_DOC_PART_JOB)} and IC_LT_TO_LINE_LOT_STAGE ${w(IC_LT_FROM_LINE_LOT_STAGE)}`;
        }
    }

    let result = await dbHelper.query(query);
    return dbHelper.extract(result);
}

async function findForwardLink(dbHelper, COMPANY_CODE, IC_LT_TO_INDICATOR, IC_LT_TO_DIV_WH_FA, IC_LT_TO_DOC_PART_JOB, IC_LT_TO_LINE_LOT_STAGE, IC_LT_TO_DOCSEQ_LOTSEQ_LINE, IC_LT_TO_STATUS) {
    console.log(`Find forward for ${COMPANY_CODE}, ${IC_LT_TO_INDICATOR}, ${IC_LT_TO_DIV_WH_FA}, ${IC_LT_TO_DOC_PART_JOB}, ${IC_LT_TO_LINE_LOT_STAGE}, ${IC_LT_TO_DOCSEQ_LOTSEQ_LINE}, ${IC_LT_TO_STATUS}`);
    let query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_FROM_INDICATOR ${w(IC_LT_TO_INDICATOR)} and IC_LT_FROM_STATUS ${w(IC_LT_TO_STATUS)} and IC_LT_FROM_DIV_WH_FA ${w(IC_LT_TO_DIV_WH_FA)} and IC_LT_FROM_DOC_PART_JOB ${w(IC_LT_TO_DOC_PART_JOB)} and IC_LT_FROM_LINE_LOT_STAGE ${w(IC_LT_TO_LINE_LOT_STAGE)} and IC_LT_FROM_DOCSEQ_LOTSEQ_LINE ${w(IC_LT_TO_DOCSEQ_LOTSEQ_LINE)}`;
    if (IC_LT_TO_INDICATOR.startsWith('PM')) {
        query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_FROM_INDICATOR like 'PM%' and IC_LT_FROM_STATUS ${w(IC_LT_TO_STATUS)} and IC_LT_FROM_DIV_WH_FA ${w(IC_LT_TO_DIV_WH_FA)} and IC_LT_FROM_DOC_PART_JOB ${w(IC_LT_TO_DOC_PART_JOB)} and IC_LT_FROM_LINE_LOT_STAGE ${w(IC_LT_TO_LINE_LOT_STAGE)}`;
    } else if (IC_LT_TO_INDICATOR.startsWith('ICSTI')) {
        query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_FROM_INDICATOR = 'ICSTO' and IC_LT_FROM_STATUS ${w(IC_LT_TO_STATUS)} and IC_LT_FROM_DIV_WH_FA ${w(IC_LT_TO_DIV_WH_FA)} and IC_LT_FROM_DOC_PART_JOB ${w(IC_LT_TO_DOC_PART_JOB)}`;
        let result = await dbHelper.query(query);
        if (await dbHelper.length(result) == 1) {
            query = dbHelper.selectQuery() + ` where COMPANY_CODE ${w(COMPANY_CODE)} and IC_LT_FROM_INDICATOR = 'ICSTO' and IC_LT_FROM_STATUS ${w(IC_LT_TO_STATUS)} and IC_LT_FROM_DIV_WH_FA ${w(IC_LT_TO_DIV_WH_FA)} and IC_LT_FROM_DOC_PART_JOB ${w(IC_LT_TO_DOC_PART_JOB)} and IC_LT_FROM_LINE_LOT_STAGE ${w(IC_LT_TO_LINE_LOT_STAGE)}`;
        }
    }
    let result = await dbHelper.query(query);
    return dbHelper.extract(result);
}

function w(input) {
    if (input === null) return 'IS NULL';
    else return ` = '${input}'`;
}

function readLookupsFile(req) {
    const fileName = 'lookups-' + (req.tenantName === '' ? 'default' : req.tenantName) + '.json';
    let file_data;
    try {
        file_data = fs.readFileSync(fileName, 'utf8');
        if (file_data.trim() === '') file_data = "[]";
    } catch (error) {
        if (error.code === 'ENOENT') {
            file_data = "[]";
            fs.writeFileSync(fileName, file_data, 'utf8');
        } else {
            throw error;
        }
    }
    return file_data
}

function writeLookupsFile(req, data) {
    fs.writeFileSync('lookups-' + (req.tenantName === '' ? 'default' : req.tenantName) + '.json', data)
}

function readLookupDBsFile(req) {
    const fileName = 'lookup-dbs-' + (req.tenantName === '' ? 'default' : req.tenantName) + '.json';
    let file_data;
    try {
        file_data = fs.readFileSync(fileName, 'utf8');
        if (file_data.trim() === '') file_data = "[]";
    } catch (error) {
        if (error.code === 'ENOENT') {
            file_data = "[]";
            fs.writeFileSync(fileName, file_data, 'utf8');
        } else {
            throw error;
        }
    }
    return file_data
}

function writeLookupDBsFile(req, data) {
    fs.writeFileSync('lookup-dbs-' + (req.tenantName === '' ? 'default' : req.tenantName) + '.json', data)
}
