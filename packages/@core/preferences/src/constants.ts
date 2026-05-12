import type { BuiltinThemeType, TimezoneOption } from '@vben-core/typings';

interface BuiltinThemePreset {
  color: string;
  darkPrimaryColor?: string;
  primaryColor?: string;
  type: BuiltinThemeType;
}

const BUILT_IN_THEME_PRESETS: BuiltinThemePreset[] = [
  {
    color: 'hsl(212 100% 45%)',
    type: 'default',
  },
  {
    color: 'hsl(245 82% 67%)',
    type: 'violet',
  },
  {
    color: 'hsl(347 77% 60%)',
    type: 'pink',
  },
  {
    color: 'hsl(42 84% 61%)',
    type: 'yellow',
  },
  {
    color: 'hsl(231 98% 65%)',
    type: 'sky-blue',
  },
  {
    color: 'hsl(161 90% 43%)',
    type: 'green',
  },
  {
    color: 'hsl(240 5% 26%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'zinc',
  },

  {
    color: 'hsl(181 84% 32%)',
    type: 'deep-green',
  },

  {
    color: 'hsl(211 91% 39%)',
    type: 'deep-blue',
  },
  {
    color: 'hsl(18 89% 40%)',
    type: 'orange',
  },
  {
    color: 'hsl(0 75% 42%)',
    type: 'rose',
  },

  {
    color: 'hsl(0 0% 25%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'neutral',
  },
  {
    color: 'hsl(215 25% 27%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'slate',
  },
  {
    color: 'hsl(217 19% 27%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'gray',
  },
  {
    color: '',
    type: 'custom',
  },
];

/**
 * 时区选项
 */
const DEFAULT_TIME_ZONE_OPTIONS: TimezoneOption[] = [
  {
    offset: 8,
    timezone: 'Asia/Shanghai',
    label: '中国 (UTC+8)',
  },
  {
    offset: 7,
    timezone: 'Asia/Bangkok',
    label: '泰国 (UTC+7)',
  },
  {
    offset: 7,
    timezone: 'Asia/Ho_Chi_Minh',
    label: '越南 (UTC+7)',
  },
  {
    offset: 8,
    timezone: 'Asia/Singapore',
    label: '新加坡 (UTC+8)',
  },
  {
    offset: 8,
    timezone: 'Asia/Kuala_Lumpur',
    label: '马来西亚 (UTC+8)',
  },
  {
    offset: 7,
    timezone: 'Asia/Jakarta',
    label: '印度尼西亚 (UTC+7)',
  },
  {
    offset: 8,
    timezone: 'Asia/Manila',
    label: '菲律宾 (UTC+8)',
  },
  {
    offset: 7,
    timezone: 'Asia/Phnom_Penh',
    label: '柬埔寨 (UTC+7)',
  },
];

export const COLOR_PRESETS = [...BUILT_IN_THEME_PRESETS].slice(0, 7);

export { BUILT_IN_THEME_PRESETS, DEFAULT_TIME_ZONE_OPTIONS };

export type { BuiltinThemePreset };
