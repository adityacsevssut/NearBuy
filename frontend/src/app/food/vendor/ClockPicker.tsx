"use client";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ClockPickerProps {
  value: string;          // "HH:MM" 24-hour
  onChange: (val: string) => void;
  onClose: () => void;
}

function to12(h24: number): { h: number; ampm: "AM" | "PM" } {
  if (h24 === 0) return { h: 12, ampm: "AM" };
  if (h24 < 12) return { h: h24, ampm: "AM" };
  if (h24 === 12) return { h: 12, ampm: "PM" };
  return { h: h24 - 12, ampm: "PM" };
}
function to24(h12: number, ampm: "AM" | "PM"): number {
  if (ampm === "AM") return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

export default function ClockPicker({ value, onChange, onClose }: ClockPickerProps) {
  const [hh, mm] = value.split(":").map(Number);
  const init12 = to12(hh || 0);

  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const [hour12, setHour12] = useState(init12.h);
  const [minute, setMinute] = useState(mm || 0);
  const [ampm, setAmpm] = useState<"AM" | "PM">(init12.ampm);

  const dialRef = useRef<SVGSVGElement>(null);

  const SIZE = 220;
  const CENTER = SIZE / 2;
  const RADIUS = 82;

  // Commit change whenever hour/minute/ampm changes
  useEffect(() => {
    const h24 = to24(hour12, ampm);
    const pad = (n: number) => String(n).padStart(2, "0");
    onChange(`${pad(h24)}:${pad(minute)}`);
  }, [hour12, minute, ampm]);

  // Build positions for clock numbers
  const hourNums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNums = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  function posOnDial(index: number, total: number, r: number) {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    };
  }

  // Compute the "hand" angle for the selected value
  function handAngle() {
    if (mode === "hour") {
      const idx = hourNums.indexOf(hour12);
      return (idx / 12) * 360 - 90;
    }
    const idx = minuteNums.indexOf(minuteNums.reduce((a, b) =>
      Math.abs(b - minute) < Math.abs(a - minute) ? b : a
    ));
    return (idx / 12) * 360 - 90;
  }

  function handleDialClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = dialRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - CENTER;
    const y = e.clientY - rect.top - CENTER;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    const steps = 12;
    const idx = Math.round(angle / (2 * Math.PI / steps)) % steps;

    if (mode === "hour") {
      setHour12(hourNums[idx]);
      setTimeout(() => setMode("minute"), 200);
    } else {
      setMinute(minuteNums[idx]);
    }
  }

  const handRad = (handAngle() + 90) * (Math.PI / 180);
  const handX = CENTER + RADIUS * Math.cos(handRad - Math.PI / 2);
  const handY = CENTER + RADIUS * Math.sin(handRad - Math.PI / 2);

  const displayH = String(hour12).padStart(2, "0");
  const displayM = String(minute).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ duration: 0.18 }}
      className="absolute z-[300] top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#2A2A3A] p-5 select-none"
      style={{ width: 260 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Time display */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <button
          onClick={() => setMode("hour")}
          className={`text-3xl font-black px-2 py-1 rounded-xl transition-colors ${mode === "hour" ? "bg-orange-500 text-white" : "text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1F1F2E]"}`}
        >
          {displayH}
        </button>
        <span className="text-3xl font-black text-gray-400">:</span>
        <button
          onClick={() => setMode("minute")}
          className={`text-3xl font-black px-2 py-1 rounded-xl transition-colors ${mode === "minute" ? "bg-orange-500 text-white" : "text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1F1F2E]"}`}
        >
          {displayM}
        </button>

        {/* AM / PM */}
        <div className="flex flex-col gap-1 ml-1">
          <button
            onClick={() => setAmpm("AM")}
            className={`text-[11px] font-black px-2 py-1 rounded-lg transition-colors ${ampm === "AM" ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-[#1F1F2E] text-gray-500 dark:text-gray-400"}`}
          >AM</button>
          <button
            onClick={() => setAmpm("PM")}
            className={`text-[11px] font-black px-2 py-1 rounded-lg transition-colors ${ampm === "PM" ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-[#1F1F2E] text-gray-500 dark:text-gray-400"}`}
          >PM</button>
        </div>
      </div>

      {/* Mode label */}
      <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {mode === "hour" ? "Select Hour" : "Select Minute"}
      </p>

      {/* Circular Dial */}
      <svg
        ref={dialRef}
        width={SIZE}
        height={SIZE}
        className="mx-auto cursor-pointer"
        onClick={handleDialClick}
      >
        {/* Outer ring */}
        <circle cx={CENTER} cy={CENTER} r={CENTER - 6} fill="none" stroke="currentColor" strokeWidth={1} className="text-gray-100 dark:text-[#1F1F2E]" />
        {/* Filled background */}
        <circle cx={CENTER} cy={CENTER} r={CENTER - 6} className="fill-gray-50 dark:fill-[#151522]" />

        {/* Clock hand */}
        <line
          x1={CENTER} y1={CENTER}
          x2={handX} y2={handY}
          stroke="#f97316"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={CENTER} cy={CENTER} r={4} fill="#f97316" />
        {/* Hand tip circle */}
        <circle cx={handX} cy={handY} r={18} fill="#f97316" opacity={0.2} />
        <circle cx={handX} cy={handY} r={10} fill="#f97316" />

        {/* Numbers */}
        {(mode === "hour" ? hourNums : minuteNums).map((num, i) => {
          const pos = posOnDial(i, 12, RADIUS);
          const isSelected = mode === "hour"
            ? num === hour12
            : num === minuteNums.reduce((a, b) => Math.abs(b - minute) < Math.abs(a - minute) ? b : a);
          return (
            <g key={num}>
              <circle cx={pos.x} cy={pos.y} r={16}
                fill={isSelected ? "#f97316" : "transparent"}
                className="transition-colors duration-100"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight="bold"
                fill={isSelected ? "white" : undefined}
                className={isSelected ? "" : "fill-gray-700 dark:fill-gray-300"}
              >
                {mode === "minute" ? String(num).padStart(2, "0") : num}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Done button */}
      <button
        onClick={onClose}
        className="mt-4 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-colors shadow-md shadow-orange-500/20 active:scale-95"
      >
        Done
      </button>
    </motion.div>
  );
}
