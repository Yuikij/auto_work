import React, { useState } from 'react';
import { Form, Input, Button } from 'antd';
import { evaluate } from 'mathjs';

const FormulaForm = () => {
    const [fields, setFields] = useState({ f1: 0, f2: 0, f3: 0 });
    const [formula, setFormula] = useState('');
    const [result, setResult] = useState(null);

    const onFieldsChange = (changedFields) => {
        setFields({ ...fields, ...changedFields });
    };

    const onFormulaChange = (e) => {
        setFormula(e.target.value);
    };

    const calculateResult = () => {
        try {
            const scope = { ...fields };
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

    return (
        <Form onFinish={onFinish}>
            <Form.Item label="f1">
                <Input type="number" onChange={(e) => onFieldsChange({ f1: parseFloat(e.target.value) })} />
            </Form.Item>
            <Form.Item label="f2">
                <Input type="number" onChange={(e) => onFieldsChange({ f2: parseFloat(e.target.value) })} />
            </Form.Item>
            <Form.Item label="f3">
                <Input type="number" onChange={(e) => onFieldsChange({ f3: parseFloat(e.target.value) })} />
            </Form.Item>
            <Form.Item label="Formula">
                <Input onChange={onFormulaChange} />
            </Form.Item>
            <Button type="primary" onClick={calculateResult}>Calculate</Button>
            <div>Result: {result}</div>
        </Form>
    );
};

export default FormulaForm;
