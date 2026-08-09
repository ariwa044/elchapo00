declare module "cloudflare:sockets" {
  export function connect(address: string, options?: Record<string, unknown>): any;
}
