import React, {useEffect, useState} from 'react';
import axiosInstance from "../utils/request";
import EditList from "./EditList";

const TemplateList = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getFilePost();
    }, []); // 空数组作为依赖项，确保只在组件挂载时运行一次

    const getFilePost = () => {
        axiosInstance.post('/template/list?type=2')
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
        axiosInstance.post('/template/edit?type=2', {...item})
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

    const delFile = (item, e) => {
        delFilePost(item.id, getFilePost)
    };

    const handleBlur = (item, e) => {
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
            <EditList title={"模板列表"} dataList={data} onEdit={handleBlur} onDelete={delFile} onAdd={handleAddBlur}/>
        </div>


    );
};
export default TemplateList;