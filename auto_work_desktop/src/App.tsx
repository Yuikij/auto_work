import { useState } from "react";
import { Layout, Tabs, Button, Space, message } from 'antd';
import TemplateList from "./components/TemplateList";
import FileList from "./components/FileList";
import DataCellList from "./components/DataCellList";
import 'antd/dist/reset.css';

import { invoke } from "@tauri-apps/api/core";
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';


const { Header, Content, Sider } = Layout;

// Define human-readable names for template types
const TEMPLATE_TYPES = [
  { key: '1', title: 'File Templates', type: 1 },
  { key: '2', title: 'Data Templates', type: 2 },
  { key: '3', title: 'Script Templates', type: 3 },
];

function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const handleTemplateSelect = (id: number) => {
    setSelectedTemplateId(id);
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
        <div style={{ color: 'white', fontSize: '20px' }}>Auto Work</div>
        <Space>
            <Button type="primary" onClick={handleExport}>Export All Data</Button>
            <Button onClick={handleImport}>Import All Data</Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={350} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
            <Tabs 
                defaultActiveKey={TEMPLATE_TYPES[0].key} 
                onChange={() => {
                    // setActiveTemplateType(Number(key)); // No longer needed
                    setSelectedTemplateId(null); // Deselect when changing type
                }}
                centered
            >
                {TEMPLATE_TYPES.map(template => (
                    <Tabs.TabPane tab={template.title} key={template.key}>
                        <TemplateList 
                            type={template.type} 
                            onSelect={handleTemplateSelect} 
                            selectedId={selectedTemplateId}
                        />
                    </Tabs.TabPane>
                ))}
            </Tabs>
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
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
