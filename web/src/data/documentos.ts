// Documentos descargables del portal (archivos en web/public/docs). Tamaños en bytes,
// medidos sobre los archivos publicados.
export interface DocumentoPortal {
  id: 'acuerdos' | 'guia';
  nombre: string;
  fecha: string;
  archivo: string;
  bytes: number;
  propuesta?: boolean;
}

export const DOCUMENTOS: DocumentoPortal[] = [
  {
    id: 'acuerdos',
    nombre: 'Mesa de Cóndores · Acuerdos Generales',
    fecha: 'Diciembre de 2025',
    archivo: 'docs/acuerdos_generales_mesa_condores_2025-12.pdf',
    bytes: 87061,
  },
  {
    id: 'guia',
    nombre: 'Guía Técnica de Buenas Prácticas (propuesta)',
    fecha: 'Sin fecha (borrador)',
    archivo: 'docs/guia_buenas_practicas_propuesta.pdf',
    bytes: 108491,
    propuesta: true,
  },
];

export const docUrl = (id: DocumentoPortal['id']): string => {
  const d = DOCUMENTOS.find((x) => x.id === id);
  return `${import.meta.env.BASE_URL}${d ? d.archivo : ''}`;
};
