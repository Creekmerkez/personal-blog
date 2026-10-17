import { createContext, useContext } from 'react';

export const OrganizerContext = createContext(null);

/** Everything the screens need: data, update, settings, updateSettings, today. */
export function useOrganizer() {
  return useContext(OrganizerContext);
}
