/**
 * Public entry of the 3D view (ADR-APP-07: ui/ uses only this and the state store).
 * In the main chunk and free of three.js: it checks WebGL 2, then lazy-loads the scene.
 *
 * - The focusable region (`role="group"`, `tabindex=0`, label given by the UI through i18n)
 *   receives the view keys (arrows, + / -, Shift+arrows, 0 / 1 / 2) only when it has the
 *   focus itself (WCAG 2.1.4); Tab is never captured.
 * - The canvas size is reserved before it loads (no layout shift); the studio background
 *   colour fills the region meanwhile.
 * - Status (loading, ready, unsupported, failed, contextLost) is in `useSceneView`; the
 *   loading bar, the view bar, the tip and the error screens are UI (developer, T5/T6),
 *   placed as `children` (overlays inside the region, after the scene in the Tab order).
 */
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Material, StudioConfig } from "../core";
import { useSceneView, viewCommandForKey } from "../state";
import { detectWebGL2, useTheme } from "./environment";

const SceneCanvas = lazy(() => import("./scene/SceneCanvas"));

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    // Chunk download error, shader / renderer creation error...: "Try again" retries.
    useSceneView.getState().setStatus("failed");
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface ViewportProps {
  readonly studio: StudioConfig;
  readonly materials: ReadonlyMap<string, Material>;
  /** Accessible name of the region (i18n, e.g. "3D view of your desk. Use arrow keys…"). */
  readonly label: string;
  readonly className?: string;
  /** Overlays of the scene: loading, view bar, tip, error screens (UI layer). */
  readonly children?: ReactNode;
}

const REGION_STYLE: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outlineOffset: "-3px",
};

export function Viewport({ studio, materials, label, className, children }: ViewportProps) {
  const status = useSceneView((state) => state.status);
  const attempt = useSceneView((state) => state.attempt);
  const theme = useTheme();

  // Checked again on "Try again" (attempt), before the 3D code is downloaded.
  const webgl2 = useMemo(() => attempt >= 0 && detectWebGL2(), [attempt]);
  useEffect(() => {
    if (!webgl2) useSceneView.getState().setStatus("unsupported");
  }, [webgl2, attempt]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return; // keys of the overlays stay theirs
    const command = viewCommandForKey(event);
    if (command !== null && useSceneView.getState().runViewCommand(command, "keyboard")) {
      event.preventDefault();
    }
  };

  const showScene = webgl2 && (status === "loading" || status === "ready");
  return (
    // The 3D view is a focusable group (UX §5: role="application" is avoided on purpose):
    // it is the keyboard alternative to dragging (WCAG 2.5.7).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="group"
      aria-label={label}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focusable 3D view (UX §5)
      tabIndex={0}
      className={className}
      data-scene-status={status}
      style={{ ...REGION_STYLE, background: studio.backdrop[theme].background }}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {showScene && (
        <SceneErrorBoundary key={attempt}>
          <Suspense fallback={null}>
            <SceneCanvas studio={studio} materials={materials} />
          </Suspense>
        </SceneErrorBoundary>
      )}
      {children}
    </div>
  );
}
