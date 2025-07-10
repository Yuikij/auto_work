import React, { useState } from 'react';
import { Input, Button, List, Space, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';

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
        if (key.trim()) {
            onAdd(key.trim());
            setKey('');
        }
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space.Compact style={{ width: '100%' }}>
                <Input
                    placeholder="参数名 (例如: 年份)"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onPressEnter={handleAdd}
                    className="modern-input"
                    style={{ borderRadius: '8px 0 0 8px' }}
                />
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAdd}
                    disabled={!key.trim()}
                    className="modern-button primary"
                    style={{ borderRadius: '0 8px 8px 0' }}
                >
                    添加
                </Button>
            </Space.Compact>
            
            <List
                className="modern-list"
                dataSource={params}
                locale={{ emptyText: '暂无参数' }}
                renderItem={(item) => (
                    <List.Item
                        className="hover-lift"
                        style={{
                            borderRadius: '8px',
                            marginBottom: '8px',
                            padding: '12px 16px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            transition: 'var(--transition-fast)'
                        }}
                        actions={[
                            <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => onDelete(item.key)}
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
                            <SettingOutlined style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ 
                                color: 'var(--text-primary)',
                                fontWeight: 500
                            }}>
                                {item.key}
                            </span>
                            <Tag 
                                color="blue"
                                style={{ 
                                    marginLeft: 'auto',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}
                            >
                                参数
                            </Tag>
                        </div>
                    </List.Item>
                )}
            />
        </Space>
    );
};

export default ParamManager;