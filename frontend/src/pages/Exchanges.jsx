import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const Exchanges = () => {
  // Mock data - replace with actual API calls
  const exchanges = [
    {
      id: 1,
      type: 'sent',
      status: 'pending',
      skill: 'Guitar Lessons',
      partner: 'John Doe',
      message: 'Hi! I would love to learn guitar from you in exchange for web development tutorials.',
      created_at: '2024-01-15',
    },
    {
      id: 2,
      type: 'received',
      status: 'accepted',
      skill: 'Web Development',
      partner: 'Jane Smith',
      message: 'I can help you with advanced JavaScript concepts if you can teach me photography basics.',
      created_at: '2024-01-14',
    },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Skill Exchanges</h1>
        <p className="text-muted-foreground">
          Manage your skill exchange requests and communications
        </p>
      </div>

      {/* Exchange Tabs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sent Requests
            </CardTitle>
            <CardDescription>
              Exchange requests you've sent to others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exchanges
                .filter(exchange => exchange.type === 'sent')
                .map((exchange) => (
                <div key={exchange.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{exchange.skill}</h3>
                      <p className="text-sm text-muted-foreground">
                        with {exchange.partner}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exchange.status)}
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(exchange.status)}`}>
                        {exchange.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{exchange.message}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{new Date(exchange.created_at).toLocaleDateString()}</span>
                    {exchange.status === 'pending' && (
                      <Button size="sm" variant="outline">
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Received Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Received Requests
            </CardTitle>
            <CardDescription>
              Exchange requests others have sent to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exchanges
                .filter(exchange => exchange.type === 'received')
                .map((exchange) => (
                <div key={exchange.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{exchange.skill}</h3>
                      <p className="text-sm text-muted-foreground">
                        from {exchange.partner}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exchange.status)}
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(exchange.status)}`}>
                        {exchange.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{exchange.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {new Date(exchange.created_at).toLocaleDateString()}
                    </span>
                    {exchange.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Decline
                        </Button>
                        <Button size="sm">
                          Accept
                        </Button>
                      </div>
                    )}
                    {exchange.status === 'accepted' && (
                      <Button size="sm" variant="outline">
                        Start Chat
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {exchanges.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exchange Requests</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't sent or received any skill exchange requests yet. Start by finding matches and sending exchange requests!
            </p>
            <Button onClick={() => window.location.href = '/matches'}>
              Find Matches
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exchange Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>💼 Exchange Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-3">Best Practices:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Be clear about your expectations and availability</li>
                <li>• Set specific learning goals and timelines</li>
                <li>• Communicate regularly with your exchange partner</li>
                <li>• Be patient and supportive during the learning process</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Exchange Etiquette:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Respond to requests promptly</li>
                <li>• Honor your commitments and scheduled sessions</li>
                <li>• Provide constructive feedback</li>
                <li>• Rate and review after successful exchanges</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Exchanges
