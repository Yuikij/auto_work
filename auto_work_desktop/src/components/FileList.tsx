import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { List, Button, Upload, message, Modal, Row, Col, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

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
    const [uploading, setUploading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);


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

    const handleUpload = async () => {
        if (fileList.length === 0 || !templateId) return;

        const file = fileList[0];
        if (!file.originFileObj) {
            message.error("Could not find the file object to upload.");
            return;
        }

        setUploading(true);

        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
                try {
                    const content = Array.from(new Uint8Array(e.target.result as ArrayBuffer));
                    await invoke('upload_file_to_template', {
                        templateId: templateId,
                        name: file.name,
                        content: content
                    });
                    message.success('File uploaded successfully!');
                    setFileList([]);
                    fetchFiles(); // Refresh the list
                } catch (error) {
                    console.error('Error uploading file:', error);
                    message.error(`Failed to upload file: ${error}`);
                } finally {
                    setUploading(false);
                }
            }
        };
        reader.onerror = () => {
            message.error("Failed to read the file.");
            setUploading(false);
        }
        reader.readAsArrayBuffer(file.originFileObj);
    };

    const uploadProps: UploadProps = {
        onRemove: file => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: file => {
            setFileList([file]);
            return false; // Prevent auto-upload
        },
        fileList,
        maxCount: 1,
    };

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Select File</Button>
                    </Upload>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        onClick={handleUpload}
                        disabled={fileList.length === 0}
                        loading={uploading}
                    >
                        {uploading ? 'Uploading' : 'Start Upload'}
                    </Button>
                </Col>
            </Row>

            <List
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
        </div>
    );
};

export default FileList; 