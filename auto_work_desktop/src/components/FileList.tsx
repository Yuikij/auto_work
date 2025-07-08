import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fetchFiles = async () => {
        if (templateId) {
            try {
                const fileList = await invoke<AppFile[]>('list_files', { templateId });
                setFiles(fileList);
            } catch (error) {
                console.error("Error fetching files:", error);
            }
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [templateId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !templateId) {
            alert("Please select a file and a template.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
                const content = Array.from(new Uint8Array(e.target.result as ArrayBuffer));
                
                const fileData = {
                    name: selectedFile.name,
                    content: content,
                };

                const request = {
                    template_id: templateId,
                    files: [fileData],
                };
                
                try {
                    await invoke('upload_files', { request });
                    alert('File uploaded successfully!');
                    fetchFiles(); // Refresh the list
                    setSelectedFile(null);
                } catch (error) {
                    console.error('Error uploading file:', error);
                    alert('Failed to upload file.');
                }
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleDeleteFile = async (fileId: number) => {
        if (window.confirm("Are you sure you want to delete this file?")) {
            try {
                await invoke('delete_file', { fileId });
                alert('File deleted successfully!');
                fetchFiles(); // Refresh the list
            } catch (error) {
                console.error("Error deleting file:", error);
                alert("Failed to delete file.");
            }
        }
    };

    return (
        <div>
            <h3>Files for Template ID: {templateId}</h3>
            <div>
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleFileUpload} disabled={!selectedFile}>
                    Upload File
                </button>
            </div>
            <ul>
                {files.map((file) => (
                    <li key={file.id}>
                        {file.name} - <small>Path: {file.path}</small>
                        <button onClick={() => handleDeleteFile(file.id)} style={{ marginLeft: '10px' }}>
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileList; 