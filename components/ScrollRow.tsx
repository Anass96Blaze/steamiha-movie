'use client';

import { useEffect, useRef } from 'react';
import { useSearchModal } from './SearchModalContext';

interface ScrollRowProps {
  rowId: string;
  sectionLabel: string;
  children: React.ReactNode;
}

export default function ScrollRow({ rowId, sectionLabel, children }: ScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hintCellRef = useRef<HTMLTableCellElement | null>(null);
  const { openSearch } = useSearchModal();

  useEffect(() => {
    const row = scrollRef.current;
    const hintCell = hintCellRef.current;
    if (!row || !hintCell) return;

    let pointerId: number | null = null;
    let startX = 0;
    let pull = 0;
    let triggered = false;
    const threshold = 72;
    let mouseDragging = false;
    let didDrag = false;
    let pullEnabled = false;
    let suppressNextClick = false;
    let dragStartScrollLeft = 0;
    let releaseTimer: number | null = null;
    let wheelPull = 0;
    let wheelResetTimer: number | null = null;
    let wheelFireTimer: number | null = null;

    const textSpan = hintCell.querySelector('.pull-search-text') as HTMLSpanElement | null;

    const updateHintVisibility = () => {
      const hintRect = hintCell.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const overlap = Math.min(hintRect.right, rowRect.right) - Math.max(hintRect.left, rowRect.left);
      const ratio = hintRect.width > 0 ? Math.max(0, Math.min(1, overlap / hintRect.width)) : 0;
      row.style.setProperty('--pull-hint-visible', String(ratio));
      return ratio;
    };

    const canPull = () => {
      const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
      if (!maxScroll) return false;
      return maxScroll - row.scrollLeft <= 40;
    };

    const setHintText = (text: string) => {
      if (textSpan) textSpan.textContent = text;
    };

    const applyPull = (value: number) => {
      pull = Math.max(0, Math.min(140, value));
      const ratio = updateHintVisibility();
      const visiblePull = pull * ratio;
      if (visiblePull <= 0) {
        row.classList.remove('pulling-end');
        row.classList.remove('pull-ready');
        row.style.removeProperty('--pull-progress');
        setHintText('Pull for search');
        return;
      }
      row.classList.add('pulling-end');
      row.style.setProperty('--pull-progress', String(pull));
      if (!pullEnabled) {
        row.classList.remove('pull-ready');
        setHintText('Go to end to search');
        return;
      }
      if (pull >= threshold) {
        row.classList.add('pull-ready');
        setHintText('Release to search');
      } else {
        row.classList.remove('pull-ready');
        setHintText('Pull for search');
      }
    };

    const updatePullEligibility = () => {
      const ratio = updateHintVisibility();
      pullEnabled = canPull() && ratio >= 0.98;
      if (!pullEnabled) applyPull(0);
    };

    const reset = () => {
      pointerId = null;
      startX = 0;
      pull = 0;
      triggered = false;
      if (releaseTimer) { window.clearTimeout(releaseTimer); releaseTimer = null; }
      wheelPull = 0;
      mouseDragging = false;
      didDrag = false;
      pullEnabled = false;
      if (suppressNextClick) {
        window.setTimeout(() => { suppressNextClick = false; }, 260);
      }
      if (wheelResetTimer) { window.clearTimeout(wheelResetTimer); wheelResetTimer = null; }
      if (wheelFireTimer) { window.clearTimeout(wheelFireTimer); wheelFireTimer = null; }
      setHintText('Pull for search');
      row.classList.remove('pulling-end');
      row.classList.remove('pull-ready');
      row.style.removeProperty('--pull-progress');
      row.style.removeProperty('--pull-hint-visible');
    };

    const fire = () => {
      if (triggered) return;
      triggered = true;
      openSearch(sectionLabel);
      releaseTimer = window.setTimeout(() => reset(), 80);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      pull = 0;
      triggered = false;
      didDrag = false;
      dragStartScrollLeft = row.scrollLeft;
      if (event.pointerType === 'mouse') {
        mouseDragging = true;
        row.classList.add('dragging-scroll');
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || triggered) return;
      const delta = startX - event.clientX;
      if (event.pointerType === 'mouse' && mouseDragging) {
        if (Math.abs(delta) > 6) didDrag = true;
        row.scrollLeft = dragStartScrollLeft + delta;
      }
      updatePullEligibility();
      if (!pullEnabled) {
        if (delta > 0) {
          applyPull(Math.min(68, delta * 0.38));
          setHintText('Go to end to search');
        } else applyPull(0);
        return;
      }
      if (delta <= 0) { applyPull(0); return; }
      applyPull(delta * 0.6);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      row.classList.remove('dragging-scroll');
      if (didDrag) suppressNextClick = true;
      if (!triggered && pullEnabled && pull >= threshold && canPull()) {
        fire();
        return;
      }
      reset();
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      row.classList.remove('dragging-scroll');
      if (didDrag) suppressNextClick = true;
      reset();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressNextClick) return;
      suppressNextClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (triggered) return;
      updatePullEligibility();
      if (!pullEnabled) {
        wheelPull = 0;
        if (event.deltaX > 0) {
          applyPull(Math.min(68, event.deltaX * 0.38));
          setHintText('Go to end to search');
        } else applyPull(0);
        if (wheelFireTimer) { window.clearTimeout(wheelFireTimer); wheelFireTimer = null; }
        return;
      }
      if (event.deltaX <= 0) {
        wheelPull = 0;
        if (wheelFireTimer) { window.clearTimeout(wheelFireTimer); wheelFireTimer = null; }
        applyPull(0);
        return;
      }
      wheelPull = Math.min(140, wheelPull + event.deltaX * 0.35);
      applyPull(wheelPull);
      if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelPull = 0;
        if (!triggered) applyPull(0);
      }, 220);
      if (pull >= threshold) {
        if (wheelFireTimer) window.clearTimeout(wheelFireTimer);
        wheelFireTimer = window.setTimeout(() => {
          if (!triggered && pull >= threshold && canPull()) fire();
        }, 260);
      }
    };

    row.addEventListener('pointerdown', onPointerDown, { passive: true });
    row.addEventListener('pointermove', onPointerMove, { passive: true });
    row.addEventListener('pointerup', onPointerUp, { passive: true });
    row.addEventListener('pointercancel', onPointerCancel, { passive: true });
    row.addEventListener('click', onClickCapture, { capture: true });
    row.addEventListener('dragstart', onDragStart);
    row.addEventListener('wheel', onWheel, { passive: true });

    const onScroll = () => updateHintVisibility();
    row.addEventListener('scroll', onScroll, { passive: true });
    updateHintVisibility();

    return () => {
      row.removeEventListener('pointerdown', onPointerDown);
      row.removeEventListener('pointermove', onPointerMove);
      row.removeEventListener('pointerup', onPointerUp);
      row.removeEventListener('pointercancel', onPointerCancel);
      row.removeEventListener('click', onClickCapture, { capture: true } as unknown as EventListenerOptions);
      row.removeEventListener('dragstart', onDragStart);
      row.removeEventListener('wheel', onWheel);
      row.removeEventListener('scroll', onScroll);
      if (releaseTimer) window.clearTimeout(releaseTimer);
      if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      if (wheelFireTimer) window.clearTimeout(wheelFireTimer);
    };
  }, [openSearch, sectionLabel]);

  return (
    <div className="scroll reveal-on-scroll" ref={scrollRef}>
      <table>
        <tbody>
          <tr id={rowId}>
            {children}
            <td className="pull-search-cell" ref={hintCellRef}>
              <div className="pull-search-tile">
                <span className="pull-search-ring" />
                <span className="pull-search-text">Pull for search</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
