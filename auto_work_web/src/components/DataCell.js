import React, {useState} from 'react';
import {
    Form,
    Input,
    Button,
    Dropdown,
    Space,
    Menu,
    Tag,
    Card,
    Modal,
    Select,
    Row,
    Col,
    InputNumber,
    Switch
} from 'antd';
import {
    PlusCircleOutlined,
    LoadingOutlined, SearchOutlined,
    SettingFilled,
    SyncOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import {evaluate} from 'mathjs';
import axiosInstance from "../utils/request";

const FunctionTypes = {
    sum: "连加",
    multi: "连乘",
}

const operationEnum = [
        {key: "+", label: "+"},
        {key: "-", label: "-"},
        {key: "*", label: "*"},
        {key: "/", label: "/"},
        {key: "(", label: "("},
        {key: ")", label: ")"},
        {key: "group", label: "分组"},
        {key: "sum", label: "连加"},
        {key: "multi", label: "连乘"},
        {key: "data", label: "选择数据单元"},
    ]
;

const dataTypeEnum = [
    {value: 1, label: '文件'},
    // {value: 2, label: '计算'},
    {value: 3, label: '其他数据单元'},
    {value: 4, label: '参数'},
    {value: 5, label: '具体值'},
]

const ScriptTypes = {
    GROUP: 1,
    FUNCTION: 2,
    OPERATION: 3
}

const ScriptTypesLabel = {
    1: "分组",
    2: "函数",
    3: "运算"
}
const DataCellForm = ({setDataCell}) => {

    const [dataCells, setDataCells] = useState([]);
    const [groupDataCells, setGroupDataCells] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [operationScript, setOperationScript] = useState("");
    const [showGroup, setShowGroup] = useState(false);
    const [showData, setShowData] = useState(false);
    const [operations, setOperations] = useState([]);
    const [dataLabels, setDataLabels] = useState([]);
    const [editingType, setEditingType] = useState(1);
    const [dataType, setDataType] = useState(1);
    const [fileSelectValue, setFileSelectValue] = useState([]);
    const [dataSelectValue, setDataSelectValue] = useState([]);

    const [form] = Form.useForm();
    const onLabelClose = (e) => {
        e.preventDefault()
        //     要删除label，operations，dataCells
    }

    const createScriptDataCell = (dataCellArr, name, operationScript, type) => {
        return {
            name: name,
            script: {
                dataCells: dataCellArr,
                operationScript: operationScript,
                scriptType: type,
            },
            type: editingType
        }
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
        axiosInstance.post('/template/data/get?templateId=1811663639102410753')
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

    const editTemplateData = (data, callBack) => {
        axiosInstance.post('/template/data/edit?templateId=1811663639102410753', data)
            .then(response => {
                if (axiosInstance.isSuccess(response, callBack)) {
                    console.log(response.data);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    const initDataSelect = () => {
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
        setOperationScript(e)
        setShowGroup(true)
    }
    const addOperations = (e) => {
        setOperations([...operations, e])
        setDataLabels([...dataLabels, e])
    }

    const clearGroupData = () => {
        setGroupDataCells([]);
        setGroupName("")
        setOperationScript("")
    }

    // 生成一个cell
    const handleGroupOk = () => {
        const size = dataCells.length;
        setDataCells([...dataCells, createScriptDataCell(
            groupDataCells, groupName, operationScript, editingType
        )])
        setOperations([...operations, ("f" + size)])
        console.log("groupDataCells:", groupDataCells);
        setDataLabels([...dataLabels, groupName])
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
        "multi": addFunctions.bind("-"),
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
        } else {
            resData = createScriptDataCell(dataCells, "最终数据", operations.join(""), ScriptTypes.OPERATION)
            resData.res = 1;
            resData.type = 2;
        }

        editTemplateData([resData])
        setDataCell && setDataCell(resData);
        console.log(resData);
    }
    const onDataCreate = (values) => {
        console.log('Received values of form: ', values);
        const size = dataCells.length;
        setOperations([...operations, ("f" + size)])
        setDataCells([...dataCells, values])
        setDataLabels([...dataLabels, values.name])
        setShowData(false)
    }

    return (
        <div>
            <Modal title={"创建" + ScriptTypesLabel[editingType]} width={'80%'} open={showGroup}
                   onOk={handleGroupOk} onCancel={handleGroupCancel}
                   maskClosable={false}>
                <Form>
                    <Form.Item label={ScriptTypesLabel[editingType] + "名称"}>
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                </Form>
                {
                    groupDataCells.map(e => <DataCellForm setDataCell={(data) => {
                        const newData = [...groupDataCells];
                        newData[newData.length - 1] = data;
                        setGroupDataCells(newData)
                    }}/>)
                }
                <Button type="primary"
                        onClick={addGroupDataCells}>{"添加" + ScriptTypesLabel[editingType] + "的数据单元"}</Button>
            </Modal>

            <Modal title={"创建数据"} width={'80%'} open={showData}
                   onCancel={handleDataCancel}
                   okButtonProps={{
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
                                style={{width: '300px'}}
                                allowClear
                                options={dataTypeEnum}
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
                            <Input style={{width: "300px"}}/>
                        </Form.Item>
                    </Col>
                </Row>
                {/*文件*/}
                {dataType === 1 &&
                    [<Row>
                        <Col span={8}>
                            <Form.Item label={"选择文件"} name="sourceId">
                                <Select
                                    style={{width: '300px'}}
                                    allowClear
                                    options={fileSelectValue}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={"输入表名"}>
                                <Input style={{width: "300px"}}/>
                            </Form.Item>
                        </Col>
                    </Row>,
                        <Row>
                            <Col span={8}>
                                <Form.Item label={"行号"} name="rowIndex">
                                    <InputNumber style={{width: "300px"}}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={"列号"} name="columnIndex">
                                    <InputNumber style={{width: "300px"}}/>
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
                                <InputNumber style={{width: "300px"}}/>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={"选择终止索引"} name="endIndex">
                                <InputNumber style={{width: "300px"}}/>
                            </Form.Item>
                        </Col>
                    </Row>
                }
                {dataType === 3 &&
                    <Form.Item label={"选择其他数据单元"} name="sourceId">
                        <Select
                            style={{width: '300px'}}
                            allowClear
                            options={dataSelectValue}
                        />
                    </Form.Item>
                }
                {dataType === 4 &&
                    <Form.Item label={"选择参数"} name="paramName">
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                }
                {dataType === 5 &&
                    <Form.Item label={"填入数值"} name="specificValue">
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                }
                <Form.Item label={"是否是最终结果"} name="res">
                    <Switch defaultChecked/>
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
                         onClose={onLabelClose.bind(this, value)}>{value}</Tag>)
            }
            <Dropdown onOpenChange={(e, a, c) => {
                console.log(a);
            }} menu={{items: operationEnum, onClick: handleMenuClick}} placement="bottomLeft">
                <Button icon={<PlusCircleOutlined/>}/>
            </Dropdown>
            <Button onClick={saveData} style={{marginLeft: "10px"}}>确定</Button>
        </div>

    );
};

export default DataCellForm;
