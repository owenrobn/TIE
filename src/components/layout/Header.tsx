"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  User,
  Menu
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle'; // Import ThemeToggle

const Header = () => {
  return (
    <header className="flex items-center justify-between border-b bg-white p-4 dark:bg-gray-900"> {/* Added dark mode background */}
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2 md:ml-0">Testnet Intelligence Engine</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
        <ThemeToggle /> {/* Add the ThemeToggle here */}
      </div>
    </header>
  );
};

export default Header;