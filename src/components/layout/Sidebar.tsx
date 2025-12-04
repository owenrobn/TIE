"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Activity, 
  Search,
  Settings,
  Zap,
  Shield,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Signals',
      href: '/signals',
      icon: Activity,
    },
    {
      name: 'Detectors',
      href: '/detectors',
      icon: Search,
    },
    {
      name: 'Automation',
      href: '/automation',
      icon: Bot,
    },
    {
      name: 'MEV Intelligence',
      href: '/mev',
      icon: Zap,
    },
    {
      name: 'Security',
      href: '/security',
      icon: Shield,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-full flex-col border-r bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">TIE</h1>
            <p className="text-xs text-gray-500">Testnet Intelligence Engine</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-blue-100 text-blue-900 hover:bg-blue-100"
                )}
                asChild
              >
                <Link to={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t">
        <div className="text-xs text-gray-500">
          Testnet Intelligence Engine v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;