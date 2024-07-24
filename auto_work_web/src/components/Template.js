import {Button, Card, Col, Divider, Drawer, List, message, Modal, Row, Space, Table, Tag, Upload} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import axiosInstance from "../utils/request";
import {dataTypeMap} from "../enums/DataEnums";
import DataCell from "./DataCell";
import EditList from "./EditList";
import KVAdd from "./KVAdd";
import TemplateList from "./TemplateList";
import {mergeArrays} from "../utils/arrays";

const Template = () => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dataCells, setDataCells] = useState(false);
    const [paramsSelect, setParamsSelect] = useState([]);
    const [params, setParams] = useState({});
    const [dataValueOpen, setDataValueOpen] = useState(false);
    const [dataValue, setDataValue] = useState([]);

    useEffect(() => {
        getData();
        getParamsSelect();
    }, []); // 空数组作为依赖项，确保只在组件挂载时运行一次

    const getParamsSelect = () => {
        axiosInstance.post('/template/list?type=3')
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)) {
                    const {list} = response.data;
                    const map = list.map(e=>(e.name));
                    setParamsSelect( map)
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
    const onParamsSelectChange = (value) => {
        getParamsSelect()
    }

    const onParamsChange = (value) => {
        const newParams={}
        value.forEach(e=>{
            newParams[e.key]=e.value
        });
        setParams(newParams)
        console.log(newParams,"newParams");
    }
    const getData = () => {
        axiosInstance.post('/data/get?templateId=1811663639102410753')
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
        formData.append('params', JSON.stringify(params));
        setUploading(true);
        axiosInstance.post('/template/execute', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                if (axiosInstance.isSuccess(response)) {
                    const list = response.data.list;
                    console.log(list,"handleUpload");
                    const newList = mergeArrays(dataCells,list);
                    console.log(newList);
                    setFileList([]);
                    setDataCells(newList);
                    message.success('执行成功');
                }
            })
            .catch((e) => {
                message.error(e,'执行失败');
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
            dataIndex: 'value',
            key: 'value',
            render: (res) => !res?"":(res.length===1 ? res :
                <Button onClick={()=>{
                    setDataValue(res)
                    setDataValueOpen(true)
                }}>查看</Button>),
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
        axiosInstance.post('/data/add?templateId=1811663639102410753', data)
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
        axiosInstance.post('/data/del?dataCellId=' + dataCellId,)
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
            <Drawer title="结果查看" onClose={() => {
                setDataValueOpen(false);
            }} open={dataValueOpen}>
                <List
                    size="small"
                    bordered
                    dataSource={dataValue}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                />
            </Drawer>
            <Row>
                <Col span={10}>
                    <Card style={cardStyleCol} title={"参数定义"}>
                        <TemplateList type={3} onChange={onParamsSelectChange} dataTemplateId={"1811663706395824129"}/>
                    </Card>
                </Col>
                <Col span={10}><KVAdd keyOptions={paramsSelect} onChange={onParamsChange}/></Col>
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
                <DataCell setDataCell={setDataCell} />
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