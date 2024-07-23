import React, { useState } from 'react';
import {Select, Input, Button, List, Upload} from 'antd';
import {UploadOutlined} from "@ant-design/icons";

const { Option } = Select;

const keyOptions = ['name', 'age', 'email', 'address'];

const KVAdd = () => {
    const [kvPairs, setKvPairs] = useState([]);
    const [selectedKey, setSelectedKey] = useState(keyOptions[0]);
    const [value, setValue] = useState('');

    const addKvPair = () => {
        if (!kvPairs.some(pair => pair.key === selectedKey)) {
            setKvPairs([...kvPairs, { key: selectedKey, value }]);
            setSelectedKey(keyOptions[0]);
            setValue('');
        }
    };

    const deleteKvPair = (key) => {
        setKvPairs(kvPairs.filter(pair => pair.key !== key));
    };

    const handleKeyChange = (key) => {
        setSelectedKey(key);
    };

    const handleValueChange = (e) => {
        setValue(e.target.value);
    };

    const generateJson = () => {
        const json = kvPairs.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
        return JSON.stringify(json, null, 2);
    };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', marginBottom: 16 }}>
                <Select value={selectedKey} onChange={handleKeyChange} style={{ width: 120, marginRight: 8 }}>
                    {keyOptions.map((key) => (
                        <Option key={key} value={key} disabled={kvPairs.some(pair => pair.key === key)}>
                            {key}
                        </Option>
                    ))}
                </Select>
                <Input value={value} onChange={handleValueChange} style={{ width: 200, marginRight: 8 }} />
                <Button type="primary" onClick={addKvPair} style={{  marginRight: 16 }}>
                    添加参数
                </Button>
            </div>
            <List
                bordered
                dataSource={kvPairs}
                renderItem={(item) => (
                    <List.Item
                        actions={[<Button type="link" onClick={() => deleteKvPair(item.key)}>Delete</Button>]}
                    >
                        {item.key}: {item.value}
                    </List.Item>
                )}
            />
        </div>
    );
};

export default KVAdd;
