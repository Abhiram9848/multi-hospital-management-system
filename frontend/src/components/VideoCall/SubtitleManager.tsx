import React, { useState, useEffect } from 'react';
import './SubtitleManager.css';

interface SubtitleManagerProps {
  subtitle: string;
  language: string;
  onLanguageChange: (language: string) => void;
  availableLanguages: Array<{ code: string; name: string }>;
}

const SubtitleManager: React.FC<SubtitleManagerProps> = ({
  subtitle,
  language,
  onLanguageChange,
  availableLanguages
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedSubtitle, setDisplayedSubtitle] = useState('');

  useEffect(() => {
    if (subtitle) {
      setDisplayedSubtitle(subtitle);
      setIsVisible(true);

      // Auto-hide subtitle after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [subtitle]);

  const getCurrentLanguageName = () => {
    const lang = availableLanguages.find(l => l.code === language);
    return lang ? lang.name : 'Unknown';
  };

  if (!isVisible || !displayedSubtitle) {
    return null;
  }

  return (
    <div className="subtitle-container">
      <div className="subtitle-content">
        <p className="subtitle-text">{displayedSubtitle}</p>
        <div className="subtitle-controls">
          <span className="subtitle-language">
            {getCurrentLanguageName()}
          </span>
          <select
            className="subtitle-language-selector"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            title="Change subtitle language"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SubtitleManager;
