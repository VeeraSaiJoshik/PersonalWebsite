import type { CSSProperties, FC } from 'react';

export interface BlobCursorProps {
  material?: 'chrome' | 'jelly' | 'pearl' | 'ink';
  color?: string;
  blend?: 'normal' | 'difference' | 'exclusion' | 'multiply' | 'screen' | 'overlay';
  size?: number;
  morph?: number;
  morphSpeed?: number;
  depth?: number;
  trail?: number;
  lag?: number;
  goo?: number;
  stretch?: number;
  wobble?: number;
  drip?: number;
  shine?: number;
  splash?: boolean;
  splashCount?: number;
  splashSpeed?: number;
  splashSize?: number;
  splashGravity?: number;
  regrow?: number;
  shadow?: boolean;
  hideCursor?: boolean;
  className?: string;
  style?: CSSProperties;
}

declare const BlobCursor: FC<BlobCursorProps>;
export default BlobCursor;
