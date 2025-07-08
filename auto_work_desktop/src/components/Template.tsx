import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Divider, Drawer, List, message, Modal, Row, Space, Switch, Table, Tag, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from 'antd/es/upload/interface';
import { invoke } from "@tauri-apps/api/core";
import DataCellList from "./DataCellList";
import KVAdd from "./KVAdd";
import TemplateList from "./TemplateList";

interface DataCell {
  id: number;
  name: string;
  type: number;
  res: boolean;
  value?: string | string[];
  template_id: number;
}

interface KVPair {
  key: string;
  value: string;
}

interface TemplateProps {
  templateId: number;
}

const dataTypeMap: { [key: number]: string } = {
  1: '文本',
  2: '数字',
  3: '日期',
  4: '列表',
  5: '脚本'
};

const Template: React.FC<TemplateProps> = ({ templateId }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dataCells, setDataCells] = useState<DataCell[]>([]);
  const [paramsSelect, setParamsSelect] = useState<string[]>([]);
  const [params, setParams] = useState<{ [key: string]: string }>({});
  const [dataValueOpen, setDataValueOpen] = useState(false);
  const [dataValue, setDataValue] = useState<string[]>([]);
  const [selectedParamTemplateId, setSelectedParamTemplateId] = useState<number | null>(null);

  useEffect(() => {
    getData();
    getParamsSelect();
  }, [templateId]);

  const getData = async () => {
    try {
      const cells = await invoke<DataCell[]>('get_data_cells', { templateId });
      // Sort by res field
      cells.sort((a, b) => {
        if (a.res === b.res) return 0;
        return a.res ? -1 : 1;
      });
      setDataCells(cells);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to fetch data cells');
    }
  };

  const getParamsSelect = async () => {
    try {
      // Get parameter templates (type 3)
      const templates = await invoke<any[]>('get_templates', { typeId: 3 });
      if (templates.length > 0) {
        setSelectedParamTemplateId(templates[0].id);
        // Get data cells for the parameter template
        const paramCells = await invoke<DataCell[]>('get_data_cells', { templateId: templates[0].id });
        const paramNames = paramCells.map(cell => cell.name);
        setParamsSelect(paramNames);
      }
    } catch (error) {
      console.error('Error fetching params:', error);
    }
  };

  const onParamsChange = (kvPairs: KVPair[]) => {
    const newParams: { [key: string]: string } = {};
    kvPairs.forEach(e => {
      newParams[e.key] = e.value;
    });
    setParams(newParams);
  };

  const editDataValue = async (data: DataCell) => {
    try {
      await invoke('update_data_cell', { 
        id: data.id,
        dataCellData: data 
      });
      getData();
    } catch (error) {
      console.error('Error updating data cell:', error);
      message.error('Failed to update data cell');
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select files to upload');
      return;
    }

    setUploading(true);
    try {
      // First, upload files
      for (const file of fileList) {
        const filePath = (file as any).path || file.name;
        await invoke('add_file', { 
          templateId, 
          name: file.name,
          path: filePath 
        });
      }

      // Execute template with parameters
      const results = await invoke<DataCell[]>('execute_template', { 
        templateId,
        params: JSON.stringify(params)
      });

      message.success('Execution successful');
      setFileList([]);
      getData(); // Refresh data cells
    } catch (error) {
      console.error('Execution failed:', error);
      message.error(`Execution failed: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const delTemplateData = async (dataCellId: number) => {
    try {
      await invoke('delete_data_cell', { id: dataCellId });
      message.success('Data cell deleted');
      getData();
    } catch (error) {
      console.error('Error deleting data cell:', error);
      message.error('Failed to delete data cell');
    }
  };

  const dataColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: number) => dataTypeMap[type] || 'Unknown',
    },
    {
      title: '是否执行',
      dataIndex: 'res',
      key: 'res',
      render: (res: boolean, record: DataCell) => (
        <Switch 
          checked={res} 
          onChange={(checked) => {
            const updatedRecord = { ...record, res: checked };
            editDataValue(updatedRecord);
          }}
        />
      ),
    },
    {
      title: '最终结果',
      dataIndex: 'value',
      key: 'value',
      render: (value: string | string[]) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) {
          if (value.length === 1) return value[0];
          return (
            <Button onClick={() => {
              setDataValue(value);
              setDataValueOpen(true);
            }}>
              查看
            </Button>
          );
        }
        return '';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DataCell) => (
        <Space size="middle">
          <a>编辑</a>
          <a onClick={() => delTemplateData(record.id)}>删除</a>
        </Space>
      ),
    },
  ];

  const uploadProps = {
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: any, fileList: any[]) => {
      setFileList(prev => [...prev, ...fileList]);
      return false;
    },
    fileList,
    multiple: true
  };

  const cardStyle = {
    margin: '15px'
  };

  const cardStyleCol = {
    margin: '15px 15px 0px 15px'
  };

  return (
    <>
      <Drawer 
        title="结果查看" 
        onClose={() => setDataValueOpen(false)} 
        open={dataValueOpen}
      >
        <List
          size="small"
          bordered
          dataSource={dataValue}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      </Drawer>
      
      <Row>
        <Col span={10}>
          <Card style={cardStyleCol} title="参数定义">
            {selectedParamTemplateId && (
              <TemplateList 
                type={3} 
                selectedId={selectedParamTemplateId}
                onSelect={(id) => {
                  setSelectedParamTemplateId(id);
                  // Refresh param options when template changes
                  getParamsSelect();
                }}
              />
            )}
          </Card>
        </Col>
        
        <Col span={10}>
          <Card style={cardStyleCol} title="参数设置">
            <KVAdd keyOptions={paramsSelect} onChange={onParamsChange} />
          </Card>
        </Col>
        
        <Col span={4}>
          <Card style={cardStyleCol} title="结果计算">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
            <Button
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0}
              loading={uploading}
              style={{ marginTop: 16 }}
            >
              {uploading ? '执行中...' : '开始运行'}
            </Button>
          </Card>
        </Col>
      </Row>

      <Card title="模版数据集" style={cardStyle}>
        <Table 
          columns={dataColumns} 
          dataSource={dataCells}
          rowKey="id"
        />
      </Card>
    </>
  );
};

export default Template;