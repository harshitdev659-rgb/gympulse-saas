import React, { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAi={() => setIsAiOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onPreviewWebsite={onPreviewWebsite}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAi={() => setIsAiOpen(true)}
          onQuickCheckIn={() => setIsQuickCheckInOpen(true)}
          onQuickAddMember={onQuickAddMember}
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
