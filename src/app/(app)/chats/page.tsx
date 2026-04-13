import { ChatsPage } from '@/components/pages/chats';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading chats...</div>}>
      <ChatsPage />
    </Suspense>
  );
}
