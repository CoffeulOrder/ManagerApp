import { Redirect } from 'expo-router';

import { useApp } from '@/context/app-context';

export default function Index() {
  const { merchant, currentStoreId } = useApp();

  if (!merchant) return <Redirect href="/login" />;
  if (!currentStoreId) return <Redirect href="/store-select" />;
  return <Redirect href="/dashboard" />;
}
