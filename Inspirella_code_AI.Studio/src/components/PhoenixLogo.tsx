import React from "react";

interface PhoenixLogoProps {
  className?: string;
  size?: number | string;
}

export default function PhoenixLogo({ className = "", size = "100%" }: PhoenixLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`text-violet-500 select-none ${className}`}
      fill="currentColor"
    >
      <defs>
        {/* Elite Violet Gold/Pink gradient matching both light and dark styles */}
        <linearGradient id="phoenix-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="40%" stopColor="#8b5cf6" />
          <stop offset="70%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        
        {/* Soft violet backing aura */}
        <radialGradient id="phoenix-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle backing glow */}
      <circle cx="256" cy="256" r="230" fill="url(#phoenix-glow)" />

      {/* 4-POINT STAR (SPARKLE) ON TOP */}
      <path
        d="M 256,60  Q 256,110 216,110  Q 256,110 256,160  Q 256,110 296,110  Q 256,110 256,60 Z"
        fill="url(#phoenix-grad)"
        filter="drop-shadow(0px 2px 4px rgba(139, 92, 246, 0.4))"
      />

      {/* LAUREL WREATH BRANCH LEAVES */}
      <g fill="url(#phoenix-grad)" opacity="0.85">
        {/* Left Branch */}
        <path d="M 200,410 C 130,370 100,280 115,190 C 117,175 125,185 123,195 C 110,265 130,340 190,385 C 195,389 202,400 198,408 Z" opacity="0.6"/>
        {/* Left Leaves */}
        <path d="M 125,180 Q 95,170 100,140 Q 115,155 125,180 Z" />
        <path d="M 120,225 Q 85,225 85,190 Q 105,200 120,225 Z" />
        <path d="M 118,275 Q 80,290 75,250 Q 100,255 118,275 Z" />
        <path d="M 125,325 Q 90,350 80,310 Q 105,310 125,325 Z" />
        <path d="M 140,370 Q 105,400 100,360 Q 123,355 140,370 Z" />
        <path d="M 170,410 Q 135,445 135,400 Q 155,395 170,410 Z" />
        <path d="M 215,440 Q 185,475 180,430 Q 200,425 215,440 Z" />

        {/* Right Branch */}
        <path d="M 312,410 C 382,370 412,280 397,190 C 395,175 387,185 389,195 C 402,265 382,340 322,385 C 317,389 310,400 314,408 Z" opacity="0.6"/>
        {/* Right Leaves */}
        <path d="M 387,180 Q 417,170 412,140 Q 397,155 387,180 Z" />
        <path d="M 392,225 Q 427,225 427,190 Q 407,200 392,225 Z" />
        <path d="M 394,275 Q 432,290 437,250 Q 412,255 394,275 Z" />
        <path d="M 387,325 Q 422,350 432,310 Q 407,310 387,325 Z" />
        <path d="M 372,370 Q 407,400 412,360 Q 389,355 372,370 Z" />
        <path d="M 342,410 Q 377,445 377,400 Q 357,395 342,410 Z" />
        <path d="M 297,440 Q 327,475 332,430 Q 312,425 297,440 Z" />
      </g>

      {/* PHOENIX RISING WITH SPREAD WINGS */}
      <g fill="url(#phoenix-grad)">
        {/* Tail Feathers - Beautiful Flowing Ornaments */}
        <path d="M 256,360 C 236,410 216,460 216,480 C 216,490 236,495 256,495 C 276,495 296,490 296,480 C 296,460 276,410 256,360 Z" opacity="0.95" />
        <path d="M 256,360 C 246,400 230,440 240,465 C 243,472 250,470 256,470 C 262,470 269,472 272,465 C 282,440 266,400 256,360 Z" />
        <path d="M 256,360 C 216,396 176,432 176,450 C 176,460 196,460 216,440 C 236,420 246,390 256,360 Z" opacity="0.8" />
        <path d="M 256,360 C 296,396 336,432 336,450 C 336,460 316,460 296,440 C 276,420 266,390 256,360 Z" opacity="0.8" />

        {/* Central Torso / Spine */}
        <path d="M 256,210 C 241,270 241,330 256,365 C 271,330 271,270 256,210 Z" />

        {/* Left Wing - Segmented Royal Feathers */}
        <path d="M 246,240 C 196,190 126,200 96,240 C 116,245 156,255 186,275 C 206,288 236,310 242,320 C 238,290 242,260 246,240 Z" />
        <path d="M 242,260 C 182,220 112,240 82,290 C 112,290 142,295 172,310 C 192,320 222,340 238,348 C 235,310 238,285 242,260 Z" opacity="0.9" />
        <path d="M 238,285 C 168,260 108,290 86,340 C 116,330 146,335 171,345 C 191,353 216,370 228,375 C 228,345 233,315 238,285 Z" opacity="0.8" />
        <path d="M 232,310 C 172,305 122,345 102,390 C 132,370 162,370 182,378 C 202,386 218,396 222,400 C 222,370 227,340 232,310 Z" opacity="0.7" />

        {/* Right Wing - Segmented Royal Feathers */}
        <path d="M 266,240 C 316,190 386,200 416,240 C 396,245 356,255 326,275 C 306,288 276,310 270,320 C 274,290 270,260 266,240 Z" />
        <path d="M 270,260 C 330,220 400,240 430,290 C 400,290 370,295 340,310 C 320,320 290,340 274,348 C 277,310 274,285 270,260 Z" opacity="0.9" />
        <path d="M 274,285 C 344,260 404,290 426,340 C 396,330 366,335 341,345 C 321,353 296,370 284,375 C 284,345 279,315 274,285 Z" opacity="0.8" />
        <path d="M 280,310 C 340,305 390,345 410,390 C 380,370 350,370 330,378 C 310,386 294,396 290,400 C 290,370 285,340 280,310 Z" opacity="0.7" />

        {/* Head and Royal Crown (Looking Left like a classic emblem phoenix) */}
        <path d="M 256,210 C 256,183 241,170 241,170 C 248,172 254,175 258,180 C 259,173 261,168 266,164 C 265,173 268,179 271,185 C 271,185 281,190 271,200 C 265,206 257,208 256,210 Z" />
        <path d="M 256,185 C 251,185 243,190 243,195 C 248,196 253,195 256,192 Z" fill="#ec4899" />
      </g>
    </svg>
  );
}
