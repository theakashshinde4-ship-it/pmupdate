import PropTypes from 'prop-types';

export default function VIPBadge({ tier }) {
  if (!tier) return null;

  const tierConfig = {
    platinum: {
      label: 'PLATINUM',
      bg: 'bg-gradient-to-r from-gray-400 to-gray-600',
      text: 'text-white',
      icon: '👑'
    },
    gold: {
      label: 'GOLD',
      bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      text: 'text-white',
      icon: '⭐'
    },
    silver: {
      label: 'SILVER',
      bg: 'bg-gradient-to-r from-gray-300 to-gray-400',
      text: 'text-gray-800',
      icon: '✨'
    }
  };

  const config = tierConfig[tier.toLowerCase()] || tierConfig.silver;

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
      ${config.bg} ${config.text}
      shadow-sm
    `}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

VIPBadge.propTypes = {
  tier: PropTypes.oneOf(['platinum', 'gold', 'silver', 'Platinum', 'Gold', 'Silver'])
};
