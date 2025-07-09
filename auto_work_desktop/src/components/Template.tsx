import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Divider, message, Modal, Row, Space, Switch, Table, Input, List, Select, Upload } from "antd";
import { DeleteOutlined, PlusOutlined, UploadOutlined, FileTextOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { invoke } from "@tauri-apps/api/core";
import KVAdd from "./KVAdd";
import AddDataCellModal from './AddDataCellModal';

interface DataCell {
  id: number;
  name: string;
  type: number;
  res: boolean;
  script: string;
  specific_value: string | null;
}

interface FileData {
    id: number;
    name: string;
}

interface KVPair {
  key: string;
  value: string;
}

interface TemplateProps {
  templateId: number | null;
}

const dataTypeMap: { [key: number]: string } = {
  1: '文本',
  2: '数字',
  3: '日期',
  4: '列表',
  5: '脚本',
  6: '计算',
  7: '其他数据单元'
};

const Template: React.FC<TemplateProps> = ({ templateId }) => {
  const [params, setParams] = useState<KVPair[]>([]);
  const [sourceFiles, setSourceFiles] = useState<FileData[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [dataCells, setDataCells] = useState<DataCell[]>([]);
  const [dataValueOpen, setDataValueOpen] = useState(false);
  const [dataValue, setDataValue] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<DataCell | null>(null);


  // New state for execution parameters
  const [executionParams, setExecutionParams] = useState<KVPair[]>([]);
  const [currentExecParamKey, setCurrentExecParamKey] = useState<string>('');
  const [currentExecParamValue, setCurrentExecParamValue] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [transientFiles, setTransientFiles] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (templateId) {
      getParams();
      getFiles();
      getDataCell();
      // Reset execution state when template changes
      setExecutionParams([]);
      setTransientFiles([]);
    }
  }, [templateId]);

  const getFiles = async () => {
    if (templateId) {
      const res: FileData[] = await invoke("list_files_by_template", { templateId });
      setSourceFiles(res);
    }
  };

  const handleAddFile = async () => {
    if (!templateId || !newFileName.trim()) {
        message.warning('请输入有效的文件名');
        return;
    }
    try {
        await invoke('add_file', {
            templateId,
            name: newFileName,
            path: newFileName, // Using name as path as per user's request for simplicity
        });
        message.success(`文件 "${newFileName}" 添加成功`);
        setNewFileName(''); // Clear input
        getFiles(); // <--- This will refresh the file list immediately
    } catch (error) {
        console.error('Failed to add file:', error);
        message.error(`添加文件失败: ${error}`);
    }
  };

  const getParams = async () => {
    if (!templateId) return;
    try {
      const kvPairs = await invoke<KVPair[]>('get_params', { templateId });
      setParams(kvPairs);
    } catch (error) {
      console.error('Error fetching params:', error);
      message.error('Failed to fetch params');
    }
  };

  const getDataCell = async () => {
    if (templateId) {
        try {
            const cells = await invoke<DataCell[]>('list_data_cells', { templateId });
            cells.sort((a, b) => {
                if (a.res === b.res) return 0;
                return a.res ? -1 : 1;
            });
            setDataCells(cells);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to fetch data cells');
        }
    }
  };

  const handleEditDataCell = (cell: DataCell) => {
    setEditingCell(cell);
    setIsModalOpen(true);
  };

  const handleAddDataCell = async (values: any) => {
    console.log('Received values of form: ', values);
    if (!templateId) return;
    try {
        const request = {
            ...values,
            template_id: templateId,
            res: values.res || false, // Ensure res has a boolean value
        };

        if (editingCell) {
            await invoke('update_data_cell', { id: editingCell.id, request });
            message.success('Data cell updated successfully');
        } else {
            await invoke('add_data_cell', { request });
            message.success('Data cell added successfully');
        }
        
        getDataCell();
    } catch (error) {
        console.error('Failed to save data cell:', error);
        message.error(`Failed to save data cell: ${error}`);
    }
    setIsModalOpen(false);
    setEditingCell(null);
  };

  const handleBatchUpload: UploadProps['beforeUpload'] = (file) => {
    setTransientFiles(prevFiles => [...prevFiles, file]);
    // Prevent auto upload
    return false;
  };

  const handleRemoveTransientFile = (file: UploadFile) => {
    setTransientFiles(prevFiles => {
        const index = prevFiles.findIndex(f => f.uid === file.uid);
        const newFileList = prevFiles.slice();
        newFileList.splice(index, 1);
        return newFileList;
    });
  };

  const handleAddExecutionParam = () => {
    if (!currentExecParamKey || !currentExecParamValue) {
        message.warning('Please select a parameter and enter a value.');
        return;
    }
    setExecutionParams(prevParams => {
        const existingParamIndex = prevParams.findIndex(p => p.key === currentExecParamKey);
        if (existingParamIndex > -1) {
            // Update existing parameter
            const newParams = [...prevParams];
            newParams[existingParamIndex] = { key: currentExecParamKey, value: currentExecParamValue };
            return newParams;
        } else {
            // Add new parameter
            return [...prevParams, { key: currentExecParamKey, value: currentExecParamValue }];
        }
    });
    setCurrentExecParamValue('');
  };

  const handleDeleteExecutionParam = (key: string) => {
    setExecutionParams(prevParams => prevParams.filter(p => p.key !== key));
  };

  const delTemplateData = async (dataCellId: number) => {
    try {
        await invoke('delete_data_cell', { id: dataCellId });
        message.success('Data cell deleted');
        getDataCell();
    } catch (error) {
        console.error('Error deleting data cell:', error);
        message.error('Failed to delete data cell');
    }
  };

  const start = async () => {
    if (!templateId) return;
    
    setUploading(true);

    try {
        const fileContents = await Promise.all(
            transientFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file as any);
                    reader.onload = () => {
                        const base64Content = (reader.result as string).split(',')[1];
                        resolve({ name: file.name, content: base64Content });
                    };
                    reader.onerror = error => reject(error);
                });
            })
        );

        const paramsAsJson = JSON.stringify(
            executionParams.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, string>)
        );

        const updatedCells = await invoke<DataCell[]>("execute_template", {
            templateId,
            params: paramsAsJson,
            transientFiles: fileContents
        });
        
        setDataCells(updatedCells);
        message.success("执行成功");
    } catch (e: any) {
        message.error("执行失败: " + e.toString());
    } finally {
        setUploading(false);
    }
  };

  const showAddDataCellModal = async () => {
    await getFiles(); // Force a refresh before opening the modal
    setIsModalOpen(true);
  };

  const dataColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: number) => {
        const typeMap: { [key: number]: string } = {
            1: '文件',
            2: '计算',
            3: '其他数据单元',
            4: '参数',
            5: '具体值',
        };
        return typeMap[type] || '未知';
    } },
    { title: '最终结果', dataIndex: 'res', key: 'res', render: (res: boolean) => <Switch checked={res} disabled /> },
    { title: '执行结果', dataIndex: 'specific_value', key: 'specific_value' },
    { title: '操作', key: 'action', render: (_: any, record: DataCell) => (
      <Space size="middle">
        <a onClick={() => handleEditDataCell(record)}>编辑</a>
        <a onClick={() => delTemplateData(record.id)}>删除</a>
      </Space>
    )},
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="参数定义">
            <KVAdd
              kvPairs={params}
              onAdd={async (newPair: KVPair) => {
                if (!templateId) return;
                await invoke("add_param", { templateId, key: newPair.key, value: newPair.value });
                getParams();
              }}
              onDelete={async (key: string) => {
                if (!templateId) return;
                await invoke("delete_param", { templateId, key });
                getParams();
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="结果计算">
            <Space.Compact style={{ width: '100%' }}>
                <Select
                    style={{ width: '40%' }}
                    placeholder="选择参数"
                    value={currentExecParamKey || undefined}
                    onChange={(value) => setCurrentExecParamKey(value)}
                >
                    {params.map(p => <Select.Option key={p.key} value={p.key}>{p.key}</Select.Option>)}
                </Select>
                <Input
                    style={{ width: '40%' }}
                    placeholder="输入参数值"
                    value={currentExecParamValue}
                    onChange={(e) => setCurrentExecParamValue(e.target.value)}
                />
                <Button
                    style={{ width: '20%' }}
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddExecutionParam}
                >
                    添加
                </Button>
            </Space.Compact>
            <List
                style={{ marginTop: 16 }}
                size="small"
                bordered
                dataSource={executionParams}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteExecutionParam(item.key)}
                            />,
                        ]}
                    >
                        <List.Item.Meta title={item.key} description={item.value} />
                    </List.Item>
                )}
                locale={{ emptyText: 'No Data' }}
            />
            <Upload
                beforeUpload={handleBatchUpload}
                onRemove={handleRemoveTransientFile}
                multiple
                fileList={transientFiles}
            >
                <Button icon={<UploadOutlined />} style={{ marginTop: 16 }}>
                    选择文件
                </Button>
            </Upload>
            <Button type="primary" onClick={start} style={{ marginTop: 16 }} block loading={uploading}>开始运行</Button>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card 
        title="模板数据集"
        extra={<Button type="primary" onClick={showAddDataCellModal}>添加数据</Button>}
      >
        <Table rowKey="id" columns={dataColumns} dataSource={dataCells} />
      </Card>

      <AddDataCellModal
        open={isModalOpen}
        onOk={handleAddDataCell}
        onCancel={() => {
            setIsModalOpen(false);
            setEditingCell(null);
        }}
        files={sourceFiles}
        dataCells={dataCells}
        initialValues={editingCell || undefined}
      />

       <Modal
          title="Data Value"
          open={dataValueOpen}
          onOk={() => setDataValueOpen(false)}
          onCancel={() => setDataValueOpen(false)}
        >
          <pre>{JSON.stringify(dataValue, null, 2)}</pre>
        </Modal>
    </div>
  );
};

export default Template;