import { Card, CardContent } from '@/components/ui/card';

export default function SqlConnections() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SQL Connections</h1>
          <p className="text-gray-600">Manage external database connections</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">SQL Connections functionality temporarily disabled</p>
            <p className="text-sm text-gray-400">Core application working properly with MS SQL integration</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}