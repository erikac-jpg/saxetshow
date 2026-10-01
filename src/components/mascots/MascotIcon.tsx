import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Season } from '../../util/season';

/** Tone-on-tone seasonal mascot line art, viewBox 0 0 200 200, white on whatever sits behind it. */
export default function MascotIcon({ season, size = 130, color = '#F7F6F2', accent = '#B3242F' }: {
  season: Season;
  size?: number;
  color?: string;
  accent?: string;
}) {
  switch (season) {
    case 'deer':
      return (
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <G fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M84,98 C80,70 68,50 50,38" />
            <Path d="M68,62 L54,52" />
            <Path d="M60,76 L44,70" />
            <Path d="M53,90 L36,88" />
            <Path d="M116,98 C120,70 132,50 150,38" />
            <Path d="M132,62 L146,52" />
            <Path d="M140,76 L156,70" />
            <Path d="M147,90 L164,88" />
          </G>
          <Path d="M80,108 C64,100 50,100 40,108 C54,110 66,116 78,124 Z" fill={color} />
          <Path d="M120,108 C136,100 150,100 160,108 C146,110 134,116 122,124 Z" fill={color} />
          <Path
            d="M100,104 C82,104 70,120 69,140 C68,158 76,176 100,180 C124,176 132,158 131,140 C130,120 118,104 100,104 Z"
            fill={color}
          />
          <Ellipse cx={86} cy={140} rx={3.2} ry={4} fill="#0C2D57" />
          <Ellipse cx={114} cy={140} rx={3.2} ry={4} fill="#0C2D57" />
          <Ellipse cx={100} cy={170} rx={7} ry={5} fill="#0C2D57" />
        </Svg>
      );
    case 'turkey':
      return (
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <G fill={color}>
            <Ellipse cx={118} cy={48} rx={9} ry={46} rotation={-60} origin={[118, 118]} />
            <Ellipse cx={118} cy={48} rx={9} ry={46} rotation={-40} origin={[118, 118]} />
            <Ellipse cx={118} cy={48} rx={9} ry={46} rotation={-20} origin={[118, 118]} />
            <Ellipse cx={118} cy={48} rx={9} ry={46} />
            <Ellipse cx={118} cy={48} rx={9} ry={46} rotation={20} origin={[118, 118]} />
            <Ellipse cx={118} cy={48} rx={9} ry={46} rotation={40} origin={[118, 118]} />
            <Ellipse cx={118} cy={48} rx={9} ry={46} rotation={60} origin={[118, 118]} />
          </G>
          <Ellipse cx={118} cy={148} rx={34} ry={27} fill={color} />
          <Path
            d="M86,140 C70,133 62,118 66,106 C69,97 80,95 86,103 C94,113 92,129 86,140 Z"
            fill={color}
          />
          <Path d="M67,108 Q57,110 59,123" stroke={accent} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M65,104 L53,106 L65,112 Z" fill={accent} />
          <Circle cx={76} cy={103} r={2.6} fill="#0C2D57" />
          <Path d="M105,174 L102,190 M130,174 L133,190" stroke={color} strokeWidth={5} strokeLinecap="round" />
        </Svg>
      );
    case 'hog':
      return (
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Path d="M160,112 Q176,100 170,84" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path
            d="M70,96 L76,78 L84,94 M90,88 L97,70 L105,87 M111,85 L118,66 L126,84"
            fill={color}
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M30,112 C30,95 48,84 75,84 C110,84 150,90 168,104 C178,112 178,126 166,134 C140,148 90,150 55,142 C38,138 30,126 30,112 Z"
            fill={color}
          />
          <Path
            d="M34,128 C18,126 6,118 4,106 C3,98 10,92 20,94 C34,97 42,110 46,122 Z"
            fill={color}
          />
          <Rect x={2} y={98} width={14} height={12} rx={3} fill={color} />
          <Path d="M14,110 C8,116 6,122 10,128" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M30,96 L24,78 L44,90 Z" fill={color} />
          <Circle cx={28} cy={104} r={3.2} fill="#0C2D57" />
          <Path
            d="M60,146 L57,170 M88,150 L86,174 M122,150 L124,174 M150,142 L154,166"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'dove':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Path
            d="M30,120 Q55,108 90,112 Q125,105 155,118 Q140,128 110,130 Q75,133 48,128 Q36,126 30,120 Z"
            fill={color}
          />
          <Path
            d="M95,112 C80,75 45,50 12,45 C40,60 62,80 75,106 C58,96 36,93 20,98 C42,101 63,108 80,118 Z"
            fill={color}
          />
          <Path d="M32,121 L6,112 L30,132 Z" fill={color} />
          <Path d="M34,126 L12,135 L36,135 Z" fill={color} />
          <Circle cx={150} cy={117} r={11} fill={color} />
          <Path d="M160,117 L174,112 L162,124 Z" fill={accent} />
          <Circle cx={152} cy={113} r={2.6} fill="#0C2D57" />
        </Svg>
      );
  }
}
