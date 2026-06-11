declare module 'express' {
  export interface Request {
    params: Record<string, string>;
    body: unknown;
    method: string;
    originalUrl: string;
    path: string;
  }

  export interface Response<T = unknown> {
    status(code: number): Response<T>;
    json(body: T): void;
    on(event: 'finish', listener: () => void): Response<T>;
    statusCode: number;
  }

  export interface NextFunction {
    (err?: unknown): void;
  }

  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

  export interface Router {
    get(path: string, handler: RequestHandler): void;
    post(path: string, handler: RequestHandler): void;
    put(path: string, handler: RequestHandler): void;
    delete(path: string, handler: RequestHandler): void;
  }

  export interface Application {
    (req: unknown, res: unknown): void;
    use(...args: unknown[]): void;
    get(path: string, handler: RequestHandler): void;
    listen(port: number, callback?: () => void): void;
  }

  export interface ExpressStatic {
    json(): RequestHandler;
    urlencoded(options: { extended: boolean }): RequestHandler;
    static(path: string): RequestHandler;
  }

  export interface ExpressFactory {
    (): Application;
    json(): RequestHandler;
    urlencoded(options: { extended: boolean }): RequestHandler;
    static(path: string): RequestHandler;
    Router(): Router;
  }

  const express: ExpressFactory;
  export default express;
  export const Router: () => Router;
  export const json: () => RequestHandler;
  export const urlencoded: (options: { extended: boolean }) => RequestHandler;
  export const static: (path: string) => RequestHandler;
}