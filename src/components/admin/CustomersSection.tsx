import { useState } from 'react';
import CustomersList from './CustomersList';
import CustomerProfile from './CustomerProfile';
import CustomerGroups from './CustomerGroups';

type View = 'list' | 'profile' | 'groups';

export default function CustomersSection() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleCustomerSelect = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('profile');
  };

  const handleBackToList = () => {
    setSelectedUserId(null);
    setCurrentView('list');
  };

  const handleViewGroups = () => {
    setCurrentView('groups');
  };

  if (currentView === 'profile' && selectedUserId) {
    return (
      <CustomerProfile
        userId={selectedUserId}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === 'groups') {
    return (
      <CustomerGroups onBack={handleBackToList} />
    );
  }

  return (
    <CustomersList
      onCustomerSelect={handleCustomerSelect}
      onViewGroups={handleViewGroups}
    />
  );
}
