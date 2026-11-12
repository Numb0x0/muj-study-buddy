import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, hint, error, required, id, className, children }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-2">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & Omit<FieldWrapperProps, "children" | "id">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, id, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} id={inputId} className={className}>
      <input ref={ref} id={inputId} className={cn("field", error && "border-danger focus:border-danger focus:ring-danger/30")} aria-invalid={!!error} required={required} {...rest} />
    </FieldWrapper>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & Omit<FieldWrapperProps, "children" | "id">;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, id, rows = 4, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} id={inputId} className={className}>
      <textarea ref={ref} id={inputId} rows={rows} className={cn("field resize-y", error && "border-danger")} aria-invalid={!!error} required={required} {...rest} />
    </FieldWrapper>
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  Omit<FieldWrapperProps, "children" | "id"> & { options: SelectOption[]; placeholder?: string };

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, id, options, placeholder, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} id={inputId} className={className}>
      <select ref={ref} id={inputId} className={cn("field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9", error && "border-danger")} aria-invalid={!!error} required={required} {...rest}>
        {placeholder !== undefined && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});

export function Checkbox({ label, className, id, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-text-2", className)}>
      <input id={inputId} type="checkbox" className="h-4 w-4 rounded border-border-2 bg-bg-2 accent-primary" {...rest} />
      {label}
    </label>
  );
}
