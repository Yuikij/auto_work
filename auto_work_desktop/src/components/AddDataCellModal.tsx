import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button } from 'antd';
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

    const renderDynamicFields = () => {
        switch (selectedType) {
            case 1: // 文件
                return (
                    <>
                        <Form.Item name="source_id" label="选择文件" rules={[{ required: true }]}>
                            <Select placeholder="请选择文件">
                                {files.map(file => <Option key={file.id} value={file.id}>{file.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="sheet" label="输入表名">
                            <Input placeholder="例如: Sheet1" />
                        </Form.Item>
                        <Form.Item name="row_index" label="行号">
                            <Input placeholder="例如: 1, 2, 3..." type="number" />
                        </Form.Item>
                        <Form.Item name="column_index" label="列号">
                            <Input placeholder="例如: A, B, C... 或 1, 2, 3..." />
                        </Form.Item>
                        <Form.Item name="start_index" label="选择起始索引">
                            <Input type="number" />
                        </Form.Item>
                        <Form.Item name="end_index" label="选择终止索引">
                            <Input type="number" />
                        </Form.Item>
                    </>
                );
            case 2: // 计算
                return (
                    <Form.Item name="script" label="计算脚本/公式" rules={[{ required: true }]}>
                        <FormulaBuilder dataCells={dataCells} />
                    </Form.Item>
                );
            case 3: // 其他数据单元 (for slicing)
                return (
                    <>
                        <Form.Item name="source_id" label="选择一个数据单元作为来源" rules={[{ required: true }]}>
                            <Select placeholder="请选择一个数据单元">
                                {dataCells.map(cell => <Option key={cell.id} value={cell.id}>{cell.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="start_index" label="选择起始索引">
                            <Input type="number" placeholder="从 1 开始" />
                        </Form.Item>
                        <Form.Item name="end_index" label="选择终止索引">
                            <Input type="number" placeholder="留空则为到底" />
                        </Form.Item>
                    </>
                );
            case 4: // 参数
                return (
                    <Form.Item name="param_name" label="选择参数">
                        <Select placeholder="请选择一个已定义的参数">
                            {params.map(p => <Option key={p.key} value={p.key}>{p.key}</Option>)}
                        </Select>
                    </Form.Item>
                );
            case 5: // 具体值
                return (
                    <Form.Item name="specific_value" label="填入数值" rules={[{ required: true }]}>
                        <Input type="number" />
                    </Form.Item>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            open={open}
            title={initialValues ? 'Edit Data Cell' : 'Add Data Cell'}
            okText="Ok"
            cancelText="Cancel"
            onCancel={onCancel}
            onOk={handleOk}
            destroyOnClose
        >
            <Form form={form} layout="vertical" name="form_in_modal">
                <Form.Item
                    name="name"
                    label="名称"
                    rules={[{ required: true, message: '请输入名称!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="type"
                    label="选择数据类型"
                    initialValue={1}
                >
                    <Select onChange={value => setSelectedType(value)}>
                        <Option value={1}>文件</Option>
                        <Option value={2}>计算</Option>
                        <Option value={3}>其他数据单元</Option>
                        <Option value={4}>参数</Option>
                        <Option value={5}>具体值</Option>
                    </Select>
                </Form.Item>
                {renderDynamicFields()}
                <Form.Item name="res" label="是否是最终结果" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddDataCellModal; 