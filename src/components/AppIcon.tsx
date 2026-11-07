import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

export type IconName = 'camera' | 'locationPin' | 'calendar' | 'star' | 'ticket' | 'person' | 'shield';

/**
 * A small custom icon set, drawn as single-stroke line art rather than
 * emoji or a generic flat-fill icon library - keeps the same restrained,
 * engraved-document feel as the rest of the brand. `star` is the one
 * exception: a solid fill, since it stands in for the decorative badge
 * mark on navy hero banners, not a functional UI glyph.
 */
export default function AppIcon({
  name,
  size = 20,
  color = '#1C1C1C',
  strokeWidth = 1.6,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}) {
  switch (name) {
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M9,7 L10,4.5 L16,4.5 L17,7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Rect
            x={2.5}
            y={7}
            width={19}
            height={13}
            rx={1.5}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Circle cx={12} cy={14} r={4.2} stroke={color} strokeWidth={strokeWidth} />
          <Circle cx={12} cy={14} r={1} fill={color} />
        </Svg>
      );
    case 'locationPin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M12,2 C8,2 5,4.9 5,8.8 C5,13.8 12,22 12,22 C12,22 19,13.8 19,8.8 C19,4.9 16,2 12,2 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={8.8} r={2.4} stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect
            x={3}
            y={5}
            width={18}
            height={16}
            rx={1.5}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Line x1={3} y1={9.5} x2={21} y2={9.5} stroke={color} strokeWidth={strokeWidth} />
          <Line x1={8} y1={3} x2={8} y2={7} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1={16} y1={3} x2={16} y2={7} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'ticket':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M3,8 C4.1,8 5,7.1 5,6 L19,6 C19,7.1 19.9,8 21,8 L21,10 C19.9,10 19,10.9 19,12 C19,13.1 19.9,14 21,14 L21,16 C19.9,16 19,16.9 19,18 L5,18 C5,16.9 4.1,16 3,16 L3,14 C4.1,14 5,13.1 5,12 C5,10.9 4.1,10 3,10 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Line
            x1={13.5}
            y1={7.5}
            x2={13.5}
            y2={16.5}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray="1.8,1.8"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'person':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx={12} cy={7.5} r={4} stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M4,21 C4,16.3 7.6,13.5 12,13.5 C16.4,13.5 20,16.3 20,21"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M12,2.5 L19.5,5.5 L19.5,11.5 C19.5,16.5 16.3,19.9 12,21.5 C7.7,19.9 4.5,16.5 4.5,11.5 L4.5,5.5 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path
            d="M8.7,12 L10.8,14.1 L15.3,9.3"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'star':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M12.0,2.0 L14.29,8.84 L21.51,8.91 L15.71,13.21 L17.88,20.09 L12.0,15.9 L6.12,20.09 L8.29,13.21 L2.49,8.91 L9.71,8.84 Z"
            fill={color}
          />
        </Svg>
      );
  }
}
