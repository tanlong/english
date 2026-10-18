import { Headphones } from "lucide-react";

export function Logo() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Headphones aria-hidden="true" size={24} />
      </span>
      <span>
        natural<span className="brand-dot">.</span>
        <small>ENGLISH FOR REAL LIFE</small>
      </span>
    </span>
  );
}
