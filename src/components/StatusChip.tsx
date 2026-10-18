import { useTheme } from '../context/ThemeContext';
import { statusColor } from '../theme/tokens';
import { CheckCircle2, Clock, CircleAlert, Archive } from 'lucide-react-native';
import { View, Text } from 'react-native';
import type { ObraCard } from '../types';
import { obraStatus } from '../domain/rules';
export function StatusChip({ obra }: { obra: ObraCard }) {
  const { colors } = useTheme();
  const status = obraStatus(obra);
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
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Icon size={16} color={color} />
      <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '700', color: color }}>
        {status.label}
      </Text>
    </View>
  );
}
