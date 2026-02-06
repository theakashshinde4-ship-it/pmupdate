import React from 'react';
import './StatsCard.css';

export default function StatsCard({ title, value, unit, trend }) {
  return (
    <div className="stats-card">
      <div className="stats-title">{title}</div>
      <div className="stats-value">{value}{unit ? <span className="stats-unit">{unit}</span> : null}</div>
      {trend && <div className={`stats-trend ${trend > 0 ? 'up' : 'down'}`}>{trend > 0 ? `+${trend}%` : `${trend}%`}</div>}
    </div>
  );
}
