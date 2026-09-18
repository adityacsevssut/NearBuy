"use client";

import React from 'react';
import styles from './ThemeSwitch.module.css';

interface ThemeSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  themeColor?: 'orange' | 'blue' | 'green';
}

export default function ThemeSwitch({ checked, onChange, themeColor = 'orange' }: ThemeSwitchProps) {
  let activeColor = '#f97316'; // orange-500
  if (themeColor === 'blue') activeColor = '#3b82f6'; // blue-500
  if (themeColor === 'green') activeColor = '#22c55e'; // green-500

  return (
    <label className={styles.switch} style={{ '--active-color': activeColor } as React.CSSProperties}>
      <input
        className={styles.cb}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.toggle}>
        <span className={styles.left}>off</span>
        <span className={styles.right}>
          on
        </span>
      </span>
    </label>
  );
}
