"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const InitialPageEntrance = createContext(true);

/** Hero entrances belong to the initial document; the signature has its own lifecycle. */
export function PageEntranceProvider({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  const [initialRoute, setInitialRoute] = useState<string | null>(routeKey);
  if (initialRoute !== null && initialRoute !== routeKey) {
    // Update before rendering the destination, including components whose
    // effects or motion imports finish after the transition has disappeared.
    // Never reset on Back/Forward to the originally loaded route.
    setInitialRoute(null);
  }

  return (
    <InitialPageEntrance.Provider value={initialRoute === routeKey}>
      {children}
    </InitialPageEntrance.Provider>
  );
}

export function useInitialPageEntrance() {
  return useContext(InitialPageEntrance);
}
