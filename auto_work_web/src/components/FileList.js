import React, {useEffect, useState} from 'react';
import {Button, Card, Dropdown, Input, List, message, Tree} from 'antd';
import axiosInstance from "../utils/request";

const FileList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {


        axiosInstance.post('/template/list?type=1')
            .then(response => {
                console.log(response);
                console.log(axiosInstance.isSuccess(response));
                if (axiosInstance.isSuccess(response)){
                    const { list } = response.data;
                    setData(list)
                    setLoading(false);
                }
                // setData(response.data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });

    }, []); // 空数组作为依赖项，确保只在组件挂载时运行一次
    //  data = [
    //     'Racing car sprays burning fuel into crowd.',
    //     'Japanese princess to wed commoner.',
    //     'Australian walks 100km after outback crash.',
    //     'Man charged over missing wedding girl.',
    //     'Los Angeles battles huge wildfires.',
    // ];
    return (
        <Card title="文件列表"
            // extra={<a href="#">More</a>}
              style={{
                  width: '300px',
              }}>
            {/*<Button>添加文件</Button>*/}
            <List
                size="small"
                header={<div>Header</div>}
                // footer={<div>Footer</div>}
                bordered
                dataSource={data}
                renderItem={(item) => <List.Item  actions={[<a key="list-loadmore-edit">编辑</a>, <a key="list-loadmore-more">删除</a>]}>
                    {/*<div>{item.name}</div>*/}
                    <Input size={"small"} placeholder="Basic usage" />
                </List.Item>}
            />
        </Card>

    );
};
export default FileList;