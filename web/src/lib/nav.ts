import { usePortalStore, type Tab } from '../store/usePortalStore';

/** Abre una pestaña del visor y lleva la vista al visor (menú superior,
 *  contadores de cabecera y tarjetas de «Explorar el portal»). Sin `tab`, solo
 *  desplaza hasta el visor sin cambiar de pestaña. */
export function goToVisor(tab?: Tab): void {
  if (tab) usePortalStore.getState().goToTab(tab);
  document.getElementById('visor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
