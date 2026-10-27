import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../theme/tokens';
import { moveTripStop, reconcileTripSequence, type TripStop } from '../domain/tripOrder';
import { userError } from '../services/errors';
import { Button, Notice, Sheet, useUI } from './ui';
import type { SharedValue } from 'react-native-reanimated';

type CellProps = {
  item: string;
  children?: React.ReactNode;
  onLayout?: (event: import('react-native').LayoutChangeEvent) => void;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
};
const CellsContext = createContext<{
  active: SharedValue<string>;
  register: (id: string, layout: { y: number; height: number }) => void;
  unregister: (id: string) => void;
} | null>(null);
function OrderCell(props: CellProps) {
  const context = useContext(CellsContext),
    active = context?.active;
  const id = props.item;
  const style = useAnimatedStyle(() => ({ zIndex: active?.get() === id ? 100 : 0 }));
  useEffect(() => () => context?.unregister(id), [context, id]);
  return (
    <Animated.View
      style={[props.style, style]}
      onLayout={(event) => {
        context?.register(props.item, event.nativeEvent.layout);
        props.onLayout?.(event);
      }}
    >
      {props.children}
    </Animated.View>
  );
}

function OrderRow({
  stop,
  index,
  total,
  onPosition,
  onMove,
  onBegin,
  onDrop,
  onFinish,
  edge,
  top,
  bottom,
  active,
}: {
  stop: TripStop;
  index: number;
  total: number;
  onPosition: (id: string) => void;
  onMove: (id: string, position: number) => void;
  onBegin: (id: string) => void;
  onDrop: (id: string, dy: number) => void;
  onFinish: () => void;
  active: SharedValue<string>;
  edge: SharedValue<number>;
  top: SharedValue<number>;
  bottom: SharedValue<number>;
}) {
  const { C, s } = useUI();
  const { motionEnabled } = useTheme();
  const dy = useSharedValue(0),
    dragging = useSharedValue(false);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: dy.get() }],
    zIndex: dragging.get() ? 100 : 0,
    opacity: dragging.get() ? 0.92 : 1,
  }));
  const id = stop.id;
  const gesture = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      active.set(id);
      dragging.set(true);
      scheduleOnRN(onBegin, id);
    })
    .onUpdate((event) => {
      dy.set(event.translationY);
      edge.set(event.absoluteY < top.get() + 52 ? -1 : event.absoluteY > bottom.get() - 52 ? 1 : 0);
    })
    .onEnd((event) => {
      edge.set(0);
      scheduleOnRN(onDrop, id, event.translationY);
    })
    .onFinalize(() => {
      edge.set(0);
      if (active.get() === id) active.set('');
      dragging.set(false);
      dy.set(withTiming(0, { duration: motionEnabled ? 110 : 0 }));
      scheduleOnRN(onFinish);
    });
  return (
    <Animated.View
      style={[
        animated,
        { backgroundColor: C.panel, borderBottomColor: C.hairline, borderBottomWidth: 1 },
      ]}
    >
      <View style={[s.row, { gap: 8, paddingVertical: 10, paddingHorizontal: 4 }]}>
        <GestureDetector gesture={gesture}>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`Ordenar ${stop.obra.clienteNombre}`}
            accessibilityHint="Mantené el agarre y arrastrá. También podés elegir la posición."
            accessibilityValue={{
              min: 1,
              max: total,
              now: index + 1,
              text: `Posición ${index + 1} de ${total}`,
            }}
            accessibilityActions={[
              { name: 'increment', label: 'Mover hacia abajo' },
              { name: 'decrement', label: 'Mover hacia arriba' },
            ]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment' && index + 1 < total)
                onMove(stop.id, index + 2);
              if (event.nativeEvent.actionName === 'decrement' && index > 0) onMove(stop.id, index);
            }}
            style={{ minWidth: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}
          >
            <GripVertical size={24} color={C.muted} />
          </View>
        </GestureDetector>
        <View style={[s.grow, { gap: 3 }]}>
          <Text style={s.label}>{stop.obra.clienteNombre}</Text>
          <Text style={s.muted}>{stop.obra.direccion}</Text>
          <Text style={s.muted}>
            {stop.task === 'RETIRE' ? 'Retiro' : 'Entrega'} · {stop.obra.localidadBarrio}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Elegir posición de ${stop.obra.clienteNombre}`}
          onPress={() => onPosition(stop.id)}
          style={{
            minWidth: 64,
            minHeight: 48,
            padding: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            backgroundColor: C.panel2,
          }}
        >
          <Text style={[s.label, { fontVariant: ['tabular-nums'], fontFamily: fonts.monoMedium }]}>
            {index + 1}
          </Text>
          <Text style={[s.muted, { fontSize: 12 }]}>Posición</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function OrderEditorSession({
  visible,
  stops,
  revision,
  onClose,
  onSave,
}: {
  visible: boolean;
  stops: TripStop[];
  revision: number;
  onClose: () => void;
  onSave: (orderedVisibleIds: string[]) => Promise<void>;
}) {
  const { s } = useUI();
  const list = useRef<FlatList<string>>(null),
    viewport = useRef<View>(null);
  const [draftIds, setDraft] = useState<string[]>(() => stops.map((s) => s.id)),
    [positionId, setPositionId] = useState<string | null>(null),
    [position, setPosition] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [openedRevision] = useState(revision);
  const eligibilityKey = stops.map((s) => s.id).join('|');
  const [previousEligibility, setPreviousEligibility] = useState(eligibilityKey);
  const draft = reconcileTripSequence(
    draftIds,
    stops.map((s) => s.id),
  );
  if (previousEligibility !== eligibilityKey) {
    // Persist reconciliation in the draft itself: a later reopening is a new stop, not an old position.
    setPreviousEligibility(eligibilityKey);
    setDraft(draft);
  }
  const changed =
    revision === openedRevision
      ? ''
      : 'Los alquileres cambiaron. Actualizamos las paradas; revisá el orden antes de guardar.';
  const latest = useRef(stops);
  const draftRef = useRef(draft);
  useLayoutEffect(() => {
    latest.current = stops;
    draftRef.current = draft;
  }, [stops, draft]);
  const offset = useRef(0),
    dragOffset = useRef(0),
    dragTop = useRef(0),
    dragHeight = useRef(0),
    interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const layouts = useRef(new Map<string, { y: number; height: number }>());
  const active = useSharedValue('');
  const edge = useSharedValue(0),
    top = useSharedValue(0),
    bottom = useSharedValue(0);
  const byId = useMemo(() => new Map(stops.map((v) => [v.id, v])), [stops]);
  const stopAuto = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
  }, []);
  const auto = useCallback(
    (direction: number) => {
      stopAuto();
      if (!direction) return;
      interval.current = setInterval(() => {
        const next = Math.max(0, offset.current + direction * 26);
        list.current?.scrollToOffset({ offset: next, animated: false });
      }, 70);
    },
    [stopAuto],
  );
  useAnimatedReaction(
    () => edge.get(),
    (value, previous) => {
      if (value !== previous) scheduleOnRN(auto, value);
    },
  );
  useEffect(() => {
    if (!visible) stopAuto();
    return stopAuto;
  }, [visible, stopAuto]);
  const announce = (id: string, next: string[]) =>
    AccessibilityInfo.announceForAccessibility(
      `${latest.current.find((s) => s.id === id)?.obra.clienteNombre || 'Parada'}, posición ${next.indexOf(id) + 1} de ${next.length}`,
    );
  const move = (id: string, value: number) => {
    try {
      const next = moveTripStop(draftRef.current, id, value);
      setDraft(next);
      announce(id, next);
      setError('');
    } catch (e) {
      setError(userError(e));
    }
  };
  const applyPosition = () => {
    if (
      !positionId ||
      !/^\d+$/.test(position) ||
      !Number.isSafeInteger(Number(position)) ||
      Number(position) < 1 ||
      Number(position) > draft.length
    ) {
      setError(`Elegí una posición entera entre 1 y ${draft.length}.`);
      return;
    }
    move(positionId, Number(position));
    setPositionId(null);
  };
  const begin = (id: string) => {
    const layout = layouts.current.get(id);
    dragOffset.current = offset.current;
    dragTop.current = layout?.y ?? 0;
    dragHeight.current = layout?.height ?? 72;
  };
  const drop = (id: string, delta: number) => {
    stopAuto();
    const center =
      dragTop.current + dragHeight.current / 2 + delta + offset.current - dragOffset.current;
    const known = draftRef.current.flatMap((key, index) => {
      const l = layouts.current.get(key);
      return l ? [{ key, index, distance: Math.abs(l.y + l.height / 2 - center) }] : [];
    });
    known.sort((a, b) => a.distance - b.distance);
    if (known[0]) move(id, known[0].index + 1);
  };
  const register = useCallback((id: string, layout: { y: number; height: number }) => {
    layouts.current.set(id, layout);
  }, []);
  const unregister = useCallback((id: string) => {
    layouts.current.delete(id);
  }, []);
  const cells = useMemo(() => ({ active, register, unregister }), [active, register, unregister]);
  const measure = () =>
    viewport.current?.measureInWindow((_x, y, _width, height) => {
      top.set(y);
      bottom.set(y + height);
    });
  return (
    <Sheet visible={visible} title="Cambiar orden" onClose={onClose} busy={busy} scroll={false}>
      <View style={{ flex: 1, minHeight: 220, gap: 12 }}>
        <Text style={s.muted}>
          Arrastrá desde el agarre o tocá «Posición». Sólo cambia el orden de las paradas visibles.
        </Text>
        {changed ? <Notice text={changed} /> : null}
        {error ? <Notice text={error} tone="error" /> : null}
        {positionId ? (
          <View style={[s.card, { gap: 8 }]}>
            <Text style={s.label}>Posición de {byId.get(positionId)?.obra.clienteNombre}</Text>
            <TextInput
              accessibilityLabel="Nueva posición"
              keyboardType="number-pad"
              returnKeyType="done"
              value={position}
              onChangeText={setPosition}
              style={[s.input, { fontFamily: fonts.mono }]}
              onSubmitEditing={applyPosition}
            />
            <Button label="Aplicar posición" variant="secondary" onPress={applyPosition} />
          </View>
        ) : null}
        <View ref={viewport} onLayout={measure} style={{ flex: 1, minHeight: 120 }}>
          <CellsContext.Provider value={cells}>
            <FlatList
              ref={list}
              data={draft}
              keyExtractor={(id) => id}
              CellRendererComponent={OrderCell}
              onScroll={(event) => {
                offset.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={32}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              renderItem={({ item, index }) => {
                const stop = byId.get(item);
                return stop ? (
                  <OrderRow
                    stop={stop}
                    active={active}
                    index={index}
                    total={draft.length}
                    onPosition={(id) => {
                      setPositionId(id);
                      setPosition(String(draftRef.current.indexOf(id) + 1));
                    }}
                    onMove={move}
                    onBegin={begin}
                    onDrop={drop}
                    onFinish={stopAuto}
                    edge={edge}
                    top={top}
                    bottom={bottom}
                  />
                ) : null;
              }}
            />
          </CellsContext.Provider>
        </View>
        <Button
          label="Guardar orden"
          loading={busy}
          disabled={!draft.length}
          onPress={async () => {
            setBusy(true);
            setError('');
            try {
              await onSave(
                reconcileTripSequence(
                  draft,
                  latest.current.map((s) => s.id),
                ),
              );
              onClose();
            } catch (e) {
              setError(userError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button label="Cancelar" variant="secondary" disabled={busy} onPress={onClose} />
      </View>
    </Sheet>
  );
}

export function TripOrderEditor(props: {
  visible: boolean;
  stops: TripStop[];
  revision: number;
  onClose: () => void;
  onSave: (orderedVisibleIds: string[]) => Promise<void>;
}) {
  const [session, setSession] = useState({ key: 0, visible: props.visible });
  if (session.visible !== props.visible)
    setSession({ key: session.key + (props.visible ? 1 : 0), visible: props.visible });
  // Keep the closing session mounted for Sheet's exit transition. A new opening gets a fresh draft.
  return <OrderEditorSession key={session.key} {...props} />;
}
