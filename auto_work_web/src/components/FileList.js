import React, {useEffect, useState} from 'react';
import {Button, Card, Col, Dropdown, Input, List, message, Row, Tree} from 'antd';
import axiosInstance from "../utils/request";

const FileList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFilePost();
    }, []); // 空数组作为依赖项，确保只在组件挂载时运行一次

    const getFilePost = () => {
        axiosInstance.post('/template/list?type=1')
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)) {
                    const {list} = response.data;
                    setData(list)
                    setLoading(false);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    }

    const delFilePost = (id, callBack) => {
        axiosInstance.post('/template/del?templateId=' + id)
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)) {
                    if (callBack) {
                        callBack()
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    }

    const editFilePost = (item, callBack) => {
        axiosInstance.post('/template/edit?type=1', {...item})
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)) {
                    if (callBack) {
                        callBack()
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    }


    const editFile = (item, e) => {
        const newData = data.map(d => {
            if (d.id === item.id) {
                return {...d, isEdit: !d.isEdit};
            }
            return d;
        });
        setData(newData);
    };

    const delFile = (item, e) => {
        delFilePost(item.id, getFilePost)
    };

    const handleBlur = (item, e) => {
        saveFile(item, e);
    };

    const saveFile = (item, e) => {
        item.name = e.target.value;
        editFilePost(item, getFilePost)

        // const newData = data.map(d => {
        //     if (d === item) {
        //         return {...d, name: e.target.value, isEdit: false};
        //     }
        //     return d;
        // });
        // setData(newData);
    };

    return (
        <Card title="文件列表"
            // extra={<a href="#">More</a>}
              style={{
                  width: '300px',
              }}>
            {/*<Button>添加文件</Button>*/}
            <List
                size="small"
                header={
                    <Row justify="space-between">
                        <Col>
                            123
                        </Col>
                        <Col>
                            <Button type="primary" >添加</Button>
                        </Col>
                    </Row>
                }
                // footer={<div>Footer</div>}
                bordered
                dataSource={data}
                renderItem={(item) => <List.Item
                    actions={[
                        <a key="list-loadmore-edit" onClick={editFile.bind(this, item)}>编辑</a>,
                        <a key="list-loadmore-more" onClick={delFile.bind(this, item)}>删除</a>]}>
                    {item.isEdit ?
                        <Input onBlur={handleBlur.bind(this, item)} size={"small"}/>
                        :
                        item.name
                    }

                </List.Item>}
            />
        </Card>

    );
};
export default FileList;