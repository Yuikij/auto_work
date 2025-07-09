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
  const [currentKey, setCurrentKey] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<string>('');
  
  useEffect(() => {
    if (keyOptions && keyOptions.length > 0) {
      setCurrentKey(keyOptions[0]);
    }
  }, [keyOptions]);

  const addKvPair = () => {
    if (currentKey && currentValue && !kvPairs.some(pair => pair.key === currentKey)) {
      const newPairs = [...kvPairs, { key: currentKey, value: currentValue }];
      setKvPairs(newPairs);
      onChange(newPairs);
      
      // Reset inputs
      setCurrentValue('');
      if (keyOptions && keyOptions.length > 0) {
        const usedKeys = new Set(newPairs.map(p => p.key));
        const nextKey = keyOptions.find(k => !usedKeys.has(k));
        setCurrentKey(nextKey || '');
      } else {
        setCurrentKey('');
      }
    }
  };

  const deleteKvPair = (key: string) => {
    const newPairs = kvPairs.filter(pair => pair.key !== key);
    setKvPairs(newPairs);
    onChange(newPairs);
  };

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 16, gap: '8px' }}>
        {keyOptions && keyOptions.length > 0 ? (
          <Select 
            value={currentKey} 
            onChange={(val) => setCurrentKey(val)} 
            style={{ width: 150 }}
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
        ) : (
          <Input 
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            placeholder="参数名 (Key)"
            style={{ width: 150 }}
          />
        )}
        <Input 
          value={currentValue} 
          onChange={(e) => setCurrentValue(e.target.value)} 
          placeholder="参数值 (Value)"
          style={{ flex: 1 }} 
        />
        <Button 
          type="primary" 
          onClick={addKvPair} 
          disabled={!currentKey || !currentValue}
        >
          添加
        </Button>
      </div>
      <List
        bordered
        size="small"
        dataSource={kvPairs}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => deleteKvPair(item.key)} danger>
                删除
              </Button>
            ]}
          >
            <span style={{ fontWeight: 'bold' }}>{item.key}:</span> {item.value}
          </List.Item>
        )}
      />
    </div>
  );
};

export default KVAdd;