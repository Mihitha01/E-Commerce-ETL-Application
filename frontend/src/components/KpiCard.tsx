import React, { memo } from 'react';

interface KpiCardProps {
  title: string;
  value: number;
}

// REQUIREMENT: React.memo
// This component will ONLY re-render if the 'title' or 'value' props change.
const KpiCard = memo(({ title, value }: KpiCardProps) => {
  console.log(`Rendering KPI Card: ${title}`); // You'll see this fires less often!
  
  return (
    <div className="mb-8 p-6 bg-blue-600 text-white rounded-lg shadow inline-block">
      <h2 className="text-lg font-medium opacity-80">{title}</h2>
      <p className="text-4xl font-bold">₹{value.toFixed(2)}</p>
    </div>
  );
});

export default KpiCard;