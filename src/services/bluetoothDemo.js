// Servicio simulado (Modo Demo). Misma interfaz que el servicio real:
// acepta comandos, "conecta" tras 1 s y permite revisar toda la interfaz sin la lámpara.

const RETRASO_CONEXION_MS = 1000;
const RETRASO_BUSQUEDA_MS = 1500;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const DISPOSITIVOS_DEMO = [
  { address: 'DE:M0:00:00:00:01', name: 'Arrullú (demo)', emparejado: true },
  { address: 'DE:M0:00:00:00:02', name: 'Bocina Arrullú (demo)', emparejado: true },
];

export function crearServicioDemo() {
  let conectado = null;
  const oyentesDesconexion = new Set();

  return {
    esDemo: true,
    async estaDisponible() {
      return true;
    },
    async estaActivado() {
      return true;
    },
    async pedirActivar() {
      return true;
    },
    async listarEmparejados() {
      return DISPOSITIVOS_DEMO;
    },
    async buscarNuevos() {
      await esperar(RETRASO_BUSQUEDA_MS);
      return [{ address: 'DE:M0:00:00:00:03', name: 'HC-05 (demo)', emparejado: false }];
    },
    async cancelarBusqueda() {},
    async emparejar(address) {
      return { address };
    },
    async conectar(address) {
      await esperar(RETRASO_CONEXION_MS);
      const d = [...DISPOSITIVOS_DEMO, { address, name: 'HC-05 (demo)' }].find((x) => x.address === address);
      conectado = { address, name: d?.name || 'Arrullú (demo)' };
      return conectado;
    },
    async desconectar() {
      conectado = null;
    },
    async estaConectado() {
      return !!conectado;
    },
    async escribir(texto) {
      if (!conectado) throw new Error('Sin conexión con la lámpara');
      // Solo lo mostramos en consola para depurar
      console.log('[DEMO] →', JSON.stringify(texto));
      return true;
    },
    alDesconectarse(cb) {
      oyentesDesconexion.add(cb);
      return () => oyentesDesconexion.delete(cb);
    },
    alApagarBluetooth() {
      return () => {};
    },
    /** Solo en demo: simula una caída de la conexión (útil para probar el banner). */
    simularCaida() {
      conectado = null;
      oyentesDesconexion.forEach((cb) => cb());
    },
    liberar() {
      oyentesDesconexion.clear();
    },
  };
}
