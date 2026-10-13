import { useTheme } from '../context/ThemeContext';
import { statusColor } from '../theme/tokens';
import { View, Text } from 'react-native';
import type { ObraCard } from '../types';
import { obraStatus } from '../domain/rules';
export function StatusChip({ obra }: { obra: ObraCard }) {
  const { colors } = useTheme();
  const status = obraStatus(obra);
  const color = statusColor(status.key, colors);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 7,
        backgroundColor: `${color}16`,
        paddingHorizontal: 9,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: color }}>{status.label}</Text>
    </View>
  );
}
