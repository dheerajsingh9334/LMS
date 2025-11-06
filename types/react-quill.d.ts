declare module 'react-quill/dist/quill.snow.css' {
  const css: string;
  export default css;
}

declare module 'react-quill' {
  import { ComponentType } from 'react';
  
  interface ReactQuillProps {
    theme?: string;
    value?: string;
    onChange?: (content: string, delta?: any, source?: string, editor?: any) => void;
    modules?: any;
    formats?: string[];
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
  }
  
  const ReactQuill: ComponentType<ReactQuillProps>;
  export default ReactQuill;
}