import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

interface Props {
  value: string;
  onChange?: (v: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
  minHeight?: number;
  language?: 'python' | 'text';
}

export function Editor({ value, onChange, onRun, readOnly, minHeight = 80, language = 'python' }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef({ onChange, onRun });
  cb.current = { onChange, onRun };

  useEffect(() => {
    const runKey = { key: 'Mod-Enter', run: () => (cb.current.onRun?.(), true) };
    const view_ = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), history(), drawSelection(), indentOnInput(), bracketMatching(), highlightActiveLine(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([runKey, indentWithTab, ...defaultKeymap, ...historyKeymap]),
          ...(language === 'python' ? [python()] : []),
          oneDark,
          EditorState.tabSize.of(4),
          EditorState.readOnly.of(!!readOnly),
          EditorView.theme({ '&': { minHeight: `${minHeight}px`, fontSize: '14px' }, '.cm-scroller': { fontFamily: 'var(--mono)' } }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange?.(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = view_;
    return () => view_.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // external value changes (e.g. "reset to starter")
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="editor" />;
}
