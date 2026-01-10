'use client';

import { memo } from 'react';

const UpgradeAlert = memo(() => {
  // const [hasNewVersion, latestVersion] = useGlobalStore((s) => [s.hasNewVersion, s.latestVersion]);
  // const { t } = useTranslation('common');

  return null;

  // return (
  //   <Alert
  //     closable
  //     type={'info'}
  //     title={
  //       <Flexbox gap={8}>
  //         <p>{t('upgradeVersion.newVersion', { version: `v${latestVersion}` })}</p>
  //         <a
  //           aria-label={t('upgradeVersion.action')}
  //           href={MANUAL_UPGRADE_URL}
  //           rel="noreferrer"
  //           style={{ marginBottom: 6 }}
  //           target="_blank"
  //         >
  //           <Button block size={'small'} type={'primary'}>
  //             {t('upgradeVersion.action')}
  //           </Button>
  //         </a>
  //       </Flexbox>
  //     }
  //   />
  // );
});

export default UpgradeAlert;
