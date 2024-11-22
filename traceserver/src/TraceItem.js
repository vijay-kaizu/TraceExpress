import React, {useEffect, useState} from "react";
import GetAppIcon from '@mui/icons-material/GetApp';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import Slider from '@mui/material/Slider';
import {ReactDiagram} from "gojs-react";
import Table from "react-bootstrap/Table";
import * as go from "gojs";
import Cookies from 'universal-cookie';
import Button from "react-bootstrap/Button";
import {useTranslation} from 'react-i18next';
import {IconButton} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TableChartIcon from '@mui/icons-material/TableChart';
import {useLocation, useNavigate, useParams} from "react-router-dom";
import LookupResult from "./LookupResult";

let diagram;

const TraceItem = () => {
    const [state, setState] = useState({
        error: null,
        items: [],
        relevantItems: [],
        itemsNodeDataArray: [],
        selectedNodeItem: null,
        lookupItems: [],
        movementCode: null,
        movementCodeLoading: false,
        showBottomTable: process.env.REACT_APP_SHOW_BOTTOM_TABLE === 'true',
        selectedItemProps: [],
        activeItemId: null
    });
    const {t} = useTranslation();
    const {product, warehouse, lot} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [zoomValue, setZoomValue] = React.useState(1.0);

    useEffect(() => {
        const handleWheel = (event) => {
            if (event.ctrlKey) {
                event.preventDefault();
                let newZoom = zoomValue + (event.deltaY < 0 ? 0.1 : -0.1);
                if (newZoom >= 0.1 && newZoom <= 3.0) {
                    setZoomValue(newZoom)
                    diagram.scale = newZoom;
                }
            }
        };

        window.addEventListener('wheel', handleWheel, {passive: true});

        loadItem({PART_CODE: product, WAREHOUSE: warehouse, IC_LOT_NUMBER: lot});

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [product, warehouse, lot]);

    useEffect(() => {
        if (state.items.length > 0) {
            diagram.addDiagramListener("ChangedSelection", handleModelChange);
        }
    }, [state.items]);

    const loadItem = (item) => {
        const cookies = new Cookies();
        fetch(`${process.env.REACT_APP_SERVER_URL}/item?product=${item.PART_CODE}&warehouse=${item.WAREHOUSE}&lot=${item.IC_LOT_NUMBER}`, {
            method: 'get',
            headers: new Headers({
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setState((prevState) => ({
                        ...prevState,
                        items: result.items,
                        relevantItems: result.items,
                        itemsNodeDataArray: result.nodes,
                        itemsLinkDataArray: result.links
                    }));
                    zoomOut();
                },
                (error) => {
                    setState((prevState) => ({
                        ...prevState,
                        error: error
                    }));
                }
            );
    };

    const makeBlob = () => {
        diagram && diagram.makeImageData({
            background: "white",
            returnType: "blob", callback: function (blob) {
                var url = window.URL.createObjectURL(blob);
                var filename = "chart.png";
                var a = document.createElement("a");
                a.style = "display: none";
                a.href = url;
                a.download = filename;
                if (window.navigator.msSaveBlob !== undefined) {
                    window.navigator.msSaveBlob(blob, filename);
                    return;
                }
                document.body.appendChild(a);
                requestAnimationFrame(function () {
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                });
            }
        });
    };

    const zoomIn = () => {
        let newZoom = zoomValue + 0.1;
        if (newZoom <= 3.0) {
            setZoomValue(newZoom)
            diagram.scale = newZoom;
        }
    };

    const zoomOut = () => {
        let newZoom = zoomValue - 0.1;
        if (newZoom >= 0.1) {
            setZoomValue(newZoom)
            if (diagram) {
                diagram.scale = newZoom;
            }
        }
    };

    const handleZoomChange = (event, newValue) => {
        setZoomValue(newValue)
        diagram.scale = newValue;
    };

    const toggleTable = () => {
        setState((prevState) => ({
            ...prevState,
            showBottomTable: !prevState.showBottomTable
        }));
    };

    const navigateBack = () => {
        if (location.state?.from) {
            navigate(location.state.from);
        } else {
            navigate(-1);
        }
    };

    const initDiagram = () => {
        const $ = go.GraphObject.make;
        go.Diagram.licenseKey = "73f944e2b26231b700ca0d2b113f69ed1bb37f3b9ed71ef55e5041f3ef0a68443089ee2c01db8b9782f919fb1828c08d8f956d289e1c0032e132d3d445b085aee16475bb430044dba3502fc7cbfb2ba2ac2d75f3c3b676f28a7fdff0efadd18c5abda3d248985eba3b680530557eb04ca8fbdc";
        diagram = $(go.Diagram,
            {
                isModelReadOnly: true,
                isReadOnly: true,
                'undoManager.isEnabled': false,
                'clickCreatingTool.archetypeNodeData': {text: 'new node', color: 'lightblue'},
                model: $(go.GraphLinksModel, {
                    linkKeyProperty: 'key'  // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
                })
            });

        diagram.nodeTemplate =
            $(go.Node, "Spot",
                new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "Circle", {
                    width: 150,
                    strokeWidth: 0,
                    fill: 'white',
                    alignment: go.Spot.Center,
                }, new go.Binding('fill', 'circleColor')),
                $(go.Shape, "Circle", {
                    width: 90,
                    strokeWidth: 0,
                    fill: 'white',
                    alignment: go.Spot.Center,
                }),
                $(go.Picture, {
                        "source": "warehouse.png",
                        'height': 64,
                        'width': 110,
                        alignment: go.Spot.Center
                    },
                    new go.Binding('source', 'icon')),
                $(go.TextBlock,
                    {margin: 3, font: '14px Roboto', textAlign: 'center', alignment: go.Spot.Bottom},
                    new go.Binding('text').makeTwoWay()
                ),
            );

        const centerDiagram = () => {
            diagram.position = new go.Point(200, 200);
            setZoomValue(3.0)
            diagram.scale = 2.0;
        };


        diagram.addDiagramListener("InitialLayoutCompleted", function () {
            if (diagram.model.nodeDataArray.length > 2) {
                var data = diagram.model.nodeDataArray[1];
                var node = diagram.findNodeForData(data);
                diagram.centerRect(node.actualBounds);
            }
            centerDiagram();
        });

        // diagram.addDiagramListener("ChangedSelection", handleModelChange);

        return diagram;
    };

    const relevantItemsHeaderStyle = {
        fontSize: '11px',
        fontWeight: 'bold'
    };

    const hiddenStyle = {
        display: 'none'
    };

    const showStyle = {
        display: 'block'
    };

    const diagramStyle = {
        width: '85%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const movementCodeShowStyle = {
        marginTop: '10px',
        minWidth: '200px',
        verticalAlign: 'top',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'block',
    };
    const movementCodeHideStyle = {
        display: 'none'
    };

    const fullWidthStyle = {
        width: '100%'
    };

    const bottomTableStyle = {
        display: state.showBottomTable ? 'block' : 'none'
    };

    const sliderStyle = {
        width: "300px",
        padding: "0px 20px"
    }


    const handleModelChange = (changes) => {
        console.log('GoJS model changed!');
        setState((prevState) => ({
            ...prevState,
            activeItemId: null,
        }));
        setState({...state})
        if (changes instanceof go.DiagramEvent) {
            let itemsCopy = [...state.items];
            let selectedProps = [];
            let newList = [];
            let selectedNodeItemTemp = null;
            let movementCodeTemp = null;
            let nodePropsTemp = null;
            if (diagram.selection.size === 0) {
                newList = [...state.items];
            } else {
                diagram.selection.each(function (part) {
                    if (part instanceof go.Node) {
                        let allUniqueKeys = [];
                        let selectedNodeKey = part.data.key;
                        diagram.model.linkDataArray.map(link => {
                            if (link.to === selectedNodeKey) {
                                allUniqueKeys.push(link.from);
                            }
                        });
                        allUniqueKeys.push(selectedNodeKey);
                        diagram.model.linkDataArray.map(link => {
                            if (link.from === selectedNodeKey) {
                                allUniqueKeys.push(link.to);
                            }
                        });
                        let nodeMap = {};
                        diagram.model.nodeDataArray.map(node => {
                            nodeMap[node.key] = node;
                        });
                        let itemMap = {};
                        itemsCopy.map(item => {
                            itemMap[item.UNIQUE_ID] = item;
                        });
                        let keyFound = false;

                        allUniqueKeys.map(key => {
                            var item = Object.assign({}, itemMap[nodeMap[key].UNIQUE_ID]);
                            item['fromColor'] = 'white';
                            item['toColor'] = 'white';
                            if (key === selectedNodeKey) {
                                keyFound = true;
                                if (nodeMap[key].item_path !== null) {
                                    selectedNodeItemTemp = {
                                        path: nodeMap[key].item_path,
                                    };
                                }
                                if (nodeMap[key].movement_code !== null) {
                                    selectedProps = itemMap[nodeMap[key].UNIQUE_ID];
                                    movementCodeTemp = nodeMap[key].movement_code;
                                    nodePropsTemp = nodeMap[key].node_props;
                                }
                            } else {
                                if (!keyFound) {
                                    item['toColor'] = 'Tomato';
                                } else {
                                    item['fromColor'] = 'SkyBlue';
                                }
                            }
                            if (key !== 1) {
                                newList.push(item);
                            }
                        });
                    }
                });
            }
            setState((prevState) => ({
                ...prevState,
                relevantItems: newList,
                selectedNodeItem: selectedNodeItemTemp,
                movementCodeLoading: true,
                lookupItems: null,
                selectedItemProps: selectedProps,
            }));
            if (movementCodeTemp != null) {
                setState((prevState) => ({
                    ...prevState,
                    movementCodeLoading: true
                }));
                loadMovementCodes(movementCodeTemp, nodePropsTemp);
            } else {
                setState((prevState) => ({
                    ...prevState,
                    movementCodeLoading: false,
                    movementCode: null,
                    lookupItems: null
                }));
            }
        } else {
            console.log("Not Diagram Event");
        }
    }

    const loadMovementCodes = (movementCode, nodeProps) => {
        const cookies = new Cookies();
        fetch(process.env.REACT_APP_SERVER_URL + "/movement-codes?movement_code=" + movementCode, {
            method: 'get',
            headers: new Headers({
                'Authorization': 'Basic ' + cookies.get('login_token'),
                'X-DB-Name': cookies.get('backend_db_name')
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    if (result.matched) {
                        result.lookups.map((lookup) => (
                            lookup['node_props'] = nodeProps
                        ));
                        setState((prevState) => ({
                            ...prevState,
                            movementCode: result.msg,
                            lookupItems: result.lookups,
                            movementCodeLoading: false
                        }));
                    } else {
                        setState((prevState) => ({
                            ...prevState,
                            movementCode: null,
                            lookupItems: [],
                            movementCodeLoading: false
                        }));
                    }
                },
                (error) => {
                    setState((prevState) => ({
                        ...prevState,
                        movementCodeLoading: false,
                        error
                    }));
                }
            )
    }


    return (<div>
        <table>
            <tbody>
            <tr>
                <td>
                    <IconButton aria-label="back" size="medium" onClick={navigateBack}>
                        <ArrowBackIcon fontSize="inherit"/>
                    </IconButton>
                </td>
                <td>
                    <IconButton aria-label="back" size="medium" onClick={makeBlob}>
                        <GetAppIcon fontSize="inherit"/>
                    </IconButton>
                </td>
                <td>
                    <IconButton aria-label="back" size="medium" onClick={zoomOut}>
                        <ZoomOutIcon fontSize="inherit"/>
                    </IconButton>
                </td>
                <td style={sliderStyle}>
                    <Slider
                        value={zoomValue}
                        aria-labelledby="discrete-slider-small-steps"
                        step={0.10}
                        marks
                        min={0.10}
                        max={3.00}
                        onChange={handleZoomChange}
                    />
                </td>
                <td>
                    <IconButton aria-label="back" size="medium" onClick={zoomIn}>
                        <ZoomInIcon fontSize="inherit"/>
                    </IconButton>
                </td>
                <td>
                    <IconButton style={process.env.REACT_APP_SHOW_BOTTOM_TABLE === 'true' ? showStyle : hiddenStyle}
                                aria-label="back" size="medium" onClick={toggleTable}>
                        <TableChartIcon fontSize="inherit"/>
                    </IconButton>
                </td>
                <td>
                    <Button onClick={() => {
                        sessionStorage.clear()
                    }}
                            style={showStyle}
                            href={'/'}>{t('home_button')}</Button>
                </td>
                <td>
                    <Button
                        style={state.selectedNodeItem != null ? showStyle : hiddenStyle}
                        href={state.selectedNodeItem != null ? ('/item/' + state.selectedNodeItem.path) : ''}>{t('start_new_inquiry')}</Button>
                </td>
            </tr>
            </tbody>
        </table>
        <table style={fullWidthStyle}>
            <tbody>
            <tr>
                <td style={diagramStyle}>
                    <div style={{'height': state.showBottomTable ? '70vh' : '90vh'}}><ReactDiagram
                        initDiagram={initDiagram}
                        divClassName='diagram-component'
                        nodeDataArray={state.itemsNodeDataArray}
                        linkDataArray={state.itemsLinkDataArray}
                        onModelChange={handleModelChange}
                    /></div>
                </td>
                <td style={state.movementCode != null ? movementCodeShowStyle : movementCodeHideStyle}>
                    {state.movementCodeLoading ? t('loading') : ''}
                    {
                        state.lookupItems != null ? state.lookupItems.map((item, index) => (
                            <div key={item.lookup_id}>
                                <LookupResult movement_code={item.movement_code} lookup_id={item.lookup_id}
                                              index={index} lookup_name={item.lookup_name}
                                              node_props={item.node_props} all_props={state.selectedItemProps}
                                              activeItemId={state.activeItemId}
                                              setActiveItemId={(id) => setState((prevState) => ({
                                                  ...prevState,
                                                  activeItemId: id,
                                              }))
                                              }/>
                                {console.log("the item is -\n" + JSON.stringify(state.selectedItemProps))}
                            </div>
                        )) : ''
                    }
                </td>
            </tr>
            </tbody>
        </table>


        <div style={bottomTableStyle}>
            <Table striped bordered hover size="sm">
                <thead>
                <tr style={relevantItemsHeaderStyle}>
                    <td>{t('trace.COMPANY_CODE')}</td>
                    <td>{t('trace.IC_LT_FROM_INDICATOR')}</td>
                    <td>{t('trace.IC_LT_FROM_DIV_WH_FA')}</td>
                    <td>{t('trace.IC_LT_FROM_DOC_PART_JOB')}</td>
                    <td>{t('trace.IC_LT_FROM_LINE_LOT_STAGE')}</td>
                    <td>{t('trace.IC_LT_FROM_DOCSEQ_LOTSEQ_LINE')}</td>
                    <td>{t('trace.IC_LT_FROM_STATUS')}</td>
                    <td>{t('trace.IC_LT_TO_INDICATOR')}</td>
                    <td>{t('trace.IC_LT_TO_DIV_WH_FA')}</td>
                    <td>{t('trace.IC_LT_TO_DOC_PART_JOB')}</td>
                    <td>{t('trace.IC_LT_TO_LINE_LOT_STAGE')}</td>
                    <td>{t('trace.IC_LT_TO_DOCSEQ_LOTSEQ_LINE')}</td>
                    <td>{t('trace.IC_LT_TO_STATUS')}</td>
                    <td>{t('trace.MOVEMENT_CODE')}</td>
                    <td>{t('trace.SOURCE_MODULE')}</td>
                </tr>
                </thead>
                <tbody>
                {state.relevantItems && state.relevantItems.map(item => (
                    <tr style={relevantItemsHeaderStyle}>
                        <td>{item?.COMPANY_CODE}</td>
                        <td style={{backgroundColor: item?.fromColor}}>{item?.IC_LT_FROM_INDICATOR}</td>
                        <td style={{backgroundColor: item?.fromColor}}>{item?.IC_LT_FROM_DIV_WH_FA}</td>
                        <td style={{backgroundColor: item?.fromColor}}>{item?.IC_LT_FROM_DOC_PART_JOB}</td>
                        <td style={{backgroundColor: item?.fromColor}}>{item?.IC_LT_FROM_LINE_LOT_STAGE}</td>
                        <td style={{backgroundColor: item?.fromColor}}>{item?.IC_LT_FROM_DOCSEQ_LOTSEQ_LINE}</td>
                        <td style={{backgroundColor: item?.fromColor}}>{item?.IC_LT_FROM_STATUS}</td>
                        <td style={{backgroundColor: item?.toColor}}>{item?.IC_LT_TO_INDICATOR}</td>
                        <td style={{backgroundColor: item?.toColor}}>{item?.IC_LT_TO_DIV_WH_FA}</td>
                        <td style={{backgroundColor: item?.toColor}}>{item?.IC_LT_TO_DOC_PART_JOB}</td>
                        <td style={{backgroundColor: item?.toColor}}>{item?.IC_LT_TO_LINE_LOT_STAGE}</td>
                        <td style={{backgroundColor: item?.toColor}}>{item?.IC_LT_TO_DOCSEQ_LOTSEQ_LINE}</td>
                        <td style={{backgroundColor: item?.toColor}}>{item?.IC_LT_TO_STATUS}</td>
                        <td>{item?.MOVEMENT_CODE}</td>
                        <td>{item?.SOURCE_MODULE}</td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>

    </div>);
};

export default TraceItem;
