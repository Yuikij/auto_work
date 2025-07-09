import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { List, Button, message, Modal, Row, Col, Typography, Card, Input } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

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
            title: 'Are you sure you want to delete this file?',
            content: 'This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await invoke('delete_file', { fileId });
                    message.success('File deleted successfully!');
                    fetchFiles(); // Refresh the list
                } catch (error) {
                    console.error("Error deleting file:", error);
                    message.error(`Failed to delete file: ${error}`);
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
            message.success('File added successfully!');
            setNewFileName('');
            fetchFiles();
        } catch (error) {
            console.error('Error adding file:', error);
            message.error(`Failed to add file: ${error}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card title="文件列表" style={{ margin: '16px' }}>
            <Row gutter={8} style={{ marginBottom: 16 }}>
                <Col flex="auto">
                    <Input
                        placeholder="输入文件名"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onPressEnter={handleAddFile}
                    />
                </Col>
                <Col>
                    <Button
                        type="primary"
                        onClick={handleAddFile}
                        disabled={!newFileName.trim()}
                        loading={loading}
                    >
                        添加
                    </Button>
                </Col>
            </Row>

            <List
                size="small"
                bordered
                dataSource={files}
                renderItem={(file) => (
                    <List.Item
                        actions={[
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteFile(file.id)}
                            />,
                        ]}
                    >
                        <Text>{file.name}</Text>
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default FileList; 