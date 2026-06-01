export type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private static singleton: EventBus | null = null;
  private listeners = new Map<string, Set<EventHandler>>();

  public static get instance(): EventBus {
    if (!EventBus.singleton) {
      EventBus.singleton = new EventBus();
    }
    return EventBus.singleton;
  }

  public on<T = unknown>(eventName: string, handler: EventHandler<T>): () => void {
    const handlers = this.listeners.get(eventName) ?? new Set<EventHandler>();
    handlers.add(handler as EventHandler);
    this.listeners.set(eventName, handlers);
    return () => this.off(eventName, handler);
  }

  public once<T = unknown>(eventName: string, handler: EventHandler<T>): () => void {
    const unsubscribe = this.on<T>(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  public off<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }
    handlers.delete(handler as EventHandler);
    if (handlers.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  public emit<T = unknown>(eventName: string, payload?: T): void {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }
    for (const handler of Array.from(handlers)) {
      handler(payload as T);
    }
  }

  public clear(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
      return;
    }
    this.listeners.clear();
  }
}

export const eventBus = EventBus.instance;

