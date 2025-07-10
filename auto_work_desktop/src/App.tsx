import { useState } from "react";
import { Layout, message } from 'antd';
import TemplateList from "./components/TemplateList";
import FileList from "./components/FileList";
import Template from "./components/Template";
import 'antd/dist/reset.css';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const handleTemplateSelect = (id: number) => {
    setSelectedTemplateId(id);
  };
  
  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="logo">AUTO WORK</div>
      </Header>
      <Layout>
        <Sider width={380} className="app-sidebar">
          <div className="fade-in">
            <TemplateList 
              type={2} 
              onSelect={handleTemplateSelect} 
              selectedId={selectedTemplateId}
            />
            {selectedTemplateId && (
              <div className="slide-in">
                <FileList templateId={selectedTemplateId} />
              </div>
            )}
          </div>
        </Sider>
        <Layout>
          <Content className="app-content">
            {selectedTemplateId ? (
              <div className="fade-in">
                <Template templateId={selectedTemplateId} />
              </div>
            ) : (
              <div className="modern-card" style={{ 
                textAlign: 'center', 
                padding: '60px 40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '24px',
                  opacity: 0.3
                }}>
                  📋
                </div>
                <h2 style={{ 
                  color: 'var(--text-secondary)',
                  fontWeight: 400,
                  margin: 0,
                  fontSize: '18px'
                }}>
                  请选择一个模板来查看详情
                </h2>
                <p style={{ 
                  color: 'var(--text-muted)',
                  marginTop: '12px',
                  fontSize: '14px'
                }}>
                  从左侧模板列表中选择一个模板开始工作
                </p>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
