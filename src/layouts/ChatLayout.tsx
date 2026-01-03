import type { Component, JSX } from 'solid-js';
import type { LayoutConfig } from '../types';
import { cn } from '../lib/utils';

interface ChatLayoutProps {
  layout: LayoutConfig;
  theme: 'light' | 'dark';
  children: JSX.Element;
  backgroundImage?: string;
  backgroundColor?: string;
  maxWidth?: string;
}

export const ChatLayout: Component<ChatLayoutProps> = (props) => {
  const colors = () => props.theme === 'light' ? props.layout.lightColors : props.layout.darkColors;
  
  const containerStyles = () => {
    const styles: Record<string, string> = {
      'background-color': props.backgroundColor || colors().background,
      'font-family': props.layout.fontFamily,
      color: colors().sentText,
    };
    
    if (props.backgroundImage) {
      styles['background-image'] = `url(${props.backgroundImage})`;
      styles['background-size'] = 'cover';
      styles['background-position'] = 'center';
    }
    
    return styles;
  };
  
  return (
    <div
      class={cn(
        'flex flex-col h-full w-full overflow-hidden',
        'transition-colors duration-200'
      )}
      style={containerStyles()}
      data-layout={props.layout.id}
      data-theme={props.theme}
    >
      {props.children}
    </div>
  );
};
