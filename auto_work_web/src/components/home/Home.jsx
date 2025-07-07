import React from 'react';
import { Card, Button, Space, Typography, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
    DatabaseOutlined, 
    FileTextOutlined, 
    CloudUploadOutlined,
    SettingOutlined,
    HomeOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Home = () => {
    const navigate = useNavigate();
    
    return (
        <div style={{ padding: '20px' }}>
            <Card>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Title level={1}>
                        <HomeOutlined /> AutoWork 离线版
                    </Title>
                    <Paragraph>
                        自动化工作流处理工具 - 离线版本
                    </Paragraph>
                    <Paragraph type="secondary">
                        支持Excel数据处理、模板管理、计算规则定义等功能
                    </Paragraph>
                </div>
                
                <Row gutter={[16, 16]} justify="center">
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card 
                            hoverable
                            style={{ textAlign: 'center', height: '200px' }}
                            bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
                        >
                            <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                            <Title level={4}>模板管理</Title>
                            <Paragraph type="secondary">创建和管理计算模板</Paragraph>
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/templates')}
                                disabled
                            >
                                进入
                            </Button>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card 
                            hoverable
                            style={{ textAlign: 'center', height: '200px' }}
                            bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
                        >
                            <CloudUploadOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                            <Title level={4}>文件管理</Title>
                            <Paragraph type="secondary">上传和管理Excel文件</Paragraph>
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/files')}
                                disabled
                            >
                                进入
                            </Button>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card 
                            hoverable
                            style={{ textAlign: 'center', height: '200px' }}
                            bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
                        >
                            <DatabaseOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }} />
                            <Title level={4}>数据管理</Title>
                            <Paragraph type="secondary">数据导入导出和备份</Paragraph>
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/data')}
                            >
                                进入
                            </Button>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card 
                            hoverable
                            style={{ textAlign: 'center', height: '200px' }}
                            bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
                        >
                            <SettingOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
                            <Title level={4}>系统设置</Title>
                            <Paragraph type="secondary">应用配置和系统信息</Paragraph>
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/settings')}
                                disabled
                            >
                                进入
                            </Button>
                        </Card>
                    </Col>
                </Row>
                
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Space direction="vertical">
                        <Title level={3}>快速开始</Title>
                        <Space wrap>
                            <Button 
                                size="large"
                                onClick={() => navigate('/data')}
                            >
                                查看系统信息
                            </Button>
                            <Button 
                                size="large" 
                                type="primary"
                                onClick={() => navigate('/data')}
                            >
                                数据备份
                            </Button>
                        </Space>
                    </Space>
                </div>
            </Card>
        </div>
    );
};

export default Home;