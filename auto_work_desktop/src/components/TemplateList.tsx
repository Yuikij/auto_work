import React, { useEffect, useState } from 'react';
import EditList from "./EditList";
import { invoke } from '@tauri-apps/api/core';
import { message } from 'antd';

interface Template {
    id: number;
    name: string;
    content?: string;
    type_id: number; // Corresponds to `typeId` in Rust
}

interface TemplateListProps {
    type: number; // This is the type_id
    onSelect?: (id: number) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ type, onSelect }) => {
    const [data, setData] = useState<Template[]>([]);

    const getTemplates = async () => {
        try {
            const templates: Template[] = await invoke('list_templates', { typeId: type });
            setData(templates);
        } catch (error) {
            console.error('Error fetching templates:', error);
            message.error(`Failed to fetch templates: ${error}`);
        }
    };

    useEffect(() => {
        getTemplates();
    }, [type]);


    const deleteTemplate = async (item: Template) => {
        try {
            await invoke('delete_template', { id: item.id });
            message.success('Template deleted successfully');
            getTemplates(); // Refresh list
        } catch (error) {
            console.error('Error deleting template:', error);
            message.error(`Failed to delete template: ${error}`);
        }
    };

    const editTemplate = async (item: Template, newName: string) => {
        try {
            // The EditList only provides a name. We'll pass the existing content, or an empty string.
            await invoke('edit_template', {
                id: item.id,
                name: newName,
                content: item.content || "", 
            });
            message.success('Template updated successfully');
            getTemplates(); // Refresh list
        } catch (error) {
            console.error('Error editing template:', error);
            message.error(`Failed to edit template: ${error}`);
        }
    };
    
    const addTemplate = async (name: string) => {
        if (!name.trim()) return; // Avoid adding empty templates
        try {
            await invoke('add_template', {
                name: name,
                content: "", // Content is not provided by EditList
                typeId: type 
            });
            message.success('Template added successfully');
            getTemplates(); // Refresh list
        } catch (error) {
            console.error('Error adding template:', error);
            message.error(`Failed to add template: ${error}`);
        }
    };

    const handleBlur = (item: Template, e: React.FocusEvent<HTMLInputElement>) => {
        if (item.name !== e.target.value) {
            editTemplate(item, e.target.value);
        }
    };

    const handleAddBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        addTemplate(e.target.value);
    };

    const handleSelect = (item: Template) => {
        if (onSelect) {
            onSelect(item.id);
        }
    }

    return (
        <div>
            <h3 style={{ margin: '16px 8px 8px' }}>Type {type} Templates</h3>
            <EditList 
                dataList={data} 
                onEdit={handleBlur} 
                onDelete={deleteTemplate} 
                onAdd={handleAddBlur}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default TemplateList; 