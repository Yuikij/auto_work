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


const DataForm = () => {
    return <div>DataForm</div>

}

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
const DataCellForm = ({setDataCell}) => {

    const [fields, setFields] = useState({f1: 0, f2: 0, f3: 0});
    const [dataCells, setDataCells] = useState([]);
    const [groupDataCells, setGroupDataCells] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [showGroup, setShowGroup] = useState(false);
    const [functionDataCells, setFunctionDataCells] = useState([]);
    const [functionName, setFunctionName] = useState("");
    const [showFunction, setShowFunction] = useState(false);
    const [operations, setOperations] = useState([]);
    const [dataLabels, setDataLabels] = useState([]);


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
        setShowGroup(true)
    }
    const addFunctions = (e) => {
        setDataLabels([...dataLabels, FunctionTypes[e]])
    }
    const addOperations = (e) => {
        setOperations([...operations, e])
        setDataLabels([...dataLabels, e])
    }

    // 生成一个cell
    const handleGroupOk = () => {
        setDataCells([...dataCells, createScriptDataCell(
            groupDataCells, groupName, null, ScriptTypes.GROUP
        )])
    }

    const handleGroupCancel = (e) => {
        setShowGroup(false)
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
    const DataLabel = () => {
        const style = {
            display: 'inline-flex', /* 使用 flexbox 对齐 */
            alignItems: 'center', /* 垂直居中 */
            justifyContent: 'center' /* 水平居中 */
        }
        return dataLabels.map((value, index, array) =>
            <Tag closeIcon={index === dataLabels.length - 1 ?
                <CloseCircleOutlined
                    style={{fontSize: '15px', position: 'absolute', right: '5px', top: '5px'}}/> : null}
                 style={{...style,fontSize: '20px', padding: '10px'}}
                 // icon={<TwitterOutlined/>}
                 onClose={onLabelClose}>{value}</Tag>)

    }

    return (
        <div>
            <Modal title="创建分组" width={'80%'} open={showGroup} onOk={handleGroupOk} onCancel={handleGroupCancel}
                   maskClosable={false}>
                <Form>
                    <Form.Item label="分组名称">
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                </Form>
                <DataCellForm/>
                {
                    groupDataCells.map(e => <DataCellForm/>)
                }
                <Button type="primary" onClick={addGroupDataCells}>添加分组</Button>
            </Modal>
            <Modal title="创建函数" width={'80%'} open={showFunction} onOk={handleGroupOk} onCancel={handleGroupCancel}
                   maskClosable={false}>
                <Form>
                    <Form.Item label="分组名称">
                        <Input onChange={e => setGroupName(e.target.value)} style={{width: "300px"}}/>
                    </Form.Item>
                </Form>
                <DataCellForm/>
                {
                    functionDataCells.map(e => <DataCellForm/>)
                }
                <Button type="primary" onClick={addGroupDataCells}>添加分组</Button>
            </Modal>
            <DataCell/>
            {/*<Space direction="vertical">*/}
            {/*    <Space wrap>*/}
            <DataForm/>
            <DataLabel/>
            <Dropdown onOpenChange={(e, a, c) => {
                console.log(a);
            }} menu={{items: operationEnum, onClick: handleMenuClick}} placement="bottomLeft">
                <Button icon={<PlusCircleOutlined/>}/>
            </Dropdown>
            {/*    </Space>*/}
            {/*</Space>*/}
            {/*<Form onFinish={onFinish}>*/}
            {/*    <Form.Item label="f1">*/}
            {/*        <Input type="number" onChange={(e) => onFieldsChange({f1: parseFloat(e.target.value)})}/>*/}
            {/*    </Form.Item>*/}
            {/*    <Form.Item label="f2">*/}
            {/*        <Input type="number" onChange={(e) => onFieldsChange({f2: parseFloat(e.target.value)})}/>*/}
            {/*    </Form.Item>*/}
            {/*    <Form.Item label="f3">*/}
            {/*        <Input type="number" onChange={(e) => onFieldsChange({f3: parseFloat(e.target.value)})}/>*/}
            {/*    </Form.Item>*/}
            {/*    <Form.Item label="Formula">*/}
            {/*        <Input onChange={onFormulaChange}/>*/}
            {/*    </Form.Item>*/}
            {/*</Form>*/}
        </div>

    );
};

export default DataCellForm;
