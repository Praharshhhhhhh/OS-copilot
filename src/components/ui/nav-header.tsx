"use client"; 

import React, { useState } from "react";
import { motion } from "motion/react";

export function NavHeader({ tabs, activeTab, onTabSelect }: { tabs: string[], activeTab: string, onTabSelect: (tab: string) => void }) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <ul
      className="relative mx-auto flex w-fit rounded-full border border-white/10 bg-black/50 backdrop-blur-md p-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      onMouseLeave={() => setHoveredTab(null)}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const isHovered = hoveredTab === tab;

        return (
          <li
            key={tab}
            onMouseEnter={() => setHoveredTab(tab)}
            className="relative block"
          >
            <button 
              onClick={() => onTabSelect(tab)} 
              className={`block w-full h-full relative z-10 cursor-pointer px-4 py-2 text-sm font-medium transition-colors md:px-6 md:py-2.5 ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {tab}
            </button>
            
            {isActive && (
              <motion.div
                layoutId="nav-active-tab"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            {!isActive && isHovered && (
              <motion.div
                layoutId="nav-hover-tab"
                className="absolute inset-0 rounded-full bg-white/10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
