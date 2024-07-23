import axiosInstance from "../../utils/request";
import {useNavigate} from "react-router-dom";
import FileList from "../FileList";
import Template from "../Template";
import DataCell from "../DataCell";
import {Content, Header} from "antd/es/layout/layout";
import {Layout} from "antd";
import Sider from "antd/es/layout/Sider";
import {Footer} from "antd/es/modal/shared";
import TemplateList from "../TemplateList";

const Home = () => {
    const navigate = useNavigate();
    // axiosInstance.get('/some-endpoint')
    //     .then(response => {
    //         // setData(response.data);
    //     })
    //     .catch(error => {
    //         console.error('Error fetching data:', error);
    //     });
    const headerStyle = {
        textAlign: 'center',
        color: '#fff',

        paddingInline: 48,
        lineHeight: '64px',
        // backgroundColor: '#4096ff',
    };
    const contentStyle = {
        textAlign: 'center',
        minHeight: 120,
        lineHeight: '120px',
        // color: '#fff',
        // backgroundColor: '#0958d9',
    };
    const siderStyle = {
        textAlign: 'center',
        lineHeight: '120px',
        color: '#000000',
        backgroundColor: '#ffffff',
    };
    const footerStyle = {
        textAlign: 'center',
        // color: '#fff',
        // backgroundColor: '#4096ff',
    };
    const layoutStyle = {
        minHeight: "100vh"
    };
    return <div>
        {/*<FileList/>*/}
        {/*<TemplateList/>*/}
        <Layout style={layoutStyle}>
            <Header style={headerStyle}>AUTO WORK</Header>
            <Layout>
                <Sider width="30%" style={siderStyle}>
                    <TemplateList type={2}/>
                    <FileList/>
                </Sider>
                <Content style={contentStyle}>
                    <Template/>
                </Content>
            </Layout>
            {/*<Footer style={footerStyle}>Footer</Footer>*/}
        </Layout>
        {/*<DataCell/>*/}
    </div>
}
export default Home;