import React, {useEffect, useState} from 'react';
import {
    Form,
    Input,
    Button,
    Dropdown,
    Menu,
    Tag,
    Card,
    Modal,
    Select,
    Row,
    Col,
    InputNumber,
    Switch, Flex
} from 'antd';
import {
    PlusCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import axiosInstance from "../utils/request";
import {ScriptTypes, ScriptTypesLabel, dataTypeList, operationEnum, LabelType} from "../enums/DataEnums";


const DataCellForm = ({setDataCell, initDataCell}) => {

        const [dataCells, setDataCells] = useState([]);
        const [operations, setOperations] = useState([]);
        const [dataLabels, setDataLabels] = useState([]);
        const [dataCellName, setDataCellName] = useState("");

        const [groupDataCells, setGroupDataCells] = useState([]);
        const [operationScript, setOperationScript] = useState([]);
        const [groupName, setGroupName] = useState("");
        const [showGroup, setShowGroup] = useState(false);
        const [editingType, setEditingType] = useState(1);

        const [showData, setShowData] = useState(false);
        const [dataType, setDataType] = useState(1);

        const [fileSelectValue, setFileSelectValue] = useState([]);
        const [dataSelectValue, setDataSelectValue] = useState([]);
        const [paramsSelectValue, setParamsSelectValue] = useState([]);
        const [isAdded, setIsAdded] = useState(false);
        const [isShow, setIsShow] = useState(false);

        const [form] = Form.useForm();

        useEffect(() => {
            init();
        }, [initDataCell]); // 空数组作为依赖项，确保只在组件挂载时运行一次
        const init = () => {
            console.log(initDataCell, "initDataCell...");
            if (initDataCell) {
                if (initDataCell.type === 2 && initDataCell.script.scriptType === ScriptTypes.OPERATION) {
                    setOperations(initDataCell.operationScript)
                    setDataCells(initDataCell.script.dataCells)
                    const newDataLabels = [];
                    initDataCell.operationScript.forEach((e, index_) => {
                        console.log(initDataCell, "initDataCell2222");
                        if (e.startsWith("f")) {
                            const index = e.replace("f", "")
                            const dataCell = initDataCell.script.dataCells[index];
                            console.log(dataCell, "init...");
                            // newDataLabels.push({
                            //     type: LabelType.SCRIPT,
                            //     index: index
                            // })
                        } else {
                            newDataLabels.push({
                                type: LabelType.DATA,
                            })
                        }
                    })
                } else {
                    setDataCells([initDataCell])
                    setDataLabels([{value: initDataCell.name, type: initDataCell.type, index: 0}])
                }
            }
        }


        const onLabelClose = (dataLabel, e) => {
            e.preventDefault()
            //    根据dataLabel 要删除label，operations，dataCells
            const newDataLabels = dataLabels.slice(0, -1);
            const newOperations = operations.slice(0, -1);
            setDataLabels(newDataLabels)
            setOperations(newOperations)
            if (dataLabel.type !== LabelType.SIGN) {
                const newDataCells = dataCells.slice(0, -1);
                setDataCells(newDataCells)
            }
        }

        const onLabelClick = (dataLabel, e) => {
            if (dataLabel.type === LabelType.DATA) {
                const dataCell = dataCells[dataLabel.index]
                if (dataCell.specificValue) {
                    dataCell.specificValue = dataCell.specificValue.join(",")
                }
                setIsShow(true)
                setDataType(dataCell.type)
                form.setFieldsValue(dataCell);
                setShowData(true)
            }

            if (dataLabel.type === LabelType.SCRIPT) {
                const dataCell = dataCells[dataLabel.index]
                console.log(dataCell, "onLabelClick");
                setIsShow(true)
                setShowGroup(true)
                setEditingType(dataCell.script.scriptType)
                setGroupName(dataCell.script.name)
                setOperationScript([dataCell.script.operationScript])
                setGroupDataCells(dataCell.script.dataCells)
            }
        }

        const createScriptDataCell = (dataCellArr, name, operationScript, type) => {
            return {
                name: name,
                script: {
                    dataCells: dataCellArr,
                    operationScript: operationScript,
                    scriptType: type,
                },
                type: 2
            }
        }

        const getParamsSelect = (callBack) => {
            const params = {type:3};
            params.dataTemplateId="1811663706395824129";
            axiosInstance.post('/template/list',null,{params})
                .then(response => {
                    console.log(response);
                    console.log(axiosInstance.isSuccess(response));
                    if (axiosInstance.isSuccess(response)) {
                        const {list} = response.data;
                        setParamsSelectValue(list.map(e => ({label: e.name, value: e.name})))
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        }

        const getFileSelect = (callBack) => {
            axiosInstance.post('/files/get?fileTemplateId=1811663639102410753')
                .then(response => {
                    if (axiosInstance.isSuccess(response, callBack)) {
                        const {list} = response.data;
                        setFileSelectValue(list.map(e => ({label: e.name, value: e.id})))
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        }

        const getDataSelect = (callBack) => {
            axiosInstance.post('/data/get?templateId=1811663639102410753')
                .then(response => {
                    if (axiosInstance.isSuccess(response, callBack)) {
                        const {list} = response.data;
                        setDataSelectValue(list.map(e => ({label: e.name, value: e.id})))
                        console.log(response.data);
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        }

        const initDataSelect = () => {
            getParamsSelect()
            getDataSelect(getFileSelect.bind(this, () => {
                setShowData(true)
            }))
        }

        const addDataCells = () => {
            initDataSelect()
        }
        const addGroups = () => {
            setEditingType(ScriptTypes.GROUP)
            setShowGroup(true)
        }
        const addFunctions = (e) => {
            setEditingType(ScriptTypes.FUNCTION)
            setOperationScript([e])
            setShowGroup(true)
        }
        const addOperations = (e) => {
            const label = {
                value: e,
                type: LabelType.SIGN
            }
            setOperations([...operations, e])
            setDataLabels([...dataLabels, label])
        }

        const clearGroupData = () => {
            setGroupDataCells([]);
            setGroupName("")
            setOperationScript("")
            setShowData(false)
        }

// 生成一个cell
        const handleGroupOk = () => {
            const size = dataCells.length;
            const label = {
                value: groupName,
                type: LabelType.SCRIPT,
                index: size
            }
            setDataCells([...dataCells, createScriptDataCell(
                groupDataCells, groupName, operationScript, editingType
            )])
            setOperations([...operations, ("f" + size)])
            console.log("groupDataCells:", groupDataCells);
            setDataLabels([...dataLabels, label])
            setShowGroup(false)
            clearGroupData()
        }

        const handleGroupCancel = (e) => {
            setShowGroup(false)
            clearGroupData()
        }

        const handleDataCancel = (e) => {
            setShowData(false)
            clearDataForm();
            setIsShow(false)
        }

        const clearDataForm = () => {
            setDataType(1);
        }

// 添加分组数据元按钮
        const addGroupDataCells = () => {
            setGroupDataCells([...groupDataCells, {}])
        };

        const funMap = {
            "+": addOperations,
            "-": addOperations,
            "*": addOperations,
            "/": addOperations,
            "(": addOperations,
            ")": addOperations,
            "group": addGroups,
            "sum": addFunctions.bind(this, "+"),
            "multi": addFunctions.bind(this, "*"),
            "data": addDataCells,
        }

        const handleMenuClick = (e) => {
            funMap[e.key](e.key);
        };

        const style = {
            display: 'inline-flex', /* 使用 flexbox 对齐 */
            alignItems: 'center', /* 垂直居中 */
            justifyContent: 'center' /* 水平居中 */
        }

        const saveData = () => {

            // 需要判断是否变成函数式了
            let resData;
            if (dataCells.length === 1) {
                resData = dataCells[0];
                resData.name = dataCellName;
            } else {
                resData = createScriptDataCell(dataCells, dataCellName, operations, ScriptTypes.OPERATION)
                resData.res = 1;
            }

            // editTemplateData([resData])
            setDataCell && setDataCell(resData);
            setIsAdded(!isAdded)
            console.log(resData);
        }
        const onDataCreate = (values) => {
            console.log('Received values of form: ', values);

            if (values && values.specificValue) {
                values.specificValue = values.specificValue.split(",");
            }

            const size = dataCells.length;
            const label = {
                value: values.name,
                type: LabelType.DATA,
                index: size
            }

            setOperations([...operations, ("f" + size)])
            setDataCells([...dataCells, values])
            setDataLabels([...dataLabels, label])
            setShowData(false)
        }

        return (
            <div>
                <Modal title={"创建" + ScriptTypesLabel[editingType]} width={'80%'} open={showGroup}
                       onOk={handleGroupOk} onCancel={handleGroupCancel}
                       maskClosable={false}>
                    <Form>
                        <Form.Item label={ScriptTypesLabel[editingType] + "名称"}>
                            <Input onChange={e => setGroupName(e.target.value)} style={{width: "20vw"}}/>
                        </Form.Item>
                    </Form>
                    {
                        groupDataCells.map(e => <DataCellForm setDataCell={(data) => {
                            const newData = [...groupDataCells];
                            newData[newData.length - 1] = data;
                            setGroupDataCells(newData)
                        }}/>)
                    }
                    <Button type="primary" disabled={isShow}
                            onClick={addGroupDataCells}>{"添加" + ScriptTypesLabel[editingType] + "的数据单元"}</Button>
                </Modal>

                <Modal title={"创建数据"} width={'80%'} open={showData}
                       onCancel={handleDataCancel}
                       okButtonProps={{
                           disabled: isShow,
                           autoFocus: true,
                           htmlType: 'submit',
                       }}
                       destroyOnClose
                       maskClosable={false}
                       modalRender={(dom) => (
                           <Form
                               layout="vertical"
                               form={form}
                               name="form_in_modal"
                               initialValues={{
                                   modifier: 'public',
                               }}
                               clearOnDestroy
                               onFinish={(values) => onDataCreate(values)}
                           >
                               {dom}
                           </Form>
                       )}
                >

                    <Row>
                        <Col span={8}>
                            <Form.Item label={"选择数据类型"} name="type">
                                <Select
                                    style={{width: '20vw'}}
                                    allowClear
                                    options={dataTypeList}
                                    onChange={e => {
                                        setDataType(e)
                                    }
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={"名称"} name="name"
                                       rules={[
                                           {
                                               required: true,
                                               message: '请填写名称',
                                           },
                                       ]}>
                                <Input style={{width: "20vw"}}/>
                            </Form.Item>
                        </Col>
                    </Row>
                    {/*文件*/}
                    {dataType === 1 &&
                        [<Row>
                            <Col span={8}>
                                <Form.Item label={"选择文件"} name="sourceId">
                                    <Select
                                        style={{width: '20vw'}}
                                        allowClear
                                        options={fileSelectValue}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={"输入表名"}>
                                    <Input style={{width: "20vw"}}/>
                                </Form.Item>
                            </Col>
                        </Row>,
                            <Row>
                                <Col span={8}>
                                    <Form.Item label={"行号"} name="rowIndex">
                                        <InputNumber style={{width: "20vw"}}/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label={"列号"} name="columnIndex">
                                        <InputNumber style={{width: "20vw"}}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        ]
                    }
                    {
                        (dataType === 3 || dataType === 1) &&
                        <Row>
                            <Col span={8}>
                                <Form.Item label={"选择起始索引"} name="startIndex">
                                    <InputNumber style={{width: "20vw"}}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={"选择终止索引"} name="endIndex">
                                    <InputNumber style={{width: "20vw"}}/>
                                </Form.Item>
                            </Col>
                        </Row>
                    }
                    {dataType === 3 &&
                        <Row>
                            <Col span={8}>
                                <Form.Item label={"选择其他数据单元"} name="sourceId">
                                    <Select
                                        style={{width: '20vw'}}
                                        allowClear
                                        options={dataSelectValue}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={"选择其他数据单元索引"} name="selectIndex">
                                    <InputNumber style={{width: "20vw"}}/>
                                </Form.Item>
                            </Col>
                        </Row>


                    }
                    {dataType === 4 &&
                        <Form.Item label={"选择参数"} name="paramName">
                            <Select
                                style={{width: '20vw'}}
                                allowClear
                                options={paramsSelectValue}
                            />
                        </Form.Item>
                    }
                    {dataType === 5 &&
                        <Form.Item label={"填入数值"} name="specificValue">
                            <Input onChange={e => setGroupName(e.target.value)} style={{width: "20vw"}}/>
                        </Form.Item>
                    }
                    <Form.Item label={"是否是最终结果"} name="res">
                        <Switch defaultChecked defaultValue={true}/>
                    </Form.Item>
                    {/*</Form>*/}
                </Modal>
                {
                    dataLabels.map((value, index, array) =>
                        <Tag closeIcon={index === dataLabels.length - 1 ?
                            <CloseCircleOutlined
                                style={{fontSize: '15px', position: 'absolute', right: '5px', top: '5px'}}/> : null}
                             style={{...style, fontSize: '20px', padding: '10px'}}
                            // icon={<TwitterOutlined/>}
                             onClick={onLabelClick.bind(this, value)}
                             onClose={onLabelClose.bind(this, value)}>{value.value}</Tag>)
                }
                <Flex style={{marginTop: '15px'}} gap="middle" justify={"center"} vertical={false}>
                    <Input onChange={(e) => {
                        setDataCellName(e.target.value)
                    }} style={{width: "5vw"}}/>
                    <Dropdown onOpenChange={(e, a, c) => {
                        console.log(a);
                    }} menu={{items: operationEnum, onClick: handleMenuClick}} placement="bottomLeft">
                        <Button disabled={isAdded} icon={<PlusCircleOutlined/>}/>
                    </Dropdown>
                    <Button disabled={isAdded} onClick={saveData} style={{marginLeft: "10px"}}>添加数据集</Button>
                </Flex>

            </div>

        );
    }
;

export default DataCellForm;
