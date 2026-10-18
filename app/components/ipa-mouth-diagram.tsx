"use client";

import { useId, useState } from "react";
import {
  airflowLabels,
  ipaArticulations,
  lipLabels,
  tongueLabels,
  type MouthFrame,
  type TonguePose,
} from "../content/ipa-articulation";
import type { IpaSound } from "../content/ipa";
import { Button } from "./ui/button";

// Original, deliberately schematic sagittal drawings. Coordinates describe relative
// gestures, not MRI contours or a measurement of a learner's anatomy.
const tongues: Record<TonguePose, string> = {
  rest: "M116 188 C149 168 194 158 230 180 C255 198 273 222 280 245",
  "high-front":
    "M116 177 C119 151 133 113 151 108 C187 104 222 145 246 174 C266 197 278 225 280 245",
  "near-high-front":
    "M116 181 C122 157 142 129 162 127 C197 125 226 156 246 183 C265 207 278 229 280 245",
  "mid-front":
    "M116 184 C125 163 150 143 171 144 C201 145 231 169 247 191 C265 214 278 232 280 245",
  "low-front":
    "M116 195 C135 179 158 173 180 177 C211 179 236 194 252 210 C270 226 278 238 280 245",
  "low-back": "M116 197 C153 194 191 193 218 189 C248 188 264 210 280 245",
  "mid-back": "M116 185 C153 183 190 164 219 142 C242 127 255 160 266 194 C275 219 279 235 280 245",
  "high-back":
    "M116 183 C155 180 184 148 219 122 C244 106 254 126 264 168 C276 209 279 234 280 245",
  "near-high-back":
    "M116 186 C155 180 185 157 218 139 C244 123 258 155 269 195 C277 219 279 236 280 245",
  central: "M116 188 C153 175 174 151 203 155 C234 159 258 194 280 245",
  "open-central": "M116 193 C150 183 177 168 203 170 C235 173 258 205 280 245",
  rhotic: "M116 184 C145 171 168 120 203 119 C235 119 252 173 265 208 C275 230 279 239 280 245",
  dental: "M78 163 C102 153 124 159 153 166 C193 169 229 183 252 205 C270 226 278 238 280 245",
  "alveolar-seal":
    "M115 112 C123 118 128 145 153 158 C197 174 230 182 252 205 C270 226 278 238 280 245",
  "alveolar-gap":
    "M116 125 C129 127 136 147 157 162 C197 174 230 183 252 205 C270 226 278 238 280 245",
  "post-seal": "M144 92 C152 101 152 128 165 148 C197 174 230 183 252 205 C270 226 278 238 280 245",
  "post-gap": "M143 109 C154 115 160 138 177 154 C207 174 235 189 252 207 C270 227 278 239 280 245",
  "velar-seal":
    "M116 188 C151 181 184 142 219 119 C238 105 244 103 253 103 C265 113 274 191 280 245",
  "velar-gap":
    "M116 188 C151 181 184 151 219 133 C238 121 244 123 253 128 C267 144 276 199 280 245",
  palatal: "M116 175 C134 145 157 101 182 97 C212 96 242 148 262 199 C274 226 279 239 280 245",
};
const tongueBase = "L278 270 C250 266 232 252 204 238 C168 225 134 215 111 204 Z";
const oralAir =
  "M302 278 C309 235 312 192 299 160 C286 143 275 140 264 136 C254 128 252 110 242 104 C218 85 179 86 150 99 C140 104 128 116 115 119 C108 122 105 144 103 157 L42 157";
const nasalAir =
  "M302 278 C308 233 312 185 301 143 C290 103 279 65 250 56 C199 40 133 49 95 70 C72 82 63 91 40 96";
const contacts = {
  lips: [72, 148],
  "teeth-lip": [90, 151],
  alveolar: [115, 112],
  postalveolar: [144, 92],
  velar: [253, 103],
} as const;

