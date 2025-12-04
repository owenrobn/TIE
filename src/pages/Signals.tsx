"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const Signals = () => {
  const { toast } = useToast();
  const [allSignals, setAllSignals] = useState<Signal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Signal; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/signals');
      if (!response.ok) {
        throw new Error('Failed to fetch signals');
      }
      const data: Signal[] = await response.json();
      setAllSignals(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load signals: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [toast]);

  const handleSort = (key: keyof Signal) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSignals = React.useMemo(() => {
    if (!sortConfig) return allSignals;
    
    return [...allSignals].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Fallback for other types or mixed types, treat as strings
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue)) 
        : String(bValue).localeCompare(String(aValue));
    });
  }, [allSignals, sortConfig]);

  const filteredSignals = sortedSignals.filter(signal => 
    signal.chain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.contract.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.detector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortIcon = (key: keyof Signal) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const exportSignals = () => {
    toast({
      title: "Export Started",
      description: "Signals export is being prepared. You'll receive a download link shortly.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Signals</h1>
            <p className="text-gray-600">Monitor and analyze detected opportunities</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search signals..."
                className="pl-8 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button onClick={exportSignals}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detected Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500">Loading signals...</div>
            ) : (
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
                    {filteredSignals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-500">No signals found.</td>
                      </tr>
                    ) : (
                      filteredSignals.map((signal) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signals;