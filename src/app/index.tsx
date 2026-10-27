import { Redirect } from 'expo-router';

import { useApp } from '@/context/app-context';

export default function Index() {
  const { account } = useApp();

  return <Redirect href={account ? '/dashboard' : '/login'} />;
}
