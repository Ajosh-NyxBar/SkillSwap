import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMessages, sendMessage, markMessagesAsRead } from '../features/chatSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ArrowLeft, Send, Loader2, User } from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

const ChatWindow = ({ room, currentUser, onBack }) => {
  const dispatch = useDispatch()
  const { messages, messagesLoading, sendingMessage } = useSelector((state) => state.chat)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const roomMessages = messages[room.id] || []

  useEffect(() => {
    if (room.id) {
      dispatch(fetchMessages({ roomId: room.id }))
      dispatch(markMessagesAsRead(room.id))
    }
  }, [room.id, dispatch])

  useEffect(() => {
    scrollToBottom()
  }, [roomMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sendingMessage) return

    const messageData = {
      content: newMessage.trim(),
      message_type: 'text'
    }

    try {
      await dispatch(sendMessage({ roomId: room.id, data: messageData })).unwrap()
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM dd, HH:mm')
    }
  }

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return 'Today'
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMMM dd, yyyy')
    }
  }

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.created_at)
    const previousDate = new Date(previousMessage.created_at)
    
    return currentDate.toDateString() !== previousDate.toDateString()
  }

  const otherUser = room.other_user

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            {otherUser?.avatar ? (
              <img 
                src={otherUser.avatar} 
                alt={otherUser.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-bold">
                {otherUser?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <CardTitle className="text-lg">{otherUser?.full_name || 'Unknown User'}</CardTitle>
            <p className="text-sm text-muted-foreground">@{otherUser?.username || 'unknown'}</p>
          </div>

          {room.exchange_id && (
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Exchange Chat
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto p-4 space-y-4"
        >
          {messagesLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : roomMessages.length > 0 ? (
            <>
              {roomMessages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUser?.id
                const previousMessage = index > 0 ? roomMessages[index - 1] : null
                const showDateSeparator = shouldShowDateSeparator(message, previousMessage)

                return (
                  <div key={message.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {formatDateSeparator(message.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Message */}
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`mt-1 text-xs text-muted-foreground ${
                          isCurrentUser ? 'text-right' : 'text-left'
                        }`}>
                          {formatMessageTime(message.created_at)}
                          {isCurrentUser && message.is_read && (
                            <span className="ml-1">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <User className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-4">
                Start the conversation with {otherUser?.full_name}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendingMessage}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sendingMessage}
            size="icon"
          >
            {sendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  )
}

export default ChatWindow
