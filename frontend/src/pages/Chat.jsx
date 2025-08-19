import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchChatRooms, setCurrentRoom, clearCurrentRoom } from '../features/chatSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { MessageCircle, Search, Plus, Loader2, Users } from 'lucide-react'
import ChatRoom from '../components/ChatRoom'
import ChatWindow from '../components/ChatWindow'

const Chat = () => {
  const dispatch = useDispatch()
  const { chatRooms, currentRoom, loading } = useSelector((state) => state.chat)
  const { user } = useSelector((state) => state.auth)
  
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(fetchChatRooms())
  }, [dispatch])

  const filteredRooms = chatRooms.filter(room =>
    room.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.other_user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRoomSelect = (room) => {
    dispatch(setCurrentRoom(room))
  }

  const handleBackToChatList = () => {
    dispatch(clearCurrentRoom())
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-200px)]">
      <div className="grid md:grid-cols-3 gap-6 h-full">
        {/* Chat Rooms List */}
        <div className={`md:col-span-1 ${currentRoom ? 'hidden md:block' : 'block'}`}>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </CardTitle>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden">
              {filteredRooms.length > 0 ? (
                <div className="space-y-2 h-full overflow-y-auto">
                  {filteredRooms.map((room) => (
                    <ChatRoom
                      key={room.id}
                      room={room}
                      currentUser={user}
                      isSelected={currentRoom?.id === room.id}
                      onClick={() => handleRoomSelect(room)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start chatting with someone from your matches
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/matches'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Find Matches
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className={`md:col-span-2 ${currentRoom ? 'block' : 'hidden md:block'}`}>
          {currentRoom ? (
            <ChatWindow
              room={currentRoom}
              currentUser={user}
              onBack={handleBackToChatList}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the left to start messaging
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
