import { formatDistanceToNow } from 'date-fns'

const ChatRoom = ({ room, currentUser, isSelected, onClick }) => {
  const otherUser = room.other_user
  
  const formatTime = (dateString) => {
    if (!dateString) return ''
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return ''
    }
  }

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No messages yet'
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
  }

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          {otherUser?.avatar ? (
            <img 
              src={otherUser.avatar} 
              alt={otherUser.full_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold">
              {otherUser?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* Chat Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-medium truncate ${isSelected ? 'text-primary-foreground' : ''}`}>
              {otherUser?.full_name || 'Unknown User'}
            </h4>
            {room.last_message_at && (
              <span className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {formatTime(room.last_message_at)}
              </span>
            )}
          </div>
          
          <p className={`text-sm truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
            {truncateMessage(room.last_message)}
          </p>
          
          {/* Exchange Badge */}
          {room.exchange_id && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isSelected 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                Exchange Chat
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
