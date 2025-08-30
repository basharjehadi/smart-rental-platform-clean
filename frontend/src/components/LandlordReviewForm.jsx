import React, { useState } from 'react';
import { Star, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LandlordReviewForm = ({ onSubmit, onClose, reviewData = null }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    onTime: reviewData?.onTime || 0,
    care: reviewData?.care || 0,
    communication: reviewData?.communication || 0,
    moveOut: reviewData?.moveOut || 0,
    overall: reviewData?.overall || 0,
    text: reviewData?.text || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = [
    {
      key: 'onTime',
      label: t('review.forms.landlordToTenant.onTime'),
      description: t('review.forms.landlordToTenant.onTimeDesc'),
    },
    {
      key: 'care',
      label: t('review.forms.landlordToTenant.care'),
      description: t('review.forms.landlordToTenant.careDesc'),
    },
    {
      key: 'communication',
      label: t('review.forms.landlordToTenant.communication'),
      description: t('review.forms.landlordToTenant.communicationDesc'),
    },
    {
      key: 'moveOut',
      label: t('review.forms.landlordToTenant.moveOut'),
      description: t('review.forms.landlordToTenant.moveOutDesc'),
    },
    {
      key: 'overall',
      label: t('review.forms.landlordToTenant.overall'),
      description: t('review.forms.landlordToTenant.overallDesc'),
    },
  ];

  const validateForm = () => {
    const newErrors = {};

    criteria.forEach(criterion => {
      if (!formData[criterion.key] || formData[criterion.key] < 1) {
        newErrors[criterion.key] = t(
          'review.forms.common.validation.ratingRequired'
        );
      }
    });

    if (!formData.text.trim()) {
      newErrors.text = t('review.forms.common.validation.commentRequired');
    } else if (formData.text.trim().length < 10) {
      newErrors.text = t('review.forms.common.validation.commentMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const stripPII = text => {
    // Remove common PII patterns
    const piiPatterns = [
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
      /\b\d{3}\.\d{3}\.\d{4}\b/g, // Phone numbers with dots
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
      /\b\d{5}(-\d{4})?\b/g, // ZIP codes
      /\b[A-Z]{2}\s\d{2}\s[A-Z]{2}\s\d{4}\b/g, // License plates
      /\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g, // Credit card numbers
      /\b\d{2}\/\d{2}\/\d{4}\b/g, // Dates
      /\b\d{1,2}:\d{2}\s?(AM|PM)?\b/gi, // Times
    ];

    let cleanedText = text;
    piiPatterns.forEach(pattern => {
      cleanedText = cleanedText.replace(pattern, '[REDACTED]');
    });

    // Remove specific property addresses and names
    cleanedText = cleanedText.replace(
      /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Place|Pl|Court|Ct)\b/gi,
      '[ADDRESS REDACTED]'
    );
    cleanedText = cleanedText.replace(
      /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g,
      match => {
        // Keep common names but redact others
        const commonNames = [
          'John',
          'Jane',
          'Mike',
          'Sarah',
          'David',
          'Lisa',
          'Tom',
          'Anna',
        ];
        return commonNames.some(name => match.includes(name))
          ? match
          : '[NAME REDACTED]';
      }
    );

    return cleanedText;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Strip PII before submission
      const cleanedData = {
        ...formData,
        text: stripPII(formData.text),
      };

      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (criterion, rating) => {
    setFormData(prev => ({ ...prev, [criterion]: rating }));
    if (errors[criterion]) {
      setErrors(prev => ({ ...prev, [criterion]: null }));
    }
  };

  const handleTextChange = e => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, text: value }));
    if (errors.text) {
      setErrors(prev => ({ ...prev, text: null }));
    }
  };

  const renderStars = (criterion, value) => {
    return (
      <div className='flex items-center space-x-1'>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type='button'
            onClick={() => handleRatingChange(criterion, star)}
            className='focus:outline-none transition-colors'
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className='ml-2 text-sm font-medium text-gray-700'>
          {value > 0 ? `${value}/5` : t('review.forms.common.notRated')}
        </span>
      </div>
    );
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {t('review.forms.landlordToTenant.title')}
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Rating Criteria */}
          <div className='space-y-4'>
            {criteria.map(criterion => (
              <div key={criterion.key} className='space-y-2'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {criterion.label}
                  </label>
                  <p className='text-xs text-gray-500 mb-2'>
                    {criterion.description}
                  </p>
                </div>
                {renderStars(criterion.key, formData[criterion.key])}
                {errors[criterion.key] && (
                  <div className='flex items-center space-x-1 text-red-600 text-xs'>
                    <AlertCircle className='w-3 h-3' />
                    <span>{errors[criterion.key]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Review Text */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              {t('review.forms.common.reviewComment')}
            </label>
            <textarea
              value={formData.text}
              onChange={handleTextChange}
              rows={4}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
              placeholder={t('review.forms.common.commentPlaceholder')}
            />
            {errors.text && (
              <div className='flex items-center space-x-1 text-red-600 text-xs'>
                <AlertCircle className='w-3 h-3' />
                <span>{errors.text}</span>
              </div>
            )}
            <p className='text-xs text-gray-500'>
              {t('review.forms.common.piiNotice')}
            </p>
          </div>

          {/* Submit Button */}
          <div className='flex space-x-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              {t('review.actions.cancel')}
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {isSubmitting
                ? t('review.actions.submitting')
                : t('review.actions.submitReview')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandlordReviewForm;
