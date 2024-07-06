import React, {useState} from 'react';
import {Form, Input, Button, Dropdown, Space, Menu, Tag, Card, Modal} from 'antd';
import {
    PlusCircleOutlined,
    LoadingOutlined, SearchOutlined,
    SettingFilled,
    SmileOutlined,
    SyncOutlined, CloseCircleOutlined, TwitterOutlined,
} from '@ant-design/icons';
import {evaluate} from 'mathjs';

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

const onLabelClose = (e) => {
    e.preventDefault()
}

const DataCell = () => {
    return <Card
        title="表1分组"
        // extra={<a href="#">More</a>}
        style={{
            width: '80%',
        }}
    >
    </Card>
}


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
    const [showData, setShowData] = useState(true);
    const [operations, setOperations] = useState([]);
    const [dataLabels, setDataLabels] = useState([]);
    const [editingType, setEditingType] = useState(1);


    const createScriptDataCell = (dataCellArr, name, operationScript, type) => {
        return {
            name: name,
            script: {
                dataCells: dataCellArr,
                operationScript: operationScript,
                type: type,
            }
        }
    }

    const addDataCells = () => {

    }
    const addGroups = () => {
        setEditingType(ScriptTypes.GROUP)
        setShowGroup(true)
    }
    const addFunctions = (e) => {
        setEditingType(ScriptTypes.FUNCTION)
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
        setDataCells([...dataCells, createScriptDataCell(
            groupDataCells, groupName, operationScript, editingType
        )])
        console.log("dataLabels:", dataLabels);
        setDataLabels([...dataLabels, groupName])
        clearGroupData()
    }

    const handleGroupCancel = (e) => {
        setShowGroup(false)
        clearGroupData()
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
        "sum": addFunctions,
        "multi": addFunctions,
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
                    groupDataCells.map(e => <DataCellForm/>)
                }
                <Button type="primary"
                        onClick={addGroupDataCells}>{"添加" + ScriptTypesLabel[editingType] + "的数据单元"}</Button>
            </Modal>

            <Modal title={"创建数据"} width={'80%'} open={showData}
                   onOk={handleGroupOk} onCancel={handleGroupCancel}
                   maskClosable={false}>
                <Form>
                    <Form.Item label={"选择数据类型"}>
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                    <Form.Item label={"名称"}>
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                    <Form.Item label={"行号"}>
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                    <Form.Item label={"列号"}>
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                </Form>
            </Modal>
            {
                dataLabels.map((value, index, array) =>
                    <Tag closeIcon={index === dataLabels.length - 1 ?
                        <CloseCircleOutlined
                            style={{fontSize: '15px', position: 'absolute', right: '5px', top: '5px'}}/> : null}
                         style={{...style, fontSize: '20px', padding: '10px'}}
                        // icon={<TwitterOutlined/>}
                         onClose={onLabelClose}>{value}</Tag>)
            }
            <Dropdown onOpenChange={(e, a, c) => {
                console.log(a);
            }} menu={{items: operationEnum, onClick: handleMenuClick}} placement="bottomLeft">
                <Button icon={<PlusCircleOutlined/>}/>
            </Dropdown>
        </div>

    );
};

export default DataCellForm;