function airPath(frame: MouthFrame) {
  if (frame.airflow === "nasal") return nasalAir;
  if (frame.airflow === "lateral")
    return "M302 278 C309 235 312 192 299 160 C278 134 245 127 206 128 L150 132";
  if (frame.airflow !== "pressure") return oralAir;
  if (frame.contact === "velar") return "M302 278 C309 235 312 192 299 160 Q285 137 268 121";
  if (frame.contact === "postalveolar")
    return "M302 278 C309 235 312 192 299 160 C280 124 242 106 205 99 L165 99";
  if (frame.contact === "alveolar")
    return "M302 278 C309 235 312 192 299 160 C275 115 218 88 175 99 L138 109";
  return oralAir.replace("L42 157", "L96 157");
}

function SagittalDiagram({
  frame,
  voiced,
  symbol,
  id,
}: {
  frame: MouthFrame;
  voiced: boolean;
  symbol: string;
  id: string;
}) {
  const jaw =
    frame.tongue === "low-front" || frame.tongue === "low-back"
      ? 202
      : frame.tongue === "high-front" || frame.tongue === "palatal"
        ? 172
        : frame.tongue === "open-central"
          ? 192
          : 184;
  const lipX = frame.lips === "rounded" ? 64 : 72;
  const lowerLip = frame.lips === "closed" ? 148 : frame.lips === "teeth-lip" ? 153 : jaw - 6;
  const contact = frame.contact ? contacts[frame.contact] : null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 380 300"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      data-slot="mouth-section"
      className="block h-auto w-full"
    >
      <title id={`${id}-title`}>
        Mặt cắt miệng cho âm /{symbol}/ · {frame.label}
      </title>
      <desc id={`${id}-desc`}>
        {tongueLabels[frame.tongue]}. {lipLabels[frame.lips]}. {airflowLabels[frame.airflow]}.{" "}
        {voiced ? "Thanh quản rung" : "Thanh quản không rung"}. Phía môi ở bên trái; lưỡi màu hồng,
        luồng hơi màu xanh.
      </desc>
      <defs>
        <linearGradient
          id={`${id}-skin`}
          x1="0"
          y1="0"
          x2="0.8"
          y2="1"
          colorInterpolation="linearRGB"
        >
          <stop offset="0" stopColor="#fff2df" />
          <stop offset="0.4" stopColor="#f7dfc9" />
          <stop offset="0.75" stopColor="#eed0bc" />
          <stop offset="1" stopColor="#e6c5b9" />
        </linearGradient>
        <linearGradient
          id={`${id}-tongue`}
          x1="0.2"
          y1="0"
          x2="0.8"
          y2="1"
          colorInterpolation="linearRGB"
        >
          <stop offset="0" stopColor="#ffa99c" />
          <stop offset="0.32" stopColor="#f18e85" />
          <stop offset="0.68" stopColor="#df777a" />
          <stop offset="1" stopColor="#bb626f" />
        </linearGradient>
        <clipPath id={`${id}-tongue-clip`}>
          <path d={`${tongues[frame.tongue]} ${tongueBase}`} />
        </clipPath>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M1 1 L9 5 L1 9 Z" fill="#157e9b" />
        </marker>
      </defs>
      <rect x="1" y="1" width="378" height="298" rx="22" fill="#fbf8f3" />
      <circle cx="209" cy="147" r="127" fill="#f1ece5" />
      {/* A continuous tissue section surrounds the pale, open vocal tract. */}
      <path
        d={`M86 18 C85 43 75 62 58 81 L40 98 Q39 105 58 106 L69 106 Q70 123 60 132 Q54 139 ${lipX} 148 L${frame.lips === "teeth-lip" ? 90 : lipX} ${lowerLip} Q53 ${lowerLip + 6} 67 ${lowerLip + 24} C78 ${lowerLip + 44} 111 231 149 231 C186 230 209 247 229 286 L342 286 L351 218 C367 159 356 94 327 53 Q302 18 264 18 Z`}
        fill={`url(#${id}-skin)`}
        stroke="#d5b8a7"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M49 97 Q73 100 95 78 C132 48 192 31 238 43 C276 51 295 78 315 102 L299 130 Q286 103 265 84 C233 62 179 61 140 77 Q102 96 80 102 Z"
        fill="#fffdf9"
      />
      <path
        d="M80 95 C114 72 147 51 200 51 C236 51 259 64 272 84"
        fill="none"
        stroke="#dfc6b8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={`M40 148 L${lipX} 148 Q79 154 87 153 L85 133 Q101 112 115 112 C148 78 202 67 237 88 ${frame.airflow === "nasal" ? "Q252 104 258 134 Q271 145 278 130 L299 100 L315 102" : "Q262 95 275 115 Q283 126 280 135 Q300 127 315 102"} C337 139 340 178 330 215 L321 286 L278 286 L278 270 C250 266 232 252 204 238 C168 225 134 215 111 204 L99 ${jaw + 11} L86 ${jaw + 11} Q77 ${jaw} ${lipX} ${lowerLip} L40 ${lowerLip} Z`}
        fill="#fffdf9"
      />
      <g
        fill="none"
        stroke="#a57f72"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d={`M86 18 C85 43 75 62 58 81 L40 98 Q39 105 58 106 L69 106 Q70 123 60 132 Q54 139 ${lipX} 148`}
        />
        <path
          d={`M${frame.lips === "teeth-lip" ? 90 : lipX} ${lowerLip} Q53 ${lowerLip + 6} 67 ${lowerLip + 24} C78 ${lowerLip + 44} 111 231 149 231 C186 230 209 247 229 286`}
        />
        <path d="M315 102 C337 139 340 178 330 215 L321 286" stroke="#c3a28f" />
        <path d="M86 133 Q101 112 115 112 C148 78 202 67 237 88" stroke="#b98e7d" strokeWidth="4" />
        <path
          d={
            frame.airflow === "nasal"
              ? "M237 88 Q252 104 258 134"
              : "M237 88 Q262 95 275 115 Q283 126 280 135"
          }
          stroke="#d6a393"
          strokeWidth="9"
        />
        <path
          d={`M97 ${jaw + 11} C124 221 166 232 204 246 Q220 256 229 286`}
          stroke="#fff6e9"
          strokeWidth="6"
        />
      </g>
      <path
        d={`${tongues[frame.tongue]} ${tongueBase}`}
        fill={`url(#${id}-tongue)`}
        stroke="#b9656d"
        strokeWidth="2"
        strokeLinejoin="round"
        data-slot="tongue"
        data-pose={frame.tongue}
      />
      <g clipPath={`url(#${id}-tongue-clip)`} fill="none" strokeLinecap="round">
        <path
          d={tongues[frame.tongue]}
          transform="translate(0 4)"
          stroke="#ffd3bc"
          strokeWidth="3"
        />
        <path
          d="M137 203 C183 201 229 221 259 251"
          stroke="#a9586c"
          strokeWidth="1.5"
          opacity="0.35"
        />
        <path
          d="M154 211 C197 211 225 232 243 245"
          stroke="#ffd2b9"
          strokeWidth="2"
          opacity="0.45"
        />
      </g>
      <g fill="#fffefa" stroke="#baa99a" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M85 133 L99 133 L99 149 Q98 154 87 153 Z" />
        <path d={`M86 ${jaw + 11} L99 ${jaw + 11} L99 ${jaw - 3} Q93 ${jaw - 8} 87 ${jaw - 6} Z`} />
      </g>
      <g fill="none" stroke="#cf7d79" strokeWidth="5" strokeLinecap="round">
        <path d={`M60 135 Q59 142 ${lipX} 148`} />
        <path
          d={`M${frame.lips === "teeth-lip" ? 90 : lipX} ${lowerLip} Q64 ${lowerLip + 2} 62 ${lowerLip + 7}`}
        />
      </g>
      <path
        d={airPath(frame)}
        fill="none"
        stroke="#157e9b"
        strokeWidth="3"
        strokeDasharray={frame.airflow === "pressure" ? "4 5" : undefined}
        strokeLinecap="round"
        markerEnd={`url(#${id}-arrow)`}
        data-slot="airflow"
        data-route={frame.airflow}
      />
      {frame.lips === "closed" && (
        <path d="M62 148 L83 148" stroke="#b34c4c" strokeWidth="4" strokeLinecap="round" />
      )}
      {contact && (
        <circle
          cx={contact[0]}
          cy={contact[1]}
          r="5"
          fill="#bd514c"
          stroke="white"
          strokeWidth="1.5"
        />
      )}
      <g
        fill="none"
        stroke={voiced ? "#8460a0" : "#89939d"}
        strokeWidth="2.5"
        strokeLinecap="round"
        data-slot="voicing"
        data-voiced={voiced}
      >
        <path d="M288 263 L296 267 M313 263 L305 267" />
        {voiced ? (
          <>
            <path d="M285 255 Q279 263 285 271" />
            <path d="M317 255 Q323 263 317 271" />
            <path d="M279 251 Q270 263 279 275" />
          </>
        ) : (
          <path d="M278 273 L283 258" strokeDasharray="2 4" />
        )}
      </g>
      {[
        { n: 1, x: 20, y: 130, to: "M33 130 L80 141", color: "#956c5b", tint: "#fff5e6" },
        { n: 2, x: 163, y: 270, to: "M163 257 L178 210", color: "#ac5661", tint: "#fff0ec" },
        { n: 3, x: 351, y: 256, to: "M338 256 L314 264", color: "#805496", tint: "#f6effb" },
      ].map((callout) => (
        <g key={callout.n}>
          <path d={callout.to} fill="none" stroke={callout.color} strokeWidth="1" />
          <circle
            cx={callout.x}
            cy={callout.y}
            r="13"
            fill={callout.tint}
            stroke={callout.color}
            strokeWidth="1"
          />
          <text
            x={callout.x}
            y={callout.y + 5}
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize="16"
            fontWeight="600"
            fill={callout.color}
          >
            {callout.n}
          </text>
        </g>
      ))}
    </svg>
  );
}

