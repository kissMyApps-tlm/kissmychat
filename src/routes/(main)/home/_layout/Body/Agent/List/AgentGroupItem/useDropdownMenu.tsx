import { type MenuProps } from '@lobehub/ui';
import { Icon } from '@lobehub/ui';
import { App } from 'antd';
import { Download, LucideCopy, Pen, PictureInPicture2Icon, Pin, PinOff, Trash, Upload } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { openEditingPopover } from '@/features/EditingPopover/store';
import { useGlobalStore } from '@/store/global';
import { useHomeStore } from '@/store/home';

import { useGroupExportImport } from './useGroupExportImport';

interface UseGroupDropdownMenuParams {
  anchor: HTMLElement | null;
  avatar?: string;
  backgroundColor?: string;
  id: string;
  memberAvatars?: { avatar?: string; background?: string }[];
  pinned: boolean;
  title: string;
}

export const useGroupDropdownMenu = ({
  anchor,
  avatar,
  backgroundColor,
  id,
  memberAvatars,
  pinned,
  title,
}: UseGroupDropdownMenuParams): (() => MenuProps['items']) => {
  const { t } = useTranslation('chat');
  const { modal, message } = App.useApp();

  const openAgentInNewWindow = useGlobalStore((s) => s.openAgentInNewWindow);
  const [pinAgentGroup, duplicateAgentGroup, removeAgentGroup] = useHomeStore((s) => [
    s.pinAgentGroup,
    s.duplicateAgentGroup,
    s.removeAgentGroup,
  ]);
  const { handleExport, handleImport } = useGroupExportImport(id);

  return useMemo(
    () => () =>
      [
        {
          icon: <Icon icon={pinned ? PinOff : Pin} />,
          key: 'pin',
          label: t(pinned ? 'pinOff' : 'pin'),
          onClick: () => pinAgentGroup(id, !pinned),
        },
        {
          icon: <Icon icon={Pen} />,
          key: 'rename',
          label: t('rename', { ns: 'common' }),
          onClick: (info: any) => {
            info.domEvent?.stopPropagation();
            if (anchor) {
              openEditingPopover({
                anchor,
                avatar,
                backgroundColor,
                id,
                memberAvatars,
                title,
                type: 'agentGroup',
              });
            }
          },
        },
        {
          icon: <Icon icon={LucideCopy} />,
          key: 'duplicate',
          label: t('duplicate', { ns: 'common' }),
          onClick: ({ domEvent }: any) => {
            domEvent.stopPropagation();
            duplicateAgentGroup(id);
          },
        },
        {
          icon: <Icon icon={PictureInPicture2Icon} />,
          key: 'openInNewWindow',
          label: t('openInNewWindow'),
          onClick: ({ domEvent }: any) => {
            domEvent.stopPropagation();
            openAgentInNewWindow(id);
          },
        },
        { type: 'divider' },
        {
          icon: <Icon icon={Download} />,
          key: 'exportGroup',
          label: t('groupExport.export'),
          onClick: ({ domEvent }: any) => {
            domEvent.stopPropagation();
            handleExport();
          },
        },
        {
          icon: <Icon icon={Upload} />,
          key: 'importGroup',
          label: t('groupExport.import'),
          onClick: ({ domEvent }: any) => {
            domEvent.stopPropagation();
            handleImport();
          },
        },
        { type: 'divider' },
        {
          danger: true,
          icon: <Icon icon={Trash} />,
          key: 'delete',
          label: t('delete', { ns: 'common' }),
          onClick: ({ domEvent }: any) => {
            domEvent.stopPropagation();
            modal.confirm({
              centered: true,
              okButtonProps: { danger: true },
              onOk: async () => {
                await removeAgentGroup(id);
                message.success(t('confirmRemoveGroupSuccess'));
              },
              title: t('confirmRemoveChatGroupItemAlert'),
            });
          },
        },
      ] as MenuProps['items'],
    [
      anchor,
      avatar,
      backgroundColor,
      memberAvatars,
      t,
      pinned,
      pinAgentGroup,
      id,
      title,
      duplicateAgentGroup,
      openAgentInNewWindow,
      handleExport,
      handleImport,
      modal,
      removeAgentGroup,
      message,
    ],
  );
};
