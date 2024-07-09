import React from 'react';
import {Card, Tree} from 'antd';

const {DirectoryTree} = Tree;
const treeData = [
    {
        title: 'parent 0',
        key: '0-0',
        children: [
            {
                title: 'leaf 0-0',
                key: '0-0-0',
                isLeaf: true,
            },
            {
                title: 'leaf 0-1',
                key: '0-0-1',
                isLeaf: true,
            },
        ],
    },
    {
        title: 'parent 1',
        key: '0-1',
        children: [
            {
                title: 'leaf 1-0',
                key: '0-1-0',
                isLeaf: true,
            },
            {
                title: 'leaf 1-1',
                key: '0-1-1',
                isLeaf: true,
            },
        ],
    },
];

const demo =
    [{"id": 1, "name": "a", "type": 0, "zipType": 0}, {
        "id": 2,
        "name": "b",
        "parentId": 1,
        "type": 0,
        "zipType": 0
    }, {"id": 3, "name": "c", "parentId": 1, "type": 0, "zipType": 0}, {
        "id": 4,
        "name": "d",
        "parentId": 2,
        "type": 0,
        "zipType": 0
    }, {"id": 5, "name": "f", "parentId": 4, "type": 0, "zipType": 0}]


const toTree = (list) => {
    const root = [];
    const dataMap = {}
    list.forEach(e => {
        e.parentId = e.parentId || -1;
        dataMap[e.parentId] = [...dataMap[e.parentId] || [], e];
    })
    root.push(...dataMap[-1])
    Object.entries(dataMap).forEach(([k, v]) => {
        v.forEach(e => {
            e.subFiles = dataMap[e.id]
        })
    })
    return root;
}

const FileTree = () => {

    toTree(demo);
    const onSelect = (keys, info) => {
        console.log('Trigger Select', keys, info);
    };
    const onExpand = (keys, info) => {
        console.log('Trigger Expand', keys, info);
    };
    return (
        <Card title="表1分组"
            // extra={<a href="#">More</a>}
              style={{
                  width: '300px',
              }}>
            <DirectoryTree
                multiple
                defaultExpandAll
                onSelect={onSelect}
                onExpand={onExpand}
                treeData={treeData}
            />
        </Card>

    );
};
export default FileTree;