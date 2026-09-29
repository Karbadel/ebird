import { goToVisor } from '../../lib/nav';
import { docUrl } from '../../data/documentos';

// Contenido tomado de «Mesa de Cóndores · Acuerdos Generales» (Ministerio de Energía,
// Unidad de Proyectos y Medio Ambiente, División de Desarrollo de Proyectos, diciembre de 2025).
const OBJETIVOS_ESPECIFICOS: string[] = [
  'Trabajar mediante la colaboración técnica, científica y estratégica entre actores públicos y privados.',
  'Promover buenas prácticas que permitan una mejora continua en las gestiones necesarias para el cuidado y la protección del cóndor.',
  'Impulsar un compromiso conjunto por la coexistencia segura entre el desarrollo de la energía eólica, el cuidado y la protección del cóndor.',
];

const TEMAS_SESIONES: string[] = [
  'Las características que hacen que el cóndor sea particularmente vulnerable a la infraestructura eólica y de transmisión.',
  'Las acciones apropiadas para reducir las colisiones.',
  'La experiencia internacional.',
  'La experiencia de proyectos desarrollados en Chile en los que han aplicado medidas excepcionales para evitar este tipo de situaciones.',
];

const PASOS_2026: string[] = [
  'Un diagnóstico, elaborado entre todos los integrantes de la Mesa a partir de la información voluntariamente entregada por los adherentes, que permitirá caracterizar los desafíos a abordar.',
  'Una propuesta de acciones y prácticas factibles de implementar por parte de las empresas adherentes.',
  'Un Plan de Trabajo detallado para el 2026 que permita avanzar en los objetivos del acuerdo.',
];

export default function ComitePage() {
  return (
    <section className="wrap page">
      <a className="back-link" href="#visor" onClick={(e) => { e.preventDefault(); goToVisor(); }}>← Volver al visor</a>
      <div className="shead">
        <h2>Comité Técnico</h2>
      </div>
      <p className="text-muted cap-nota">
        Trabajo de la Mesa de Cóndores, instancia público-privada convocada por el Ministerio de
        Energía: sesiones, acuerdos y actividades previstas. Fuente: Mesa de Cóndores, Acuerdos
        Generales, diciembre de 2025.
      </p>

      <h3>Reuniones</h3>
      <div className="page-text">
        <p>
          Se realizaron <strong>6 sesiones de trabajo</strong>, en las que se revisaron:
        </p>
        <ul className="guia-cuerpo-ul">
          {TEMAS_SESIONES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="text-muted">
          Detalle de sesiones (fechas, actas y presentaciones) pendiente: el documento de acuerdos
          no lo incluye.
        </p>
      </div>

      <h3>Acuerdos</h3>
      <div className="page-text">
        <p className="text-muted">
          Acuerdos Generales · Diciembre de 2025. El documento propone un marco de acuerdos
          generales no vinculantes entre los participantes de la Mesa.
        </p>
        <h4 className="guia-h">1. Visión: por un viento que impulse la energía y proteja al cóndor</h4>
        <p>
          Los integrantes de la Mesa comparten una visión de futuro donde se compatibiliza el
          desarrollo de los proyectos de energía con el cuidado y la protección del cóndor.
        </p>
        <h4 className="guia-h">2. Objetivo general</h4>
        <p>
          Avanzar en el desarrollo de acciones y prácticas efectivas para compatibilizar los
          proyectos de energía con el cuidado y protección del cóndor.
        </p>
        <h4 className="guia-h">3. Objetivos específicos</h4>
        <ol className="guia-cuerpo-ul">
          {OBJETIVOS_ESPECIFICOS.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ol>
        <h4 className="guia-h">4. Base del trabajo: información para la toma de decisiones</h4>
        <p>
          Se elaborará una base de información que será construida con los antecedentes que los
          adherentes pongan a disposición, asegurando su acceso para todos los participantes.
        </p>
        <p>
          Esta información podrá incluir los datos de los proyectos de energía, estudios sobre
          cóndores, registro de colisiones, análisis de efectividad de medidas aplicadas, registro
          de monitoreos y otras medidas establecidas en las Resoluciones de Calificación Ambiental
          («RCA»), acciones implementadas de forma adicional y/o voluntaria y cualquier otro tipo
          de información pública que pueda orientar el trabajo de los participantes de la Mesa
          adheridos al acuerdo.
        </p>
        <p>
          Respecto al tratamiento de la información que se comparta en la mesa, esta será tratada
          bajo los siguientes parámetros: toda información que sea expuesta en la mesa será de
          carácter público.
        </p>
        <p>
          <a className="btn btn-secondary cap-dl" href={docUrl('acuerdos')} download>
            Descargar Acuerdos Generales (PDF)
          </a>
        </p>
      </div>

      <h3>Actividades / Agenda</h3>
      <div className="page-text">
        <p>
          <strong>Actividades 2026.</strong> Una vez suscrito el acuerdo se elaborará, entre todos
          los integrantes de la Mesa:
        </p>
        <ol className="guia-cuerpo-ul">
          {PASOS_2026.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ol>
        <p className="text-muted">Las fechas de estas actividades aún no están definidas en el documento.</p>
      </div>
    </section>
  );
}
