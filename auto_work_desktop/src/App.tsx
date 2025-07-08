import { useState } from "react";
import { Layout, Menu, Tabs, Button, Space, message } from 'antd';
import TemplateList from "./components/TemplateList";
import FileList from "./components/FileList";
import DataCellList from "./components/DataCellList";
import 'antd/dist/reset.css';

import { invoke } from "@tauri-apps/api/core";
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';


const { Header, Content, Sider } = Layout;

function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const handleTemplateSelect = (id: number) => {
    // A simple reload to ensure all components refetch data after import/delete.
    if (selectedTemplateId !== id) {
        setSelectedTemplateId(id);
    } else {
        window.location.reload();
    }
  };

  const handleExport = async () => {
    try {
        const jsonData = await invoke<string>('export_all_data');
        const filePath = await save({
            title: "Save Data Export",
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });
        if (filePath) {
            await writeTextFile(filePath, jsonData);
            message.success('Data exported successfully!');
        }
    } catch (error: any) {
        console.error('Export failed:', error);
        message.error(`Export failed: ${error}`);
    }
  };

  const handleImport = async () => {
    try {
        const selectedPath = await open({
            title: "Open Data File",
            multiple: false,
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (typeof selectedPath === 'string') {
            if (!window.confirm("Are you sure? This will overwrite all existing data.")) {
                return;
            }
            const jsonData = await readTextFile(selectedPath);
            await invoke('import_all_data', { dataJson: jsonData });
            message.success('Data imported successfully! The app will now refresh.');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    } catch (error: any) {
        console.error('Import failed:', error);
        message.error(`Import failed: ${error}`);
    }
  };


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} style={{ flex: 1 }}>
          <Menu.Item key="1">Templates</Menu.Item>
        </Menu>
        <Space>
            <Button type="primary" onClick={handleExport}>Export</Button>
            <Button onClick={handleImport}>Import</Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={300} className="site-layout-background">
          <TemplateList type={1} onSelect={handleTemplateSelect} />
          <TemplateList type={2} onSelect={handleTemplateSelect} />
          <TemplateList type={3} onSelect={handleTemplateSelect} />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            {selectedTemplateId ? (
              <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="Files" key="1">
                  <FileList templateId={selectedTemplateId} />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Data Cells" key="2">
                  <DataCellList templateId={selectedTemplateId} />
                </Tabs.TabPane>
              </Tabs>
            ) : (
              <div>Please select a template to see its details.</div>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
