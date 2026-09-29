import { goToVisor } from '../../lib/nav';
import { docUrl } from '../../data/documentos';

// Presentación y objetivos: textuales de «Mesa de Cóndores · Acuerdos Generales»
// (diciembre de 2025).
const EMPRESAS = [
  'Acciona', 'AES Andes', 'Colbún', 'EDF', 'EDP Renewables Chile', 'Enel', 'Engie',
  'Ibereólica Cabo Leones II S.A.', 'Ibereólica', 'Innergex', 'OPDE', 'Pacific Hydro', 'Sonnedix', 'Statkraft',
];
const GREMIOS = [
  'Asociación Chilena de Energías Renovables y Almacenamiento (ACERA)',
  'Asociación de Generación Renovable (AGR)',
  'Generadoras de Chile AG',
];
const ONG = ['Aves Chile', 'Red de Observadores de Aves y Vida Silvestre de Chile (ROC)'];
const CONSULTORA = ['Bioamérica'];
const PUBLICAS = ['Ministerio del Medio Ambiente', 'Ministerio de Energía'];

const OBJETIVOS = [
  'Compartir y nivelar los conocimientos de los participantes de la mesa, sobre las características particulares del cóndor, desde su biología y rol ecológico y su vulnerabilidad frente a la infraestructura energética.',
  'Identificar las mejores acciones o prácticas disponibles para minimizar la afectación de los cóndores, que sean factibles de implementar en parques eólicos y la infraestructura de transmisión asociada.',
  'Difundir los resultados de la Mesa, previo acuerdo de todos los actores participantes.',
];

function Participantes({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div className="qs-grupo">
      <h4 className="guia-h">{titulo} <span className="lyr-n">({items.length})</span></h4>
      <ul className="guia-cuerpo-ul">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export default function QuienesPage() {
  return (
    <section className="wrap page">
      <a className="back-link" href="#visor" onClick={(e) => { e.preventDefault(); goToVisor(); }}>← Volver al visor</a>
      <div className="shead">
        <h2>Quiénes Somos</h2>
      </div>

      <h3>La Mesa de Cóndores</h3>
      <div className="page-text">
        <p>
          El cóndor andino es Monumento Natural y especie emblemática de Chile que, en la
          actualidad, se encuentra sometido a diversas amenazas. En los últimos años se ha
          evidenciado un riesgo de colisión con la infraestructura de los parques eólicos.
        </p>
        <p>
          La Mesa de Cóndores es una instancia de trabajo público-privada, a través de la cual se
          busca promover acciones o prácticas que permitan compatibilizar el desarrollo energético
          con el cuidado y protección del cóndor en el país.
        </p>
        <p>
          De esta instancia colaborativa participaron voluntariamente 14 empresas de energía, tres
          gremios de energía, dos ONG, una consultora y dos instituciones públicas:
        </p>
        <div className="qs-participantes">
          <Participantes titulo="Empresas de energía" items={EMPRESAS} />
          <Participantes titulo="Gremios de energía" items={GREMIOS} />
          <Participantes titulo="ONG" items={ONG} />
          <Participantes titulo="Consultora" items={CONSULTORA} />
          <Participantes titulo="Instituciones públicas" items={PUBLICAS} />
        </div>
        <p>
          En el contexto de esta Mesa se realizaron 6 sesiones de trabajo, en las que se revisaron
          las características que hacen que el cóndor sea particularmente vulnerable a la
          infraestructura eólica y de transmisión, las acciones apropiadas para reducir las
          colisiones, la experiencia internacional y la experiencia de proyectos desarrollados en
          Chile en los que han aplicado medidas excepcionales para evitar este tipo de situaciones.
        </p>
        <h4 className="guia-h">Objetivos de la Mesa</h4>
        <p>Los objetivos que han guiado las sesiones de la Mesa son los siguientes:</p>
        <ol className="guia-cuerpo-ul">
          {OBJETIVOS.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ol>
        <p className="doc-fuente">
          Fuente: Mesa de Cóndores, Acuerdos Generales, diciembre de 2025 (Ministerio de Energía,
          Unidad de Proyectos y Medio Ambiente, División de Desarrollo de Proyectos).{' '}
          <a href={docUrl('acuerdos')} target="_blank" rel="noopener">Ver el documento (PDF)</a>.
        </p>
      </div>
    </section>
  );
}
