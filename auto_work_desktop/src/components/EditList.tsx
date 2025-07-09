import React, { useState } from 'react';
import { List, Button, Input, Row, Col, Modal } from 'antd';

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
        <div>
            <div style={{ marginBottom: '10px', textAlign: 'right' }}>
                <Button onClick={showAddModal} type="primary" size="small">
                    Add
                </Button>
            </div>
            <List
                size="small"
                bordered
                dataSource={dataList}
                renderItem={(item) => (
                    <List.Item
                        style={{ 
                            backgroundColor: selectedId === item.id ? '#e6f7ff' : 'transparent',
                            cursor: 'pointer'
                        }}
                        onClick={() => onSelect && onSelect(item)}
                        actions={[
                            <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); showEditModal(item); }}>Edit</Button>,
                            <Button type="link" size="small" danger onClick={(e) => { e.stopPropagation(); onDelete(item); }}>Delete</Button>,
                        ]}
                    >
                        {item.name}
                    </List.Item>
                )}
            />
            <Modal
                title="Add New Item"
                open={isAddModalVisible}
                onOk={handleAddOk}
                onCancel={handleAddCancel}
                destroyOnClose
            >
                <Input
                    placeholder="Enter new item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onPressEnter={handleAddOk}
                />
            </Modal>
            <Modal
                title="Edit Item"
                open={isEditModalVisible}
                onOk={handleEditOk}
                onCancel={handleEditCancel}
                destroyOnClose
            >
                <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onPressEnter={handleEditOk}
                />
            </Modal>
        </div>
    );
};

export default EditList; 