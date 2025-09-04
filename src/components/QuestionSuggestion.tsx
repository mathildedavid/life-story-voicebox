import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Lightbulb } from 'lucide-react';

const LIFE_STORY_QUESTIONS = [
  "Where and when were you born, and what was your hometown like?",
  "Tell me about your parents - what were they like and what did they do?",
  "Do you have siblings? What was your relationship with them growing up?",
  "What are your earliest childhood memories?",
  "What kind of child were you - shy, outgoing, curious, rebellious?",
  "What family traditions or values shaped you most?",
  "Who was your biggest influence growing up and why?",
  "What schools did you attend and how did they shape you?",
  "Were you a good student? What subjects interested you most?",
  "What extracurricular activities were you involved in?",
  "Who was your most memorable teacher and what did they teach you?",
  "What were your teenage years like?",
  "What did you want to be when you grew up?",
  "How did you choose your career path?",
  "What was your first job and what did you learn from it?",
  "What has been your most significant professional achievement?",
  "What was your biggest professional failure and what did it teach you?",
  "Who were your mentors or role models in your field?",
  "What skills or qualities have been most important to your success?",
  "How has your industry or field changed during your career?",
  "Tell me about meeting your spouse/partner - what attracted you to them?",
  "What has been the key to your lasting relationships?",
  "Do you have children? How has parenthood changed you?",
  "Who are your closest friends and how did you meet them?",
  "What role has friendship played in your life?",
  "What has been the most difficult period of your life?",
  "What major decisions or turning points shaped your path?",
  "How do you handle failure or setbacks?",
  "What fears have you had to overcome?",
  "What would you do differently if you could go back?",
  "What principles or values guide your decisions?",
  "How have your beliefs or worldview changed over time?",
  "What does success mean to you?",
  "What are you most proud of in your life?",
  "What legacy do you hope to leave?",
  "What are your hobbies or passions outside of work?",
  "What books, movies, or music have influenced you most?",
  "Where do you feel most at home or peaceful?",
  "What makes you laugh?",
  "How do you like to spend your free time?",
  "What advice would you give to your younger self?",
  "What has surprised you most about getting older?",
  "What do you wish more people understood about you or your field?",
  "What are you still learning or working to improve?",
  "What question do you wish I had asked?",
  "What are you most excited about for the future?",
  "What goals or dreams do you still want to pursue?",
  "How do you want to be remembered?",
  "What would you want people to learn from your story?",
  "If you could have dinner with anyone, living or dead, who would it be and why?"
];

export const QuestionSuggestion = () => {
  const [currentQuestion, setCurrentQuestion] = useState(() => 
    LIFE_STORY_QUESTIONS[Math.floor(Math.random() * LIFE_STORY_QUESTIONS.length)]
  );

  const getNewQuestion = () => {
    let newQuestion;
    do {
      newQuestion = LIFE_STORY_QUESTIONS[Math.floor(Math.random() * LIFE_STORY_QUESTIONS.length)];
    } while (newQuestion === currentQuestion && LIFE_STORY_QUESTIONS.length > 1);
    setCurrentQuestion(newQuestion);
  };

  return (
    <motion.div
      className="rounded-2xl bg-white/50 backdrop-blur-md shadow-lg p-6 border border-white/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-600" />
        <h3 className="text-sm font-medium text-gray-700">Need inspiration?</h3>
      </div>
      
      <div className="relative">
        <p className="text-gray-700 leading-relaxed text-sm mb-0">
          {currentQuestion}
        </p>
        <button 
          onClick={getNewQuestion}
          className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Get another suggestion"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3 italic">
        This is just a suggestion - feel free to share any story you'd like!
      </p>
    </motion.div>
  );
};