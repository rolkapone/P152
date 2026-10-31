/**
 * Content of the "Desk" tab (UX US-006, design-system.md §16, maquette US-006.html): title and
 * help, the desk models as a React Aria `RadioGroup` "Desk model" (one grouped list with
 * hairlines, a line = thumbnail + "W × D cm" + name + check), then the "Selected" summary in
 * cm and mm. Choosing is applying: a click, an arrow, Home / End or Space calls `onChange` at
 * once (no button, no confirmation); the active line again does nothing (UX-4, UX-5). One Tab
 * stop; arrows loop (React Aria), Home / End are added here. No "Custom size" (US-007).
 *
 * `choices` null = the catalog could not load: an alert banner takes the place of the list
 * and the summary, the scene keeps its default desk. No choice yet (empty list): title only.
 */
import { useEffect, useId, useMemo, useRef } from "react";
import { Radio, RadioGroup } from "react-aria-components";
import { useTranslation } from "react-i18next";
import type { DeskChoice, DeskSpec } from "../../../core";
import { Button } from "../../components/Button";
import { cx } from "../../components/cx";
import { Icon } from "../../components/Icon";
import { formatCentimetres, formatMillimetres } from "../../i18n/format";
import styles from "./DeskPanel.module.css";
import { DeskThumb, thumbScale } from "./DeskThumb";

export interface DeskPanelProps {
  /** Desk models of the catalog in catalog order; null when the catalog could not load. */
  readonly choices: readonly DeskChoice[] | null;
  /** Id of the active line (`DeskChoice.id`). */
  readonly value: string | null;
  /** Applies a line; never called for the active one. */
  readonly onChange: (choiceId: string) => void;
  /** "Reload page" of the error banner (default: reloads the page). */
  readonly onReload?: () => void;
}

const reloadPage = () => window.location.reload();

/**
 * Home / End go to the first / last line and apply it (UX-5); arrows are React Aria's.
 * The radios of the group are the lines, in the order of `choices`.
 */
function moveToEnd(
  event: globalThis.KeyboardEvent,
  group: HTMLElement,
  choices: readonly DeskChoice[],
  value: string | null,
  onChange: (choiceId: string) => void,
) {
  if (event.key !== "Home" && event.key !== "End") return;
  const index = event.key === "Home" ? 0 : choices.length - 1;
  const target = group.querySelectorAll<HTMLInputElement>('input[type="radio"]')[index];
  const choice = choices[index];
  if (target === undefined || choice === undefined) return;
  event.preventDefault();
  target.focus();
  if (choice.id !== value) onChange(choice.id);
}

export function DeskPanel({ choices, value, onChange, onReload = reloadPage }: DeskPanelProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const ids = useId();
  const scale = useMemo(() => thumbScale((choices ?? []).map(({ spec }) => spec)), [choices]);
  const cm = (mm: number) => formatCentimetres(mm, language);
  const mm = (value: number) => formatMillimetres(value, language);
  const size = (spec: DeskSpec) =>
    t("desk.size", { width: cm(spec.widthMm), depth: cm(spec.depthMm) });
  const active = choices?.find((choice) => choice.id === value) ?? null;
  const group = useRef<HTMLDivElement>(null);

  // React Aria's RadioGroup does not forward keyboard handlers: a native listener instead.
  useEffect(() => {
    const node = group.current;
    if (node === null || choices === null) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) =>
      moveToEnd(event, node, choices, value, onChange);
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [choices, value, onChange]);

  return (
    <div className={cx(styles.panel)}>
      <div className={cx(styles.header)}>
        <h2 className={cx(styles.title)}>{t("desk.title")}</h2>
        {choices !== null && choices.length > 0 && (
          <p className={cx(styles.help)}>{t("desk.help")}</p>
        )}
      </div>
      {choices === null ? (
        <div role="alert" className={cx(styles.banner)}>
          <Icon name="alert-triangle" className={cx(styles.bannerIcon)} />
          <div className={cx(styles.bannerText)}>
            <p className={cx(styles.bannerTitle)}>{t("desk.errorTitle")}</p>
            <p>{t("desk.errorBody")}</p>
            <Button size="sm" className={cx(styles.bannerAction)} onPress={onReload}>
              {t("desk.reload")}
            </Button>
          </div>
        </div>
      ) : choices.length === 0 ? null : (
        <>
          <RadioGroup
            className={cx(styles.list)}
            aria-label={t("desk.group")}
            value={value}
            onChange={onChange}
            ref={group}
          >
            {choices.map((choice, index) => (
              <Radio
                key={choice.id}
                value={choice.id}
                className={cx(styles.row)}
                aria-describedby={`${ids}-h${String(index)}`}
              >
                <DeskThumb desk={choice.spec} scale={scale} />
                <span className={cx(styles.text)}>
                  <span className={cx(styles.size)}>{size(choice.spec)}</span>
                  <span className={cx(styles.name)}>{choice.name}</span>
                </span>
                <Icon name="check" className={cx(styles.check)} />
              </Radio>
            ))}
          </RadioGroup>
          {/* Descriptions of the lines (UX-14): read with the line, not shown. */}
          <div hidden>
            {choices.map((choice, index) => (
              <span key={choice.id} id={`${ids}-h${String(index)}`}>
                {t("desk.height", { height: cm(choice.spec.heightMm) })}
              </span>
            ))}
          </div>
          {active !== null && (
            <section className={cx(styles.summary)} aria-labelledby={`${ids}-sum`}>
              <h3 id={`${ids}-sum`} className={cx(styles.groupTitle)}>
                {t("desk.selected")}
              </h3>
              <div className={cx(styles.group)}>
                <p className={cx(styles.groupRow, styles.summaryName)}>
                  {t("desk.summaryName", {
                    name: active.name,
                    width: cm(active.spec.widthMm),
                    depth: cm(active.spec.depthMm),
                  })}
                </p>
                <p className={cx(styles.groupRow, styles.summarySize)}>
                  {t("desk.summarySize", {
                    width: mm(active.spec.widthMm),
                    depth: mm(active.spec.depthMm),
                    height: mm(active.spec.heightMm),
                  })}
                </p>
              </div>
              <p className={cx(styles.caption)}>{t("desk.summaryCaption")}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
