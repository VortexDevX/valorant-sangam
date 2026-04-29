"use client";

import { useState } from "react";

interface ConfirmButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  labelPending?: string;
  labelConfirm?: string;
  labelCancel?: string;
  variant?: "danger" | "secondary";
}

export function ConfirmButton({
  onConfirm,
  disabled = false,
  label = "Delete",
  labelPending = "Deleting...",
  labelConfirm = "Confirm",
  labelCancel = "Cancel",
  variant = "danger",
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          className="button-danger"
          disabled={disabled}
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          type="button"
        >
          {disabled ? labelPending : labelConfirm}
        </button>
        <button
          className="button-secondary"
          disabled={disabled}
          onClick={() => setConfirming(false)}
          type="button"
        >
          {labelCancel}
        </button>
      </span>
    );
  }

  return (
    <button
      className={variant === "danger" ? "button-danger" : "button-secondary"}
      disabled={disabled}
      onClick={() => setConfirming(true)}
      type="button"
    >
      {disabled ? labelPending : label}
    </button>
  );
}
