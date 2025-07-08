import React from 'react';
import { Table } from 'antd';

interface ParseResultViewerProps {
  values: number[];
}

const columns = [
  {
    title: 'Index',
    dataIndex: 'index',
    key: 'index',
  },
  {
    title: 'Value',
    dataIndex: 'value',
    key: 'value',
  },
];

const ParseResultViewer: React.FC<ParseResultViewerProps> = ({ values }) => {
  const dataSource = values.map((value, index) => ({
    key: index,
    index: index + 1,
    value,
  }));

  return <Table dataSource={dataSource} columns={columns} pagination={false} scroll={{ y: 400 }} />;
};

export default ParseResultViewer; 