import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";

interface TemplateDefaults {
  fileTemplateId: number | null;
  dataTemplateId: number | null;
  paramTemplateId: number | null;
}

export const useTemplateDefaults = () => {
  const [defaults, setDefaults] = useState<TemplateDefaults>({
    fileTemplateId: null,
    dataTemplateId: null,
    paramTemplateId: null,
  });

  useEffect(() => {
    loadDefaultTemplates();
  }, []);

  const loadDefaultTemplates = async () => {
    try {
      // Get first template of each type to use as default
      const fileTemplates = await invoke<any[]>('get_templates', { typeId: 1 });
      const dataTemplates = await invoke<any[]>('get_templates', { typeId: 2 });
      const paramTemplates = await invoke<any[]>('get_templates', { typeId: 3 });

      setDefaults({
        fileTemplateId: fileTemplates.length > 0 ? fileTemplates[0].id : null,
        dataTemplateId: dataTemplates.length > 0 ? dataTemplates[0].id : null,
        paramTemplateId: paramTemplates.length > 0 ? paramTemplates[0].id : null,
      });
    } catch (error) {
      console.error('Failed to load default templates:', error);
    }
  };

  return defaults;
};