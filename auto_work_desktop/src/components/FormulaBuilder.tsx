import React from 'react';
import { Select, Button, Input, Space, Card, Tag, Divider } from 'antd';
import { FunctionOutlined, CalculatorOutlined, DatabaseOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

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

    const operators = [
        { symbol: '+', label: '加法', icon: <PlusOutlined />, color: '#52c41a' },
        { symbol: '-', label: '减法', icon: <MinusOutlined />, color: '#fa8c16' },
        { symbol: '*', label: '乘法', icon: '×', color: '#1890ff' },
        { symbol: '/', label: '除法', icon: '÷', color: '#722ed1' },
        { symbol: '(', label: '左括号', icon: '(', color: '#595959' },
        { symbol: ')', label: '右括号', icon: ')', color: '#595959' }
    ];
    
    const functions = [
        { key: "sum", label: "连加", icon: <CalculatorOutlined />, color: '#52c41a' },
        { key: "multi", label: "连乘", icon: <FunctionOutlined />, color: '#1890ff' },
        { key: "group", label: "分组", icon: <DatabaseOutlined />, color: '#722ed1' }
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Input 
                value={value}
                onChange={handleInputChange} 
                placeholder="在此构建你的公式"
                className="modern-input"
                style={{ 
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '14px',
                    minHeight: '40px'
                }}
            />
            
            <Card 
                size="small" 
                className="modern-card"
                style={{ background: 'var(--bg-hover)' }}
                bodyStyle={{ padding: '12px' }}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DatabaseOutlined style={{ color: '#667eea' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>数据单元</span>
                    </div>
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="选择数据单元"
                        onSelect={handleDataCellSelect}
                        className="modern-select"
                    >
                        {dataCells.map(cell => (
                            <Option key={cell.id} value={cell.name}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <DatabaseOutlined style={{ color: 'var(--text-secondary)' }} />
                                    {cell.name}
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Space>
            </Card>
            
            <Card 
                size="small" 
                className="modern-card"
                style={{ background: 'var(--bg-hover)' }}
                bodyStyle={{ padding: '12px' }}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalculatorOutlined style={{ color: '#667eea' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>运算符</span>
                    </div>
                    <Space wrap size="small">
                        {operators.map(op => (
                            <Button 
                                key={op.symbol} 
                                onClick={() => handleOperatorClick(op.symbol)}
                                className="modern-button secondary"
                                style={{ 
                                    borderRadius: '8px',
                                    minWidth: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title={op.label}
                            >
                                <span style={{ 
                                    color: op.color,
                                    fontWeight: 600,
                                    fontSize: '16px'
                                }}>
                                    {typeof op.icon === 'string' ? op.icon : op.icon}
                                </span>
                            </Button>
                        ))}
                    </Space>
                </Space>
            </Card>
            
            <Card 
                size="small" 
                className="modern-card"
                style={{ background: 'var(--bg-hover)' }}
                bodyStyle={{ padding: '12px' }}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FunctionOutlined style={{ color: '#667eea' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>函数</span>
                    </div>
                    <Space wrap size="small">
                        {functions.map(fn => (
                            <Button 
                                key={fn.key} 
                                onClick={() => handleFunctionClick(fn.key as any)}
                                className="modern-button secondary"
                                style={{ 
                                    borderRadius: '8px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span style={{ color: fn.color }}>
                                    {fn.icon}
                                </span>
                                <span style={{ fontWeight: 500 }}>
                                    {fn.label}
                                </span>
                            </Button>
                        ))}
                    </Space>
                </Space>
            </Card>
        </Space>
    );
};

export default FormulaBuilder; 