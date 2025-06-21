import React, { useState, useEffect } from 'react';
import { qaData, getAnswerById } from './qaData';
import { FaTimes } from 'react-icons/fa';
import '../../styles/AIChat.css';

const QAChat = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [headerText, setHeaderText] = useState('');
  const [language, setLanguage] = useState('en');

  const fullHeaderTexts = {
    ua: "Якби у вас був шанс взяти у мене інтерв'ю... про що б ви запитали?",
    en: 'If you had a chance to interview me...what would you ask?'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => {
    setHeaderText('');
    const fullHeaderText = fullHeaderTexts[language];
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullHeaderText.length) {
        setHeaderText(fullHeaderText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [language, isOpen]);

  const handleLanguageSwitch = (lang) => {
    setLanguage(lang);
    setSelectedQuestionId(null);
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestionId(selectedQuestionId === questionId ? null : questionId);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="chat-popup-overlay" onClick={handleClose}>
      <div className="chat-popup-content" onClick={e => e.stopPropagation()}>
        <div className="chat-popup-header">
          <div className="language-switcher">
            <button
              onClick={() => handleLanguageSwitch('ua')}
              className={`lang-btn ${language === 'ua' ? 'active' : ''}`}
            >
              UA
            </button>
            <button
              onClick={() => handleLanguageSwitch('en')}
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            >
              EN
            </button>
          </div>
          <h3>{headerText}</h3>
          <button onClick={handleClose} className="chat-popup-close">
            <FaTimes />
          </button>
        </div>

        <div className="questions-container">
          <div className="questions-list">
            {qaData[language].map((qa) => {
              const isSelected = selectedQuestionId === qa.id;
              const answer = isSelected ? getAnswerById(qa.id, language)?.answer : null;
              
              return (
                <div key={qa.id} className="qa-item">
                  <button
                    className="question-button"
                    onClick={() => handleQuestionSelect(qa.id)}
                    aria-expanded={isSelected}
                  >
                    {qa.question}
                  </button>
                  <div
                    className={`answer-panel ${isSelected ? 'expanded' : ''}`}
                    aria-hidden={!isSelected}
                  >
                    <div className="answer-content">
                      {answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QAChat; 