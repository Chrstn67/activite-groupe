// src/components/Sheet.jsx
import { forwardRef } from "react";
import { GROUP_TITLE } from "@/app/publishers";

const Sheet = forwardRef(function Sheet(
  { title, children, wide = false, showGroup = true, testId, className = "" },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`sheet ${wide ? "sheet--wide" : ""} ${className}`}
      data-testid={testId}
    >
      <header className="sheet__head">
        {showGroup && (
          <p className="sheet__overline" data-testid="sheet-group-title">
            {GROUP_TITLE}
          </p>
        )}
        <h2 className="sheet__title" data-testid="sheet-title">
          {title}
        </h2>
        <div className="sheet__rule" />
      </header>
      <div className="sheet__body">{children}</div>
    </div>
  );
});

export default Sheet;
