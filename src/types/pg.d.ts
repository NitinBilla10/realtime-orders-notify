declare module 'pg' {
  export interface Notification {
    channel: string;
    payload?: string;
  }

  export interface ClientConfig {
    connectionString?: string;
  }

  export class Client {
    constructor(config?: ClientConfig);
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'notification', listener: (msg: Notification) => void): this;
    connect(): Promise<void>;
    query(queryText: string): Promise<unknown>;
    end(): Promise<void>;
  }
}