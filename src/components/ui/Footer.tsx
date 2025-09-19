import React from "react";
import { Tab } from "~/components/App";

interface FooterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  showWallet?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ activeTab, setActiveTab, showWallet = false }) => (
  <div className="fixed bottom-0 left-0 right-0 mx-4 mb-4 card glass z-50">
    <div className="flex justify-around items-center px-2 py-3">
      <button
        onClick={() => setActiveTab(Tab.Home)}
        className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
          activeTab === Tab.Home
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-md'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
        }`}
      >
        <span className="text-2xl mb-1">🏠</span>
        <span className="text-xs font-medium">Home</span>
      </button>
      <button
        onClick={() => setActiveTab(Tab.Actions)}
        className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
          activeTab === Tab.Actions
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-md'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
        }`}
      >
        <span className="text-2xl mb-1">⚡</span>
        <span className="text-xs font-medium">Actions</span>
      </button>
      <button
        onClick={() => setActiveTab(Tab.Context)}
        className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
          activeTab === Tab.Context
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-md'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
        }`}
      >
        <span className="text-2xl mb-1">📋</span>
        <span className="text-xs font-medium">Context</span>
      </button>
      {showWallet && (
        <button
          onClick={() => setActiveTab(Tab.Wallet)}
          className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
            activeTab === Tab.Wallet
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-md'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
          }`}
        >
          <span className="text-2xl mb-1">👛</span>
          <span className="text-xs font-medium">Wallet</span>
        </button>
      )}
    </div>
  </div>
);
