import type * as React from 'react';

interface MotionProps {
  animate?: any;
  children?: React.ReactNode;
  className?: string;
  exit?: any;
  initial?: any;
  key?: React.Key;
  style?: React.CSSProperties;
  transition?: any;
  variants?: any;
}

interface HTMLMotionPropsBase
  extends MotionProps,
    Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps> {}

type MotionComponent<E extends HTMLElement> = React.ForwardRefExoticComponent<
  HTMLMotionPropsBase & React.RefAttributes<E>
>;

interface MotionComponents {
  a: MotionComponent<HTMLAnchorElement>;
  article: MotionComponent<HTMLElement>;
  aside: MotionComponent<HTMLElement>;
  button: MotionComponent<HTMLButtonElement>;
  circle: React.ForwardRefExoticComponent<
    MotionProps & React.SVGAttributes<SVGCircleElement> & React.RefAttributes<SVGCircleElement>
  >;
  div: MotionComponent<HTMLDivElement>;
  footer: MotionComponent<HTMLElement>;
  form: MotionComponent<HTMLFormElement>;
  h1: MotionComponent<HTMLHeadingElement>;
  h2: MotionComponent<HTMLHeadingElement>;
  h3: MotionComponent<HTMLHeadingElement>;
  header: MotionComponent<HTMLElement>;
  img: MotionComponent<HTMLImageElement>;
  input: MotionComponent<HTMLInputElement>;
  label: MotionComponent<HTMLLabelElement>;
  li: MotionComponent<HTMLLIElement>;
  main: MotionComponent<HTMLElement>;
  nav: MotionComponent<HTMLElement>;
  p: MotionComponent<HTMLParagraphElement>;
  path: React.ForwardRefExoticComponent<
    MotionProps & React.SVGAttributes<SVGPathElement> & React.RefAttributes<SVGPathElement>
  >;
  rect: React.ForwardRefExoticComponent<
    MotionProps & React.SVGAttributes<SVGRectElement> & React.RefAttributes<SVGRectElement>
  >;
  section: MotionComponent<HTMLElement>;
  select: MotionComponent<HTMLSelectElement>;
  span: MotionComponent<HTMLSpanElement>;
  svg: React.ForwardRefExoticComponent<
    MotionProps & React.SVGAttributes<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
  >;
  textarea: MotionComponent<HTMLTextAreaElement>;
  ul: MotionComponent<HTMLUListElement>;
}

declare module 'motion/react-m' {
  export const a: MotionComponents['a'];
  export const article: MotionComponents['article'];
  export const aside: MotionComponents['aside'];
  export const button: MotionComponents['button'];
  export const circle: MotionComponents['circle'];
  export const div: MotionComponents['div'];
  export const footer: MotionComponents['footer'];
  export const form: MotionComponents['form'];
  export const h1: MotionComponents['h1'];
  export const h2: MotionComponents['h2'];
  export const h3: MotionComponents['h3'];
  export const header: MotionComponents['header'];
  export const img: MotionComponents['img'];
  export const input: MotionComponents['input'];
  export const label: MotionComponents['label'];
  export const li: MotionComponents['li'];
  export const main: MotionComponents['main'];
  export const nav: MotionComponents['nav'];
  export const p: MotionComponents['p'];
  export const path: MotionComponents['path'];
  export const rect: MotionComponents['rect'];
  export const section: MotionComponents['section'];
  export const select: MotionComponents['select'];
  export const span: MotionComponents['span'];
  export const svg: MotionComponents['svg'];
  export const textarea: MotionComponents['textarea'];
  export const ul: MotionComponents['ul'];
}

declare module 'motion/react' {
  interface MotionPropsExported {
    animate?: any;
    children?: React.ReactNode;
    className?: string;
    exit?: any;
    initial?: any;
    key?: React.Key;
    style?: React.CSSProperties;
    transition?: any;
    variants?: any;
  }

  interface HTMLMotionPropsExported
    extends MotionPropsExported,
      Omit<React.HTMLAttributes<HTMLElement>, keyof MotionPropsExported> {}

  export const motion: {
    a: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLAnchorElement>
    >;
    article: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLElement>
    >;
    aside: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLElement>
    >;
    button: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLButtonElement>
    >;
    circle: React.ForwardRefExoticComponent<
      MotionPropsExported &
        React.SVGAttributes<SVGCircleElement> &
        React.RefAttributes<SVGCircleElement>
    >;
    div: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLDivElement>
    >;
    footer: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLElement>
    >;
    form: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLFormElement>
    >;
    h1: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLHeadingElement>
    >;
    h2: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLHeadingElement>
    >;
    h3: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLHeadingElement>
    >;
    header: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLElement>
    >;
    img: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLImageElement>
    >;
    input: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLInputElement>
    >;
    label: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLLabelElement>
    >;
    li: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLLIElement>
    >;
    main: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLElement>
    >;
    nav: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLElement>
    >;
    p: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLParagraphElement>
    >;
    path: React.ForwardRefExoticComponent<
      MotionPropsExported &
        React.SVGAttributes<SVGPathElement> &
        React.RefAttributes<SVGPathElement>
    >;
    rect: React.ForwardRefExoticComponent<
      MotionPropsExported &
        React.SVGAttributes<SVGRectElement> &
        React.RefAttributes<SVGRectElement>
    >;
    section: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLElement>
    >;
    select: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLSelectElement>
    >;
    span: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLSpanElement>
    >;
    svg: React.ForwardRefExoticComponent<
      MotionPropsExported &
        React.SVGAttributes<SVGSVGElement> &
        React.RefAttributes<SVGSVGElement>
    >;
    textarea: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLTextAreaElement>
    >;
    ul: React.ForwardRefExoticComponent<
      HTMLMotionPropsExported & React.RefAttributes<HTMLUListElement>
    >;
  };

  export const m: typeof motion;

  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    custom?: any;
    initial?: boolean;
    mode?: 'sync' | 'wait' | 'popLayout';
    onExitComplete?: () => void;
    presenceAffectsLayout?: boolean;
  }>;

  export const LazyMotion: React.FC<{
    children?: React.ReactNode;
    features: any;
    strict?: boolean;
  }>;

  export const domAnimation: any;
  export const domMax: any;

  export function useAnimation(): any;
  export function useAnimationFrame(callback: (time: number, delta: number) => void): void;
  export function useDragControls(): any;
  export function useInView(ref: React.RefObject<Element>, options?: any): boolean;
  export function useMotionValue<T>(initial: T): any;
  export function useReducedMotion(): boolean | null;
  export function useScroll(options?: any): any;
  export function useSpring(value: any, config?: any): any;
  export function useTransform<I, O>(value: any, input: I[], output: O[]): any;
}
