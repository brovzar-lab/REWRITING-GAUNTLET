import { useEffect, useRef, useState } from 'react';
import type { Connection } from '../model/screenplay';
import { translate, type Lang } from '../i18n/strings';

interface Point {
  x: number;
  y: number;
}

interface ResolvedLine {
  connection: Connection;
  from: Point;
  to: Point;
}

/** Distinct visual grammar per connection kind (never color alone):
    setup/pay-off solid + circle glyph, escalation dashed + triangle,
    relationship dotted + diamond. */
const KIND_STYLE: Record<Connection['kind'], { dash: string; glyph: string }> = {
  setup_payoff: { dash: '', glyph: '●' },
  escalation: { dash: '7 4', glyph: '▲' },
  relationship: { dash: '2 4', glyph: '◆' },
};

export function ConnectionLayer({
  connections,
  containerRef,
  lang,
}: {
  connections: Connection[];
  containerRef: React.RefObject<HTMLElement | null>;
  lang: Lang;
}) {
  const [lines, setLines] = useState<ResolvedLine[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const next: ResolvedLine[] = [];
      for (const connection of connections) {
        const fromEl = container.querySelector(`[data-scene-card="${connection.fromSceneId}"]`);
        const toEl = container.querySelector(`[data-scene-card="${connection.toSceneId}"]`);
        if (!fromEl || !toEl) continue;
        const a = fromEl.getBoundingClientRect();
        const b = toEl.getBoundingClientRect();
        next.push({
          connection,
          from: { x: a.left + a.width / 2 - containerRect.left, y: a.top - containerRect.top + 6 },
          to: { x: b.left + b.width / 2 - containerRect.left, y: b.top - containerRect.top + 6 },
        });
      }
      setLines(next);
    };

    measure();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    });
    observer.observe(container);
    const mutation = new MutationObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    });
    mutation.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => {
      observer.disconnect();
      mutation.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [connections, containerRef]);

  return (
    <svg className="connection-layer" aria-hidden="true">
      {lines.map(({ connection, from, to }) => {
        const style = KIND_STYLE[connection.kind];
        const midX = (from.x + to.x) / 2;
        const arcY = Math.min(from.y, to.y) - 26;
        const path = `M ${from.x} ${from.y} Q ${midX} ${arcY} ${to.x} ${to.y}`;
        const label = `${translate(lang, `connection.${connection.kind}` as const)}: ${connection.label}`;
        return (
          <g
            key={connection.id}
            data-connection-id={connection.id}
            data-connection-kind={connection.kind}
            className={`connection kind-${connection.kind}`}
          >
            <title>{label}</title>
            <path d={path} fill="none" strokeDasharray={style.dash} />
            <text x={midX} y={arcY + 10} textAnchor="middle" className="connection-glyph">
              {style.glyph}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
