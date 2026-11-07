"use client";

import type { RefObject } from "react";
import { FormField } from "./form-field";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/app/components/ui/combobox";

export type ComboboxOption = { value: string; label: string };

type SelectComboboxProps = {
  id: string;
  label: string;
  options: readonly ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  descriptionId?: string;
  name?: string;
  container?: HTMLElement | ShadowRoot | RefObject<HTMLElement | ShadowRoot | null> | null;
  positionMethod?: "absolute" | "fixed";
};

export function SelectCombobox({
  id,
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  descriptionId,
  name,
  container,
  positionMethod,
}: SelectComboboxProps) {
  return (
    <Combobox
      name={name}
      disabled={disabled}
      items={options}
      value={options.find((option) => option.value === value) ?? null}
      onValueChange={(option) => option && onValueChange(option.value)}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
      autoHighlight
    >
      <ComboboxInput
        id={id}
        aria-label={label}
        aria-describedby={descriptionId}
        disabled={disabled}
        triggerLabel={`Mở danh sách ${label}`}
        placeholder={`Tìm ${label.toLocaleLowerCase("vi")}…`}
      />
      <ComboboxContent container={container} positionMethod={positionMethod}>
        <ComboboxEmpty>Không tìm thấy lựa chọn.</ComboboxEmpty>
        <ComboboxList>
          {(option: ComboboxOption) => (
            <ComboboxItem key={option.value} value={option}>
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function ComboboxField({
  hint,
  className,
  ...props
}: SelectComboboxProps & {
  hint?: string;
  className?: string;
}) {
  return (
    <FormField id={props.id} label={props.label} hint={hint} className={className}>
      <SelectCombobox {...props} descriptionId={hint ? `${props.id}-hint` : props.descriptionId} />
    </FormField>
  );
}
