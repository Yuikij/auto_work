import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Divider, message, Modal, Row, Space, Switch, Table, Input, List, Select, Upload, Tag, Tooltip } from "antd";
import { DeleteOutlined, PlusOutlined, UploadOutlined, FileTextOutlined, PlayCircleOutlined, SettingOutlined, DatabaseOutlined, CalculatorOutlined, EditOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { invoke } from "@tauri-apps/api/core";
import ParamManager, { Param } from "./KVAdd";
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
  const [params, setParams] = useState<Param[]>([]);
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
      const fetchedParams = await invoke<Param[]>('get_params', { templateId });
      setParams(fetchedParams);
    } catch (error) {
      console.error('Error fetching params:', error);
      message.error('Failed to fetch params');
    }
  };

  const handleAddParam = async (key: string) => {
    if (!templateId || !key.trim()) return;
    try {
        await invoke('add_param', { templateId, key });
        message.success(`参数 '${key}' 添加成功`);
        getParams();
    } catch (error) {
        console.error('Failed to add param:', error);
        message.error(`添加参数失败: ${error}`);
    }
  };

  const handleDeleteParam = async (key: string) => {
      if (!templateId) return;
      try {
          await invoke('delete_param', { templateId, key });
          message.success(`参数 '${key}' 已删除`);
          getParams();
      } catch (error) {
          console.error('Failed to delete param:', error);
          message.error(`删除参数失败: ${error}`);
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

  const getTypeIcon = (type: number) => {
    const iconMap: { [key: number]: React.ReactNode } = {
      1: <FileTextOutlined style={{ color: '#52c41a' }} />,
      2: <CalculatorOutlined style={{ color: '#1890ff' }} />,
      3: <DatabaseOutlined style={{ color: '#722ed1' }} />,
      4: <SettingOutlined style={{ color: '#fa8c16' }} />,
      5: <FileTextOutlined style={{ color: '#eb2f96' }} />,
    };
    return iconMap[type] || <FileTextOutlined />;
  };

  const getTypeTag = (type: number) => {
    const typeMap: { [key: number]: { text: string; color: string } } = {
      1: { text: '文件', color: 'green' },
      2: { text: '计算', color: 'blue' },
      3: { text: '其他数据单元', color: 'purple' },
      4: { text: '参数', color: 'orange' },
      5: { text: '具体值', color: 'magenta' },
    };
    const config = typeMap[type] || { text: '未知', color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const dataColumns = [
    { 
      title: '名称', 
      dataIndex: 'name', 
      key: 'name',
      render: (name: string, record: DataCell) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getTypeIcon(record.type)}
          <span style={{ fontWeight: 500 }}>{name}</span>
        </div>
      )
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: number) => getTypeTag(type)
    },
    { 
      title: '最终结果', 
      dataIndex: 'res', 
      key: 'res', 
      render: (res: boolean) => (
        <Switch 
          checked={res} 
          disabled 
          className="modern-switch"
          size="small"
        />
      )
    },
    { 
      title: '执行结果', 
      dataIndex: 'specific_value', 
      key: 'specific_value',
      render: (value: string | null) => (
        <div style={{ 
          maxWidth: '200px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)'
        }}>
          {value || '暂无结果'}
        </div>
      )
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: DataCell) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditDataCell(record)}
              className="modern-button"
              style={{ borderRadius: '6px' }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="text" 
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => delTemplateData(record.id)}
              className="modern-button"
              style={{ borderRadius: '6px' }}
            />
          </Tooltip>
        </Space>
      )
    },
  ];

  return (
    <div className="fade-in" style={{ padding: '0' }}>
      {/* 顶部操作区域 */}
      <div className="execution-area-wrapper">
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card 
              title={
                <div className="config-card-title">
                  <PlayCircleOutlined style={{ color: '#667eea' }} />
                  <span className="text-gradient">模板执行</span>
                </div>
              }
              className="modern-card execution-area-content"
              bodyStyle={{ padding: '20px' }}
            >
              <Row gutter={[16, 16]} align="middle" className="execution-control-row">
                              <Col span={6}>
                  <div className="execution-control-label">
                    <SettingOutlined style={{ color: '#667eea' }} />
                    添加执行参数
                  </div>
                </Col>
              <Col span={5}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择参数"
                  value={currentExecParamKey || undefined}
                  onChange={(value) => setCurrentExecParamKey(value)}
                  className="modern-select"
                >
                  {params.map(p => (
                    <Select.Option key={p.key} value={p.key}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SettingOutlined style={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                        {p.key}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col span={5}>
                <Input
                  placeholder="输入参数值"
                  value={currentExecParamValue}
                  onChange={(e) => setCurrentExecParamValue(e.target.value)}
                  className="modern-input"
                />
              </Col>
              <Col span={3}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddExecutionParam}
                  className="modern-button primary"
                  disabled={!currentExecParamKey || !currentExecParamValue}
                  style={{ width: '100%' }}
                >
                  添加
                </Button>
              </Col>
              <Col span={5}>
                <Button 
                  type="primary" 
                  onClick={start} 
                  loading={uploading}
                  icon={<PlayCircleOutlined />}
                  className="modern-button primary execute-button"
                  style={{ 
                    borderRadius: '12px',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: 600,
                    width: '100%',
                    background: uploading ? 'var(--warning-gradient)' : 'var(--primary-gradient)',
                    border: 'none',
                    boxShadow: uploading ? 'var(--shadow-lg)' : 'var(--shadow-md)'
                  }}
                  disabled={executionParams.length === 0 && transientFiles.length === 0}
                >
                  {uploading ? '执行中...' : '开始运行'}
                </Button>
              </Col>
                          </Row>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 中部配置区域 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }} className="template-config-row">
        {/* 参数定义 */}
        <Col span={8}>
                     <Card 
             title={
               <div className="config-card-title">
                 <SettingOutlined style={{ color: '#667eea' }} />
                 <span className="text-gradient">参数定义</span>
               </div>
             }
             className="modern-card hover-lift"
             style={{ height: '400px' }}
             bodyStyle={{ padding: '20px', height: 'calc(100% - 57px)', overflow: 'hidden' }}
          >
            <ParamManager params={params} onAdd={handleAddParam} onDelete={handleDeleteParam} />
          </Card>
        </Col>

        {/* 执行参数列表 */}
        <Col span={8}>
                     <Card 
             title={
               <div className="config-card-title">
                 <DatabaseOutlined style={{ color: '#667eea' }} />
                 <span className="text-gradient">执行参数</span>
                 <Tag color="blue" className="config-card-counter">
                   {executionParams.length} 个
                 </Tag>
               </div>
             }
             className="modern-card hover-lift"
             style={{ height: '400px' }}
             bodyStyle={{ padding: '20px', height: 'calc(100% - 57px)', overflow: 'hidden' }}
          >
            {executionParams.length === 0 ? (
              <div className="empty-state empty-state-centered">
                <SettingOutlined className="empty-state-icon" />
                <div className="empty-state-title">暂无执行参数</div>
                <div className="empty-state-description">
                  请在上方添加执行所需的参数
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', overflow: 'auto' }} className="param-list-container">
                <List
                  className="modern-list"
                  size="small"
                  dataSource={executionParams}
                  renderItem={(item) => (
                    <List.Item
                      className="param-list-item"
                      actions={[
                        <Tooltip title="删除参数">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteExecutionParam(item.key)}
                            className="modern-button"
                            style={{ borderRadius: '6px' }}
                          />
                        </Tooltip>,
                      ]}
                    >
                      <List.Item.Meta 
                        avatar={<SettingOutlined style={{ color: '#667eea' }} />}
                        title={<span className="param-meta-title">{item.key}</span>}
                        description={<span className="param-meta-description">{item.value}</span>}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* 文件上传 */}
        <Col span={8}>
                     <Card 
             title={
               <div className="config-card-title">
                 <UploadOutlined style={{ color: '#667eea' }} />
                 <span className="text-gradient">文件上传</span>
                 <Tag color="orange" className="config-card-counter">
                   {transientFiles.length} 个
                 </Tag>
               </div>
             }
             className="modern-card hover-lift"
             style={{ height: '400px' }}
             bodyStyle={{ padding: '20px', height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Upload
                beforeUpload={handleBatchUpload}
                onRemove={handleRemoveTransientFile}
                multiple
                fileList={transientFiles}
                className="modern-upload"
                showUploadList={false}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  className="modern-button secondary"
                  style={{ borderRadius: '8px', width: '100%', height: '44px' }}
                >
                  选择文件
                </Button>
              </Upload>
            </div>
            
                         <div style={{ flex: 1, overflow: 'auto' }} className="file-list-container">
               {transientFiles.length === 0 ? (
                 <div className="empty-state empty-state-centered">
                   <UploadOutlined className="empty-state-icon" />
                   <div className="empty-state-title">暂无上传文件</div>
                   <div className="empty-state-description">
                     点击上方按钮选择文件
                   </div>
                 </div>
               ) : (
                 <List
                   className="modern-list"
                   size="small"
                   dataSource={transientFiles}
                   renderItem={(file) => (
                     <List.Item
                       className="file-list-item"
                      actions={[
                        <Tooltip title="删除文件">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveTransientFile(file)}
                            className="modern-button"
                            style={{ borderRadius: '6px' }}
                          />
                        </Tooltip>,
                      ]}
                    >
                                             <List.Item.Meta 
                         avatar={<FileTextOutlined style={{ color: '#667eea' }} />}
                         title={<span className="file-meta-title">{file.name}</span>}
                         description={<span className="file-meta-description">{((file.size || 0) / 1024).toFixed(1)} KB</span>}
                       />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
      
              {/* 底部数据表格区域 */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card 
              title={
                <div className="config-card-title">
                  <DatabaseOutlined style={{ color: '#667eea' }} />
                  <span className="text-gradient">模板数据集</span>
                </div>
              }
              extra={
                <Button 
                  onClick={showAddDataCellModal} 
                  icon={<PlusOutlined />}
                  className="modern-button primary"
                  style={{ borderRadius: '8px' }}
                >
                  添加数据
                </Button>
              }
              className="modern-card hover-lift data-table-section"
              bodyStyle={{ padding: '20px' }}
          >
            <Table 
              columns={dataColumns} 
              dataSource={dataCells} 
              rowKey="id"
              className="modern-table"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </Card>
        </Col>
      </Row>
      
      <AddDataCellModal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCell(null);
        }}
        onOk={handleAddDataCell}
        files={sourceFiles}
        dataCells={dataCells}
        params={params}
        initialValues={editingCell ? { ...editingCell, type: editingCell.type } : undefined}
      />
      
      <Modal 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextOutlined style={{ color: '#667eea' }} />
            <span>数据显示</span>
          </div>
        }
        open={dataValueOpen} 
        onOk={() => setDataValueOpen(false)} 
        onCancel={() => setDataValueOpen(false)}
        className="modern-modal"
        okButtonProps={{ 
          className: 'modern-button primary',
          style: { borderRadius: '8px' }
        }}
        cancelButtonProps={{ 
          className: 'modern-button secondary',
          style: { borderRadius: '8px' }
        }}
      >
        <List
          className="modern-list"
          dataSource={dataValue}
          renderItem={item => (
            <List.Item style={{ 
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)'
            }}>
              {item}
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default Template;