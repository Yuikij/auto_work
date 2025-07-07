import React, { useState, useEffect } from 'react';
import { Layout, Button, Upload, message, Modal, Card, Space, Typography, Divider } from 'antd';
import { 
    DownloadOutlined, 
    UploadOutlined, 
    DatabaseOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import axiosInstance from "../../utils/request";
import FileList from "../FileList";
import Template from "../Template";
import TemplateList from "../TemplateList";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { confirm } = Modal;

const OfflineHome = () => {
    const [appInfo, setAppInfo] = useState({});
    const [loading, setLoading] = useState(false);

    // 获取应用信息
    useEffect(() => {
        fetchAppInfo();
    }, []);

    const fetchAppInfo = async () => {
        try {
            const response = await axiosInstance.get('/backup/info');
            setAppInfo(response.data);
        } catch (error) {
            console.error('获取应用信息失败:', error);
        }
    };

    // 导出全量数据
    const handleExportData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.post('/backup/export/all', {}, {
                responseType: 'blob'
            });
            
            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // 从响应头获取文件名
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'autowork_backup.awb';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            message.success('数据导出成功');
        } catch (error) {
            console.error('导出数据失败:', error);
            message.error('导出数据失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // 导入全量数据
    const handleImportData = (file) => {
        confirm({
            title: '确认导入数据',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>导入数据将会：</p>
                    <ul>
                        <li>清空现有的所有数据</li>
                        <li>导入备份文件中的数据</li>
                        <li>自动创建当前数据的备份</li>
                    </ul>
                    <p><strong>此操作不可逆，请确认继续？</strong></p>
                </div>
            ),
            onOk: () => performImport(file),
            okText: '确认导入',
            cancelText: '取消',
        });
        
        return false; // 阻止默认上传行为
    };

    const performImport = async (file) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axiosInstance.post('/backup/import/all', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                message.success('数据导入成功');
                // 刷新页面或重新加载数据
                window.location.reload();
            } else {
                message.error('导入失败: ' + response.data.message);
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            message.error('导入数据失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // 创建备份
    const handleCreateBackup = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.post('/backup/create-backup');
            
            if (response.data.success) {
                message.success('备份创建成功: ' + response.data.backupFilePath);
            } else {
                message.error('创建备份失败: ' + response.data.message);
            }
        } catch (error) {
            console.error('创建备份失败:', error);
            message.error('创建备份失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const headerStyle = {
        textAlign: 'center',
        color: '#fff',
        paddingInline: 48,
        lineHeight: '64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };
    
    const contentStyle = {
        textAlign: 'center',
        minHeight: 120,
        lineHeight: '120px',
    };
    
    const siderStyle = {
        textAlign: 'center',
        lineHeight: '120px',
        color: '#000000',
        backgroundColor: '#ffffff',
    };
    
    const layoutStyle = {
        minHeight: "100vh"
    };

    return (
        <Layout style={layoutStyle}>
            <Header style={headerStyle}>
                <Title level={2} style={{ color: 'white', margin: 0 }}>
                    AUTO WORK 离线版
                </Title>
                
                <Space>
                    <Button 
                        type="primary" 
                        icon={<InfoCircleOutlined />}
                        onClick={() => {
                            Modal.info({
                                title: '应用信息',
                                content: (
                                    <div>
                                        <p><strong>应用名称:</strong> {appInfo.appName}</p>
                                        <p><strong>版本:</strong> {appInfo.version}</p>
                                        <p><strong>模式:</strong> {appInfo.mode}</p>
                                        <p><strong>描述:</strong> {appInfo.description}</p>
                                    </div>
                                ),
                            });
                        }}
                    >
                        应用信息
                    </Button>
                    
                    <Button 
                        type="primary" 
                        icon={<DatabaseOutlined />}
                        onClick={handleCreateBackup}
                        loading={loading}
                    >
                        创建备份
                    </Button>
                    
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />}
                        onClick={handleExportData}
                        loading={loading}
                    >
                        导出数据
                    </Button>
                    
                    <Upload
                        beforeUpload={handleImportData}
                        showUploadList={false}
                        accept=".awb"
                    >
                        <Button 
                            type="primary" 
                            icon={<UploadOutlined />}
                            loading={loading}
                        >
                            导入数据
                        </Button>
                    </Upload>
                </Space>
            </Header>
            
            <Layout>
                <Sider width="30%" style={siderStyle}>
                    <div style={{ padding: '16px', textAlign: 'left' }}>
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <Title level={5}>数据管理</Title>
                            <Text type="secondary">
                                • 导出：备份所有数据和模板<br/>
                                • 导入：恢复备份数据<br/>
                                • 备份：自动创建备份文件
                            </Text>
                        </Card>
                    </div>
                    
                    <Divider>模板列表</Divider>
                    <TemplateList type={2}/>
                    
                    <Divider>文件列表</Divider>
                    <FileList/>
                </Sider>
                
                <Content style={contentStyle}>
                    <Template/>
                </Content>
            </Layout>
        </Layout>
    );
};

export default OfflineHome;