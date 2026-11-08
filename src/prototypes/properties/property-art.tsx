import { useId } from "react";
import type { SyntheticProperty } from "./fixtures";
import styles from "../../app/prototype/properties/prototype.module.css";

const palettes = {
  sage: { sky: "#e0e6db", wall: "#c4cdbb", side: "#8a9c89", ink: "#304d3b" },
  clay: { sky: "#ece0d3", wall: "#d8a88c", side: "#a97860", ink: "#624739" },
  sand: { sky: "#ece8dc", wall: "#ddd0b4", side: "#b0a284", ink: "#5c5845" },
  slate: { sky: "#e0e5e5", wall: "#b9c7c7", side: "#819798", ink: "#344e53" },
  olive: { sky: "#e5e6d6", wall: "#c8c9a8", side: "#929875", ink: "#474e32" },
};

export function PropertyArt({
  property,
  view = "elevation",
}: {
  property: SyntheticProperty;
  view?: "elevation" | "courtyard";
}) {
  const id = useId().replaceAll(":", "");
  const color = palettes[property.palette];
  return (
    <svg
      className={styles.art}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      data-artwork={property.palette}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} width="48" height="52" patternUnits="userSpaceOnUse">
          <rect
            x="10"
            y="10"
            width="26"
            height="32"
            fill={color.ink}
            opacity=".7"
          />
          <path d="M10 35h26M23 10v32" stroke={color.wall} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill={color.sky} />
      <path d="M0 440 800 390v210H0Z" fill={color.side} opacity=".2" />
      {property.palette === "sage" ? (
        <>
          <circle cx="655" cy="105" r="48" fill="#c47b58" opacity=".65" />
          <path d="M110 460V150h210v310Z" fill={color.wall} />
          <path d="M480 460V105h210v355Z" fill={color.side} />
          <path
            d="M130 174h170v258H130ZM500 130h170v302H500Z"
            fill={`url(#${id})`}
          />
          <path d="M320 460V270h160v190Z" fill={color.wall} />
          <path d="M340 445V292h120v153Z" fill={color.ink} opacity=".6" />
          <path d="M290 510 360 450h90l85 60Z" fill="#efe9dc" />
          <path
            d="M100 150h230M470 105h230M480 235h210M110 300h210"
            stroke={color.ink}
            strokeWidth="6"
          />
        </>
      ) : property.palette === "clay" ? (
        <>
          <circle cx="145" cy="125" r="60" fill="#d1a07c" />
          <path
            d="M115 460V285l90-85 90 85v175ZM295 460V285l90-85 90 85v175ZM475 460V285l90-85 90 85v175Z"
            fill={color.wall}
          />
          <path
            d="M100 290 205 185l105 105M280 290 385 185l105 105M460 290 565 185l105 105"
            stroke={color.ink}
            strokeWidth="14"
            fill="none"
          />
          <path
            d="M205 200v260M385 200v260M565 200v260"
            stroke={color.side}
            strokeWidth="3"
          />
          <path
            d="M142 310h120v55H142ZM322 310h120v55H322ZM502 310h120v55H502Z"
            fill={`url(#${id})`}
          />
          <path
            d="M182 460v-68h46v68M362 460v-68h46v68M542 460v-68h46v68"
            fill={color.ink}
          />
          <path
            d="M170 510 205 462M350 510 385 462M530 510 565 462"
            stroke="#efe9dc"
            strokeWidth="26"
          />
        </>
      ) : property.palette === "sand" ? (
        <>
          <path
            d="M0 330 145 270l150 60 180-95 190 55 135-55v305H0Z"
            fill={color.side}
            opacity=".24"
          />
          <path
            d="M140 450V305h260v145ZM400 450V245h200v205Z"
            fill={color.wall}
          />
          <path d="M600 245 680 288v162h-80Z" fill={color.side} />
          <path d="M120 295h300v22H120ZM380 230h245v25H380Z" fill={color.ink} />
          <path
            d="M170 335h190v90H170ZM430 280h140v145H430Z"
            fill={color.ink}
            opacity=".75"
          />
          <path
            d="M225 335v90M305 335v90M480 280v145M525 280v145"
            stroke={color.wall}
            strokeWidth="5"
          />
          <path d="M110 455h585v18H110Z" fill={color.side} />
          <path
            d="M75 450V270M725 450V220"
            stroke={color.ink}
            strokeWidth="8"
          />
          <ellipse cx="75" cy="245" rx="58" ry="80" fill={color.side} />
          <ellipse
            cx="725"
            cy="185"
            rx="55"
            ry="85"
            fill={color.ink}
            opacity=".8"
          />
        </>
      ) : property.palette === "slate" ? (
        <>
          <circle cx="180" cy="120" r="55" fill="#fff7ed" opacity=".8" />
          <path
            d="M150 460V285h140v-70h140v-65h140v-55h90v365Z"
            fill={color.wall}
          />
          <path d="M660 95 720 145v315h-60Z" fill={color.side} />
          <path
            d="M175 305h95v130h-95ZM315 240h95v195h-95ZM455 175h95v260h-95ZM585 120h50v315h-50Z"
            fill={`url(#${id})`}
          />
          <path
            d="M135 285h160M275 215h160M415 150h160M555 95h110M150 365h510M290 295h370"
            stroke={color.ink}
            strokeWidth="9"
          />
          <path
            d="M0 505q200-30 400 0t400 0M0 530q200-30 400 0t400 0"
            stroke={color.side}
            strokeWidth="3"
            fill="none"
          />
          <path d="M110 465h620" stroke={color.ink} strokeWidth="4" />
        </>
      ) : (
        <>
          <path
            d="M75 465V290h195v175ZM275 465V250h195v215ZM475 465V210h195v255Z"
            fill={color.wall}
          />
          <path
            d="M270 290h-70v175h70ZM470 250h-70v215h70ZM670 210h-70v255h70Z"
            fill={color.side}
          />
          <path
            d="M60 278h220v18H60ZM260 238h220v18H260ZM460 198h220v18H460Z"
            fill={color.ink}
          />
          <path
            d="M95 315h80v100H95ZM295 275h80v100H295ZM495 235h80v100H495Z"
            fill={color.ink}
            opacity=".75"
          />
          <path
            d="M85 345h165M285 305h165M485 265h165"
            stroke={color.wall}
            strokeWidth="7"
          />
          <path
            d="M75 438h175M275 398h175M475 358h175"
            stroke={color.ink}
            strokeWidth="6"
          />
          <path
            d="M230 465v-75M430 465V350M630 465V310"
            stroke={color.ink}
            strokeWidth="4"
          />
          <circle cx="230" cy="380" r="28" fill={color.ink} />
          <circle cx="430" cy="340" r="28" fill={color.ink} />
          <circle cx="630" cy="300" r="28" fill={color.ink} />
          <path d="M55 495h645" stroke={color.side} strokeWidth="24" />
        </>
      )}
      {view === "courtyard" && (
        <>
          <path d="M0 530 295 460h170l335 70v70H0Z" fill="#efe9dc" />
          <path
            d="M95 530v-65M705 530v-90"
            stroke={color.ink}
            strokeWidth="5"
          />
          <circle cx="95" cy="440" r="42" fill={color.side} />
          <circle cx="705" cy="410" r="48" fill={color.ink} opacity=".8" />
          <path
            d="M330 550h160M330 562h160"
            stroke={color.side}
            strokeWidth="4"
          />
        </>
      )}
      <path
        d="M40 60h85M40 60v85M760 540h-85M760 540v-85"
        fill="none"
        stroke={color.ink}
        opacity=".35"
      />
    </svg>
  );
}
