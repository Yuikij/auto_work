import { useState } from "react";
import { Layout, message } from 'antd';
import TemplateList from "./components/TemplateList";
import FileList from "./components/FileList";
import Template from "./components/Template";
import 'antd/dist/reset.css';


const { Header, Content, Sider } = Layout;


function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const handleTemplateSelect = (id: number) => {
    setSelectedTemplateId(id);
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px' }}>AUTO WORK</div>
      </Header>
      <Layout>
        <Sider width={350} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
            <TemplateList 
                type={2} 
                onSelect={handleTemplateSelect} 
                selectedId={selectedTemplateId}
            />
            {selectedTemplateId && <FileList templateId={selectedTemplateId} />}
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
                <Template templateId={selectedTemplateId} />
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
