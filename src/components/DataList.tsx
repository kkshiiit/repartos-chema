import { FlashList, FlashListProps } from '@shopify/flash-list';
export function DataList<T>(props: FlashListProps<T>) {
  return <FlashList {...props} />;
}
