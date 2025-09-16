'use client';
import { useEffect, useState } from 'react';

interface MiniKitReadyWrapperProps {
  children: React.ReactNode;
}

export function MiniKitReadyWrapper({ children }: MiniKitReadyWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p>Loading PoEP...</p>
      </div>
    </div>
  );
}