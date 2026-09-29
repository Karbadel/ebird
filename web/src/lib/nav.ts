import { usePortalStore, type Page, type Tab } from '../store/usePortalStore';

/** Abre una pestaña del visor y lleva la vista al visor (menú superior,
 *  contadores de cabecera y tarjetas de «Explorar el portal»). Sin `tab`,
 *  mantiene la pestaña vigente y solo asegura que se muestre el visor (p. ej.
 *  al volver desde una página institucional). */
export function goToVisor(tab?: Tab): void {
  const s = usePortalStore.getState();
  s.goToTab(tab ?? s.tab);
  // Al inicio del documento: el visor queda completo bajo la cabecera, visible.
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/** Lleva la vista a una página institucional (o de vuelta al visor con
 *  `'visor'`) y desplaza al inicio de la página. */
export function goToPage(page: Page): void {
  usePortalStore.getState().goToPage(page);
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
