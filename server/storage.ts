// The app uses localStorage on the frontend for data persistence.
// This interface remains empty but satisfies any basic server imports if needed.

export interface IStorage {}
export class MemStorage implements IStorage {}
export const storage = new MemStorage();
