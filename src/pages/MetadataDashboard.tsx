
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getLighthouseMetadata } from '@/lib/metadata';
import { toast } from '@/components/ui/use-toast';
import { Database, Eye, Download, ExternalLink, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MetadataDashboard() {
  const [metadata, setMetadata] = useState<any[]>([]);
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetadata = () => {
      try {
        const storedMetadata = getLighthouseMetadata();
        setMetadata(storedMetadata);
      } catch (error) {
        console.error('Failed to load metadata:', error);
        toast({
          title: 'Error',
          description: 'Failed to load metadata',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard'
    });
  };

  const exportAsJsonLD = (metadataItem: any) => {
    const jsonLD = {
      "@context": "https://daostar.org/contexts/metadata.jsonld",
      "@type": "DAOMetadata",
      ...metadataItem.metadata
    };
    
    const blob = new Blob([JSON.stringify(jsonLD, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metadata-${metadataItem.hash}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delegate_opt_in': return 'bg-blue-500';
      case 'random_assignment': return 'bg-purple-500';
      case 'task_creation': return 'bg-green-500';
      case 'task_completion': return 'bg-orange-500';
      case 'proposal_categorization': return 'bg-indigo-500';
      case 'task_update': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Loading metadata...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Metadata Dashboard
            </h1>
            <p className="text-gray-300">
              View and manage generated metadata stored on Lighthouse/IPFS
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metadata.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Task Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {metadata.filter(m => m.metadata.action.includes('task')).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Categorizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {metadata.filter(m => m.metadata.action === 'proposal_categorization').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {metadata.filter(m => m.metadata.action.includes('assignment')).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Table */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Metadata Records
            </CardTitle>
            <CardDescription className="text-gray-300">
              All metadata records generated and stored on Lighthouse/IPFS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metadata.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">No metadata records found</p>
                <p className="text-gray-400 text-sm">
                  Start using the app to generate metadata records
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Action</TableHead>
                    <TableHead className="text-gray-300">Task ID</TableHead>
                    <TableHead className="text-gray-300">Hash</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Size</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metadata.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge className={`${getActionColor(item.metadata.action)} text-white`}>
                          {getActionLabel(item.metadata.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-mono text-sm">
                        {item.metadata.taskId?.substring(0, 20)}...
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {item.hash.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatDistanceToNow(new Date(item.savedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {item.size} bytes
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedMetadata(item)}
                                className="text-white border-white/30 hover:bg-white/10"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Metadata Details</DialogTitle>
                                <DialogDescription className="text-gray-300">
                                  View complete metadata record
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedMetadata && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-white font-medium">Hash:</label>
                                      <div className="flex items-center gap-2">
                                        <code className="text-gray-300 text-sm bg-gray-800 p-1 rounded">
                                          {selectedMetadata.hash}
                                        </code>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => copyToClipboard(selectedMetadata.hash)}
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-white font-medium">Name:</label>
                                      <p className="text-gray-300">{selectedMetadata.name}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-white font-medium mb-2 block">Metadata JSON:</label>
                                    <pre className="bg-gray-800 text-gray-300 p-4 rounded text-sm overflow-auto max-h-96">
                                      {JSON.stringify(selectedMetadata.metadata, null, 2)}
                                    </pre>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => exportAsJsonLD(selectedMetadata)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Export JSON-LD
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      onClick={() => window.open(`https://gateway.lighthouse.storage/ipfs/${selectedMetadata.hash}`, '_blank')}
                                      className="text-white border-white/30 hover:bg-white/10"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View on IPFS
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => exportAsJsonLD(item)}
                            className="text-white border-white/30 hover:bg-white/10"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
