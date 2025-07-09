import React, { useState, useEffect } from 'react';
import { Select, Input, Button, List } from 'antd';

const { Option } = Select;

interface KVPair {
  key: string;
  value: string;
}

interface KVAddProps {
  keyOptions: string[];
  onChange: (kvPairs: KVPair[]) => void;
}

const KVAdd: React.FC<KVAddProps> = ({ keyOptions, onChange }) => {
  const [kvPairs, setKvPairs] = useState<KVPair[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>(keyOptions[0] || '');
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (keyOptions.length > 0 && !selectedKey) {
      setSelectedKey(keyOptions[0]);
    }
  }, [keyOptions, selectedKey]);

  const addKvPair = () => {
    if (selectedKey && value && !kvPairs.some(pair => pair.key === selectedKey)) {
      const newPairs = [...kvPairs, { key: selectedKey, value }];
      setKvPairs(newPairs);
      onChange(newPairs);
      
      // Reset to next available key
      const usedKeys = new Set(newPairs.map(p => p.key));
      const nextKey = keyOptions.find(k => !usedKeys.has(k));
      setSelectedKey(nextKey || '');
      setValue('');
    }
  };

  const deleteKvPair = (key: string) => {
    const newPairs = kvPairs.filter(pair => pair.key !== key);
    setKvPairs(newPairs);
    onChange(newPairs);
  };

  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', marginBottom: 16 }}>
        <Select 
          value={selectedKey} 
          onChange={handleKeyChange} 
          style={{ width: 120, marginRight: 8 }}
          disabled={keyOptions.length === 0}
        >
          {keyOptions.map((key) => (
            <Option 
              key={key} 
              value={key} 
              disabled={kvPairs.some(pair => pair.key === key)}
            >
              {key}
            </Option>
          ))}
        </Select>
        <Input 
          value={value} 
          onChange={handleValueChange} 
          style={{ width: 200, marginRight: 8 }} 
          placeholder="Enter value"
        />
        <Button 
          type="primary" 
          onClick={addKvPair} 
          disabled={!selectedKey || !value}
        >
          添加参数
        </Button>
      </div>
      <List
        bordered
        dataSource={kvPairs}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => deleteKvPair(item.key)}>
                删除
              </Button>
            ]}
          >
            {item.key}: {item.value}
          </List.Item>
        )}
      />
    </div>
  );
};

export default KVAdd;