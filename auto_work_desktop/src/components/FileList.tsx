import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { List, Button, message, Modal, Row, Col, Typography, Card, Input, Space } from 'antd';
import { DeleteOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AppFile {
    id: number;
    name: string;
    path: string;
}

interface FileListProps {
    templateId: number | null;
}

const FileList: React.FC<FileListProps> = ({ templateId }) => {
    const [files, setFiles] = useState<AppFile[]>([]);
    const [newFileName, setNewFileName] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchFiles = async () => {
        if (!templateId) {
            setFiles([]);
            return;
        };
        try {
            const fileList = await invoke<AppFile[]>('list_files_by_template', { templateId });
            setFiles(fileList);
        } catch (error) {
            console.error("Error fetching files:", error);
            message.error(`Failed to fetch files: ${error}`);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [templateId]);

    const handleDeleteFile = (fileId: number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这个文件吗？此操作无法撤销。',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            className: 'modern-modal',
            onOk: async () => {
                try {
                    await invoke('delete_file', { fileId });
                    message.success('文件删除成功！');
                    fetchFiles(); // Refresh the list
                } catch (error) {
                    console.error("Error deleting file:", error);
                    message.error(`删除文件失败: ${error}`);
                }
            },
        });
    };

    const handleAddFile = async () => {
        if (!newFileName.trim() || !templateId) return;

        setLoading(true);
        try {
            await invoke('add_file', {
                templateId: templateId,
                name: newFileName,
                path: newFileName, // Using name as path, as per new logic
            });
            message.success('文件添加成功！');
            setNewFileName('');
            fetchFiles();
        } catch (error) {
            console.error('Error adding file:', error);
            message.error(`添加文件失败: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card 
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📁</span>
                    <span className="text-gradient">文件列表</span>
                </div>
            }
            className="modern-card hover-lift"
            style={{ 
                margin: '16px',
                border: 'none'
            }}
            bodyStyle={{ padding: '16px' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row gutter={8}>
                    <Col flex="auto">
                        <Input
                            placeholder="输入文件名"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onPressEnter={handleAddFile}
                            className="modern-input"
                            style={{ borderRadius: '8px' }}
                        />
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            onClick={handleAddFile}
                            disabled={!newFileName.trim()}
                            loading={loading}
                            icon={<PlusOutlined />}
                            className="modern-button primary"
                            style={{ borderRadius: '8px' }}
                        >
                            添加
                        </Button>
                    </Col>
                </Row>

                <List
                    className="modern-list"
                    size="small"
                    dataSource={files}
                    locale={{ emptyText: '暂无文件' }}
                    renderItem={(file) => (
                        <List.Item
                            className="hover-lift"
                            style={{
                                borderRadius: '8px',
                                marginBottom: '4px',
                                padding: '12px 16px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-light)',
                                transition: 'var(--transition-fast)'
                            }}
                            actions={[
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="modern-button"
                                    style={{ 
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        minWidth: 'auto'
                                    }}
                                />,
                            ]}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileTextOutlined style={{ color: 'var(--text-secondary)' }} />
                                <Text style={{ color: 'var(--text-primary)' }}>{file.name}</Text>
                            </div>
                        </List.Item>
                    )}
                />
            </Space>
        </Card>
    );
};

export default FileList; 