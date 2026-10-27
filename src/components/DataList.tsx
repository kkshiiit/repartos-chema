import type { Ref } from 'react';
import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
export function DataList<T>(props: FlashListProps<T> & { ref?: Ref<FlashListRef<T>> }) {
  return <FlashList {...props} />;
}
