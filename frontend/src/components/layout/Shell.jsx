import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AiAssistantDrawer } from '../ai/AiAssistantDrawer';
import { QuickCheckInModal } from '../modals/QuickCheckInModal';

export const Shell = ({
  activeTab,
  setActiveTab,
  children,
  isAiOpen,
  setIsAiOpen,
  aiInitialPrompt = '',
  isQuickCheckInOpen,
  setIsQuickCheckInOpen,
  onQuickAddMember,
  onCheckInSuccess,
  onPreviewWebsite
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // When activeTab changes, automatically close all open modals/drawers to prevent stacking
  useEffect(() => {
    setIsAiOpen(false);
    setIsQuickCheckInOpen(false);
    setSidebarOpen(false);
    window.dispatchEvent(new CustomEvent('gympulse:dismiss-modals'));
  }, [activeTab]);

  const handleOpenAi = () => {
    window.dispatchEvent(new CustomEvent('gympulse:dismiss-modals'));
    setIsQuickCheckInOpen(false);
    setIsAiOpen(true);
  };

  const handleQuickCheckIn = () => {
    window.dispatchEvent(new CustomEvent('gympulse:dismiss-modals'));
    setIsAiOpen(false);
    setIsQuickCheckInOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAi={handleOpenAi}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onPreviewWebsite={onPreviewWebsite}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAi={handleOpenAi}
          onQuickCheckIn={handleQuickCheckIn}
          onQuickAddMember={() => {
            window.dispatchEvent(new CustomEvent('gympulse:dismiss-modals'));
            setIsAiOpen(false);
            setIsQuickCheckInOpen(false);
            onQuickAddMember?.();
          }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        initialPrompt={aiInitialPrompt}
        setActiveTab={setActiveTab}
      />

      {/* Global Quick Check-In Modal */}
      <QuickCheckInModal
        isOpen={isQuickCheckInOpen}
        onClose={() => setIsQuickCheckInOpen(false)}
        onSuccess={(member) => {
          if (onCheckInSuccess) onCheckInSuccess(member);
        }}
        onNavigateAttendance={() => {
          setIsQuickCheckInOpen(false);
          setActiveTab('attendance');
        }}
      />
    </div>
  );
};
