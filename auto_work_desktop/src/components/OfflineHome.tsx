import React, { useState, useEffect } from 'react';
import { Layout, Button, Upload, message, Modal, Card, Space, Typography, Divider } from 'antd';
import { 
    DownloadOutlined, 
    UploadOutlined, 
    DatabaseOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { invoke } from "@tauri-apps/api/core";
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeFile, readTextFile } from '@tauri-apps/plugin-fs';
import FileList from "./FileList";
import Template from "./Template";
import TemplateList from "./TemplateList";
import { useTemplateContext } from '../contexts/TemplateContext';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

interface AppInfo {
    appName: string;
    version: string;
    mode: string;
    description: string;
}

const OfflineHome: React.FC = () => {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const { setDefaultDataTemplateId } = useTemplateContext();

    // 获取应用信息
    useEffect(() => {
        fetchAppInfo();
    }, []);

    const fetchAppInfo = async () => {
        try {
            const info = await invoke<AppInfo>('get_app_info');
            setAppInfo(info);
        } catch (error) {
            console.error('获取应用信息失败:', error);
        }
    };

    // 导出全量数据
    const handleExportData = async () => {
        try {
            setLoading(true);
            const jsonData = await invoke<string>('export_all_data');
            
            const filePath = await save({
                title: "Save Data Export",
                filters: [{ name: 'Auto Work Backup', extensions: ['awb'] }]
            });
            
            if (filePath) {
                // Convert string to Uint8Array
                const encoder = new TextEncoder();
                const data = encoder.encode(jsonData);
                await writeFile(filePath, data);
                message.success('数据导出成功');
            }
        } catch (error: any) {
            console.error('导出数据失败:', error);
            message.error(`导出数据失败: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    // 导入全量数据
    const handleImportData = async () => {
        Modal.confirm({
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
            onOk: performImport,
            okText: '确认导入',
            cancelText: '取消',
        });
    };

    const performImport = async () => {
        try {
            setLoading(true);
            
            const selectedPath = await open({
                title: "Open Backup File",
                multiple: false,
                filters: [{ name: 'Auto Work Backup', extensions: ['awb'] }]
            });

            if (typeof selectedPath === 'string') {
                const jsonData = await readTextFile(selectedPath);
                await invoke('import_all_data', { dataJson: jsonData });
                message.success('数据导入成功');
                // 刷新页面
                window.location.reload();
            }
        } catch (error: any) {
            console.error('导入数据失败:', error);
            message.error(`导入数据失败: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    // 创建备份
    const handleCreateBackup = async () => {
        try {
            setLoading(true);
            const backupPath = await invoke<string>('create_backup');
            message.success(`备份创建成功: ${backupPath}`);
        } catch (error: any) {
            console.error('创建备份失败:', error);
            message.error(`创建备份失败: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const headerStyle: React.CSSProperties = {
        textAlign: 'center',
        color: '#fff',
        paddingInline: 48,
        lineHeight: '64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };
    
    const contentStyle: React.CSSProperties = {
        textAlign: 'center',
        minHeight: 120,
        lineHeight: '120px',
    };
    
    const siderStyle: React.CSSProperties = {
        textAlign: 'center',
        lineHeight: '120px',
        color: '#000000',
        backgroundColor: '#ffffff',
    };
    
    const layoutStyle: React.CSSProperties = {
        minHeight: "100vh"
    };

    const handleTemplateSelect = (id: number) => {
        setSelectedTemplateId(id);
        setDefaultDataTemplateId(id);
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
                                        <p><strong>应用名称:</strong> {appInfo?.appName}</p>
                                        <p><strong>版本:</strong> {appInfo?.version}</p>
                                        <p><strong>模式:</strong> {appInfo?.mode}</p>
                                        <p><strong>描述:</strong> {appInfo?.description}</p>
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
                    
                    <Button 
                        type="primary" 
                        icon={<UploadOutlined />}
                        onClick={handleImportData}
                        loading={loading}
                    >
                        导入数据
                    </Button>
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
                    <TemplateList 
                        type={2} 
                        onSelect={handleTemplateSelect}
                        selectedId={selectedTemplateId}
                    />
                    
                    <Divider>文件列表</Divider>
                    {selectedTemplateId && <FileList templateId={selectedTemplateId} />}
                </Sider>
                
                <Content style={contentStyle}>
                    {selectedTemplateId ? (
                        <Template templateId={selectedTemplateId} />
                    ) : (
                        <div style={{ padding: '50px' }}>
                            <Text type="secondary">请从左侧选择一个模板开始工作</Text>
                        </div>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default OfflineHome;