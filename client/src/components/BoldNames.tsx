import React from "react";

/**
 * Renders translated copy with the given names in bold. Pass the text from
 * t() with each name swapped for a marker, e.g. t(key, { owner: "\u0001owner\u0001" }).
 */
export const NAME_MARK = "\u0001";

export function nameMarker(key: string): string {
  return `${NAME_MARK}${key}${NAME_MARK}`;
}

const BoldNames: React.FC<{ text: string; names: Record<string, string> }> = ({ text, names }) => {
  const parts = text.split(NAME_MARK);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i}>{names[part] ?? part}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

export default BoldNames;
