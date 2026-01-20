import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectedDateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isToday: boolean;
  formatDate: (date: Date) => string;
  goToToday: () => void;
}

const SelectedDateContext = createContext<SelectedDateContextType | undefined>(undefined);

export const SelectedDateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <SelectedDateContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        isToday,
        formatDate,
        goToToday,
      }}
    >
      {children}
    </SelectedDateContext.Provider>
  );
};

export const useSelectedDate = (): SelectedDateContextType => {
  const context = useContext(SelectedDateContext);
  if (context === undefined) {
    throw new Error('useSelectedDate must be used within a SelectedDateProvider');
  }
  return context;
};
