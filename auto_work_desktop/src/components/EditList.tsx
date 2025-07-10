import React, { useState } from 'react';
import { List, Button, Input, Row, Col, Modal, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface DataItem {
    id: number;
    name: string;
}

interface EditListProps<T extends DataItem> {
    dataList: T[];
    onAdd: (name: string) => void;
    onEdit: (item: T, newName: string) => void;
    onDelete: (item: T) => void;
    onSelect?: (item: T) => void;
    selectedId?: number | null;
}

const EditList = <T extends DataItem>({ dataList, onAdd, onEdit, onDelete, onSelect, selectedId }: EditListProps<T>) => {
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [editingName, setEditingName] = useState('');

    const showAddModal = () => {
        setIsAddModalVisible(true);
    };

    const handleAddOk = () => {
        if (newItemName.trim()) {
            onAdd(newItemName);
        }
        setIsAddModalVisible(false);
        setNewItemName('');
    };

    const handleAddCancel = () => {
        setIsAddModalVisible(false);
        setNewItemName('');
    };
    
    const showEditModal = (item: T) => {
        setEditingItem(item);
        setEditingName(item.name);
        setIsEditModalVisible(true);
    };
    
    const handleEditOk = () => {
        if (editingItem && editingName.trim()) {
            onEdit(editingItem, editingName);
        }
        setIsEditModalVisible(false);
        setEditingItem(null);
        setEditingName('');
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        setEditingItem(null);
        setEditingName('');
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ textAlign: 'right' }}>
                <Button 
                    onClick={showAddModal} 
                    type="primary" 
                    size="small"
                    icon={<PlusOutlined />}
                    className="modern-button primary"
                    style={{ borderRadius: '8px' }}
                >
                    添加
                </Button>
            </div>
            
            <List
                className="modern-list"
                size="small"
                dataSource={dataList}
                locale={{ emptyText: '暂无数据' }}
                renderItem={(item) => (
                    <List.Item
                        className={`hover-lift ${selectedId === item.id ? 'selected' : ''}`}
                        style={{ 
                            backgroundColor: selectedId === item.id ? 'var(--bg-selected)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            marginBottom: '4px',
                            padding: '12px 16px',
                            border: selectedId === item.id ? '1px solid #667eea' : '1px solid var(--border-light)',
                            borderLeft: selectedId === item.id ? '3px solid #667eea' : '1px solid var(--border-light)',
                            transition: 'var(--transition-fast)'
                        }}
                        onClick={() => onSelect && onSelect(item)}
                        actions={[
                            <Button 
                                type="text" 
                                size="small" 
                                icon={<EditOutlined />}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    showEditModal(item); 
                                }}
                                className="modern-button"
                                style={{ 
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    minWidth: 'auto'
                                }}
                            />,
                            <Button 
                                type="text" 
                                size="small" 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onDelete(item); 
                                }}
                                className="modern-button"
                                style={{ 
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    minWidth: 'auto'
                                }}
                            />,
                        ]}
                    >
                        <div style={{ 
                            color: selectedId === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: selectedId === item.id ? 500 : 400,
                            fontSize: '14px'
                        }}>
                            {item.name}
                        </div>
                    </List.Item>
                )}
            />
            
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlusOutlined style={{ color: '#667eea' }} />
                        <span>添加新项目</span>
                    </div>
                }
                open={isAddModalVisible}
                onOk={handleAddOk}
                onCancel={handleAddCancel}
                destroyOnClose
                className="modern-modal"
                okText="添加"
                cancelText="取消"
                okButtonProps={{ 
                    className: 'modern-button primary',
                    style: { borderRadius: '8px' }
                }}
                cancelButtonProps={{ 
                    className: 'modern-button secondary',
                    style: { borderRadius: '8px' }
                }}
            >
                <Input
                    placeholder="请输入项目名称"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onPressEnter={handleAddOk}
                    className="modern-input"
                    style={{ borderRadius: '8px' }}
                />
            </Modal>
            
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EditOutlined style={{ color: '#667eea' }} />
                        <span>编辑项目</span>
                    </div>
                }
                open={isEditModalVisible}
                onOk={handleEditOk}
                onCancel={handleEditCancel}
                destroyOnClose
                className="modern-modal"
                okText="保存"
                cancelText="取消"
                okButtonProps={{ 
                    className: 'modern-button primary',
                    style: { borderRadius: '8px' }
                }}
                cancelButtonProps={{ 
                    className: 'modern-button secondary',
                    style: { borderRadius: '8px' }
                }}
            >
                <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onPressEnter={handleEditOk}
                    className="modern-input"
                    style={{ borderRadius: '8px' }}
                />
            </Modal>
        </Space>
    );
};

export default EditList; 