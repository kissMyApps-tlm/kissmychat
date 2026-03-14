import { App } from 'antd';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { type AgentGroupExportData, agentGroupExportService } from '@/services/agentGroupExport';
import { useHomeStore } from '@/store/home';
import { exportJSONFile } from '@lobechat/utils/client';

export const useGroupExportImport = (groupId: string) => {
  const { t } = useTranslation('chat');
  const { message } = App.useApp();
  const refreshAgentList = useHomeStore((s) => s.refreshAgentList);

  const handleExport = useCallback(async () => {
    const loadingKey = 'exportGroup.loading';
    message.loading({ content: t('groupExport.exporting'), duration: 0, key: loadingKey });

    try {
      const data = await agentGroupExportService.exportGroup(groupId);
      if (!data) {
        message.destroy(loadingKey);
        message.error(t('groupExport.exportFailed'));
        return;
      }

      const filename = `${data.group.title || 'agent-group'}.json`;
      exportJSONFile(data, filename);
      message.destroy(loadingKey);
      message.success(t('groupExport.exportSuccess'));
    } catch {
      message.destroy(loadingKey);
      message.error(t('groupExport.exportFailed'));
    }
  }, [groupId, message, t]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      const loadingKey = 'importGroup.loading';
      message.loading({ content: t('groupExport.importing'), duration: 0, key: loadingKey });

      try {
        const text = await file.text();
        const data = JSON.parse(text) as AgentGroupExportData;

        if (data.type !== 'agentGroup') {
          message.destroy(loadingKey);
          message.error(t('groupExport.invalidFile'));
          return;
        }

        await agentGroupExportService.importGroup(data);
        await refreshAgentList();
        message.destroy(loadingKey);
        message.success(t('groupExport.importSuccess'));
      } catch {
        message.destroy(loadingKey);
        message.error(t('groupExport.importFailed'));
      }
    });

    input.click();
  }, [message, t, refreshAgentList]);

  return { handleExport, handleImport };
};
