import {Button, Card, Col, Divider, message, Modal, Row, Space, Table, Tag, Upload} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import axiosInstance from "../utils/request";
import {dataTypeMap} from "../enums/DataEnums";
import DataCell from "./DataCell";
import EditList from "./EditList";
import KVAdd from "./KVAdd";
import TemplateList from "./TemplateList";

const Template = () => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dataCells, setDataCells] = useState(false);

    useEffect(() => {
        getData();
    }, []); // 空数组作为依赖项，确保只在组件挂载时运行一次
    const getData = () => {
        axiosInstance.post('/template/data/get?templateId=1811663639102410753')
            .then(response => {
                if (axiosInstance.isSuccess(response)) {
                    console.log(response, "getData");
                    setDataCells(response.data.list);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
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
        axiosInstance.post('/template/execute', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
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
        multiple: true

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
            render: (type) => dataTypeMap[type],
        },
        {
            title: '是否执行',
            dataIndex: 'res',
            key: 'res',
            render: (res) => res ? '是' : '否',
        },
        {
            title: '最终结果',
            dataIndex: 'resData',
            key: 'resData',
            //render: (res) => res ? '是' : '否',
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <a>编辑</a>
                    <a onClick={() => {
                        delTemplateData(record.id, getData)
                    }}>删除</a>
                </Space>
            ),
        },
    ]

    const cardStyle = {
        margin: '15px'
    }

    const cardStyleCol = {
        margin: '15px 15px 0px 15px'
    }

    const addTemplateData = (data, callBack) => {
        axiosInstance.post('/template/data/add?templateId=1811663639102410753', data)
            .then(response => {
                if (axiosInstance.isSuccess(response, callBack)) {
                    console.log(response.data);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    const delTemplateData = (dataCellId, callBack) => {
        axiosInstance.post('/template/data/del?dataCellId=' + dataCellId,)
            .then(response => {
                if (axiosInstance.isSuccess(response, callBack)) {
                    console.log(response.data);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }


    const setDataCell = (data) => {
        addTemplateData(data, getData)
    }

    return (
        <>
            <Row>
                <Col span={10}>
                    <Card style={cardStyleCol} title={"参数定义"}>
                        <TemplateList type={3}/>
                    </Card>
                </Col>
                <Col span={10}><KVAdd/></Col>
                <Col span={4}>
                    <Card style={cardStyleCol} title={"结果计算"}>
                        <Upload {...props}>
                            <Button icon={<UploadOutlined/>}>上传文件</Button>
                        </Upload>
                        <Button
                            type="primary"
                            onClick={handleUpload}
                            disabled={fileList.length === 0}
                            loading={uploading}
                            style={{
                                marginTop: 16,
                            }}
                        >
                            {uploading ? 'Uploading' : '开始运行'}
                        </Button>
                    </Card>

                </Col>
            </Row>

            <Card style={cardStyle}>
                <DataCell setDataCell={setDataCell}/>
            </Card>
            <Card title={'模版数据集'} style={cardStyle}>
                <Table columns={dataColumns} dataSource={dataCells}/>
            </Card>
            <Modal>

            </Modal>

        </>
    );
};
export default Template;