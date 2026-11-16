import { useState } from "react";

import { Field } from "./Field";
import type { FieldProps } from "./Field";

type PasswordFieldProps = Omit<FieldProps, "type" | "inputAction">;

/** Field with a Show/Hide toggle. Pass `labelAction` for a "Forgot password?" link. */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      {...props}
      type={visible ? "text" : "password"}
      inputAction={
        <button
          type="button"
          className="absolute right-2.5 text-xs font-semibold text-secondary"
          onClick={() => {
            setVisible((current) => !current);
          }}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
