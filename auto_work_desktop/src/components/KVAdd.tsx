import React, { useState } from 'react';
import { Input, Button, List, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

export interface Param {
    id: number;
    key: string;
}

interface ParamManagerProps {
    params: Param[];
    onAdd: (key: string) => void;
    onDelete: (key: string) => void;
}

const ParamManager: React.FC<ParamManagerProps> = ({ params, onAdd, onDelete }) => {
    const [key, setKey] = useState('');

    const handleAdd = () => {
        if (key) {
            onAdd(key);
            setKey('');
        }
    };

    return (
        <div>
            <Space>
                <Input
                    placeholder="参数名 (例如: 年份)"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onPressEnter={handleAdd}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    添加
                </Button>
            </Space>
            <List
                style={{ marginTop: 16 }}
                bordered
                dataSource={params}
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
                        {item.key}
                    </List.Item>
                )}
            />
        </div>
    );
};

export default ParamManager;