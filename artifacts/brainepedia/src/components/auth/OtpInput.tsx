import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const getOtpValue = () => (value ? value.toString().split("") : []);

  const changeCodeAtFocus = (str: string) => {
    const otp = getOtpValue();
    otp[activeInput] = str[0] || "";
    onChange(otp.join(""));
  };

  const focusInput = (index: number) => {
    const activeIndex = Math.max(Math.min(length - 1, index), 0);
    setActiveInput(activeIndex);
    inputRefs.current[activeIndex]?.focus();
  };

  const focusNextInput = () => focusInput(activeInput + 1);
  const focusPrevInput = () => focusInput(activeInput - 1);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      e.preventDefault();
      return;
    }
    changeCodeAtFocus(val);
    focusNextInput();
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      changeCodeAtFocus("");
      focusPrevInput();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusPrevInput();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusNextInput();
    }
  };

  const handleOnPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .trim()
      .slice(0, length)
      .split("");
    
    if (pastedData.length) {
      let newValue = "";
      const otp = getOtpValue();
      for (let i = 0; i < length; i++) {
        newValue += pastedData[i] || otp[i] || "";
      }
      onChange(newValue);
      focusInput(Math.min(pastedData.length, length - 1));
    }
  };

  const otpValue = getOtpValue();

  return (
    <div className="flex gap-2 justify-between">
      {Array(length)
        .fill("")
        .map((_, index) => (
          <Input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            className="w-12 h-14 text-center text-xl font-mono border-border/50 bg-background/50 focus-visible:ring-primary shadow-inner"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{1}"
            maxLength={length}
            value={otpValue[index] || ""}
            onChange={handleOnChange}
            onKeyDown={handleOnKeyDown}
            onPaste={handleOnPaste}
            onFocus={(e) => {
              setActiveInput(index);
              e.target.select();
            }}
          />
        ))}
    </div>
  );
}
