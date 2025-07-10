import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Space, Tag, Divider } from 'antd';
import { DatabaseOutlined, CalculatorOutlined, FileTextOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';
import FormulaBuilder from './FormulaBuilder';
import { Param } from './KVAdd';

const { Option } = Select;

interface File {
    id: number;
    name: string;
}

interface DataCell {
    id: number;
    name: string;
    type: number;
}
interface AddDataCellModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (values: any) => void;
    files: File[];
    dataCells: DataCell[];
    params: Param[]; // Add params prop
    initialValues?: Partial<DataCell>;
}

const AddDataCellModal: React.FC<AddDataCellModalProps> = ({ open, onCancel, onOk, files, dataCells, params, initialValues }) => {
    const [form] = Form.useForm();
    const [selectedType, setSelectedType] = useState(1);

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue(initialValues);
                setSelectedType(initialValues.type || 1);
            } else {
                form.resetFields();
                setSelectedType(1);
            }
        }
    }, [open, initialValues, form]);

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                form.resetFields();
                
                let final_source_id = undefined;
                let final_source_cell_id = undefined;

                if (selectedType === 1) { // 文件
                    final_source_id = values.source_id;
                } else if (selectedType === 3) { // 其他数据单元
                    final_source_cell_id = values.source_id; // The form item is named source_id
                }

                // Ensure numeric fields are numbers, not strings from form inputs
                const numericValues = {
                    ...values,
                    type: selectedType,
                    source_id: final_source_id ? parseInt(final_source_id, 10) : undefined,
                    source_cell_id: final_source_cell_id ? parseInt(final_source_cell_id, 10) : undefined,
                    row_index: values.row_index ? parseInt(values.row_index, 10) : undefined,
                    start_index: values.start_index ? parseInt(values.start_index, 10) : undefined,
                    end_index: values.end_index ? parseInt(values.end_index, 10) : undefined,
                };
                
                const finalValues = initialValues ? { ...initialValues, ...numericValues } : numericValues;
                onOk(finalValues);
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    };

    const getTypeIcon = (type: number) => {
        const iconMap: { [key: number]: React.ReactNode } = {
            1: <FileTextOutlined style={{ color: '#52c41a' }} />,
            2: <CalculatorOutlined style={{ color: '#1890ff' }} />,
            3: <DatabaseOutlined style={{ color: '#722ed1' }} />,
            4: <SettingOutlined style={{ color: '#fa8c16' }} />,
            5: <EditOutlined style={{ color: '#eb2f96' }} />,
        };
        return iconMap[type] || <FileTextOutlined />;
    };

    const renderDynamicFields = () => {
        switch (selectedType) {
            case 1: // 文件
                return (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Form.Item name="source_id" label="选择文件" rules={[{ required: true }]}>
                            <Select 
                                placeholder="请选择文件"
                                className="modern-select"
                            >
                                {files.map(file => (
                                    <Option key={file.id} value={file.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileTextOutlined style={{ color: 'var(--text-secondary)' }} />
                                            {file.name}
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="sheet" label="输入表名">
                            <Input placeholder="例如: Sheet1" className="modern-input" />
                        </Form.Item>
                        <Form.Item name="row_index" label="行号">
                            <Input placeholder="例如: 1, 2, 3..." type="number" className="modern-input" />
                        </Form.Item>
                        <Form.Item name="column_index" label="列号">
                            <Input placeholder="例如: A, B, C... 或 1, 2, 3..." className="modern-input" />
                        </Form.Item>
                        <Form.Item name="start_index" label="选择起始索引">
                            <Input type="number" className="modern-input" />
                        </Form.Item>
                        <Form.Item name="end_index" label="选择终止索引">
                            <Input type="number" className="modern-input" />
                        </Form.Item>
                    </Space>
                );
            case 2: // 计算
                return (
                    <Form.Item name="script" label="计算脚本/公式" rules={[{ required: true }]}>
                        <FormulaBuilder dataCells={dataCells} />
                    </Form.Item>
                );
            case 3: // 其他数据单元 (for slicing)
                return (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Form.Item name="source_id" label="选择一个数据单元作为来源" rules={[{ required: true }]}>
                            <Select 
                                placeholder="请选择一个数据单元"
                                className="modern-select"
                            >
                                {dataCells.map(cell => (
                                    <Option key={cell.id} value={cell.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getTypeIcon(cell.type)}
                                            {cell.name}
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="start_index" label="选择起始索引">
                            <Input type="number" placeholder="从 1 开始" className="modern-input" />
                        </Form.Item>
                        <Form.Item name="end_index" label="选择终止索引">
                            <Input type="number" placeholder="留空则为到底" className="modern-input" />
                        </Form.Item>
                    </Space>
                );
            case 4: // 参数
                return (
                    <Form.Item name="param_name" label="选择参数">
                        <Select 
                            placeholder="请选择一个已定义的参数"
                            className="modern-select"
                        >
                            {params.map(p => (
                                <Option key={p.key} value={p.key}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <SettingOutlined style={{ color: 'var(--text-secondary)' }} />
                                        {p.key}
                                        <Tag color="blue" style={{ marginLeft: 'auto' }}>参数</Tag>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                );
            case 5: // 具体值
                return (
                    <Form.Item name="specific_value" label="填入数值" rules={[{ required: true }]}>
                        <Input type="number" className="modern-input" />
                    </Form.Item>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            open={open}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DatabaseOutlined style={{ color: '#667eea' }} />
                    <span>{initialValues ? '编辑数据单元' : '添加数据单元'}</span>
                </div>
            }
            okText="确定"
            cancelText="取消"
            onCancel={onCancel}
            onOk={handleOk}
            destroyOnClose
            className="modern-modal"
            width={600}
            okButtonProps={{ 
                className: 'modern-button primary',
                style: { borderRadius: '8px' }
            }}
            cancelButtonProps={{ 
                className: 'modern-button secondary',
                style: { borderRadius: '8px' }
            }}
        >
            <Form form={form} layout="vertical" name="form_in_modal">
                <Form.Item
                    name="name"
                    label="名称"
                    rules={[{ required: true, message: '请输入名称!' }]}
                >
                    <Input className="modern-input" placeholder="请输入数据单元名称" />
                </Form.Item>
                
                <Form.Item
                    name="type"
                    label="选择数据类型"
                    initialValue={1}
                >
                    <Select 
                        onChange={value => setSelectedType(value)}
                        className="modern-select"
                    >
                        <Option value={1}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileTextOutlined style={{ color: '#52c41a' }} />
                                文件
                                <Tag color="green" style={{ marginLeft: 'auto' }}>FILE</Tag>
                            </div>
                        </Option>
                        <Option value={2}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CalculatorOutlined style={{ color: '#1890ff' }} />
                                计算
                                <Tag color="blue" style={{ marginLeft: 'auto' }}>CALC</Tag>
                            </div>
                        </Option>
                        <Option value={3}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DatabaseOutlined style={{ color: '#722ed1' }} />
                                其他数据单元
                                <Tag color="purple" style={{ marginLeft: 'auto' }}>DATA</Tag>
                            </div>
                        </Option>
                        <Option value={4}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SettingOutlined style={{ color: '#fa8c16' }} />
                                参数
                                <Tag color="orange" style={{ marginLeft: 'auto' }}>PARAM</Tag>
                            </div>
                        </Option>
                        <Option value={5}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <EditOutlined style={{ color: '#eb2f96' }} />
                                具体值
                                <Tag color="magenta" style={{ marginLeft: 'auto' }}>VALUE</Tag>
                            </div>
                        </Option>
                    </Select>
                </Form.Item>
                
                <Divider style={{ margin: '16px 0' }} />
                
                {renderDynamicFields()}
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Form.Item name="res" label="是否是最终结果" valuePropName="checked">
                    <Switch className="modern-switch" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddDataCellModal; 