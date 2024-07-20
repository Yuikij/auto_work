import {Button, message, Space, Table, Tag, Upload} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {useState} from "react";
import axiosInstance from "../utils/request";

const Template = () => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const handleUpload = () => {
        const formData = new FormData();
        fileList.forEach((file) => {
            formData.append('files', file);
        });


        formData.append('templateId', "1811663639102410753");
        formData.append('params', "{}");
        setUploading(true);
        // const response = axiosInstance.post('/api/upload', formData, {
        //     headers: {
        //         'Content-Type': 'multipart/form-data'
        //     },
        //     onUploadProgress: (progressEvent) => {
        //         const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        //         setUploadProgress(progress);
        //     }
        // });
        // You can use any AJAX library you like
        axiosInstance.post('/template/execute', formData,{  headers: {
                'Content-Type': 'multipart/form-data'
            }})
            .then((res) => res.json())
            .then(() => {
                setFileList([]);
                message.success('upload successfully.');
            })
            .catch(() => {
                message.error('upload failed.');
            })
            .finally(() => {
                setUploading(false);
            });
    };
    const props = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file, fileLists) => {
            setFileList([...fileList, ...fileLists]);
            console.log(fileList);
            return false;
        },
        fileList,
        multiple:true

    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <a>{text}</a>,
        },
        {
            title: 'Age',
            dataIndex: 'age',
            key: 'age',
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: 'Tags',
            key: 'tags',
            dataIndex: 'tags',
            render: (_, { tags }) => (
                <>
                    {tags.map((tag) => {
                        let color = tag.length > 5 ? 'geekblue' : 'green';
                        if (tag === 'loser') {
                            color = 'volcano';
                        }
                        return (
                            <Tag color={color} key={tag}>
                                {tag.toUpperCase()}
                            </Tag>
                        );
                    })}
                </>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <a>Invite {record.name}</a>
                    <a>Delete</a>
                </Space>
            ),
        },
    ];
    const data = [
        {
            key: '1',
            name: 'John Brown',
            age: 32,
            address: 'New York No. 1 Lake Park',
            tags: ['nice', 'developer'],
        },
        {
            key: '2',
            name: 'Jim Green',
            age: 42,
            address: 'London No. 1 Lake Park',
            tags: ['loser'],
        },
        {
            key: '3',
            name: 'Joe Black',
            age: 32,
            address: 'Sydney No. 1 Lake Park',
            tags: ['cool', 'teacher'],
        },
    ];
    return (
        <>
            <Table columns={columns} dataSource={data} />
            {/*<Upload {...props}>*/}
            {/*    <Button icon={<UploadOutlined />}>Select File</Button>*/}
            {/*</Upload>*/}
            {/*<Button*/}
            {/*    type="primary"*/}
            {/*    onClick={handleUpload}*/}
            {/*    disabled={fileList.length === 0}*/}
            {/*    loading={uploading}*/}
            {/*    style={{*/}
            {/*        marginTop: 16,*/}
            {/*    }}*/}
            {/*>*/}
            {/*    {uploading ? 'Uploading' : 'Start Upload'}*/}
            {/*</Button>*/}
        </>
    );
};
export default Template;