export interface TextSelection {
  start: number;
  end: number;
}

const clampIndex = (index: number, length: number) => Math.min(Math.max(index, 0), length);

export function insertTextAtSelection(value: string, insert: string, selection: TextSelection): { value: string; caret: number } {
  const start = clampIndex(Math.min(selection.start, selection.end), value.length);
  const end = clampIndex(Math.max(selection.start, selection.end), value.length);
  const nextValue = `${value.slice(0, start)}${insert}${value.slice(end)}`;
  return {
    value: nextValue,
    caret: start + insert.length,
  };
}