function LipsDiagram({ frame, id }: { frame: MouthFrame; id: string }) {
  const rounded = frame.lips === "rounded";
  const closed = frame.lips === "closed";
  const rx = rounded ? 22 : frame.lips === "spread" ? 49 : 40;
  const ry = closed
    ? 0
    : frame.lips === "open"
      ? 25
      : rounded
        ? 24
        : frame.lips === "teeth-lip"
          ? 6
          : frame.lips === "spread"
            ? 8
            : 13;
  const left = 80 - rx;
  const right = 80 + rx;
  const top = 50 - ry;
  const bottom = 50 + ry;
  const upperEdge = closed
    ? `M${left} 50 Q80 56 ${right} 50`
    : rounded
      ? `M${left} 50 C${left} ${top + 7} 69 ${top} 80 ${top} C91 ${top} ${right} ${top + 7} ${right} 50`
      : `M${left} 50 C${left + rx * 0.3} ${top + 2} ${80 - rx * 0.45} ${top - 2} 80 ${top + 1} C${80 + rx * 0.45} ${top - 2} ${right - rx * 0.3} ${top + 2} ${right} 50`;
  const lowerEdge = rounded
    ? `C${right} ${bottom - 4} 91 ${bottom + 3} 80 ${bottom + 3} C69 ${bottom + 3} ${left} ${bottom - 4} ${left} 50`
    : `C${right - rx * 0.3} ${bottom + 4} ${80 + rx * 0.4} ${bottom + 6} 80 ${bottom + 5} C${80 - rx * 0.4} ${bottom + 6} ${left + rx * 0.3} ${bottom + 4} ${left} 50`;
  const opening = `${upperEdge} ${lowerEdge} Z`;
  const outline = rounded
    ? `M${left - 6} 50 C${left - 8} ${top - 8} 69 ${top - 11} 76 ${top - 10} Q80 ${top - 8} 84 ${top - 10} C91 ${top - 11} ${right + 8} ${top - 8} ${right + 6} 50 C${right + 8} ${bottom + 14} 93 ${bottom + 19} 80 ${bottom + 19} C67 ${bottom + 19} ${left - 8} ${bottom + 14} ${left - 6} 50 Z`
    : `M${left - 5} 50 C${left + 9} ${top - 8} 66 ${top - 16} 73 ${top - 9} Q80 ${top - 3} 87 ${top - 9} C94 ${top - 16} ${right - 9} ${top - 8} ${right + 5} 50 C${right - 9} ${bottom + 16} 104 ${bottom + 18} 80 ${bottom + 17} C56 ${bottom + 18} ${left + 9} ${bottom + 16} ${left - 5} 50 Z`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 110"
      role="img"
      aria-labelledby={`${id}-title`}
      data-slot="mouth-front"
      className="block w-full"
    >
      <title id={`${id}-title`}>
        Nhìn chính diện: {lipLabels[frame.lips]}
        {frame.airflow === "lateral" ? ", hơi đi qua hai bên lưỡi" : ""}
      </title>
      <defs>
        <linearGradient
          id={`${id}-lip`}
          x1="0"
          y1="0"
          x2="0.2"
          y2="1"
          colorInterpolation="linearRGB"
        >
          <stop offset="0" stopColor="#d98580" />
          <stop offset="0.3" stopColor="#eaa294" />
          <stop offset="0.58" stopColor="#f8b6a3" />
          <stop offset="1" stopColor="#ce7f80" />
        </linearGradient>
        <radialGradient
          id={`${id}-cavity`}
          cx="0.5"
          cy="0.8"
          r="0.9"
          colorInterpolation="linearRGB"
        >
          <stop offset="0" stopColor="#8a4f59" />
          <stop offset="0.4" stopColor="#6c414f" />
          <stop offset="0.7" stopColor="#4f3547" />
          <stop offset="1" stopColor="#392d40" />
        </radialGradient>
        <clipPath id={`${id}-opening`}>
          <path d={opening} />
        </clipPath>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M1 1 L9 5 L1 9 Z" fill="#157e9b" />
        </marker>
      </defs>
      <rect x="1" y="1" width="158" height="108" rx="20" fill="#fbf3e9" />
      <ellipse cx="80" cy={bottom + 21} rx={rx * 0.65} ry="3" fill="#c99d89" opacity="0.15" />
      <path
        d={outline}
        fill={`url(#${id}-lip)`}
        stroke="#b66e70"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {!closed && <path d={opening} fill={`url(#${id}-cavity)`} />}
      {!closed && (
        <g clipPath={`url(#${id}-opening)`}>
          <path
            d={`M${left} ${top - 1} Q80 ${top - 6} ${right} ${top - 1} L${right - 3} ${top + 9} Q80 ${top + 14} ${left + 3} ${top + 9} Z`}
            fill="#fffaf0"
            stroke="#dccabd"
            strokeWidth="0.8"
          />
          <path
            d={`M80 ${top} L80 ${top + 12} M68 ${top} L68 ${top + 11} M92 ${top} L92 ${top + 11}`}
            fill="none"
            stroke="#ddcec2"
            strokeWidth="0.7"
          />
          {frame.airflow === "lateral" && (
            <>
              <path
                d="M66 78 L70 42 Q80 31 90 42 L94 78 Z"
                fill="#ed9a92"
                stroke="#b9656d"
                strokeWidth="1.2"
              />
              <path
                d="M53 72 Q47 57 51 43 M107 72 Q113 57 109 43"
                fill="none"
                stroke="#5cbdd0"
                strokeWidth="2.5"
                markerEnd={`url(#${id}-arrow)`}
              />
            </>
          )}
        </g>
      )}
      <path d={upperEdge} fill="none" stroke="#a65e66" strokeWidth="1.2" />
      <path
        d={`M${left + 12} ${bottom + 8} Q80 ${bottom + 18} ${right - 12} ${bottom + 8}`}
        fill="none"
        stroke="#ffcfb7"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {frame.tongue === "dental" && (
        <path
          d={`M64 ${top + 13} Q80 ${top + 10} 96 ${top + 13} L95 ${bottom + 4} Q80 ${bottom + 17} 65 ${bottom + 4} Z`}
          fill="#f29c92"
          stroke="#b9656d"
          strokeWidth="1.2"
        />
      )}
      {frame.lips === "teeth-lip" && (
        <path
          d={`M56 ${top + 13} Q80 ${top + 7} 104 ${top + 13}`}
          fill="none"
          stroke="#be7778"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function IpaMouthDiagram({ sound }: { sound: IpaSound }) {
  const id = useId();
  const articulation = ipaArticulations[sound.id];
  const [step, setStep] = useState(0);
  const frame = articulation.frames[step];
  return (
    <figure
      className="my-4 overflow-hidden rounded-2xl border bg-card p-3"
      aria-label={`Minh hoạ đặt miệng cho âm /${sound.symbol}/`}
      data-frame={frame.label}
    >
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Mặt cắt khi phát âm</span>
        <span>Nhìn nghiêng · môi bên trái</span>
      </figcaption>
      {articulation.frames.length > 1 && (
        <div
          role="group"
          aria-label={`Các bước phát âm /${sound.symbol}/`}
          className="mb-3 grid grid-cols-2 gap-2"
        >
          {articulation.frames.map((item, index) => (
            <Button
              key={item.label}
              size="sm"
              variant={index === step ? "default" : "outline"}
              aria-pressed={index === step}
              onClick={() => setStep(index)}
            >
              {index + 1}. {item.label}
            </Button>
          ))}
        </div>
      )}
      <SagittalDiagram
        frame={frame}
        voiced={articulation.voiced}
        symbol={sound.symbol}
        id={`${id}-section`}
      />
      <div className="mt-3 grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3">
        <div>
          <p className="mb-1 text-[12px] text-muted-foreground">Nhìn chính diện</p>
          <LipsDiagram frame={frame} id={`${id}-front`} />
        </div>
        <ol className="m-0 list-none space-y-2 p-0 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#956c5b]/30 bg-[#fff5e6] text-[12px] font-semibold text-[#956c5b]"
            >
              1
            </span>
            Răng / môi
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#ac5661]/30 bg-[#fff0ec] text-[12px] font-semibold text-[#ac5661]"
            >
              2
            </span>
            Lưỡi
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#805496]/30 bg-[#f6effb] text-[12px] font-semibold text-[#805496]"
            >
              3
            </span>
            Thanh quản
          </li>
        </ol>
      </div>
      <div className="mt-3 space-y-2 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed">
        <p className="m-0">
          <span aria-hidden="true" className="mr-1 text-[#087ea4]">
            →
          </span>
          {airflowLabels[frame.airflow]}
        </p>
        <p className="m-0 text-muted-foreground">
          {tongueLabels[frame.tongue]}. {lipLabels[frame.lips]}.
        </p>
        <p
          className={`m-0 font-medium ${articulation.voiced ? "text-violet" : "text-muted-foreground"}`}
        >
          {articulation.voiced
            ? "Thanh quản rung · âm hữu thanh"
            : "Thanh quản không rung · âm vô thanh"}
        </p>
        {frame.contact && (
          <p className="m-0 text-muted-foreground">
            <span aria-hidden="true" className="mr-1 text-[#c34a36]">
              ●
            </span>
            Chấm đỏ: điểm tiếp xúc.
          </p>
        )}
      </div>
      <p className="mt-3 mb-0 border-t pt-2 text-[12px] leading-relaxed text-muted-foreground">
        Sơ đồ vị trí tương đối; hình dạng thay đổi theo người nói và âm đi kèm.
      </p>
    </figure>
  );
}
