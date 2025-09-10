import { memo } from 'react';


const UpgradeAlert = memo(() => {

  return null;
  // const [hasNewVersion, latestVersion] = useGlobalStore((s) => [s.hasNewVersion, s.latestVersion]);
  // const { t } = useTranslation('common');

  // if (!hasNewVersion) return null;

  // return (
  //   <Alert
  //     action={
  //       <Link
  //         aria-label={t('upgradeVersion.action')}
  //         href={MANUAL_UPGRADE_URL}
  //         style={{ marginBottom: 12 }}
  //         target={'_blank'}
  //       >
  //         <Button block size={'small'} type={'primary'}>
  //           {t('upgradeVersion.action')}
  //         </Button>
  //       </Link>
  //     }
  //     closable
  //     message={t('upgradeVersion.newVersion', { version: latestVersion })}
  //     showIcon={false}
  //     type={'info'}
  //   />
  // );
});

export default UpgradeAlert;
