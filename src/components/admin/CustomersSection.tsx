import { useState } from 'react';
import CustomersList from './CustomersList';
import CustomerProfile from './CustomerProfile';
import CustomerGroups from './CustomerGroups';
import DuplicateCustomersManager from './DuplicateCustomersManager';

type View = 'list' | 'profile' | 'groups' | 'duplicates';

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

  const handleViewDuplicates = () => {
    setCurrentView('duplicates');
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

  if (currentView === 'duplicates') {
    return (
      <DuplicateCustomersManager onBack={handleBackToList} />
    );
  }

  return (
    <CustomersList
      onCustomerSelect={handleCustomerSelect}
      onViewGroups={handleViewGroups}
      onViewDuplicates={handleViewDuplicates}
    />
  );
}
