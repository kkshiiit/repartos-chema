import { View, Text, Pressable } from 'react-native';
import { usePathname } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { adProvider, sponsor, useAds } from '../context/AdsContext';
import { adPlacementAllowed } from '../services/adsPolicy';
import { openLink } from '../services/links';
import { AdMobBanner } from './AdMobBanner';
import { C, s } from './ui';
export function AdSlot() {
  const path = usePathname(),
    { enabled } = useAds();
  if (!enabled || !adPlacementAllowed(path)) return null;
  if (adProvider === 'admob') return <AdMobBanner />;
  if (adProvider !== 'sponsor' || !sponsor.url) return null;
  return (
    <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderColor: C.line }}>
      <Text style={{ color: C.subtle, fontSize: 10, marginBottom: 6 }}>
        Publicidad · Patrocinio
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Visitar ${sponsor.name}. Abre un sitio externo.`}
        onPress={() => void openLink(sponsor.url!).catch(() => undefined)}
        style={[s.row, { minHeight: 50, padding: 12, borderRadius: 10, backgroundColor: C.panel }]}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>{sponsor.name}</Text>
          <Text style={{ color: C.subtle, fontSize: 11 }} numberOfLines={2}>
            {sponsor.text}
          </Text>
        </View>
        <ExternalLink size={16} color={C.subtle} />
      </Pressable>
    </View>
  );
}
