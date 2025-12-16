import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Users, Send, Hash, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  participants?: Array<{
    id: number;
    userId: string;
    role: string;
    user: User;
  }>;
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: string;
  message: string;
  messageType: string;
  createdAt: string;
  sender: User;
}

export default function Chat() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch chat rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected room
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/rooms/${selectedRoom?.id}/messages`],
    enabled: !!selectedRoom,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Fetch all users for user management
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isUsersDialogOpen,
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });
      if (!response.ok) throw new Error("Failed to create room");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setIsCreateRoomOpen(false);
      toast({ title: "Room created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create room", variant: "destructive" });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      const response = await fetch(`/api/chat/rooms/${selectedRoom?.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/rooms", selectedRoom?.id, "messages"] 
      });
      setMessageText("");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await fetch(`/api/chat/rooms/${roomId}/join`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to join room");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      toast({ title: "Joined room successfully" });
    },
    onError: () => {
      toast({ title: "Failed to join room", variant: "destructive" });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRoom) return;
    sendMessageMutation.mutate({ message: messageText });
  };

  const handleCreateRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const isPrivate = formData.get("isPrivate") === "on";

    if (!name.trim()) return;

    createRoomMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      isPrivate,
    });
  };

  const handleStartDirectChat = async (user: any) => {
    try {
      // Create a direct chat room with this user
      const roomName = `${user.firstName} ${user.lastName}`;
      
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName,
          description: `Direct chat with ${user.firstName} ${user.lastName}`,
          isPrivate: true,
        }),
      });
      
      if (response.ok) {
        const newRoom = await response.json();
        
        // Add the target user as a participant
        await fetch(`/api/chat/rooms/${newRoom.id}/add-participant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        
        // Refresh rooms list
        queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
        
        // Select the new room
        setSelectedRoom(newRoom);
        
        toast({ title: `Started chat with ${user.firstName} ${user.lastName}` });
      }
    } catch (error) {
      console.error("Error creating direct chat:", error);
      toast({ title: "Failed to create chat", variant: "destructive" });
    }
    
    setIsUsersDialogOpen(false);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "?";
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="p-6 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Engineer Chat</h1>
          <p className="text-gray-600">Internal communication for engineering teams</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Rooms Sidebar */}
          <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat Rooms
                </CardTitle>
                <div className="flex gap-2">
                  <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Users className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-gray-200 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">All Registered Users</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto">
                        {usersLoading ? (
                          <div className="text-gray-600 text-center py-4">Loading users...</div>
                        ) : (
                          <div className="space-y-2">
                            {allUsers.map((user: any) => (
                              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-cyan-600 text-white text-xs">
                                      {getInitials(user.firstName, user.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {user.department} • {user.role}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                                    {user.role}
                                  </Badge>
                                  {user.isActive && (
                                    <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                                      Active
                                    </Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                    onClick={() => handleStartDirectChat(user)}
                                  >
                                    Chat
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-gray-200">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">Create New Room</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateRoom} className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-gray-900">Room Name</Label>
                          <Input
                            id="name"
                            name="name"
                            required
                            className="bg-white border-gray-300 text-gray-900"
                            placeholder="Enter room name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-gray-900">Description</Label>
                          <Textarea
                            id="description"
                            name="description"
                            className="bg-white border-gray-300 text-gray-900"
                            placeholder="Optional description"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="isPrivate" name="isPrivate" />
                          <Label htmlFor="isPrivate" className="text-gray-900">Private Room</Label>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-cyan-600 hover:bg-cyan-700"
                          disabled={createRoomMutation.isPending}
                        >
                          {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {roomsLoading ? (
                  <div className="p-4 text-gray-600">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                  <div className="p-4 text-gray-600">No rooms available</div>
                ) : (
                  <div className="space-y-1 p-2">
                    {rooms.map((room: ChatRoom) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedRoom?.id === room.id
                            ? "bg-cyan-50 border border-cyan-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {room.isPrivate ? (
                            <Lock className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Hash className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-900 truncate">{room.name}</span>
                        </div>
                        {room.description && (
                          <p className="text-xs text-gray-600 truncate">{room.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {room.participants?.length || 0} members
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 bg-white border-gray-200 shadow-sm flex flex-col">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                        {selectedRoom.isPrivate ? (
                          <Lock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Hash className="h-5 w-5 text-gray-500" />
                        )}
                        {selectedRoom.name}
                      </CardTitle>
                      {selectedRoom.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedRoom.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-gray-700 border-gray-300">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedRoom.participants?.length || 0}
                    </Badge>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[400px] p-4">
                    {messagesLoading ? (
                      <div className="text-gray-600">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-gray-600 text-center mt-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: ChatMessage) => (
                          <div key={message.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-cyan-600 text-white text-xs">
                                {getInitials(message.sender?.firstName, message.sender?.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {message.sender?.firstName || "Unknown"} {message.sender?.lastName || "User"}
                                </span>
                                <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                                  {message.sender?.role || "User"}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-800 text-sm leading-relaxed">
                                {message.message}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Message #${selectedRoom.name}`}
                      className="flex-1 bg-white border-gray-300 text-gray-900"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900">Select a chat room</h3>
                  <p>Choose a room from the sidebar to start chatting</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}