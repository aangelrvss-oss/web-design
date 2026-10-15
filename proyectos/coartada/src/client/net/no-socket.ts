// Stand-in for socket.io-client in the standalone demo, which never goes online.
export function io(): never {
  throw new Error('La demo de un solo móvil no se conecta a ningún servidor.');
}
export type Socket = never;
