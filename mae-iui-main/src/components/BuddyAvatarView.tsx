import React from "react";
import { BuddyAvatar } from "../lib/types";

export type BuddyPose = "idle" | "walking" | "jogging" | "pointing" | "clicking" | "waving";

interface Props {
  avatar: BuddyAvatar;
  size?: number; // pixel width/height (default 80)
  className?: string;
  showAccessories?: boolean;
  pose?: BuddyPose;
  facing?: "left" | "right";
  isFullBody?: boolean;
}

export const BuddyAvatarView: React.FC<Props> = ({
  avatar,
  size = 80,
  className = "",
  showAccessories = true,
  pose = "idle",
  facing = "right",
  isFullBody = true,
}) => {
  const {
    skinColor = "#fcd5b4",
    hairStyle = "ac_wavy",
    hairColor = "#4a3525",
    eyeStyle = "ac_dot",
    eyeColor = "#2b2340",
    mouthStyle = "smile",
    outfit = "hoodie",
    outfitColor = "#6b4fbb",
    accessory = "none",
    mood = "happy",
    faceShape = "round",
  } = avatar;

  const isMoving = pose === "walking" || pose === "jogging";
  const isPointing = pose === "pointing";
  const isClicking = pose === "clicking";
  const isWaving = pose === "waving";

  const shoeColor = outfit === "faculty_robe" ? "#1e1b2e" : "#2b2340";

  return (
    <div
      style={{ width: size, height: isFullBody ? Math.round(size * 1.25) : size }}
      className={`relative inline-flex items-center justify-center select-none overflow-visible ${
        isMoving ? "animate-jog" : ""
      } ${className}`}
    >
      <svg
        viewBox="0 0 100 126"
        className="w-full h-full drop-shadow-sm overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={facing === "left" ? "scale(-1, 1) translate(-100, 0)" : undefined}>
          {/* --- LEGS & SHOES (Nintendo Mii longer slender limbs) --- */}
          {isFullBody && (
            <g id="limbs-legs">
              {/* Left Leg */}
              <g
                style={
                  isMoving
                    ? {
                        animation: "leg-cycle-l 0.32s infinite ease-in-out",
                        transformOrigin: "36px 84px",
                      }
                    : undefined
                }
              >
                <path
                  d="M 36 84 L 36 108"
                  stroke={outfitColor}
                  strokeWidth="7.5"
                  strokeLinecap="round"
                />
                {/* Left Shoe */}
                <ellipse cx="33" cy="113" rx="7.5" ry="5" fill={shoeColor} />
                <path d="M 27 115 L 39 115" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Right Leg */}
              <g
                style={
                  isMoving
                    ? {
                        animation: "leg-cycle-r 0.32s infinite ease-in-out",
                        transformOrigin: "64px 84px",
                      }
                    : undefined
                }
              >
                <path
                  d="M 64 84 L 64 108"
                  stroke={outfitColor}
                  strokeWidth="7.5"
                  strokeLinecap="round"
                />
                {/* Right Shoe */}
                <ellipse cx="67" cy="113" rx="7.5" ry="5" fill={shoeColor} />
                <path d="M 61 115 L 73 115" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>
          )}

          {/* --- TORSO & BODY OUTFIT --- */}
          <g id="body-torso">
            {outfit === "faculty_robe" ? (
              <>
                <path
                  d="M 26 74 Q 50 70 74 74 L 80 88 Q 50 90 20 88 Z"
                  fill="#1f1b2e"
                />
                <path d="M 44 72 L 50 88 L 56 72 Z" fill="#d97706" />
                <path d="M 36 71 Q 50 78 64 71 L 60 76 Q 50 81 40 76 Z" fill="#f59e0b" />
              </>
            ) : outfit === "school_uniform" ? (
              <>
                <path
                  d="M 28 74 Q 50 71 72 74 L 78 88 Q 50 90 22 88 Z"
                  fill={outfitColor}
                />
                <polygon points="46,72 54,72 50,84" fill="#ffffff" />
                <polygon points="49,75 51,75 52,80 48,80" fill="#dc2626" />
              </>
            ) : outfit === "sweater_vest" ? (
              <>
                <path
                  d="M 28 74 Q 50 71 72 74 L 78 88 Q 50 90 22 88 Z"
                  fill="#ffffff"
                />
                <path d="M 32 74 L 42 74 L 38 88 L 26 88 Z" fill={outfitColor} />
                <path d="M 68 74 L 58 74 L 62 88 L 74 88 Z" fill={outfitColor} />
              </>
            ) : (
              /* Cozy Campus Hoodie */
              <>
                <path
                  d="M 26 74 Q 50 69 74 74 L 80 88 Q 50 91 20 88 Z"
                  fill={outfitColor}
                />
                <path
                  d="M 45 76 Q 44 83 43 86 M 55 76 Q 56 83 57 86"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            )}
          </g>

          {/* --- ARMS & HANDS (Nintendo Mii longer articulated limbs) --- */}
          {isFullBody && (
            <g id="limbs-arms">
              {/* Left Arm */}
              <g
                style={
                  isMoving
                    ? {
                        animation: "arm-cycle-l 0.32s infinite ease-in-out",
                        transformOrigin: "27px 73px",
                      }
                    : undefined
                }
              >
                <path
                  d={isMoving ? "M 27 73 Q 15 85 18 96" : "M 27 73 Q 17 85 18 97"}
                  stroke={outfitColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Left Hand - Classic Mii spherical hand */}
                <circle cx="18" cy={isMoving ? 100 : 101} r="4.5" fill={skinColor} />
              </g>

              {/* Right Arm - Dynamic: Points when user hovers! */}
              {isPointing ? (
                /* OUTSTRETCHED POINTING ARM & HAND (Longer Nintendo Mii Reach) */
                <g style={{ transformOrigin: "73px 72px" }}>
                  {/* Outstretched sleeve */}
                  <path
                    d="M 73 72 L 99 60"
                    stroke={outfitColor}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Pointing hand with extended finger */}
                  <g transform="translate(98, 57)">
                    <circle cx="4" cy="3" r="4.5" fill={skinColor} />
                    {/* Extended index finger pointing at target */}
                    <path
                      d="M 6 2 L 17 0"
                      stroke={skinColor}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    {/* Thumb */}
                    <path
                      d="M 4 0 L 6 -3.5"
                      stroke={skinColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              ) : isClicking ? (
                /* CLICKING / TAPPING DOWN ARM */
                <g style={{ transformOrigin: "73px 72px" }}>
                  <path
                    d="M 73 72 Q 88 74 93 88"
                    stroke={outfitColor}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="94" cy="92" r="4.5" fill={skinColor} />
                  {/* Tap sparkle */}
                  <circle cx="100" cy="95" r="2.2" fill="#fbbf24" />
                </g>
              ) : isWaving ? (
                /* WAVING ARM */
                <g style={{ transformOrigin: "73px 72px" }}>
                  <path
                    d="M 73 72 Q 86 52 90 36"
                    stroke={outfitColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="91" cy="32" r="4.5" fill={skinColor} />
                </g>
              ) : isMoving ? (
                /* JOGGING ARM CYCLE */
                <g
                  style={{
                    animation: "arm-cycle-r 0.32s infinite ease-in-out",
                    transformOrigin: "73px 73px",
                  }}
                >
                  <path
                    d="M 73 73 Q 85 85 82 96"
                    stroke={outfitColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="82" cy="100" r="4.5" fill={skinColor} />
                </g>
              ) : (
                /* IDLE RESTING ARM (Nintendo Mii longer slender arm) */
                <g>
                  <path
                    d="M 73 73 Q 83 85 82 97"
                    stroke={outfitColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="82" cy="101" r="4.5" fill={skinColor} />
                </g>
              )}
            </g>
          )}

          {/* --- EARS --- */}
          <circle cx="21" cy="46" r="5.5" fill={skinColor} />
          <circle cx="21" cy="46" r="3" fill="#e2a792" opacity="0.6" />
          <circle cx="79" cy="46" r="5.5" fill={skinColor} />
          <circle cx="79" cy="46" r="3" fill="#e2a792" opacity="0.6" />

          {/* --- HEAD / FACE SHAPE --- */}
          <g id="face">
            {faceShape === "chibi" ? (
              <path
                d="M 24 42 C 24 25, 76 25, 76 42 C 76 60, 66 70, 50 70 C 34 70, 24 60, 24 42 Z"
                fill={skinColor}
              />
            ) : faceShape === "oval" ? (
              <ellipse cx="50" cy="45" rx="27" ry="28" fill={skinColor} />
            ) : faceShape === "heart" ? (
              <path
                d="M 23 40 C 23 24, 77 24, 77 40 C 77 58, 62 68, 50 71 C 38 68, 23 58, 23 40 Z"
                fill={skinColor}
              />
            ) : (
              /* Classic Animal Crossing / Mii round head */
              <circle cx="50" cy="45" r="27" fill={skinColor} />
            )}

            {/* Cheeks blush (Animal Crossing iconic) */}
            <ellipse cx="33" cy="52" rx="4.5" ry="3" fill="#f43f5e" opacity="0.45" />
            <ellipse cx="67" cy="52" rx="4.5" ry="3" fill="#f43f5e" opacity="0.45" />
          </g>

          {/* --- EYES --- */}
          <g id="eyes">
            {eyeStyle === "glasses_round" ? (
              <>
                <circle cx="37" cy="44" r="8" fill="none" stroke="#222222" strokeWidth="2" />
                <circle cx="63" cy="44" r="8" fill="none" stroke="#222222" strokeWidth="2" />
                <line x1="45" y1="44" x2="55" y2="44" stroke="#222222" strokeWidth="2" />
                <circle cx="37" cy="44" r="3.5" fill={eyeColor} />
                <circle cx="63" cy="44" r="3.5" fill={eyeColor} />
                <circle cx="38" cy="43" r="1.2" fill="#ffffff" />
                <circle cx="64" cy="43" r="1.2" fill="#ffffff" />
              </>
            ) : eyeStyle === "glasses_nerd" ? (
              <>
                <rect x="29" y="38" width="16" height="12" rx="3" fill="none" stroke="#6b4fbb" strokeWidth="2.5" />
                <rect x="55" y="38" width="16" height="12" rx="3" fill="none" stroke="#6b4fbb" strokeWidth="2.5" />
                <line x1="45" y1="43" x2="55" y2="43" stroke="#6b4fbb" strokeWidth="2.5" />
                <circle cx="37" cy="44" r="3" fill={eyeColor} />
                <circle cx="63" cy="44" r="3" fill={eyeColor} />
              </>
            ) : eyeStyle === "ac_dot" ? (
              <>
                <ellipse cx="37" cy="44" rx="4.2" ry="5.5" fill={eyeColor} />
                <ellipse cx="63" cy="44" rx="4.2" ry="5.5" fill={eyeColor} />
                <circle cx="38.5" cy="42" r="1.8" fill="#ffffff" />
                <circle cx="64.5" cy="42" r="1.8" fill="#ffffff" />
                <circle cx="36" cy="46" r="0.9" fill="#ffffff" />
                <circle cx="62" cy="46" r="0.9" fill="#ffffff" />
              </>
            ) : eyeStyle === "anime_sparkle" ? (
              <>
                <ellipse cx="36" cy="43" rx="5.5" ry="7" fill={eyeColor} />
                <ellipse cx="64" cy="43" rx="5.5" ry="7" fill={eyeColor} />
                <ellipse cx="37.5" cy="41" rx="2.5" ry="3" fill="#ffffff" />
                <ellipse cx="65.5" cy="41" rx="2.5" ry="3" fill="#ffffff" />
                <circle cx="35" cy="46" r="1.2" fill="#ffffff" />
                <circle cx="63" cy="46" r="1.2" fill="#ffffff" />
              </>
            ) : eyeStyle === "chill" ? (
              <>
                <path
                  d="M 32 44 Q 37 40 42 44"
                  stroke={eyeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 58 44 Q 63 40 68 44"
                  stroke={eyeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : (
              <>
                <ellipse cx="37" cy="44" rx="3.5" ry="5" fill={eyeColor} />
                <ellipse cx="63" cy="44" rx="3.5" ry="5" fill={eyeColor} />
                <circle cx="38" cy="42.5" r="1.2" fill="#ffffff" />
                <circle cx="64" cy="42.5" r="1.2" fill="#ffffff" />
              </>
            )}

            {/* Eyebrows */}
            <path
              d="M 33 36 Q 37 33 42 35"
              stroke={hairColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 58 35 Q 63 33 67 36"
              stroke={hairColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* --- NOSE & MOUTH --- */}
          <g id="nose-mouth">
            <ellipse cx="50" cy="50" rx="1.5" ry="1.2" fill="#d97768" opacity="0.7" />

            {mouthStyle === "cat_w" ? (
              <path
                d="M 44 56 Q 47 59 50 56 Q 53 59 56 56"
                stroke="#4a2820"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            ) : mouthStyle === "open" ? (
              <path
                d="M 45 55 Q 50 62 55 55 Z"
                fill="#e11d48"
                stroke="#4a2820"
                strokeWidth="1.2"
              />
            ) : mouthStyle === "grin" ? (
              <path
                d="M 43 55 Q 50 61 57 55 Q 50 57 43 55"
                fill="#ffffff"
                stroke="#4a2820"
                strokeWidth="1.5"
              />
            ) : (
              <path
                d="M 45 56 Q 50 60 55 56"
                stroke="#4a2820"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>

          {/* --- HAIR --- */}
          <g id="hair">
            {hairStyle === "spiky" ? (
              <path
                d="M 22 40 C 20 22, 30 12, 50 12 C 70 12, 80 22, 78 40 C 76 34, 72 29, 68 27 C 65 18, 58 16, 54 22 C 48 14, 40 16, 36 23 C 30 25, 25 32, 22 40 Z"
                fill={hairColor}
              />
            ) : hairStyle === "tomodachi_bob" ? (
              <path
                d="M 21 48 C 18 24, 28 12, 50 12 C 72 12, 82 24, 79 48 C 77 40, 73 28, 66 26 C 58 29, 42 29, 34 26 C 27 28, 23 40, 21 48 Z"
                fill={hairColor}
              />
            ) : hairStyle === "twintails" ? (
              <>
                <ellipse cx="16" cy="42" rx="8" ry="16" fill={hairColor} transform="rotate(15 16 42)" />
                <ellipse cx="84" cy="42" rx="8" ry="16" fill={hairColor} transform="rotate(-15 84 42)" />
                <path
                  d="M 22 40 C 22 18, 78 18, 78 40 C 74 32, 64 28, 50 28 C 36 28, 26 32, 22 40 Z"
                  fill={hairColor}
                />
              </>
            ) : hairStyle === "curly" ? (
              <path
                d="M 20 44 C 18 30, 22 16, 34 12 C 42 10, 58 10, 66 12 C 78 16, 82 30, 80 44 C 76 34, 72 26, 60 26 C 50 28, 40 26, 30 28 C 25 32, 22 38, 20 44 Z"
                fill={hairColor}
              />
            ) : hairStyle === "afro" ? (
              <circle cx="50" cy="36" r="32" fill={hairColor} />
            ) : hairStyle === "cap" ? (
              <>
                <path d="M 22 38 C 24 18, 76 18, 78 38 Z" fill="#3b82f6" />
                <path d="M 20 38 Q 50 42 84 36 L 88 41 Q 50 48 18 41 Z" fill="#2563eb" />
              </>
            ) : hairStyle === "ac_wavy" ? (
              <>
                <path
                  d="M 21 46 C 18 24, 30 12, 50 12 C 70 12, 82 24, 79 46 C 77 36, 70 26, 58 26 C 45 26, 38 28, 30 26 C 24 30, 22 38, 21 46 Z"
                  fill={hairColor}
                />
                <path d="M 30 26 Q 44 36 56 28 Q 45 24 30 26 Z" fill={hairColor} />
              </>
            ) : (
              <path
                d="M 22 40 C 22 18, 78 18, 78 40 C 72 30, 62 24, 50 24 C 38 24, 28 30, 22 40 Z"
                fill={hairColor}
              />
            )}

            {/* Hair shine */}
            <path
              d="M 38 18 Q 50 16 62 19"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.35"
              fill="none"
            />
          </g>

          {/* --- ACCESSORIES --- */}
          {showAccessories && (
            <g id="accessories">
              {accessory === "grad_cap" ? (
                <>
                  <polygon points="50,1 84,13 50,25 16,13" fill="#18181b" />
                  <rect x="36" y="17" width="28" height="7" rx="2" fill="#27272a" />
                  <line x1="50" y1="13" x2="78" y2="25" stroke="#f59e0b" strokeWidth="1.8" />
                  <circle cx="78" cy="26" r="2.5" fill="#f59e0b" />
                </>
              ) : accessory === "cat_ears" ? (
                <>
                  <polygon points="26,20 34,4 44,16" fill={hairColor} />
                  <polygon points="29,18 34,7 41,15" fill="#f43f5e" />
                  <polygon points="74,20 66,4 56,16" fill={hairColor} />
                  <polygon points="71,18 66,7 59,15" fill="#f43f5e" />
                </>
              ) : accessory === "star_pin" ? (
                <polygon
                  points="72,22 74,26 78,27 75,30 76,34 72,32 68,34 69,30 66,27 70,26"
                  fill="#fbbf24"
                  stroke="#d97706"
                  strokeWidth="0.8"
                />
              ) : accessory === "headband" ? (
                <path d="M 22 34 Q 50 22 78 34" stroke="#ec4899" strokeWidth="4" fill="none" />
              ) : accessory === "pencil_ear" ? (
                <line x1="74" y1="40" x2="88" y2="32" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
              ) : accessory === "coffee_mug" && !isPointing ? (
                <g transform="translate(68, 64) scale(0.6)">
                  <rect x="0" y="0" width="16" height="20" rx="3" fill="#ffffff" stroke="#6b4fbb" strokeWidth="2" />
                  <path d="M 16 4 Q 22 10 16 16" fill="none" stroke="#6b4fbb" strokeWidth="2" />
                  <path d="M 4 -4 Q 8 -8 4 -12 M 10 -4 Q 14 -8 10 -12" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
                </g>
              ) : null}
            </g>
          )}

          {/* --- MOOD OVERLAYS --- */}
          {mood === "alarmed" ? (
            <g transform="translate(76, 6)">
              <circle cx="6" cy="6" r="8" fill="#e11d48" />
              <text x="6" y="11" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">!</text>
            </g>
          ) : mood === "thinking" ? (
            <g transform="translate(74, 6)">
              <circle cx="2" cy="10" r="2" fill="#6b4fbb" opacity="0.6" />
              <circle cx="6" cy="6" r="3" fill="#6b4fbb" opacity="0.8" />
              <circle cx="12" cy="0" r="5" fill="#6b4fbb" />
              <text x="12" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">?</text>
            </g>
          ) : mood === "celebrating" ? (
            <g transform="translate(70, 4)">
              <circle cx="0" cy="0" r="2" fill="#fbbf24" />
              <circle cx="10" cy="-4" r="2.5" fill="#ec4899" />
              <circle cx="16" cy="6" r="2" fill="#3b82f6" />
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  );
};
