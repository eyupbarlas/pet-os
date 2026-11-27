// Current pet as app state (ADR 0003). Not persisted yet: with one pet per household in this
// slice, the first pet is the right default after a restart.
import { create } from 'zustand';

interface CurrentPet { petId: string | null; setPetId: (id: string) => void }
export const useCurrentPetStore = create<CurrentPet>((set) => ({ petId: null, setPetId: (petId) => set({ petId }) }));

/** The chosen pet if it still exists, else the first one (mobile.md 2.4). */
export function useCurrentPet<P extends { id: string }>(pets: P[]): P | undefined {
  const petId = useCurrentPetStore((s) => s.petId);
  return pets.find((p) => p.id === petId) ?? pets[0];
}
