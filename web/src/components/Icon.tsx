import { ICON, type IconKey } from '../data/portal';

export function Icon({ k, s = 18 }: { k: IconKey; s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICON[k] }}
    />
  );
}
