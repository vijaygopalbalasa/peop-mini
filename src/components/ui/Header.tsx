"use client";

import { useState } from "react";
import { APP_NAME } from "~/lib/constants";
import sdk from "@farcaster/miniapp-sdk";

type HeaderProps = {
  user?: any;
};

export function Header({ user }: HeaderProps) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <div className="mt-6 mb-6 mx-4 px-6 py-4 card flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-pulse"></div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              {APP_NAME}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Your onchain identity passport</p>
          </div>
        </div>
        {user && (
          <div
            className="cursor-pointer transition-transform duration-200 hover:scale-105"
            onClick={() => {
              setIsUserDropdownOpen(!isUserDropdownOpen);
            }}
          >
            {user.pfpUrl && (
              <div className="relative">
                <img
                  src={user.pfpUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-primary-200 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white dark:border-neutral-900"></div>
              </div>
            )}
          </div>
        )}
      </div>
      {user && (
        <>
          {isUserDropdownOpen && (
            <>
              {/* Mobile backdrop */}
              <div
                className="fixed inset-0 z-40 md:hidden"
                onClick={() => setIsUserDropdownOpen(false)}
              />
              <div className="absolute top-full right-0 z-50 w-56 mt-1 mx-4 card animate-in slide-in-from-top-2 duration-200 shadow-xl">
                <div className="p-3 space-y-2">
                  <div className="text-right">
                    <h3
                      className="font-bold text-base hover:text-primary-600 cursor-pointer transition-colors duration-200 inline-block"
                      onClick={() => sdk.actions.viewProfile({ fid: user.fid })}
                    >
                      {user.displayName || user.username}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      @{user.username}
                    </p>
                    <div className="inline-flex items-center px-2 py-1 mt-1 bg-primary-50 dark:bg-primary-900/20 rounded-full">
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                        FID: {user.fid}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
