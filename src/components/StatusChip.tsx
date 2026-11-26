import { useTheme } from '../context/ThemeContext';
import { statusColor } from '../theme/tokens';
import { CheckCircle2, Clock, CircleAlert, Archive } from 'lucide-react-native';
import { View, Text } from 'react-native';
import type { ObraCard } from '../types';
import { businessDate } from '../domain/rules';
import { obraPresentationStatus } from '../utils/listPresentation';
export function StatusChip({
  obra,
  compact = false,
  today = businessDate(),
}: {
  obra: ObraCard;
  compact?: boolean;
  today?: string;
}) {
  const { colors } = useTheme();
  const status = obraPresentationStatus(obra, today);
  const color = statusColor(status.key, colors);
  const Icon =
    status.key === 'VERDE'
      ? CheckCircle2
      : status.key === 'ROJO'
        ? CircleAlert
        : status.key === 'RETIRADO' || status.key === 'REINGRESADO'
          ? Archive
          : Clock;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 20,
        borderWidth: 0,
        borderColor: `${color}55`,
        backgroundColor: `${color}16`,
        paddingHorizontal: compact ? 9 : 10,
        paddingVertical: compact ? 3 : 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {!compact ? <Icon size={16} color={color} /> : null}
      <Text
        style={{
          fontSize: compact ? 13 : 14,
          lineHeight: compact ? 18 : 20,
          fontWeight: '700',
          color: color,
        }}
      >
        {status.label}
      </Text>
    </View>
  );
}
