import React, {useEffect, useMemo, useState} from 'react';
import {Button, Card, Col, Dropdown, Input, List, message, Row, Tree} from 'antd';
import axiosInstance from "../utils/request";

const EditList = ({title, onDelete, onEdit, onAdd, dataList}) => {
    const [data, setData] = useState([]);
    const [isAdd, setIsAdd] = useState(false);

     useMemo(() => {
        if (data !== dataList) {
            setData(dataList);
        }
    }, [dataList]);

    const editItem = (item, e) => {
        const newData = data.map(d => {
            if (d.id === item.id) {
                return {...d, isEdit: !d.isEdit};
            }
            return d;
        });
        setData(newData);
    };

    const addItem = (e) => {
        onAdd(e);
        setIsAdd(false)
    }

    return (
        <div>
            {/*<Card title={title}*/}
            {/*      style={{}}>*/}
                <List
                    size="small"
                    header={
                        <Row justify="space-between">
                            <Col>
                                {isAdd && <Input onBlur={addItem}/>}
                            </Col>
                            <Col>
                                <Button onClick={() => setIsAdd(!isAdd)} type="primary">添加</Button>
                            </Col>
                        </Row>
                    }
                    bordered
                    dataSource={data}
                    renderItem={(item) => <List.Item
                        actions={[
                            <a key="list-loadmore-edit" onClick={editItem.bind(this, item)}>编辑</a>,
                            <a key="list-loadmore-more" onClick={onDelete.bind(this, item)}>删除</a>]}>
                        {item.isEdit ?
                            <Input onBlur={onEdit.bind(this, item)} size={"small"}/>
                            :
                            item.name
                        }
                    </List.Item>}
                />
            {/*</Card>*/}
        </div>


    );
};
export default EditList;