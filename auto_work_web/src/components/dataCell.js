import React, {useState} from 'react';
import {Form, Input, Button, Dropdown, Space, Menu} from 'antd';
import {
    PlusCircleOutlined,
    LoadingOutlined, SearchOutlined,
    SettingFilled,
    SmileOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import {evaluate} from 'mathjs';

const operations = [
        {key: "+", label: "+"},
        {key: "-", label: "-"},
        {key: "*", label: "*"},
        {key: "/", label: "/"},
        {key: "(", label: "("},
        {key: "group", label: "分组"},
        {key: "sum", label: "连加"},
        {key: "multi", label: "连乘"},
    ]
;
const FormulaForm = () => {

    const [fields, setFields] = useState({f1: 0, f2: 0, f3: 0});
    const [formula, setFormula] = useState('');
    const [result, setResult] = useState(null);

    const onFieldsChange = (changedFields) => {
        setFields({...fields, ...changedFields});
    };

    const onFormulaChange = (e) => {
        setFormula(e.target.value);
    };

    const calculateResult = () => {
        try {
            const scope = {...fields};
            const res = evaluate(formula, scope);
            setResult(res);
            console.log(fields);
            console.log(formula);
            debugger
        } catch (error) {
            console.error('Invalid formula:', error);
            setResult('Error');
        }
    };
    const onFinish = () => {

        // Send data to backend
        // axios.post('/api/calculate', { fields, formula });
    };

    const handleMenuClick = (e) => {
        console.log(e.key);
    };

    return (
        <div>
            {/*<Space direction="vertical">*/}
            {/*    <Space wrap>*/}
                    <Dropdown onOpenChange={(e,a,c)=>{
                        console.log(a);
                    }} menu={{items:operations,  onClick: handleMenuClick}} placement="bottomLeft">
                        <Button icon={<PlusCircleOutlined/>}/>
                    </Dropdown>
            {/*    </Space>*/}
            {/*</Space>*/}
            <Form onFinish={onFinish}>
                <Form.Item label="f1">
                    <Input type="number" onChange={(e) => onFieldsChange({f1: parseFloat(e.target.value)})}/>
                </Form.Item>
                <Form.Item label="f2">
                    <Input type="number" onChange={(e) => onFieldsChange({f2: parseFloat(e.target.value)})}/>
                </Form.Item>
                <Form.Item label="f3">
                    <Input type="number" onChange={(e) => onFieldsChange({f3: parseFloat(e.target.value)})}/>
                </Form.Item>
                <Form.Item label="Formula">
                    <Input onChange={onFormulaChange}/>
                </Form.Item>
                <Button type="primary" onClick={calculateResult}>Calculate</Button>
                <div>Result: {result}</div>
            </Form>
        </div>

    );
};

export default FormulaForm;
