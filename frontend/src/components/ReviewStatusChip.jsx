import React from 'react';
import { Clock, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CountdownTimer from './CountdownTimer';

const ReviewStatusChip = ({ status, publishAfter, isBlind = false }) => {
  const { t } = useTranslation();
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          label: t('review.status.pending'),
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-3 h-3" />
        };
      case 'SUBMITTED':
        if (isBlind && publishAfter) {
          return {
            label: t('review.status.blind'),
            color: 'bg-orange-100 text-orange-800 border-orange-200',
            icon: <Eye className="w-3 h-3" />,
            showCountdown: true
          };
        }
        return {
          label: t('review.status.pending'),
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Clock className="w-3 h-3" />
        };
      case 'PUBLISHED':
        return {
          label: t('review.status.published'),
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'BLOCKED':
        return {
          label: t('review.status.blocked'),
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="w-3 h-3" />
        };
      default:
        return {
          label: t('review.status.unknown'),
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-3 h-3" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col space-y-1">
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
      
      {config.showCountdown && publishAfter && (
        <CountdownTimer targetDate={publishAfter} />
      )}
    </div>
  );
};

export default ReviewStatusChip;
