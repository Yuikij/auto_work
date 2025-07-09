import React from 'react';
import { Select, Button, Input, Space } from 'antd';

const { Option } = Select;

interface DataCell {
    id: number;
    name: string;
}

interface FormulaBuilderProps {
    value?: string;
    onChange?: (value: string) => void;
    dataCells: DataCell[];
}

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({ value = '', onChange, dataCells }) => {

    const triggerChange = (changedValue: string) => {
        onChange?.(changedValue);
    };

    const handleDataCellSelect = (dataCellName: string) => {
        const newFormula = `${value}[${dataCellName}]`;
        triggerChange(newFormula);
    };

    const handleOperatorClick = (operator: string) => {
        const newFormula = `${value} ${operator} `;
        triggerChange(newFormula);
    };

    const handleFunctionClick = (func: 'sum' | 'multi' | 'group') => {
        const newFormula = `${value}${func}()`;
        triggerChange(newFormula);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        triggerChange(e.target.value);
    }

    const operators = ['+', '-', '*', '/', '(', ')'];
    const functions = [
        { key: "sum", label: "连加" },
        { key: "multi", label: "连乘" },
        { key: "group", label: "分组" }
    ];

    return (
        <div>
            <Input 
                value={value}
                onChange={handleInputChange} 
                placeholder="在此构建你的公式"
            />
            <div style={{ marginTop: 8 }}>
                <Space wrap>
                    <span>数据单元:</span>
                    <Select
                        showSearch
                        style={{ width: 150 }}
                        placeholder="选择数据单元"
                        onSelect={handleDataCellSelect}
                    >
                        {dataCells.map(cell => (
                            <Option key={cell.id} value={cell.name}>
                                {cell.name}
                            </Option>
                        ))}
                    </Select>
                </Space>
            </div>
            <div style={{ marginTop: 8 }}>
                <Space wrap>
                    <span>运算符:</span>
                    {operators.map(op => (
                        <Button key={op} onClick={() => handleOperatorClick(op)}>
                            {op}
                        </Button>
                    ))}
                </Space>
            </div>
            <div style={{ marginTop: 8 }}>
                <Space wrap>
                    <span>函数:</span>
                    {functions.map(fn => (
                        <Button key={fn.key} onClick={() => handleFunctionClick(fn.key as any)}>
                            {fn.label}
                        </Button>
                    ))}
                </Space>
            </div>
        </div>
    );
};

export default FormulaBuilder; 