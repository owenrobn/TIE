"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Signal {
  id: string;
  chain: string;
  type: string;
  contract: string;
  score: number;
  urgency: 'High' | 'Medium' | 'Low';
  timestamp: string;
  status: string;
  detector: string;
}

interface SignalTableProps {
  signals: Signal[];
  onSort: (key: string, direction: 'asc' | 'desc') => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
}

const SignalTable: React.FC<SignalTableProps> = ({ signals, onSort, sortConfig }) => {
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSort(key, direction);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th 
              className="text-left py-3 px-4 font-medium cursor-pointer"
              onClick={() => handleSort('chain')}
            >
              <div className="flex items-center">
                Chain
                {getSortIcon('chain')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 font-medium cursor-pointer"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center">
                Type
                {getSortIcon('type')}
              </div>
            </th>
            <th className="text-left py-3 px-4 font-medium">Contract</th>
            <th 
              className="text-left py-3 px-4 font-medium cursor-pointer"
              onClick={() => handleSort('score')}
            >
              <div className="flex items-center">
                Score
                {getSortIcon('score')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 font-medium cursor-pointer"
              onClick={() => handleSort('urgency')}
            >
              <div className="flex items-center">
                Urgency
                {getSortIcon('urgency')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 font-medium cursor-pointer"
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center">
                Timestamp
                {getSortIcon('timestamp')}
              </div>
            </th>
            <th className="text-left py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => (
            <tr key={signal.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium">{signal.chain}</div>
                <div className="text-sm text-gray-500">{signal.detector}</div>
              </td>
              <td className="py-3 px-4">
                <Badge variant="outline">{signal.type}</Badge>
              </td>
              <td className="py-3 px-4">
                <div className="font-mono text-sm">{signal.contract.substring(0, 6)}...{signal.contract.substring(signal.contract.length - 4)}</div>
              </td>
              <td className="py-3 px-4">
                <Badge 
                  variant={signal.score > 80 ? "default" : signal.score > 60 ? "secondary" : "outline"}
                >
                  {signal.score}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <Badge 
                  variant={signal.urgency === 'High' ? "destructive" : signal.urgency === 'Medium' ? "default" : "secondary"}
                >
                  {signal.urgency}
                </Badge>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {new Date(signal.timestamp).toLocaleString()}
              </td>
              <td className="py-3 px-4">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SignalTable;