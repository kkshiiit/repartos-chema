import { useLocalSearchParams } from 'expo-router';
import { ObraForm } from '../../src/components/ObraForm';
import { useInventory } from '../../src/context/InventoryContext';
import { Screen, Empty } from '../../src/components/ui';
export default function Edit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useInventory();
  const obra = state.obras.find((o) => o.id === id);
  return obra ? (
    <ObraForm obra={obra} />
  ) : (
    <Screen title="Editar obra" back>
      <Empty title="Obra no encontrada" detail="Vuelve al listado." />
    </Screen>
  );
}
