import React, {useEffect, useState} from 'react';
import {Button, Card, Col, Divider, Dropdown, Input, List, message, Row, Tree} from 'antd';
import axiosInstance from "../utils/request";
import EditList from "./EditList";
import TemplateList from "./TemplateList";

const FileList = () => {
    const [data, setData] = useState([]);
    const [detailData, setDetailData] = useState([]);

    useEffect(() => {
        getFilePost();
        getFileDetailPost();
    }, []); // 空数组作为依赖项，确保只在组件挂载时运行一次

    const getFilePost = () => {
        axiosInstance.post('/template/list?type=1')
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)) {
                    const {list} = response.data;
                    setData(list)
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    const getFileDetailPost = () => {
        axiosInstance.post('/files/get?fileTemplateId=1811663639102410753')
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)) {
                    const {list} = response.data;
                    setDetailData(list)
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
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
            });
    }

    const editFilePost = (item, callBack) => {
        item.type = 1;
        axiosInstance.post('/template/edit', {...item})
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

    const onDetailEdit = (item, e) => {
        saveFile(item, e);
    };

    const handleAddBlur = (e) => {
        const name = e.target.value;
        axiosInstance.post('/template/files/add', {name})
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)) {
                    getFilePost()
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    };

    const saveFile = (item, e) => {
        item.name = e.target.value;
        editFilePost(item, getFilePost)
    };

    return (
        <div>
            <Card title={"文件列表"}>
                <TemplateList type={1}/>
                <Divider>文件列表详情</Divider>
                <EditList dataList={detailData} onEdit={onDetailEdit} onDelete={delFile} onAdd={handleAddBlur}/>
            </Card>


        </div>
    );
};
export default FileList;