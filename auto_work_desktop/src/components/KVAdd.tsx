import React, { useState } from 'react';
import { Input, Button, List, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface KVPair {
    key: string;
    value: string;
}

interface KVAddProps {
    kvPairs: KVPair[];
    onAdd: (newPair: KVPair) => void;
    onDelete: (key: string) => void;
}

const KVAdd: React.FC<KVAddProps> = ({ kvPairs, onAdd, onDelete }) => {
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');

    const handleAdd = () => {
        if (key && value) {
            onAdd({ key, value });
            setKey('');
            setValue('');
        }
    };

    return (
        <div>
            <Space>
                <Input
                    placeholder="Key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                />
                <Input
                    placeholder="Value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Add
                </Button>
            </Space>
            <List
                style={{ marginTop: 16 }}
                bordered
                dataSource={kvPairs}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onDelete(item.key)}
                            />,
                        ]}
                    >
                        <List.Item.Meta title={item.key} description={item.value} />
                    </List.Item>
                )}
            />
        </div>
    );
};

export default KVAdd;