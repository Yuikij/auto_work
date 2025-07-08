import React, { useState } from 'react';
import { List, Button, Input, Row, Col } from 'antd';

interface DataItem {
    id: number;
    name: string;
}

interface EditListProps<T extends DataItem> {
    dataList: T[];
    onAdd: (e: React.FocusEvent<HTMLInputElement>) => void;
    onEdit: (item: T, e: React.FocusEvent<HTMLInputElement>) => void;
    onDelete: (item: T) => void;
    onSelect?: (item: T) => void;
    selectedId?: number | null;
}

const EditList = <T extends DataItem>({ dataList, onAdd, onEdit, onDelete, onSelect, selectedId }: EditListProps<T>) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleAddItem = (e: React.FocusEvent<HTMLInputElement>) => {
        onAdd(e);
        setIsAdding(false);
    };

    const handleEditItem = (item: T, e: React.FocusEvent<HTMLInputElement>) => {
        onEdit(item, e);
        setEditingId(null);
    };

    const handleSelectItem = (item: T) => {
        if (onSelect) {
            onSelect(item);
        }
    };

    return (
        <div>
            <List
                size="small"
                header={
                    <Row justify="space-between" align="middle">
                        <Col flex="auto">
                            {isAdding && (
                                <Input
                                    onBlur={handleAddItem}
                                    onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                                    placeholder="Enter new item name"
                                    autoFocus
                                />
                            )}
                        </Col>
                        <Col>
                            <Button onClick={() => setIsAdding(!isAdding)} type="primary" size="small">
                                {isAdding ? 'Cancel' : 'Add'}
                            </Button>
                        </Col>
                    </Row>
                }
                bordered
                dataSource={dataList}
                renderItem={(item) => (
                    <List.Item
                        style={{ 
                            backgroundColor: selectedId === item.id ? '#e6f7ff' : 'transparent',
                            cursor: 'pointer'
                        }}
                        onClick={() => handleSelectItem(item)}
                        actions={[
                            <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}>Edit</Button>,
                            <Button type="link" size="small" danger onClick={(e) => { e.stopPropagation(); onDelete(item); }}>Delete</Button>,
                        ]}
                    >
                        {editingId === item.id ? (
                            <Input
                                defaultValue={item.name}
                                onBlur={(e) => handleEditItem(item, e)}
                                onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        ) : (
                            <div style={{ width: '100%', padding: '4px 0' }}>
                                {item.name}
                            </div>
                        )}
                    </List.Item>
                )}
            />
        </div>
    );
};

export default EditList; 