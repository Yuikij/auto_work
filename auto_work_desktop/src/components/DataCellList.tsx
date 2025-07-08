import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Drawer, Space, message } from 'antd';
import ParseResultViewer from './ParseResultViewer';

const { Option } = Select;

// Matching Rust structs
interface DataCell {
    id: number;
    template_id: number;
    name: string;
    sheet_name?: string;
    start_row?: number;
    end_row?: number;
    start_col?: number;
    end_col?: number;
    type: number;
    data_range?: string;
    description?: string;
}

interface ParseResult {
    values: number[];
}

interface DataCellListProps {
    templateId: number;
}

const DataCellList: React.FC<DataCellListProps> = ({ templateId }) => {
    const [dataCells, setDataCells] = useState<DataCell[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCell, setEditingCell] = useState<DataCell | null>(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [parseResult, setParseResult] = useState<number[]>([]);
    const [form] = Form.useForm();

    const fetchDataCells = async () => {
        try {
            const cells = await invoke<DataCell[]>('list_data_cells', { templateId });
            setDataCells(cells);
        } catch (error) {
            console.error('Error fetching data cells:', error);
            message.error(`Failed to fetch data cells: ${error}`);
        }
    };

    useEffect(() => {
        if (templateId) {
            fetchDataCells();
        }
    }, [templateId]);

    const handleAdd = () => {
        setEditingCell(null);
        form.resetFields();
        form.setFieldsValue({ template_id: templateId, type: 1 }); // Default to NUMBER
        setIsModalVisible(true);
    };

    const handleEdit = (cell: DataCell) => {
        setEditingCell(cell);
        form.setFieldsValue(cell);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this data cell?')) {
            try {
                await invoke('delete_data_cell', { id });
                message.success('Data cell deleted successfully');
                fetchDataCells();
            } catch (error) {
                console.error('Error deleting data cell:', error);
                message.error(`Failed to delete data cell: ${error}`);
            }
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, template_id: templateId, type: Number(values.type) };

            if (editingCell) {
                await invoke('update_data_cell', { id: editingCell.id, request: { ...editingCell, ...payload } });
                message.success('Data cell updated successfully');
            } else {
                await invoke('add_data_cell', { request: payload });
                message.success('Data cell added successfully');
            }
            fetchDataCells();
            setIsModalVisible(false);
        } catch (error) {
            console.error('Form validation/submission failed:', error);
            message.error(`Operation failed: ${error}`);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleParse = async (cellId: number) => {
        try {
            const result = await invoke<ParseResult>('parse_data_cell', { id: cellId });
            setParseResult(result.values);
            setIsDrawerVisible(true);
        } catch (e) {
            message.error(`Error parsing data: ${e}`);
        }
    };

    const onDrawerClose = () => {
        setIsDrawerVisible(false);
        setParseResult([]);
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Sheet Name', dataIndex: 'sheet_name', key: 'sheet_name' },
        { title: 'Range', dataIndex: 'data_range', key: 'data_range' },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: DataCell) => (
                <Space size="middle">
                    <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
                    <Button type="link" danger onClick={() => handleDelete(record.id)}>Delete</Button>
                    <Button type="link" onClick={() => handleParse(record.id)}>Parse</Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
                Add Data Cell
            </Button>
            <Table columns={columns} dataSource={dataCells} rowKey="id" />

            <Modal
                title={editingCell ? 'Edit Data Cell' : 'Add Data Cell'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                destroyOnClose
            >
                <Form form={form} layout="vertical" name="dataCellForm" initialValues={{ type: 1 }}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="type" label="Data Type" rules={[{ required: true }]}>
                        <Select>
                            <Option value={1}>Number</Option>
                            <Option value={2}>String</Option>
                            <Option value={3}>Date</Option>
                            <Option value={4}>Row</Option>
                            <Option value={5}>Column</Option>
                            <Option value={6}>Table</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="sheet_name" label="Sheet Name">
                        <Input />
                    </Form.Item>
                    <Form.Item name="start_row" label="Start Row">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="end_row" label="End Row">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="start_col" label="Start Col">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="end_col" label="End Col">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="data_range" label="Data Range (e.g., A1:B5)">
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title="Parse Result"
                placement="right"
                onClose={onDrawerClose}
                open={isDrawerVisible}
                width={400}
            >
                <ParseResultViewer values={parseResult} />
            </Drawer>
        </div>
    );
};

export default DataCellList; 