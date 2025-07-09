import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Divider, message, Modal, Row, Space, Switch, Table, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from 'antd/es/upload/interface';
import { invoke } from "@tauri-apps/api/core";
import KVAdd from "./KVAdd";

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
  5: '脚本',
  6: '计算',
  7: '其他数据单元'
};

const Template: React.FC<TemplateProps> = ({ templateId }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dataCells, setDataCells] = useState<DataCell[]>([]);
  const [params, setParams] = useState<{ [key: string]: string }>({});
  const [dataValueOpen, setDataValueOpen] = useState(false);
  const [dataValue, setDataValue] = useState<string[]>([]);

  useEffect(() => {
    if (templateId) {
    getData();
    }
  }, [templateId]);

  const getData = async () => {
    try {
      const cells = await invoke<DataCell[]>('get_data_cells', { templateId });
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

  const onParamsChange = (kvPairs: KVPair[]) => {
    const newParams: { [key: string]: string } = {};
    kvPairs.forEach(e => {
      newParams[e.key] = e.value;
    });
    setParams(newParams);
  };

  const editDataValue = async (data: Partial<DataCell>) => {
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

  const handleUploadAndExecute = async () => {
    setUploading(true);
    try {
      if (fileList.length > 0) {
      for (const file of fileList) {
          // In Tauri, we might need to read file content and pass it
          const fileContent = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file.originFileObj as Blob);
          });

          await invoke('upload_file_to_template', {
          templateId, 
          name: file.name,
            content: Array.from(new Uint8Array(fileContent)),
        });
        }
      }

      await invoke('execute_template', { 
        templateId,
        params: JSON.stringify(params)
      });

      message.success('Execution successful');
      setFileList([]);
      getData();
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
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: number) => dataTypeMap[type] || 'Unknown' },
    { title: '是否执行', dataIndex: 'res', key: 'res', render: (res: boolean, record: DataCell) => (
      <Switch checked={res} onChange={(checked) => editDataValue({ id: record.id, res: checked })} />
    )},
    { title: '最终结果', dataIndex: 'value', key: 'value', render: (value: string | string[]) => {
        if (!value) return '';
        if (Array.isArray(value)) {
        return <Button onClick={() => { setDataValue(value); setDataValueOpen(true); }}>查看</Button>;
        }
      return String(value);
    }},
    { title: '操作', key: 'action', render: (_: any, record: DataCell) => (
        <Space size="middle">
          <a>编辑</a>
          <a onClick={() => delTemplateData(record.id)}>删除</a>
        </Space>
    )},
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="参数定义">
            <KVAdd onChange={onParamsChange} keyOptions={[]} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="结果计算">
            <Upload
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList)}
              multiple
            >
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
            <Button
              type="primary"
              onClick={handleUploadAndExecute}
              loading={uploading}
              style={{ marginTop: 16 }}
            >
              {uploading ? 'Executing...' : '开始运行'}
            </Button>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="模板数据集">
        <Table rowKey="id" columns={dataColumns} dataSource={dataCells} />
      </Card>

       <Modal
          title="Data Value"
          open={dataValueOpen}
          onOk={() => setDataValueOpen(false)}
          onCancel={() => setDataValueOpen(false)}
        >
          <pre>{JSON.stringify(dataValue, null, 2)}</pre>
        </Modal>
    </div>
  );
};

export default Template;