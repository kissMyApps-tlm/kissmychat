'use client';

import { ORG_NAME } from '@lobechat/business-const';
import { isCustomORG } from '@lobechat/const';
import { Flexbox, type FlexboxProps } from '@lobehub/ui';
import { LobeHub } from '@lobehub/ui/brand';
import { createStyles } from 'antd-style';
import Link from 'next/link';
import { memo } from 'react';

const useStyles = createStyles(({ token, css }) => ({
  logoLink: css`
    line-height: 1;
    color: inherit;

    &:hover {
      color: ${token.colorLink};
    }
  `,
}));

const BrandWatermark = memo<Omit<FlexboxProps, 'children'>>(({ style, ...rest }) => {
  const { styles, theme } = useStyles();
  return (
    <Flexbox
      align={'center'}
      dir={'ltr'}
      flex={'none'}
      gap={4}
      horizontal
      style={{ color: theme.colorTextDescription, fontSize: 12, ...style }}
      {...rest}
    >
      <span>Powered by</span>
      {isCustomORG ? (
        <span>{ORG_NAME}</span>
      ) : (
        <Link
          className={styles.logoLink}
          href={`kissmyapps.tech`}
          target={'_blank'}
        >
          <LobeHub size={20} type={'text'} />
        </Link>
      )}
    </Flexbox>
  );
});

export default BrandWatermark;
