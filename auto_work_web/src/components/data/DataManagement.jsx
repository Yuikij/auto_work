import React, { useState, useEffect } from 'react';
import { 
    Upload, 
    Button, 
    message, 
    Card, 
    Space, 
    Divider, 
    Descriptions, 
    Progress,
    Alert,
    Modal,
    List,
    Typography
} from 'antd';
import { 
    UploadOutlined, 
    DownloadOutlined, 
    ExportOutlined, 
    ImportOutlined,
    InfoCircleOutlined,
    DatabaseOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const DataManagement = () => {
    const [loading, setLoading] = useState(false);
    const [systemInfo, setSystemInfo] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [exportHistory, setExportHistory] = useState([]);
    
    useEffect(() => {
        fetchSystemInfo();
    }, []);
    
    const fetchSystemInfo = async () => {
        try {
            const response = await axios.get('/api/offline/system/info');
            setSystemInfo(response.data);
        } catch (error) {
            console.error('获取系统信息失败:', error);
        }
    };
    
    const handleExportAll = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/offline/data/export');
            if (response.data.success) {
                message.success('数据导出成功！');
                message.info(`导出文件：${response.data.exportPath}`);
                
                // 添加到导出历史
                const newExport = {
                    time: new Date().toLocaleString(),
                    path: response.data.exportPath,
                    type: '全量数据'
                };
                setExportHistory(prev => [newExport, ...prev.slice(0, 9)]);
            } else {
                message.error(response.data.message || '导出失败');
            }
        } catch (error) {
            message.error('导出失败：' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };
    
    const handleImportAll = (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        setLoading(true);
        setUploadProgress(0);
        
        axios.post('/api/offline/data/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(percentCompleted);
            },
        })
        .then(response => {
            if (response.data.success) {
                message.success('数据导入成功！');
                // 刷新系统信息
                fetchSystemInfo();
            } else {
                message.error(response.data.message || '导入失败');
            }
        })
        .catch(error => {
            message.error('导入失败：' + (error.response?.data?.message || error.message));
        })
        .finally(() => {
            setLoading(false);
            setUploadProgress(0);
        });
        
        return false; // 阻止默认上传行为
    };
    
    const handleExportTemplate = async () => {
        Modal.confirm({
            title: '导出模板',
            content: '请输入要导出的模板ID：',
            onOk: async () => {
                // 这里应该有一个输入框来获取模板ID
                // 为了简化，我们先使用一个固定值或弹出输入框
                const templateId = prompt('请输入模板ID:');
                if (templateId) {
                    try {
                        setLoading(true);
                        const response = await axios.post('/api/offline/template/export', null, {
                            params: { templateId }
                        });
                        if (response.data.success) {
                            message.success('模板导出成功！');
                            message.info(`导出文件：${response.data.exportPath}`);
                        } else {
                            message.error(response.data.message || '模板导出失败');
                        }
                    } catch (error) {
                        message.error('模板导出失败：' + (error.response?.data?.message || error.message));
                    } finally {
                        setLoading(false);
                    }
                }
            },
        });
    };
    
    const handleImportTemplate = (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        setLoading(true);
        axios.post('/api/offline/template/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        .then(response => {
            if (response.data.success) {
                message.success('模板导入成功！');
            } else {
                message.error(response.data.message || '模板导入失败');
            }
        })
        .catch(error => {
            message.error('模板导入失败：' + (error.response?.data?.message || error.message));
        })
        .finally(() => {
            setLoading(false);
        });
        
        return false;
    };
    
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return (
        <div style={{ padding: '20px' }}>
            <Title level={2}>
                <DatabaseOutlined /> 数据管理
            </Title>
            
            {/* 系统信息卡片 */}
            {systemInfo && (
                <Card 
                    title={<><InfoCircleOutlined /> 系统信息</>} 
                    style={{ marginBottom: '20px' }}
                >
                    <Descriptions column={2} size="small">
                        <Descriptions.Item label="应用版本">{systemInfo.version}</Descriptions.Item>
                        <Descriptions.Item label="应用名称">{systemInfo.name}</Descriptions.Item>
                        <Descriptions.Item label="数据目录">{systemInfo.dataDir}</Descriptions.Item>
                        <Descriptions.Item label="便携模式">{systemInfo.portableMode ? '是' : '否'}</Descriptions.Item>
                        <Descriptions.Item label="运行状态">{systemInfo.status}</Descriptions.Item>
                        <Descriptions.Item label="启动时间">{new Date(systemInfo.timestamp).toLocaleString()}</Descriptions.Item>
                    </Descriptions>
                    
                    {systemInfo.memory && (
                        <div style={{ marginTop: '16px' }}>
                            <Text strong>内存使用情况：</Text>
                            <div style={{ marginTop: '8px' }}>
                                <Progress 
                                    percent={Math.round((systemInfo.memory.used / systemInfo.memory.total) * 100)}
                                    status="active"
                                    format={() => `${formatBytes(systemInfo.memory.used)} / ${formatBytes(systemInfo.memory.total)}`}
                                />
                            </div>
                        </div>
                    )}
                </Card>
            )}
            
            {/* 数据备份与恢复 */}
            <Card 
                title="全量数据备份与恢复" 
                style={{ marginBottom: '20px' }}
            >
                <Alert 
                    message="数据备份说明"
                    description="全量数据备份包含所有模板、数据单元、文件信息和配置。导入时会覆盖现有数据，请谨慎操作。"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
                
                <Space size="large">
                    <Button 
                        type="primary" 
                        icon={<ExportOutlined />}
                        onClick={handleExportAll}
                        loading={loading}
                        size="large"
                    >
                        导出全部数据
                    </Button>
                    
                    <Upload
                        beforeUpload={handleImportAll}
                        showUploadList={false}
                        accept=".zip"
                        disabled={loading}
                    >
                        <Button 
                            icon={<ImportOutlined />}
                            loading={loading}
                            size="large"
                        >
                            导入全部数据
                        </Button>
                    </Upload>
                </Space>
                
                {uploadProgress > 0 && (
                    <div style={{ marginTop: '16px' }}>
                        <Progress percent={uploadProgress} />
                    </div>
                )}
            </Card>
            
            <Divider />
            
            {/* 模板管理 */}
            <Card title="模板管理" style={{ marginBottom: '20px' }}>
                <Alert 
                    message="模板导入导出说明"
                    description="可以导出单个模板或导入模板文件。模板文件包含模板定义、相关数据单元和文件信息。"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
                
                <Space size="large">
                    <Button 
                        icon={<DownloadOutlined />}
                        onClick={handleExportTemplate}
                        disabled={loading}
                        size="large"
                    >
                        导出模板
                    </Button>
                    
                    <Upload
                        beforeUpload={handleImportTemplate}
                        showUploadList={false}
                        accept=".zip,.json"
                        disabled={loading}
                    >
                        <Button 
                            icon={<UploadOutlined />}
                            disabled={loading}
                            size="large"
                        >
                            导入模板
                        </Button>
                    </Upload>
                </Space>
            </Card>
            
            {/* 导出历史 */}
            {exportHistory.length > 0 && (
                <Card title="最近导出记录">
                    <List
                        size="small"
                        dataSource={exportHistory}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={`${item.type} - ${item.time}`}
                                    description={item.path}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}
        </div>
    );
};

export default DataManagement;